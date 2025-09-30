import { describe, it, expect } from 'vitest';
import { withTimeout, formatError, validateArgs, validateMethodArgs, toErrorMessage } from '../protocol-helpers.js';

describe('protocol-helpers', () => {
  it('withTimeout resolves and times out', async () => {
    const v = await withTimeout(async () => 42, 10, 'op');
    expect(v).toBe(42);
    await expect(withTimeout(async () => new Promise(r => setTimeout(() => r(1), 20)), 5, 'op')).rejects.toThrow('timed out');
  });
  it('formatError normalizes values', () => {
    expect(formatError(new Error('x'))).toBe('x');
    expect(formatError('y')).toBe('y');
    expect(formatError(null, 'z')).toBe('z');
  });
  it('validateArgs warns but returns boolean', () => {
    expect(validateArgs(['a','b'], ['a'])).toBe(false);
    expect(validateArgs([], [])).toBe(true);
  });
  it('validateMethodArgs checks required count', () => {
    expect(validateMethodArgs(['x'], ['v'])).toEqual({ ok: true });
    expect(validateMethodArgs([], [])).toEqual({ ok: true });
  });
  it('toErrorMessage handles various inputs', () => {
    expect(toErrorMessage(new Error('e'))).toBe('e');
    expect(toErrorMessage('s')).toBe('s');
  });
});


