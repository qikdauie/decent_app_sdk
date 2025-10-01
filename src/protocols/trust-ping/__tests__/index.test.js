// @ts-nocheck
import { describe, it, expect } from 'vitest';
/// <reference types="vitest" />
import { TrustPingProtocol } from '../index.js';

function makeRuntime() {
  const calls = [];
  return {
    pack: async () => ({}),
    unpack: async (raw) => ({ success: true, message: JSON.stringify(raw) }),
    send: async () => 'success',
    sendType: async (dest, type, body, options) => {
      calls.push({ dest, type, body, options });
      return true;
    },
    registry: {},
    permissions: {},
    _calls: calls
  };
}

describe('trust-ping protocol', () => {
  it('auto-responds to ping when enabled', async () => {
    const p = new TrustPingProtocol({ autoRespond: true });
    p.register(makeRuntime());
    const ok = await p.handleIncoming({ type: 'https://didcomm.org/trust-ping/2.0/ping', from: 'did:x', body: { response_requested: true } });
    expect(ok).toBe(true);
  });

  it('ping client method sends without throwing', async () => {
    const p = new TrustPingProtocol();
    p.register(makeRuntime());
    const res = await p.invokeClientMethod('ping', ['did:y', {}]);
    expect(res.ok).toBe(true);
  });

  it('passes replyTo parameter when auto-responding to ping', async () => {
    const runtime = makeRuntime();
    const p = new TrustPingProtocol({ autoRespond: true });
    p.register(runtime);
    const rawMessage = { thid: 'test-thread-123', type: 'https://didcomm.org/trust-ping/2.0/ping', from: 'did:example:sender', body: { response_requested: true } };
    const envelope = { type: 'https://didcomm.org/trust-ping/2.0/ping', from: 'did:example:sender', body: { response_requested: true }, raw: rawMessage };
    await p.handleIncoming(envelope);
    expect(runtime._calls).toHaveLength(1);
    expect(runtime._calls[0].options).toBeDefined();
    expect(runtime._calls[0].options.replyTo).toBeDefined();
    expect(runtime._calls[0].options.replyTo).toBe(JSON.stringify(rawMessage));
  });

  it('includes thid in response headers when present in request', async () => {
    const runtime = makeRuntime();
    const p = new TrustPingProtocol({ autoRespond: true });
    p.register(runtime);
    const rawMessage = { thid: 'thread-456', type: 'https://didcomm.org/trust-ping/2.0/ping', from: 'did:example:sender', body: { response_requested: true } };
    const envelope = { type: 'https://didcomm.org/trust-ping/2.0/ping', from: 'did:example:sender', body: { response_requested: true }, raw: rawMessage };
    await p.handleIncoming(envelope);
    expect(runtime._calls).toHaveLength(1);
    expect(runtime._calls[0].options).toBeDefined();
    expect(runtime._calls[0].options.headers).toBeDefined();
    expect(runtime._calls[0].options.headers.thid).toBe('thread-456');
  });

  it('includes both replyTo and thid when auto-responding', async () => {
    const runtime = makeRuntime();
    const p = new TrustPingProtocol({ autoRespond: true });
    p.register(runtime);
    const rawMessage = { thid: 'thread-789', type: 'https://didcomm.org/trust-ping/2.0/ping', from: 'did:example:sender', body: { response_requested: true, comment: 'test ping' } };
    const envelope = { type: 'https://didcomm.org/trust-ping/2.0/ping', from: 'did:example:sender', body: { response_requested: true, comment: 'test ping' }, raw: rawMessage };
    await p.handleIncoming(envelope);
    expect(runtime._calls).toHaveLength(1);
    const call = runtime._calls[0];
    expect(call.dest).toBe('did:example:sender');
    expect(call.type).toBe('https://didcomm.org/trust-ping/2.0/ping-response');
    expect(call.options).toBeDefined();
    expect(call.options.replyTo).toBe(JSON.stringify(rawMessage));
    expect(call.options.headers).toBeDefined();
    expect(call.options.headers.thid).toBe('thread-789');
  });

  it('still passes replyTo even when thid is missing', async () => {
    const runtime = makeRuntime();
    const p = new TrustPingProtocol({ autoRespond: true });
    p.register(runtime);
    const rawMessage = { type: 'https://didcomm.org/trust-ping/2.0/ping', from: 'did:example:sender', body: { response_requested: true } };
    const envelope = { type: 'https://didcomm.org/trust-ping/2.0/ping', from: 'did:example:sender', body: { response_requested: true }, raw: rawMessage };
    await p.handleIncoming(envelope);
    expect(runtime._calls).toHaveLength(1);
    expect(runtime._calls[0].options).toBeDefined();
    expect(runtime._calls[0].options.replyTo).toBe(JSON.stringify(rawMessage));
  });
});


