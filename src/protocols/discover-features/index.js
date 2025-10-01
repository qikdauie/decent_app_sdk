import { BaseProtocol } from '../base.js';
import { buildQueryBody, isDisclosePacket, extractFeatures, matchFeatures } from './utils.js';
import { extractThid } from '../../utils/message-helpers.js';

export class DiscoverFeaturesProtocol extends BaseProtocol {
  constructor() {
    super({
      id: 'discover-features-v2',
      piuri: 'https://didcomm.org/discover-features/2.0',
      version: '2.0',
      messageTypes: [
        'https://didcomm.org/discover-features/2.0/queries',
        'https://didcomm.org/discover-features/2.0/disclose',
      ],
    });
  }

  declareClientMethods() {
    return {
      discover: { params: ['matchers', 'timeout?'], description: 'Discover features across peers', timeoutMs: 1000 },
      advertise: { params: ['featureType', 'id', 'roles?'], description: 'Advertise a feature', timeoutMs: 500 },
    };
  }

  async handleIncoming(envelope) {
    const { type, from, body } = envelope || {};
    if (type === 'https://didcomm.org/discover-features/2.0/queries' && from) {
      const queries = Array.isArray(body?.queries) ? body.queries : [];
      const caps = this.runtime.registry.aggregateCapabilities();
      const matched = matchFeatures(caps.map(f => ({ featureType: f['feature-type'] || f.feature_type || f.featureType, id: f.id, roles: f.roles || [] })), queries);
      if (!matched.length) return true; // no-op; handled

      const discloseBody = {
        disclosures: matched.map(f => ({ ['feature-type']: f.featureType, id: f.id, roles: f.roles || [] }))
      };
      const thid = extractThid(envelope?.raw || envelope) || undefined;
      const headers = thid ? { thid } : undefined;
      await this.runtime.sendType(from, 'https://didcomm.org/discover-features/2.0/disclose', discloseBody, { headers, replyTo: JSON.stringify(envelope?.raw || {}) });
      return true;
    }
    return false;
  }

  advertiseCapabilities() {
    // Only advertise protocol; message types will be surfaced via registry aggregate
    return [ { ['feature-type']: 'protocol', id: this.meta.piuri, roles: [] } ];
  }

  async invokeClientMethod(methodName, args) {
    if (methodName === 'discover') {
      const [matchers = [], timeout = 400] = Array.isArray(args) ? args : [args];
      const result = await discoverFeatures(this.runtime, matchers, timeout);
      return { ok: true, result };
    }
    if (methodName === 'advertise') {
      const [featureType, id, roles = []] = Array.isArray(args) ? args : [args];
      await this.runtime.registry.advertiseFeature(featureType, id, roles);
      return { ok: true };
    }
    throw new Error(`Unknown method: ${methodName}`);
  }
}

/**
 * Service-side helper to broadcast a query and collect responses for a short window.
 * Uses the runtime bridges available in the protocol instance.
 */
export async function discoverFeatures(runtime, matchers = [], timeout = 400) {
  const body = buildQueryBody(matchers);
  const packed = await runtime.pack('did:all:all', 'https://didcomm.org/discover-features/2.0/queries', JSON.stringify(body), [], "");
  if (!packed?.success) return {};
  try { await runtime.send('did:all:all', packed.message); } catch {}

  return await new Promise(resolve => {
    const featuresByPeer = {};
    const listener = (evt) => {
      try {
        const env = (/** @type {any} */ (evt))?.data || {};
        const msg = env?.raw || env;
        if (!isDisclosePacket(msg)) return;
        const peer = msg?.from;
        const feats = extractFeatures(msg);
        if (peer && Array.isArray(feats)) featuresByPeer[peer] = feats;
      } catch {}
    };
    try { self.addEventListener('rpc-delivery', listener); } catch {}
    setTimeout(() => { try { self.removeEventListener('rpc-delivery', listener); } catch {} resolve(featuresByPeer); }, timeout);
  });
}


