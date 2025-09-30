import { BaseProtocol } from '../base.js';
import { INTENTS, advertiseIntentsList, requestTypeToAction } from './intents.js';
import { IntentRouter } from './router.js';

export { INTENTS } from './intents.js';
export { IntentRouter } from './router.js';

export class AppIntentsProtocol extends BaseProtocol {
  constructor(options = {}) {
    super({
      id: 'app-intents-v1',
      piuri: 'https://didcomm.org/app-intent/1.0',
      version: '1.0',
      messageTypes: [
        'https://didcomm.org/app-intent/1.0/*',
      ],
    });
    this.router = new IntentRouter(options.router || {});
    this.roles = Array.isArray(options.roles) ? options.roles : ['provider'];
    this.advertise = options.advertise !== false;
  }

  register(runtime) {
    super.register(runtime);
    if (this.advertise) {
      advertiseIntentsList(runtime.registry, Object.values(INTENTS), this.roles);
      runtime.registry.advertiseFeature('protocol', this.meta.piuri, this.roles);
    }
  }

  async handleIncoming(envelope) {
    const { type } = envelope || {};
    if (!type) return false;
    if (type.startsWith('https://didcomm.org/app-intent/1.0/')) {
      return await this.router.handleIncoming(envelope, this.runtime);
    }
    return false;
  }

  declareClientMethods() {
    return {
      advertise: { params: ['actionOrType', 'roles?'], description: 'Advertise an app-intent capability' },
      discover: { params: ['matchers?', 'timeoutMs?'], description: 'Discover intent providers', timeoutMs: 1000 },
      request: { params: ['to', 'requestBody', 'opts?'], description: 'Send an app-intent request and optionally wait for response', timeoutMs: 15000 },
    };
  }

  async invokeClientMethod(methodName, args) {
    if (methodName === 'advertise') {
      const [actionOrRequestType, roles = ['provider']] = Array.isArray(args) ? args : [args];
      const arg = String(actionOrRequestType || '');
      const isType = arg.includes('://');
      const payload = isType ? { requestType: arg, roles } : { action: arg, roles };
      await this.runtime.registry.advertiseFeature('message-type', payload.requestType || '', payload.roles || ['provider']);
      return { ok: true };
    }
    if (methodName === 'discover') {
      const [matchers = ['*'], timeout = 600] = Array.isArray(args) ? args : [args];
      const { discoverFeatures } = await import('../discover-features/index.js');
      const all = await discoverFeatures(this.runtime, matchers, timeout);
      const like = Array.isArray(matchers) && matchers.length ? matchers : ['*'];
      const matchFn = (id) => {
        const s = String(id || '');
        for (const m of like) {
          const mm = String(m || '*');
          if (mm === '*') return true;
          if (mm.endsWith('*')) { if (s.startsWith(mm.slice(0, -1))) return true; }
          if (s === mm) return true;
        }
        return false;
      };
      const filtered = {};
      for (const [peer, feats] of Object.entries(all || {})) {
        const list = (feats || []).filter(f => (f?.['feature-type'] || f?.feature_type || f?.featureType) === 'message-type' && matchFn(f?.id));
        if (list.length) filtered[peer] = list;
      }
      return { ok: true, result: filtered };
    }
    if (methodName === 'request') {
      const [dest, requestBody, opts = {}] = Array.isArray(args) ? args : [args];
      const { ensureJson, extractThid, isIntentResponse, isIntentDecline } = await import('../../utils/message-helpers.js');
      const requestType = opts.requestType;
      if (!requestType) throw new Error('requestType is required');
      const packed = await this.runtime.pack(dest, requestType, ensureJson(requestBody || {}), [], "");
      if (!packed?.success) throw new Error(String(packed?.error || 'pack failed'));
      const thid = packed?.thid || extractThid(packed?.message);
      await this.runtime.send(dest, packed.message);
      if (opts.waitForResult === false) return { ok: true };
      const timeout = Number.isFinite(opts.timeout) ? Number(opts.timeout) : 15000;
      const result = await new Promise((resolve, reject) => {
        if (!thid) { reject(new Error('intentRequest missing thread id')); return; }
        const timeoutId = setTimeout(() => {
          try { /* best-effort log */ console?.warn?.('[AppIntents] intentRequest timed out', { thid }); } catch {}
          reject(new Error('intentRequest timed out'));
        }, timeout);
        const onEvt = async (evt) => {
          try {
            const up = await this.runtime.unpack((/** @type {any} */ (evt)).data);
            if (!up?.success) return;
            const msg = JSON.parse(up.message);
            const env = { type: msg?.type, from: msg?.from, body: msg?.body, raw: msg };
            if (!isIntentResponse(env.type) && !isIntentDecline(env.type)) return;
            const got = extractThid(env?.raw || env);
            if (String(got || '') !== String(thid || '')) return;
            try { clearTimeout(timeoutId); } catch {}
            try { self.removeEventListener('delivery', onEvt); } catch {}
            resolve({ response: env, declined: isIntentDecline(env.type) });
          } catch {}
        };
        try { self.addEventListener('delivery', onEvt); } catch {}
      });
      return { ok: true, ...(result || {}) };
    }
    throw new Error(`Unknown method: ${methodName}`);
  }
}


