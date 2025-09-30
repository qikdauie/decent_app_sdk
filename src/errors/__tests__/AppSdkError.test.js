import { describe, it, expect } from 'vitest';
import { AppSdkError } from '../AppSdkError.js';

describe('AppSdkError', () => {
  it('constructs with code and message', () => {
    const e = new AppSdkError('test', 'E_CODE', 'boom');
    expect(e.code).toBe('E_CODE');
    expect(e.domain).toBe('test');
    expect(String(e)).toContain('boom');
  });

  it('toJSON includes domain, code, message', () => {
    const e = new AppSdkError('test', 'E_CODE', 'boom');
    const j = e.toJSON();
    expect(j.code).toBe('E_CODE');
    expect(j.domain).toBe('test');
    expect(j.message).toContain('boom');
  });
});


