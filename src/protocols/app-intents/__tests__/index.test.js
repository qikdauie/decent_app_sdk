import { describe, it, expect } from 'vitest';
import { AppIntentsProtocol } from '../index.js';

describe('AppIntentsProtocol', () => {
  it('registers and advertises features', () => {
    const p = new AppIntentsProtocol({ advertise: true, roles: ['provider'] });
    const registry = { advertiseFeature: () => {} };
    const runtime = { registry };
    p.register(runtime);
    expect(p.meta.id).toBe('app-intents-v1');
  });
});


