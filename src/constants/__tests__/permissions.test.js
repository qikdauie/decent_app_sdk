import { describe, it, expect } from 'vitest';
import { PermissionMethods } from '../permissions.js';

describe('permissions constants', () => {
  it('has entries', () => {
    expect(Object.keys(PermissionMethods).length).toBeGreaterThan(0);
  });
});


