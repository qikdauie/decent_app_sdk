// @ts-nocheck
import { describe, it, expect, vi } from 'vitest';
import { createProtocolHelpers } from '../protocols.js';

const mkMessenger = () => ({ rpc: vi.fn(async (kind) => {
  if (kind === 'getProtocolMethods') return { ok: true, methods: { 'trust-ping-v2': { ping: {} } } };
  if (kind === 'protocolInvoke') return { ok: true, result: { pong: true } };
  if (kind === 'advertise') return { ok: true };
  if (kind === 'discover') return { ok: true, result: {} };
  if (kind === 'intentAdvertise') return { ok: true };
  if (kind === 'intentDiscover') return { ok: true, result: {} };
  if (kind === 'intentRequest') return { ok: true };
  return { ok: true };
}) });

describe('client.protocols', () => {
  it('refresh and get proxies', async () => {
    const helpers = createProtocolHelpers(mkMessenger());
    await helpers.refresh();
    expect(helpers.list()).toContain('trust-ping-v2');
    const ping = helpers['trust-ping-v2'];
    const res = await ping.ping('did:x');
    expect(res).toEqual({ pong: true });
  });

  it('intents helpers return ok responses', async () => {
    const helpers = createProtocolHelpers(mkMessenger());
    const ok = await helpers.intents.advertise('share');
    expect(ok).toBe(true);
    const disc = await helpers.intents.discover(['*']);
    expect(disc).toBeTruthy();
  });
});


