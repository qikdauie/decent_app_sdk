import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MessengerClient } from '../messenger.js';

let __snap;
beforeEach(() => {
  __snap = globalThis.__snapGlobals?.();
  // Minimal navigator SW mock for constructor path (won't actually register)
  globalThis.navigator = Object.assign(Object.create(globalThis.navigator || {}), {
    serviceWorker: {
      register: async () => ({ active: { postMessage() {} }, addEventListener() {}, removeEventListener() {}, installing: null, waiting: null }),
      addEventListener() {},
      removeEventListener() {},
      controller: { postMessage() {} },
    }
  });
});

afterEach(() => {
  globalThis.__restoreGlobals?.(__snap);
});

describe('MessengerClient', () => {
  it('constructs and exposes rpc()', async () => {
    const m = new MessengerClient({ readinessTimeoutMs: 10, rpcTimeoutMs: 10 });
    // m.ready may reject in Node env without true SW; treat as smoke
    await m.ready.catch(() => {});
    // We cannot fully test rpc without ports here; smoke test api exists
    expect(typeof m.rpc).toBe('function');
  });

  // Service worker port/RPC behavior is validated in UI-triggered tests under
  // `src/tests/ui-triggered/sdk/client/messenger.test.js`.
});


