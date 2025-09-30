import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import * as MessengerMod from '../messenger.js';

let messengerSpy;
beforeAll(() => {
  messengerSpy = vi.spyOn(MessengerMod, 'MessengerClient').mockImplementation(function Stub(options) {
    this.swUrl = options?.serviceWorkerUrl || '/sw.js';
    this.readinessTimeoutMs = options?.readinessTimeoutMs || 1;
    this.rpcTimeoutMs = options?.rpcTimeoutMs || 10;
    this.ready = Promise.resolve();
    this.rpc = vi.fn(async (kind, data) => {
      if (kind === 'SEND') return 'success';
      if (kind === 'PACK_MESSAGE') return { success: true, error_code: 0, error: '', message: '{}', thid: 't-1' };
      if (kind === 'UNPACK_MESSAGE') return { success: true, error_code: 0, error: '', message: '{}' };
      if (kind === 'GET_DID') return { success: true, error_code: 0, error: '', did: 'did:example:123', did_document: '{}', public_key: 'pk' };
      return { ok: true };
    });
  });
});

afterAll(() => {
  try { messengerSpy?.mockRestore?.(); } catch {}
});

import { DecentClient } from '../index.js';

describe('DecentClient', () => {
  it('constructs and exposes helpers', () => {
    const sdk = new DecentClient({ readinessTimeoutMs: 1, rpcTimeoutMs: 10 });
    expect(sdk.messenger).toBeTruthy();
    expect(sdk.protocols).toBeTruthy();
    expect(sdk.permissions).toBeTruthy();
  });

  // The following tests depend on real Service Worker APIs and have been moved
  // to browser-only UI-triggered tests under `src/tests/ui-triggered/sdk/client/`:
  // - sendOk maps success
  // - packOk and unpackOk map success
  // - getDIDOk maps success and getLastError returns null on success
});


