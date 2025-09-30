// @ts-nocheck
import { describe, it, expect } from 'vitest';
/// <reference types="vitest" />
import { BasicMessageProtocol } from '../index.js';

function makeRuntime() {
  const sent = [];
  return {
    sent,
    pack: async () => ({}),
    unpack: async (raw) => ({ success: true, message: JSON.stringify(raw) }),
    send: async () => 'success',
    sendType: async (to, type, body) => { sent.push({ to, type, body }); return true; },
    registry: {},
    permissions: {},
  };
}

describe('basic-message protocol', () => {
  // The storage behavior relies on runtime APIs and is validated in
  // UI-triggered tests under `src/tests/ui-triggered/sdk/protocols/basic-message.test.js`.

  it('sendMessage builds body and calls runtime', async () => {
    const p = new BasicMessageProtocol();
    const rt = makeRuntime();
    p.register(rt);
    const res = await p.invokeClientMethod('sendMessage', ['did:y', 'hello', {}]);
    expect(res.ok).toBe(true);
    expect(rt.sent.length).toBe(1);
  });
});


