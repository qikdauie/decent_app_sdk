// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { createWorkerCore } from '../core.js';
import { createSdkMockServiceWorkerGlobal as createMockServiceWorkerGlobal } from '../../test-helpers/mock-sw-global.js';

describe('service-worker core', () => {
  it('creates registry and runtime bridges', () => {
    globalThis.self = createMockServiceWorkerGlobal();
    const { registry, runtime } = createWorkerCore({});
    expect(registry).toBeTruthy();
    expect(typeof runtime.pack).toBe('function');
    expect(typeof runtime.unpack).toBe('function');
    expect(typeof runtime.send).toBe('function');
    expect(typeof runtime.sendType).toBe('function');
  });

  it('handles missing apis gracefully', () => {
    const selfMock = createMockServiceWorkerGlobal({ overrides: { packMessage: undefined } });
    globalThis.self = selfMock;
    const { runtime } = createWorkerCore({});
    // pack should still be a function that rejects or returns failure
    expect(typeof runtime.pack).toBe('function');
  });
});


