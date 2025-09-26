/**
 * BaseProtocol — abstract class for DIDComm protocol implementations.
 *
 * JavaScript-first with JSDoc. Extend this class to implement a protocol.
 *
 * Lifecycle:
 * - register(runtime): called once with runtime helpers (send, pack, unpack, registry, permissions)
 * - handleIncoming(envelope): called for inbound DIDComm messages
 * - advertiseCapabilities(): return array of capability descriptors
 * - cleanup(): optional teardown
 */

export class BaseProtocol {
  /**
   * @param {{
   *   id: string,
   *   piuri: string,
   *   version?: string,
   *   messageTypes?: string[],
   *   requiredPermissions?: { protocolUri: string, messageTypeUris?: string[] }[],
   * }} meta
   */
  constructor(meta) {
    if (!meta || typeof meta !== 'object') throw new Error('Protocol metadata is required');
    if (!meta.id) throw new Error('Protocol id is required');
    if (!meta.piuri) throw new Error('Protocol piuri is required');
    this.meta = {
      id: String(meta.id),
      piuri: String(meta.piuri),
      version: meta.version ? String(meta.version) : '1.0',
      messageTypes: Array.isArray(meta.messageTypes) ? meta.messageTypes.map(String) : [],
      requiredPermissions: Array.isArray(meta.requiredPermissions) ? meta.requiredPermissions : [],
    };
    /** @type {object|null} */
    this.runtime = null;
  }

  /**
   * Called by the ProtocolRegistry when the protocol is installed.
   *
   * @param {{
   *   pack: (dest: string, type: string, bodyJson: string, attachments?: any[], replyTo?: string) => Promise<any>,
   *   unpack: (raw: any) => Promise<any>,
   *   send: (dest: string, packed: string) => Promise<any>,
   *   sendType: (dest: string, type: string, body: any) => Promise<any>,
   *   registry: any,
   *   permissions: any,
   *   logger?: Console,
   * }} runtime
   */
  register(runtime) {
    this.runtime = runtime;
  }

  /**
   * Declare client-callable methods for this protocol.
   * Override in subclasses to return an object of the shape:
   *   { [methodName: string]: { params?: string[], description?: string, timeoutMs?: number } }
   * Used for dynamic client proxy generation and validation.
   * Defaults to empty object (no client methods exposed).
   */
  declareClientMethods() {
    return {};
  }

  /**
   * Invoke a client-declared method. Subclasses should override to handle calls.
   * @param {string} methodName
   * @param {any[]} args
   * @returns {Promise<any>}
   */
  async invokeClientMethod(methodName, args) { // override in subclass
    void methodName; void args;
    throw new Error('invokeClientMethod not implemented');
  }

  /**
   * Helper to send a DIDComm message of a given type and wait for a matching
   * response within the provided timeout. Avoids relying on thread id from the
   * packed JWE (which may be unavailable). Prefer explicit match functions.
   *
   * @param {string} to
   * @param {string} messageType
   * @param {any} body
   * @param {{ timeoutMs?: number, match?: (envelope:any)=>boolean, skipSend?: boolean, prepacked?: string }} [opts]
   * @returns {Promise<any|null>} The matching envelope or null on timeout
   */
  async sendAndWaitForResponse(to, messageType, body, opts = {}) {
    const timeoutMs = Number.isFinite(opts.timeoutMs) ? opts.timeoutMs : 5000;
    const skipSend = opts?.skipSend === true;

    let packedMessage = opts?.prepacked;
    if (!skipSend) {
      const packed = await this.runtime.pack(to, messageType, JSON.stringify(body || {}), [], "");
      if (!packed?.success) throw new Error(String(packed?.error || 'pack failed'));
      packedMessage = packed.message;
      await this.runtime.send(to, packedMessage);
    } else {
      if (!opts.match) throw new Error('waitForResponse requires explicit match when skipSend=true');
    }

    // Listen for rpc-delivery first (already unpacked envelope), then fall back to delivery+unpack
    /** @type {null | (() => void)} */
    let removeListener = null;
    const awaitMatch = () => new Promise((resolve) => {
      let settled = false;
      const done = (val) => { if (settled) return; settled = true; try { self.removeEventListener('delivery', onDelivery); } catch {} try { self.removeEventListener('rpc-delivery', onRpcDelivery); } catch {} resolve(val); };
      const onRpcDelivery = (evt) => {
        try {
          const env = (/** @type {any} */ (evt)).data;
          const matchFn = typeof opts.match === 'function' ? opts.match : (() => false);
          if (matchFn(env)) done(env);
        } catch {}
      };
      const onDelivery = async (evt) => {
        try {
          const raw = (/** @type {any} */ (evt)).data;
          const up = await this.runtime.unpack(raw);
          if (!up?.success) return;
          const msg = JSON.parse(up.message);
          const env = { type: msg?.type, from: msg?.from, body: msg?.body, raw: msg };
          const matchFn = typeof opts.match === 'function' ? opts.match : (() => false);
          if (matchFn(env)) done(env);
        } catch {}
      };
      removeListener = () => { try { self.removeEventListener('delivery', onDelivery); } catch {} try { self.removeEventListener('rpc-delivery', onRpcDelivery); } catch {} };
      try { self.addEventListener('rpc-delivery', onRpcDelivery); } catch {}
      try { self.addEventListener('delivery', onDelivery); } catch {}
    });

    try {
      const { withTimeout } = await import('../utils/protocol-helpers.js');
      const result = await withTimeout(awaitMatch, Math.max(1, timeoutMs), 'sendAndWaitForResponse');
      return result;
    } catch (err) {
      if (String(err?.message || '').includes('sendAndWaitForResponse timed out')) return null;
      throw err;
    } finally {
      try { if (typeof removeListener === 'function') removeListener(); } catch {}
    }
  }

