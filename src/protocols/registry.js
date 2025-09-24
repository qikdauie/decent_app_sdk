/**
 * ProtocolRegistry — installs and routes messages between protocols.
 */

export class ProtocolRegistry {
  constructor(options = {}) {
    /** @type {Map<string, any>} id → protocol */
    this.idToProtocol = new Map();
    /** @type {Set<any>} */
    this.protocols = new Set();
    this.logger = options.logger || console;
    this.featureAds = new Map(); // custom advertised features: id → {featureType,id,roles}

    /** runtime helpers injected at init() */
    this.runtime = null;
  }

  /**
   * Initialize with runtime bridges used by protocols.
   * @param {{
   *  pack: (dest: string, type: string, bodyJson: string, attachments?: any[], replyTo?: string) => Promise<any>,
   *  unpack: (raw: any) => Promise<any>,
   *  send: (dest: string, packed: string) => Promise<any>,
   *  sendType: (dest: string, type: string, body: any) => Promise<any>,
   *  permissions?: any,
   *  logger?: Console,
   *  registry?: any,
   * }} runtime
   */
  init(runtime) {
    this.runtime = runtime;
  }

  /** Register a protocol instance */
  register(protocol) {
    if (!protocol || !protocol.meta?.id) throw new Error('Invalid protocol');
    if (this.idToProtocol.has(protocol.meta.id)) {
      throw new Error(`Protocol already registered: ${protocol.meta.id}`);
    }
    this.protocols.add(protocol);
    this.idToProtocol.set(protocol.meta.id, protocol);
    try {
      protocol.register({
        ...this.runtime,
        registry: this,
      });
    } catch (err) {
      this.logger.warn('Protocol register() failed:', protocol.meta.id, err);
    }
  }

  /** Unregister a protocol instance */
  async unregister(protocolId) {
    const p = this.idToProtocol.get(protocolId);
    if (!p) return false;
    try { await p.cleanup?.(); } catch {}
    this.idToProtocol.delete(protocolId);
    this.protocols.delete(p);
    return true;
  }

  /**
   * Route an incoming message to the first protocol that supports the type.
   * @param {{ type: string, from?: string, body?: any, raw?: any }} envelope
   * @returns {Promise<boolean>} whether a handler consumed the message
   */
  async routeIncoming(envelope) {
    const type = String(envelope?.type || '');
    if (!type) return false;
    for (const p of this.protocols) {
      try {
        if (typeof p.supportsMessageType === 'function' ? p.supportsMessageType(type) : false) {
          const handled = await p.handleIncoming(envelope);
          if (handled) return true;
        }
      } catch (err) {
        this.logger.error('Protocol handleIncoming failed:', p.meta?.id, err);
      }
    }
    return false;
  }

  /** Advertise a custom feature (not tied to a specific protocol) */
  advertiseFeature(featureType, id, roles = []) {
    const ft = String(featureType);
    if (ft !== 'protocol' && ft !== 'goal-code' && ft !== 'message-type') {
      throw new Error(`Unsupported feature-type: ${featureType}`);
    }
    this.featureAds.set(id, { featureType: ft, id, roles: Array.isArray(roles) ? roles : [] });
  }

  /** Aggregate features from all protocols and custom ads */
  aggregateCapabilities() {
    const out = [];
    for (const p of this.protocols) {
      try {
        const caps = p.advertiseCapabilities?.();
        if (Array.isArray(caps)) out.push(...caps);
      } catch {}
    }
    for (const entry of this.featureAds.values()) out.push(entry);
    return out;
  }
}


