import { ProtocolProxyFactory } from './protocol-proxy.js';

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
      if (name === 'advertise') return (featureType, id, roles = []) => messenger.rpc('advertise', { featureType, id, roles }).then(r => Boolean(r && r.ok)).catch(() => false);
      if (name === 'discover') return (matchers, timeout = 400) => messenger.rpc('discover', { matchers, timeout }).catch(() => ({ ok: false, result: {} }));
      if (name === 'intents') {
        return {
          advertise: (actionOrRequestType, roles = ['provider']) => {
            const arg = String(actionOrRequestType || '');
            const isType = arg.includes('://');
            const payload = isType ? { requestType: arg, roles } : { action: arg, roles };
            return messenger.rpc('intentAdvertise', payload).then(r => Boolean(r && r.ok)).catch(() => false);
          },
          discover: (matchers = ['*'], timeout = 600) => messenger.rpc('intentDiscover', { matchers, timeout }).catch(() => ({ ok: false, result: {} })),
          request: (dest, requestBody, opts = {}) => messenger.rpc('intentRequest', { dest, requestBody, waitForResult: opts.waitForResult !== false, timeout: opts.timeout || 15000, requestType: opts.requestType }).catch(() => ({ ok: false, error: 'RPC failed' })),
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