  /**
   * Wait for a response that matches a predicate within a timeout, without sending.
   * Useful when sending is handled separately and correlation is explicit.
   * @param {{ match: (envelope:any)=>boolean, timeoutMs?: number }} opts
   */
  async waitForResponse(opts) {
    if (!opts || typeof opts.match !== 'function') throw new Error('waitForResponse requires a match function');
    const timeoutMs = Number.isFinite(opts.timeoutMs) ? Number(opts.timeoutMs) : 5000;
    /** @type {null | (() => void)} */
    let removeListener = null;
    const awaitMatch = () => new Promise((resolve) => {
      let settled = false;
      const done = (val) => { if (settled) return; settled = true; try { self.removeEventListener('delivery', onDelivery); } catch {} try { self.removeEventListener('rpc-delivery', onRpcDelivery); } catch {} resolve(val); };
      const onRpcDelivery = (evt) => {
        try {
          const env = (/** @type {any} */ (evt)).data;
          if (opts.match(env)) done(env);
        } catch {}
      };
      const onDelivery = async (evt) => {
        try {
          const raw = (/** @type {any} */ (evt)).data;
          const up = await this.runtime.unpack(raw);
          if (!up?.success) return;
          const msg = JSON.parse(up.message);
          const env = { type: msg?.type, from: msg?.from, body: msg?.body, raw: msg };
          if (opts.match(env)) done(env);
        } catch {}
      };
      removeListener = () => { try { self.removeEventListener('delivery', onDelivery); } catch {} try { self.removeEventListener('rpc-delivery', onRpcDelivery); } catch {} };
      try { self.addEventListener('rpc-delivery', onRpcDelivery); } catch {}
      try { self.addEventListener('delivery', onDelivery); } catch {}
    });

    try {
      const { withTimeout } = await import('../utils/protocol-helpers.js');
      const result = await withTimeout(awaitMatch, Math.max(1, timeoutMs), 'waitForResponse');
      return result;
    } catch (err) {
      if (String(err?.message || '').includes('waitForResponse timed out')) return null;
      throw err;
    } finally {
      try { if (typeof removeListener === 'function') removeListener(); } catch {}
    }
  }

  /**
   * Determine if this protocol supports a given DIDComm message type URI.
   * @param {string} typeUri
   */
  supportsMessageType(typeUri) {
    const list = this.meta.messageTypes || [];
    if (!typeUri || !list.length) return false;
    const t = String(typeUri);
    for (const mt of list) {
      if (mt.endsWith('/*')) {
        const prefix = mt.slice(0, -2);
        if (t.startsWith(prefix)) return true;
      } else if (mt === t) {
        return true;
      }
    }
    return false;
  }

  /**
   * Handle an incoming DIDComm message.
   * @param {{ type: string, from?: string, body?: any, raw?: any }} envelope
   * @returns {Promise<boolean>} whether the message was handled
   */
  async handleIncoming(envelope) { // override in subclass
    void envelope;
    return false;
  }

  /**
   * Return protocol capabilities for discover-features disclosure.
   * Each capability: { ['feature-type']: 'protocol'|'message-type'|'goal-code', id: string, roles?: string[] }
   * @returns {Array<{ ['feature-type']: string, id: string, roles?: string[] }>}
   */
  advertiseCapabilities() {
    // Default: advertise protocol PIURI and message types
    const caps = [
      { ['feature-type']: 'protocol', id: this.meta.piuri, roles: [] },
    ];
    for (const mt of this.meta.messageTypes || []) {
      if (!mt.endsWith('/*')) {
        caps.push({ ['feature-type']: 'message-type', id: mt, roles: [] });
      }
    }
    return caps;
  }

  /** Optional cleanup when unregistered */
  async cleanup() {}
}


