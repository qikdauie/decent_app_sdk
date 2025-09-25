import { BaseProtocol } from '../base.js';
import {
  TYPE_PING,
  TYPE_PING_RESPONSE,
  isValidPingBody,
  isValidPingResponseBody,
  buildPingBody,
  buildPingResponseBody,
  startPingTimeout,
  clearPingTimeout,
  extractThreadId,
} from './utils.js';

export class TrustPingProtocol extends BaseProtocol {
  /**
   * @param {{ autoRespond?: boolean, defaultTimeoutMs?: number }} [options]
   */
  constructor(options = {}) {
    super({
      id: 'trust-ping-v2',
      piuri: 'https://didcomm.org/trust-ping/2.0',
      version: '2.0',
      messageTypes: [TYPE_PING, TYPE_PING_RESPONSE],
    });
    this.autoRespond = options.autoRespond !== false;
    this.defaultTimeoutMs = Number.isFinite(options.defaultTimeoutMs) ? options.defaultTimeoutMs : 5000;
  }

  register(runtime) {
    super.register(runtime);
  }

  declareClientMethods() {
    return {
      ping: { params: ['to', 'options?'], description: 'Send a trust ping', timeoutMs: this.defaultTimeoutMs },
      pingAndWait: { params: ['to', 'options?'], description: 'Send a trust ping and wait for response', timeoutMs: this.defaultTimeoutMs },
    };
  }

  async handleIncoming(envelope) {
    const { type, from, body } = envelope || {};
    if (!type) return false;

    if (type === TYPE_PING) {
      if (!from || !isValidPingBody(body)) return false;

      if (this.autoRespond && body?.response_requested !== false) {
        const thid = extractThreadId(envelope) || undefined;
        const responseBody = buildPingResponseBody({ comment: body?.comment });
        try {
          await this.runtime.sendType(from, TYPE_PING_RESPONSE, responseBody);
        } catch (e) {
          try { this.runtime?.logger?.warn?.('trust-ping: failed to send ping-response', e); } catch {}
        }
      }
      return true;
    }

    if (type === TYPE_PING_RESPONSE) {
      // Clear any pending timeout by thid if present
      const thid = extractThreadId(envelope);
      if (thid) clearPingTimeout(from || '', thid);
      if (!isValidPingResponseBody(body)) return false;
      return true;
    }

    return false;
  }

  /**
   * Send a trust ping to a peer.
   * @param {string} to
   * @param {{ comment?: string, responseRequested?: boolean, timeoutMs?: number, thid?: string }} [opts]
   */
  async sendPing(to, opts = {}) {
    const responseRequested = opts.responseRequested !== false;
    const thid = opts.thid || (globalThis?.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
    const body = buildPingBody({ responseRequested });
    if (opts.comment) body.comment = String(opts.comment);
    await this.runtime.sendType(to, TYPE_PING, body);

    if (responseRequested) {
      const timeoutMs = Number.isFinite(opts.timeoutMs) ? opts.timeoutMs : this.defaultTimeoutMs;
      if (thid) startPingTimeout(to, thid, timeoutMs, () => {
        try { this.runtime?.logger?.warn?.('trust-ping: ping timeout', { to, thid }); } catch {}
      });
    }
  }

  async invokeClientMethod(methodName, args) {
    const [to, options = {}] = Array.isArray(args) ? args : [args];
    if (!to || typeof to !== 'string') throw new Error('to is required');
    if (methodName === 'ping') {
      await this.sendPing(to, options || {});
      return { ok: true };
    }
    if (methodName === 'pingAndWait') {
      const responseRequested = options?.responseRequested !== false;
      const thid = options?.thid || (globalThis?.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
      const body = buildPingBody({ responseRequested });
      if (options?.comment) body.comment = String(options.comment);
      const timeoutMs = Number.isFinite(options?.timeoutMs) ? Number(options.timeoutMs) : this.defaultTimeoutMs;
      const match = (envelope) => {
        try { return envelope?.type === TYPE_PING_RESPONSE && (envelope?.from === to || !to); } catch { return false; }
      };
      const result = await this.sendAndWaitForResponse(to, TYPE_PING, body, { timeoutMs, match });
      if (!result) throw new Error('pingAndWait timed out');
      return { ok: true, response: result };
    }
    throw new Error(`Unknown method: ${methodName}`);
  }
}


