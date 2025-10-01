import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createProtocolProxy, ProtocolProxyFactory } from '../protocol-proxy.js';
import { RpcMethods } from '../../constants/index.js';

describe('client protocol-proxy', () => {
  let messenger;
  beforeEach(() => {
    messenger = { rpc: vi.fn() };
  });

  it('forwards method calls via rpc and returns result', async () => {
    messenger.rpc.mockResolvedValueOnce({ ok: true, result: { ok: true, value: 42 } });
    const methods = { ping: {} };
    const proxy = createProtocolProxy(messenger, 'trust-ping-v2', methods);
    const res = await proxy.ping('did:example:123', { timeoutMs: 1234 });
    expect(res).toEqual({ ok: true, value: 42 });
    expect(messenger.rpc).toHaveBeenCalledWith(
      RpcMethods.PROTOCOL_INVOKE,
      expect.objectContaining({ protocolId: 'trust-ping-v2', method: 'ping', args: ['did:example:123', { timeoutMs: 1234 }], timeout: 1234 }),
    );
  });

  it('throws when rpc returns error', async () => {
    messenger.rpc.mockResolvedValueOnce({ ok: false, error: 'boom' });
    const proxy = createProtocolProxy(messenger, 'trust-ping-v2', { ping: {} });
    await expect(proxy.ping('did:x')).rejects.toThrow(/boom|protocolInvoke failed/);
  });

  it('throws for unknown client method', async () => {
    const proxy = createProtocolProxy(messenger, 'trust-ping-v2', { ping: {} });
    await expect(() => proxy.unknown('did:x')).toThrow(/no client method "unknown"/);
  });

  it('factory refresh loads method maps and rebuilds proxies', async () => {
    const factory = new ProtocolProxyFactory(messenger);
    // First refresh returns two protocols
    messenger.rpc.mockResolvedValueOnce({ ok: true, methods: {
      'trust-ping-v2': { ping: {}, pingAndWait: {} },
      'basic-message-v2': { sendMessage: {}, getMessages: {} },
    }});
    const ids = await factory.refresh();
    expect(ids).toEqual(['trust-ping-v2', 'basic-message-v2']);
    const tp = factory.get('trust-ping-v2');
    expect(tp.__methods).toContain('ping');
    expect(factory.list()).toEqual(['trust-ping-v2', 'basic-message-v2']);
    expect(factory.has('basic-message-v2')).toBe(true);

    // Rebuild proxies on refresh
    const before = tp;
    messenger.rpc.mockResolvedValueOnce({ ok: true, methods: {
      'trust-ping-v2': { ping: {} }, // drop pingAndWait
    }});
    await factory.refresh();
    const after = factory.get('trust-ping-v2');
    expect(after).not.toBe(before);
    expect(after.__methods).toEqual(['ping']);
  });
});


