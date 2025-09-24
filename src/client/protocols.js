/** Client-side protocol helpers */
import { isSuccess, getErrorMessage } from '../utils/response-helpers.js';

export function createProtocolHelpers(messenger) {
  return {
    discover: (matchers, timeout = 400) => 
      messenger.rpc('discover', { matchers, timeout })
        .catch(() => ({ ok: false, result: {} })),
    advertise: (featureType, id, roles = []) => 
      messenger.rpc('advertise', { featureType, id, roles })
        .then(r => Boolean(r && r.ok))
        .catch(() => false),
    // Convenience methods
    async discoverOk(matchers, timeout = 400) {
      const result = await this.discover(matchers, timeout);
      return isSuccess(result);
    },
    async getDiscoverError(matchers, timeout = 400) {
      const result = await this.discover(matchers, timeout);
      return getErrorMessage(result);
    },
    intents: {
      advertise: (actionOrRequestType, roles = ['provider']) => {
        const arg = String(actionOrRequestType || '');
        const isType = arg.includes('://');
        const payload = isType ? { requestType: arg, roles } : { action: arg, roles };
        return messenger.rpc('intentAdvertise', payload)
          .then(r => Boolean(r && r.ok))
          .catch(() => false);
      },
      discover: (matchers = ['*'], timeout = 600) => 
        messenger.rpc('intentDiscover', { matchers, timeout })
          .catch(() => ({ ok: false, result: {} })),
      request: (dest, requestBody, opts = {}) => 
        messenger.rpc('intentRequest', {
          dest,
          requestBody,
          waitForResult: opts.waitForResult !== false,
          timeout: opts.timeout || 15000,
          requestType: opts.requestType,
        }).catch(() => ({ ok: false, error: 'RPC failed' })),
      async requestOk(dest, requestBody, opts = {}) {
        const result = await this.request(dest, requestBody, opts);
        return isSuccess(result);
      },
      async getRequestError(dest, requestBody, opts = {}) {
        const result = await this.request(dest, requestBody, opts);
        return getErrorMessage(result);
      }
    },
    // Universal helpers
    isSuccess: (result) => isSuccess(result),
    getError: (result) => getErrorMessage(result)
  };
}


