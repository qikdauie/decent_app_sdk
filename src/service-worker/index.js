import { createWorkerCore } from './core.js';
import { registerRpcHandlers } from './rpc.js';

/**
 * Initialize the Service Worker for decent_app_sdk.
 *
 * Example usage in your sw.js:
 *   import { initServiceWorker } from 'decent_app_sdk/service-worker';
 *   initServiceWorker({ builtInProtocols: true });
 */
/**
 * Initialize the Service Worker for decent_app_sdk.
 *
 * Configuration options:
 * - autoUnpack?: boolean = true
 *   When true, inbound delivery events are automatically unpacked and routed.
 *   When false, raw messages are forwarded and protocols receive raw payloads.
 * - deliveryStrategy?: 'broadcast' | 'thread' = 'broadcast'
 *   Controls how inbound messages are forwarded to window clients.
 *   'broadcast': forward to all clients (default).
 *   'thread': target only the originating client based on DIDComm thread IDs.
 *   Note: 'thread' requires autoUnpack=true. If configured otherwise, the SDK
 *   will automatically enable autoUnpack and log a warning.
 * - appIntents?: {
 *     router?: {
 *       onRequest?: (envelope) => Promise<{ accept?: boolean, response?: { result?: any }, result?: any, decline?: { reason?: string, detail?: any, retry_after_ms?: number } }>,
 *       onCancel?: (envelope) => void,
 *     },
 *     roles?: string[],
 *     advertise?: boolean,
 *   }
 *   Router handlers allow custom processing of app-intents. onRequest/onCancel
 *   must be functions if provided. autoUnpack defaults to true and should only
 *   be disabled for development.
 */
export function initServiceWorker(config = {}) {
  const cfg = { autoUnpack: true, deliveryStrategy: 'broadcast', ...(config || {}) };
  try {
    if (cfg.deliveryStrategy === 'thread' && cfg.autoUnpack === false) {
      try { console?.warn?.('[SW] deliveryStrategy "thread" requires autoUnpack. Forcing autoUnpack=true.'); } catch {}
      cfg.autoUnpack = true;
    }
    // Basic validation for appIntents.router handlers
    const appCfg = /** @type {any} */ (cfg);
    const router = appCfg?.appIntents?.router;
    if (router) {
      if (router.onRequest && typeof router.onRequest !== 'function') {
        try { console?.warn?.('[SW] appIntents.router.onRequest must be a function'); } catch {}
        router.onRequest = undefined;
      }
      if (router.onCancel && typeof router.onCancel !== 'function') {
        try { console?.warn?.('[SW] appIntents.router.onCancel must be a function'); } catch {}
        router.onCancel = undefined;
      }
    }
  } catch {}

  const { registry, logger, runtime } = createWorkerCore(cfg);
  registerRpcHandlers({ registry, runtime: Object.assign(self, runtime), logger, config: cfg });
  return { registry, runtime };
}


