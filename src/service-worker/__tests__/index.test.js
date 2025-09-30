// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { initServiceWorker } from '../index.js';
import { createSdkMockServiceWorkerGlobal as createMockServiceWorkerGlobal } from '../../test-helpers/mock-sw-global.js';

describe('service-worker init', () => {
  it('returns registry and runtime', () => {
    globalThis.self = createMockServiceWorkerGlobal();
    const { registry, runtime } = initServiceWorker({ builtInProtocols: false });
    expect(registry).toBeTruthy();
    expect(runtime).toBeTruthy();
  });
});


