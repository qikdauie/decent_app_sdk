import { ProtocolProxyFactory } from './protocol-proxy.js';
import { RpcMethods } from '../constants/index.js';

/**
 * Dynamic, proxy-based protocol helpers entrypoint.
 */
export function createProtocolHelpers(messenger) {
  const factory = new ProtocolProxyFactory(messenger);
  const root = new Proxy({}, {
    get(_t, prop) {
      const name = String(prop);
      if (name === 'refresh') return () => factory.refresh();
      if (name === 'list') return () => factory.list();
      if (name === 'has') return (id) => factory.has(id);
      if (name === 'advertise') return (featureType, id, roles = []) => messenger.rpc(RpcMethods.ADVERTISE, { featureType, id, roles }).then(r => Boolean(r && r.ok)).catch(() => false);
      if (name === 'discover') return (matchers, timeout = 400) => messenger.rpc(RpcMethods.DISCOVER, { matchers, timeout }).catch(() => ({ ok: false, result: {} }));
      if (name === 'intents') {
        return {
          advertise: (actionOrRequestType, roles = ['provider']) => {
            const arg = String(actionOrRequestType || '');
            const isType = arg.includes('://');
            const payload = isType ? { requestType: arg, roles } : { action: arg, roles };
            return messenger.rpc(RpcMethods.INTENT_ADVERTISE, payload).then(r => Boolean(r && r.ok)).catch(() => false);
          },
          discover: (matchers = ['*'], timeout = 600) => messenger.rpc(RpcMethods.INTENT_DISCOVER, { matchers, timeout }).catch(() => ({ ok: false, result: {} })),
          request: (dest, requestBody, opts = {}) => messenger.rpc(RpcMethods.INTENT_REQUEST, { dest, requestBody, waitForResult: opts.waitForResult !== false, timeout: opts.timeout || 15000, requestType: opts.requestType }).catch(() => ({ ok: false, error: 'RPC failed' })),
        };
      }
      return factory.get(name);
    },
  });
  // Auto-refresh methods on first tick but defer heavy work until used
  // Caller can await sdk.protocols.refresh() to ensure ready
  setTimeout(() => { try { factory.refresh(); } catch {} }, 0);
  return root;
}

