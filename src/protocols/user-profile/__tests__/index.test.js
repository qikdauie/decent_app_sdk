// @ts-nocheck
import { describe, it, expect } from 'vitest';
/// <reference types="vitest" />
import { UserProfileProtocol } from '../index.js';

function makeRuntime() {
  return {
    pack: async () => ({}),
    unpack: async (raw) => ({ success: true, message: JSON.stringify(raw) }),
    send: async () => 'success',
    sendType: async () => true,
    registry: {},
    permissions: {},
  };
}

describe.skip('user-profile protocol', () => {
  // Runtime-integrated behavior is validated by UI-triggered tests at
  // `src/tests/ui-triggered/sdk/protocols/user-profile.test.js`.
});


