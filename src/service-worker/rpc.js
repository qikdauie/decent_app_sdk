/**
 * Service Worker RPC router for decent_app_sdk.
 * Registers a message-based RPC handler and optional delivery forwarding.
 */

import { discoverFeatures } from '../protocols/discover-features/index.js';
import { actionToRequestType } from '../protocols/app-intents/intents.js';
import { RpcMethods, RouterResults } from '../constants/index.js';
import {
  ensureJson,
  isIntentResponse,
  isIntentDecline,
} from '../utils/message-helpers.js';
import { extractThid } from '../utils/message-helpers.js';
import { normalizeAttachments, validateAttachments } from '../utils/attachments.js';

export function registerRpcHandlers(options) {
  const { registry, runtime = self, logger = console, config = {} } = options || {};
  const deliveryStrategy = config.deliveryStrategy || 'broadcast';
  const autoUnpack = config.autoUnpack !== false; // default true
  /** @type {Map<string, { clientId: string, expiresAt: number }>} */
  const threadToClient = new Map();
  const THREAD_TTL_MS = 5 * 60 * 1000; // 5 minutes
  const MAX_THREAD_MAPPINGS = 1000; // guardrail to cap memory usage
  const now = () => Date.now();
  const cleanThreads = () => {
    const t = now();
    for (const [k, v] of threadToClient.entries()) {
      if ((v?.expiresAt || 0) <= t) threadToClient.delete(k);
    }
  };

  /** @type {Map<string, { resolve: (value:any)=>void, reject: (err:any)=>void, timeoutId: any }>} */
  const pendingByThreadId = new Map();

  // Wire delivery events for thread-based intent matching (expects createWorkerCore to dispatch 'rpc-delivery' with unpacked envelope)
  try {
    runtime.addEventListener?.('rpc-delivery', (evt) => {
      try {
        const envelope = (/** @type {any} */ (evt))?.data || {};
        const type = String(envelope?.type || '');
        if (!type || (!isIntentResponse(type) && !isIntentDecline(type))) return;
        const thid = extractThid(envelope?.raw || envelope);
        if (!thid) return;
        const pending = pendingByThreadId.get(String(thid));
        if (!pending) {
          try { logger?.log?.('[SW][rpc] intent response received but no pending waiter', { thid }); } catch {}
          return;
        }
        try { clearTimeout(pending.timeoutId); } catch {}
        pendingByThreadId.delete(String(thid));
        const declined = isIntentDecline(type);
        try {
          try { logger?.log?.('[SW][rpc] intent response matched', { thid, declined }); } catch {}
          pending.resolve({ response: envelope, ...(declined ? { declined: true } : {}) });
        } catch {}
      } catch {}
    });
  } catch {}
  try {
    runtime.addEventListener('message', (evt) => {
      const msg = (evt && /** @type {any} */ (evt).data) || {};
      const { kind, data, port } = msg;
      if (!port || !kind) return;
      const reply = (payload) => { try { port.postMessage(payload); } catch (e) { try { logger?.error?.('[SW][rpc] postMessage failed', e); } catch {} } };
      const ok = (res) => reply({ ok: true, ...res });
      const fail = (error, extra = {}) => {
        try {
          (async () => {
            try {
              const { formatError } = await import('../utils/protocol-helpers.js');
              const msg = formatError(error, 'RPC failed');
              reply({ ok: false, error: msg, ...extra });
            } catch {
              reply({ ok: false, error: String(error?.message || error), ...extra });
            }
          })();
        } catch {
          reply({ ok: false, error: String(error?.message || error), ...extra });
        }
      };
      (async () => {
        try {
          switch (kind) {
            case RpcMethods.GET_PROTOCOL_METHODS: {
              try {
                const map = registry.getAllProtocolClientMethods();
                return ok({ methods: map });
              } catch (err) { return fail(err); }
            }
            case RpcMethods.PROTOCOL_INVOKE: {
              try {
                const { protocolId, method, args = [], timeout } = data || {};
                const result = await registry.invokeProtocolClientMethod(protocolId, method, Array.isArray(args) ? args : [args], timeout);
                return ok({ result });
              } catch (err) { return fail(err); }
            }
            case RpcMethods.REGISTER_ADDRESS: {
              try {
                const { did } = data || {};
                const res = await (/** @type {any} */ (runtime))['registerAddress']?.(did);
                return reply(res);
              } catch (err) {
                try { logger?.error?.('[SW][rpc] registerAddress failed', err); } catch {}
                // RouterResult fallback on error
                return reply(RouterResults.UNKNOWN_ERROR);
              }
            }
            case RpcMethods.GET_DID: {
              try {
                const res = await ((/** @type {any} */ (runtime))['getDID']?.() ?? Promise.reject(new Error('getDID not available')));
                return reply(res);
              } catch (err) {
                try { logger?.error?.('[SW][rpc] getDID failed', err); } catch {}
                return reply({ success: false, error_code: 1, error: String(err?.message || err), did: '', did_document: '', public_key: '' });
              }
            }
            case RpcMethods.PACK_MESSAGE: {
              try {
                const { dest, type, body, attachments = [], replyTo = "" } = data || {};
                // Normalize and validate attachments to ensure underlying env receives clean values
                const normalized = normalizeAttachments(Array.isArray(attachments) ? attachments : []);
                const validated = validateAttachments(normalized);
                if (!validated.ok) {
                  const details = (validated.errors || []).map(e => `#${e.index}:${e.error}`).join(', ');
                  throw new Error(`[SW][rpc] Invalid attachments: ${details || 'validation failed'}`);
                }
                const bodyJson = ensureJson(body || {});
                const res = await (/** @type {any} */ (runtime))['packMessage'](dest, type, bodyJson, normalized, replyTo);
                return reply({ ...res, thid: res?.thid });
              } catch (err) {
                try { logger?.error?.('[SW][rpc] packMessage failed', err); } catch {}
                return reply({ success: false, error_code: 1, error: String(err?.message || err), message: '' });
              }
            }
            case RpcMethods.UNPACK_MESSAGE: {
              try {
                const { raw } = data || {};
                const res = await (/** @type {any} */ (runtime))['unpackMessage'](raw);
                return reply(res);
              } catch (err) {
                try { logger?.error?.('[SW][rpc] unpackMessage failed', err); } catch {}
                return reply({ success: false, error_code: 1, error: String(err?.message || err), message: '' });
              }
            }
            case RpcMethods.SEND: {
              try {
                const { dest, packed, threadId } = data || {};
                const result = await (/** @type {any} */ (runtime))['sendMessage'](dest, packed);
                try {
                  const inferredThreadId = threadId || extractThid(packed) || undefined;
                  if (inferredThreadId && evt?.source?.id) {
                    threadToClient.set(String(inferredThreadId), { clientId: String((/** @type {any} */ (evt)).source.id), expiresAt: now() + THREAD_TTL_MS });
                    cleanThreads();
                    // Evict oldest mappings if exceeding cap (FIFO over Map insertion order)
                    while (threadToClient.size > MAX_THREAD_MAPPINGS) {
                      const oldestKey = threadToClient.keys().next().value;
                      if (!oldestKey) break;
                      threadToClient.delete(oldestKey);
                    }
                  }
                } catch {}
                return reply(result);
              } catch (err) {
                try { logger?.error?.('[SW][rpc] send failed', err); } catch {}
                return reply(RouterResults.UNKNOWN_ERROR);
              }
            }
            case RpcMethods.DISCOVER: {
              try {
                const { matchers, timeout } = data || {};
                const result = await discoverFeatures(runtime, matchers, timeout);
                return ok({ result });
              } catch (err) { return fail(err); }
            }
            case RpcMethods.ADVERTISE: {
              try {
                const { featureType, id, roles = [] } = data || {};
                await registry.advertiseFeature(featureType, id, roles);
                return ok({});
              } catch (err) { return fail(err); }
            }
            case RpcMethods.INTENT_ADVERTISE: {
              try {
                const { action, requestType, roles = ['provider'] } = data || {};
                const typeUri = requestType || (action ? actionToRequestType(action) : '');
                if (!typeUri) throw new Error('Unknown intent action/type');
                await registry.advertiseFeature('message-type', typeUri, roles);
                return ok({});
              } catch (err) { return fail(err); }
            }
            case RpcMethods.INTENT_DISCOVER: {
              try {
                const { matchers = ['*'], timeout } = data || {};
                const all = await discoverFeatures(runtime, matchers, timeout);
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
                return ok({ result: filtered });
              } catch (err) { return fail(err); }
            }
            case RpcMethods.INTENT_REQUEST: {
              try {
                const { dest, requestBody, requestType, waitForResult = true, timeout = 5000 } = data || {};
                if (!requestType) throw new Error('requestType is required');
                const packed = await (/** @type {any} */ (runtime))['packMessage'](dest, requestType, ensureJson(requestBody || {}), [], "");
                if (!packed?.success) throw new Error(String(packed?.error || 'pack failed'));
                const thid = packed?.thid || extractThid(packed?.message);
                await (/** @type {any} */ (runtime))['sendMessage'](dest, packed.message);
                if (!waitForResult) return ok({});

                const result = await new Promise((resolve, reject) => {
                  if (!thid) {
                    reject(new Error('intentRequest missing thread id'));
                    return;
                  }
                  const timeoutId = setTimeout(() => {
                    try { pendingByThreadId.delete(String(thid)); } catch {}
                    reject(new Error('intentRequest timed out'));
                  }, timeout);
                  try { logger?.log?.('[SW][rpc] intent waiter set', { thid }); } catch {}
                  pendingByThreadId.set(String(thid), { resolve, reject, timeoutId });
                });
                return ok(result || {});
              } catch (err) { return fail(err); }
            }
            case RpcMethods.CHECK_PERMISSION: {
              try {
                const { protocolUri, messageTypeUri } = data || {};
                const granted = await (/** @type {any} */ (runtime))['checkDidcommPermission']?.(protocolUri, messageTypeUri);
                return reply(Boolean(granted));
              } catch (err) {
                try { logger?.error?.('[SW][rpc] checkDidcommPermission failed', err); } catch {}
                return reply(false);
              }
            }
            case RpcMethods.CHECK_MULTIPLE_PERMISSIONS: {
              try {
                const { protocolUris = [], messageTypeUris = [] } = data || {};
                const n = Math.min(protocolUris.length, messageTypeUris.length);
                const pu = protocolUris.slice(0, n);
                const mu = messageTypeUris.slice(0, n);
                const results = await (/** @type {any} */ (runtime))['checkMultipleDidcommPermissions']?.(pu, mu);
                return reply(results || []);
              } catch (err) {
                try { logger?.error?.('[SW][rpc] checkMultipleDidcommPermissions failed', err); } catch {}
                return reply([]);
              }
            }
            case RpcMethods.REQUEST_PERMISSIONS: {
              try {
                const { requests = [] } = data || {};
                const result = await (/** @type {any} */ (runtime))['requestDidcommPermissions']?.(requests);
                return reply(result);
              } catch (err) {
                try { logger?.error?.('[SW][rpc] requestDidcommPermissions failed', err); } catch {}
                return reply({ success: false, grantedPermissions: [], failedProtocols: [], errorMessage: 'RPC failed' });
              }
            }
            case RpcMethods.LIST_GRANTED_PERMISSIONS: {
              try {
                const { protocolUris = [] } = data || {};
                const list = await (/** @type {any} */ (runtime))['listGrantedDidcommPermissions']?.(protocolUris);
                return reply(list || []);
              } catch (err) {
                try { logger?.error?.('[SW][rpc] listGrantedDidcommPermissions failed', err); } catch {}
                return reply([]);
              }
            }
            default:
              throw new Error(`Unknown RPC kind: ${kind}`);
          }
        } catch (err) {
          try { logger?.error?.('[SW][rpc] handler error', kind, err); } catch {}
          fail(err);
        }
      })();
    });
  } catch (err) {
    try { logger?.error?.('[SW][rpc] Failed to register message handler', err); } catch {}
  }

  // Forward inbound delivery events to window clients
  try {
    runtime.addEventListener('delivery', async (evt) => {
      try {
        const raw = (/** @type {any} */ (evt))?.data;
        let unpacked = null;
        if (autoUnpack) {
          try {
            const up = await runtime.unpack(raw);
            if (up?.success) unpacked = JSON.parse(up.message);
          } catch {}
        }
        const clientsList = await runtime.clients.matchAll({ includeUncontrolled: true, type: 'window' });
        try { logger?.log?.(`[SW][rpc] delivery fanout to ${String((clientsList && clientsList.length) || 0)} client(s)`); } catch {}
        if (deliveryStrategy === 'thread' && autoUnpack) {
          try {
            if (unpacked) {
              const { extractThid } = await import('../utils/message-helpers.js');
              const thid = extractThid(unpacked);
              const mapping = thid ? threadToClient.get(String(thid)) : null;
              const clientId = mapping?.clientId;
              if (clientId) {
                const target = clientsList.find(c => String(c.id) === clientId);
                if (target) {
                  try { target.postMessage({ kind: 'incoming', raw: unpacked }); } catch {}
                  return; // delivered
                }
              }
            }
          } catch {}
          // Fallback to broadcast if no mapping
        }
        for (const c of clientsList) {
          try { logger?.log?.(`[SW][rpc] posting incoming to client ${String(c?.id || '')}`); } catch {}
          try { c.postMessage({ kind: 'incoming', raw: unpacked ?? raw }); } catch {}
        }
      } catch (err) {
        try { logger?.error?.('[SW][rpc] delivery fanout failed', err); } catch {}
      }
    });
  } catch (err) {
    try { logger?.error?.('[SW][rpc] Failed to register delivery listener', err); } catch {}
  }
}


