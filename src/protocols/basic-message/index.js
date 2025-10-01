import { BaseProtocol } from '../base.js';
import { MESSAGE_TYPE, isValidBasicMessage, buildBasicMessageBody, parseBasicMessage } from './utils.js';

/**
 * Basic Message 2.0 — simple text messaging
 */
export class BasicMessageProtocol extends BaseProtocol {
  constructor() {
    super({
      id: 'basic-message-v2',
      piuri: 'https://didcomm.org/basicmessage/2.0',
      version: '2.0',
      messageTypes: [MESSAGE_TYPE],
    });
    /** @type {Array<{ from?: string, to?: string, content: string, sent_time?: string, raw?: any }>} */
    this._messages = [];
    /** @type {{ keepLast?: number, maxAgeMs?: number|null }} */
    this._retention = { keepLast: 200, maxAgeMs: null };
  }

  declareClientMethods() {
    return {
      sendMessage: { params: ['to', 'content', 'options?'], description: 'Send a basic message', timeoutMs: 4000 },
      getMessages: { params: ['options?'], description: 'Get received basic messages', timeoutMs: 500 },
    };
  }

  async handleIncoming(envelope) {
    const { type, from, body } = envelope || {};
    if (type !== MESSAGE_TYPE) return false;
    if (!isValidBasicMessage(body)) return false;
    try {
      const parsed = parseBasicMessage({ ...envelope, from });
      this._messages.push({ from, content: parsed.content, sent_time: parsed.sent_time, raw: envelope?.raw });
      this._pruneRetention();
    } catch {}
    return true;
  }

  async invokeClientMethod(methodName, args) {
    if (methodName === 'sendMessage') {
      const [to, content, options = {}] = Array.isArray(args) ? args : [args];
      if (!to || typeof to !== 'string') throw new Error('to is required');
      if (!content || typeof content !== 'string') throw new Error('content is required');
      const body = buildBasicMessageBody({ content, sent_time: options?.sent_time });
      await this.runtime.sendType(to, MESSAGE_TYPE, body);
      return { ok: true };
    }
    if (methodName === 'getMessages') {
      const [options = {}] = Array.isArray(args) ? args : [args];
      const limit = Number.isFinite(options?.limit) ? Number(options.limit) : undefined;
      const since = options?.since ? new Date(options.since).getTime() : undefined;
      let list = this._messages.slice();
      if (Number.isFinite(since)) list = list.filter(m => {
        const t = m?.sent_time ? Date.parse(m.sent_time) : NaN;
        return Number.isFinite(t) ? t >= since : true;
      });
      if (Number.isFinite(limit) && limit > 0) list = list.slice(-limit);
      return { ok: true, messages: list };
    }
    throw new Error(`Unknown method: ${methodName}`);
  }

  _pruneRetention() {
    try {
      const { keepLast, maxAgeMs } = this._retention || {};
      if (Number.isFinite(keepLast) && keepLast > 0 && this._messages.length > keepLast) {
        this._messages = this._messages.slice(-keepLast);
      }
      if (Number.isFinite(maxAgeMs) && maxAgeMs > 0) {
        const now = Date.now();
        this._messages = this._messages.filter(m => {
          const t = m?.sent_time ? Date.parse(m.sent_time) : NaN;
          return Number.isFinite(t) ? (now - t) <= maxAgeMs : true;
        });
      }
    } catch {}
  }
}

export default BasicMessageProtocol;


