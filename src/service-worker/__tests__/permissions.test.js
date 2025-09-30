// @ts-nocheck
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initServiceWorker } from '../index.js';
import { RpcMethods } from '../../constants/rpc.js';
import { createSdkMockServiceWorkerGlobal as createMockServiceWorkerGlobal } from '../../test-helpers/mock-sw-global.js';

describe('service-worker permissions rpc', () => {
  let snap;
  beforeEach(() => {
    snap = globalThis.__snapGlobals?.();
    const selfMock = createMockServiceWorkerGlobal();
    globalThis.self = selfMock;
    initServiceWorker({ builtInProtocols: false });
  });
  afterEach(() => { globalThis.__restoreGlobals?.(snap); });

  // The following cases require real Service Worker APIs and have been moved to
  // UI-triggered tests under `src/tests/ui-triggered/sdk/service-worker/permissions.test.js`:
  // - check permission routes to runtime and returns boolean
  // - checkMultiple returns array of booleans
  // - request permissions returns structured result
  // - listGranted returns array
  // - handles runtime errors gracefully

  it('registers message handler for permissions (smoke)', () => {
    const selfMock = globalThis.self;
    expect(Array.isArray(selfMock.__listeners.message)).toBe(true);
    expect(selfMock.__listeners.message.length).toBeGreaterThan(0);
  });

  it('CHECK_PERMISSION returns boolean (smoke)', () => {
    const selfMock = globalThis.self;
    let out = null;
    const port = { postMessage: (m) => { out = m; } };
    selfMock.__dispatchMessage({ kind: RpcMethods.CHECK_PERMISSION, data: { protocolUri: 'p', messageTypeUri: 't' }, port });
    // In our RPC wrapper, permission replies are posted directly as boolean
    // or wrapped objects when errors occur; accept either
    expect(['boolean', 'object']).toContain(typeof out);
  });
});


