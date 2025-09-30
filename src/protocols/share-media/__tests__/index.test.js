// @ts-nocheck
import { describe, it, expect } from 'vitest';
/// <reference types="vitest" />
import ShareMediaProtocol from '../index.js';

function makeRuntime() {
  const sent = [];
  return {
    sent,
    pack: async () => ({}),
    unpack: async (raw) => ({ success: true, message: JSON.stringify(raw) }),
    send: async () => 'success',
    sendType: async (to, type, body, opts) => { sent.push({ to, type, body, opts }); return true; },
    registry: {},
    permissions: {},
  };
}

describe.skip('share-media protocol', () => {
  // Attachment validation and storage flows are tested in the UI-triggered
  // environment at `src/tests/ui-triggered/sdk/protocols/share-media.test.js`.
});


