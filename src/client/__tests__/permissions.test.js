import { describe, it, expect, vi } from 'vitest';
import { createPermissionHelpers } from '../permissions.js';
import { RpcMethods } from '../../constants/rpc.js';

describe('permissions helpers', () => {
  const rpc = vi.fn(async (kind) => {
    if (kind === RpcMethods.REQUEST_PERMISSIONS) return { success: true };
    if (kind === RpcMethods.CHECK_PERMISSION) return true;
    if (kind === RpcMethods.CHECK_MULTIPLE_PERMISSIONS) return [true, false];
    if (kind === RpcMethods.LIST_GRANTED_PERMISSIONS) return [];
    return { ok: true };
  });
  const helpers = createPermissionHelpers({ rpc });

  // The following behavior is validated with real Service Worker APIs in
  // UI-triggered tests under `src/tests/ui-triggered/sdk/client/permissions.test.js`:
  // - requestOk returns boolean
  // - check and list operate

  it('exposes helper methods and basic return types (smoke)', async () => {
    expect(typeof helpers.check).toBe('function');
    expect(typeof helpers.checkMultiple).toBe('function');
    expect(typeof helpers.request).toBe('function');
    expect(typeof helpers.listGranted).toBe('function');

    await expect(helpers.check('p', 't')).resolves.toBeTypeOf('boolean');
    await expect(helpers.checkMultiple(['p'], ['t'])).resolves.toBeInstanceOf(Array);
    await expect(helpers.request([{ protocolUri: 'p', messageTypeUri: 't' }])).resolves.toHaveProperty('success');
    await expect(helpers.listGranted(['p'])).resolves.toBeInstanceOf(Array);
  });
});


