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


