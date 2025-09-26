import { RpcMethods } from '../constants/index.js';
/**
 * ProtocolProxy — dynamic client for protocol methods via RPC.
 *
 * Usage:
 *   const proxy = createProtocolProxy(messenger, 'trust-ping-v2', methodsMap)
 *   await proxy.ping(did, { comment: 'hi' })
 */

function getTimeoutOverrideFromArgs(args) {
  try {
    if (!Array.isArray(args) || args.length === 0) return undefined;
    const last = args[args.length - 1];
    if (last && typeof last === 'object') {
      if (Number.isFinite(last.timeout)) return Number(last.timeout);
      if (Number.isFinite(last.timeoutMs)) return Number(last.timeoutMs);
    }
  } catch {}
  return undefined;
}

export function createProtocolProxy(messenger, protocolId, methodsMap = {}) {
  const id = String(protocolId || '');
  const declared = methodsMap && typeof methodsMap === 'object' ? methodsMap : {};
  const call = async (method, args) => {
    const timeout = getTimeoutOverrideFromArgs(args);
    const res = await messenger.rpc(RpcMethods.PROTOCOL_INVOKE, { protocolId: id, method, args, timeout });
    if (res && res.ok) return res.result;
    throw new Error(String(res && res.error ? res.error : 'protocolInvoke failed'));
  };
  const handler = {
    get(_t, prop) {
      const name = String(prop);
      if (name === '__protocolId') return id;
      if (name === '__methods') return Object.keys(declared);
      if (!Object.prototype.hasOwnProperty.call(declared, name)) {
        return () => { throw new Error(`Protocol "${id}" has no client method "${name}". Available: ${Object.keys(declared).join(', ') || '(none)'}`); };
      }
      return (...args) => call(name, args);
    },
  };
  return new Proxy({}, handler);
}

export class ProtocolProxyFactory {
  constructor(messenger) {
    this.messenger = messenger;
    /** @type {Map<string, any>} */
    this.cache = new Map();
    /** @type {Record<string, any>} */
    this.methodsByProtocol = {};
  }

  async refresh() {
    const res = await this.messenger.rpc(RpcMethods.GET_PROTOCOL_METHODS, {});
    if (!res || !res.ok) throw new Error(String(res?.error || 'getProtocolMethods failed'));
    this.methodsByProtocol = res.methods || {};
    // Rebuild proxies in cache to pick up new method maps
    for (const [id] of this.cache.entries()) {
      const nextProxy = createProtocolProxy(this.messenger, id, this.methodsByProtocol[id] || {});
      this.cache.set(id, nextProxy);
    }
    return Object.keys(this.methodsByProtocol);
  }

  get(protocolId) {
    const id = String(protocolId || '');
    if (!this.cache.has(id)) {
      const proxy = createProtocolProxy(this.messenger, id, this.methodsByProtocol[id] || {});
      this.cache.set(id, proxy);
    }
    return this.cache.get(id);
  }

  list() {
    return Object.keys(this.methodsByProtocol || {});
  }

  has(protocolId) {
    return Object.prototype.hasOwnProperty.call(this.methodsByProtocol || {}, String(protocolId || ''));
  }
}


