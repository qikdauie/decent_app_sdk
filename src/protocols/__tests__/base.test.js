import { describe, it, expect } from 'vitest';
import { BaseProtocol } from '../base.js';

describe('BaseProtocol', () => {
  it('constructs with required metadata and supports message type patterns', () => {
    const p = new BaseProtocol({ id: 'x', piuri: 'urn:x:1.0', messageTypes: ['urn:x/1.0/*', 'urn:x/1.0/y'] });
    expect(p.supportsMessageType('urn:x/1.0/anything')).toBe(true);
    expect(p.supportsMessageType('urn:x/1.0/y')).toBe(true);
    expect(p.supportsMessageType('urn:x/1.0/z')).toBe(true);
    expect(p.supportsMessageType('urn:x/2.0/z')).toBe(false);
  });

  it('advertises protocol and message-type capabilities', () => {
    const p = new BaseProtocol({ id: 'x', piuri: 'urn:x:1.0', messageTypes: ['urn:x/1.0/y'] });
    const caps = p.advertiseCapabilities();
    expect(Array.isArray(caps)).toBe(true);
    expect(caps.find(c => c['feature-type'] === 'protocol')).toBeTruthy();
    expect(caps.find(c => c['feature-type'] === 'message-type')).toBeTruthy();
  });
});


