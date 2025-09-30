import { describe, it, expect } from 'vitest';
import { isDIDSuccess, isMessageOpSuccess, isRouterSuccess, isPermissionSuccess, isSuccess, getErrorMessage, getErrorCode } from '../response-helpers.js';

describe('response-helpers', () => {
  it('success detectors', () => {
    expect(isDIDSuccess({ success: true })).toBe(true);
    expect(isMessageOpSuccess({ success: true })).toBe(true);
    expect(isPermissionSuccess({ success: true })).toBe(true);
    expect(isRouterSuccess('success')).toBe(true);
    expect(isRouterSuccess('invalid-address')).toBe(false);
    expect(isSuccess('success')).toBe(true);
    expect(isSuccess({ success: true })).toBe(true);
    expect(isSuccess({ ok: true })).toBe(true);
    expect(isSuccess({ result: 'success' })).toBe(true);
  });

  it('error extraction', () => {
    expect(getErrorMessage({ error: 'boom' })).toBe('boom');
    expect(getErrorMessage('fail')).toBe('fail');
    expect(getErrorMessage({ errorMessage: 'oops' })).toBe('oops');
    expect(getErrorMessage(null)).toBeNull();
    expect(getErrorCode({ error_code: 5 })).toBe(5);
    expect(getErrorCode({})).toBeNull();
  });
});


