import { ProtocolRegistry } from '../protocols/registry.js';
import { DiscoverFeaturesProtocol } from '../protocols/discover-features/index.js';
import { AppIntentsProtocol } from '../protocols/app-intents/index.js';
import { TrustPingProtocol } from '../protocols/trust-ping/index.js';

/**
 * Service Worker core harness for decent_app_sdk.
 * Bridges DIDComm pack/unpack/send, protocol registry, and permissions.
 */

export function createWorkerCore(config = {}) {
  const logger = config.logger || console;
  const registry = new ProtocolRegistry({ logger });

  // Feature detection for required env APIs
  try {
    for (const api of ['packMessage','unpackMessage','sendMessage']) {
      if (typeof self[api] !== 'function') {
        try { logger.error(`[SW] Missing required API: ${api}`); } catch {}
      }
    }
  } catch {}

  async function pack(dest, type, bodyJson, attachments = [], replyTo = "") {
    try {
      return await (/** @type {any} */ (self)).packMessage(dest, type, bodyJson, attachments, replyTo);
    } catch (err) {
      try { logger.error('[SW] pack failed', err); } catch {}
      return { success: false, error: String(err?.message || err) };
    }
  }
  async function unpack(raw) {
    try {
      return await (/** @type {any} */ (self)).unpackMessage(raw);
    } catch (err) {
      try { logger.error('[SW] unpack failed', err); } catch {}
      return { success: false, error: String(err?.message || err) };
    }
  }
  async function send(dest, packed) {
    try {
      await (/** @type {any} */ (self)).sendMessage(dest, packed);
      return { ok: true };
    } catch (err) {
      try { logger.error('[SW] send failed', err); } catch {}
      return { ok: false, error: String(err?.message || err) };
    }
  }
  async function sendType(dest, type, body) {
    const packed = await pack(dest, type, JSON.stringify(body || {}), [], "");
    if (!packed?.success) return false;
    const res = await send(dest, packed.message);
    return Boolean(res && res.ok);
  }

  // Pass full runtime including registry for protocol access
  registry.init({ pack, unpack, send, sendType, permissions: self, logger, registry });

  const builtIns = config.builtInProtocols !== false;
  if (builtIns) {
    // Allow router configuration to be provided via config.appIntents.router
    const intentsOptions = { ...(config.appIntents || {}) };
    registry.register(new DiscoverFeaturesProtocol());
    registry.register(new AppIntentsProtocol(intentsOptions));
    registry.register(new TrustPingProtocol());
  }

  // Wire inbound delivery to registry routing (best-effort)
  try {
    const autoUnpack = config.autoUnpack !== false; // default true
    self.addEventListener('delivery', evt => {
      (async () => {
        try {
          const raw = (/** @type {any} */ (evt)).data;
          if (autoUnpack) {
            try {
              const up = await unpack(raw);
              if (up?.success) {
                const msg = JSON.parse(up.message);
                const envelope = { type: msg?.type, from: msg?.from, body: msg?.body, raw };
                try { await registry.routeIncoming(envelope); } catch {}
                // TODO: Remove correlation forwarding once packMessage returns thread ID
                try { self.dispatchEvent(new MessageEvent('rpc-delivery', { data: envelope })); } catch {}
                return;
              }
            } catch (err) {
              try { logger.error('[SW] unpack on delivery failed', err); } catch {}
            }
            // Fallback when unpack fails
            const envelope = { type: '', from: undefined, body: undefined, raw };
            try { await registry.routeIncoming(envelope); } catch {}
            try { self.dispatchEvent(new MessageEvent('rpc-delivery', { data: envelope })); } catch {}
          } else {
            // Skip unpacking; forward raw
            const envelope = { type: '', from: undefined, body: undefined, raw };
            try { await registry.routeIncoming(envelope); } catch {}
            // TODO: Remove correlation forwarding once packMessage returns thread ID
            try { self.dispatchEvent(new MessageEvent('rpc-delivery', { data: envelope })); } catch {}
          }
        } catch (err) {
          try { logger.error('[SW] delivery handling failed', err); } catch {}
        }
      })();
    });
  } catch {}

  return { registry, logger, runtime: { pack, unpack, send, sendType } };
}
