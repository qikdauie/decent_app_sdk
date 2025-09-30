import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDecentClientSingleton, getReadyDecentClientSingleton } from '../singleton.js';

let __snap;
beforeEach(() => {
  __snap = globalThis.__snapGlobals?.();
  // Minimal navigator SW mock to satisfy DecentClient construction path
  const nav = /** @type {any} */ (globalThis.navigator || (globalThis.navigator = /** @type {any} */({})));
  nav.serviceWorker = {
    register: async () => ({ active: { postMessage() {} }, addEventListener() {}, removeEventListener() {}, installing: null, waiting: null }),
    addEventListener() {},
    removeEventListener() {},
    controller: { postMessage() {} },
  };
});

afterEach(() => {
  globalThis.__restoreGlobals?.(__snap);
});

describe('singleton', () => {
  it('returns same instance across calls', async () => {
    const a = getDecentClientSingleton();
    const b = getDecentClientSingleton();
    expect(a).toBe(b);
  });

  it('ready variant resolves', async () => {
    const sdk = await getReadyDecentClientSingleton();
    expect(sdk).toBeTruthy();
  });
});


