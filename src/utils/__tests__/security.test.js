import { describe, it, expect } from 'vitest';
import { isNonEmptyString, isDid, validateMessageShape, constantTimeEqual } from '../security.js';

describe('security utils', () => {
  it('string and DID validation', () => {
    expect(isNonEmptyString('x')).toBe(true);
    expect(isNonEmptyString('')).toBe(false);
    expect(isDid('did:example:123')).toBe(true);
    expect(isDid('example:123')).toBe(false);
  });
  it('validateMessageShape enforces minimal fields', () => {
    expect(validateMessageShape({ type: 'x' })).toBe(true);
    expect(validateMessageShape({})).toBe(false);
    expect(validateMessageShape({ type: 'x', from: 'did:example:me' })).toBe(true);
    expect(validateMessageShape({ type: 'x', from: 'me' })).toBe(false);
  });
  it('constantTimeEqual compares equally', () => {
    expect(constantTimeEqual('abc', 'abc')).toBe(true);
    expect(constantTimeEqual('abc', 'abx')).toBe(false);
    expect(constantTimeEqual('a', 'aa')).toBe(false);
  });
});


