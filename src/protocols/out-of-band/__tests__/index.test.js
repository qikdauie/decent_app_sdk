import { describe, it, expect } from 'vitest';
import OutOfBandProtocol from '../index.js';

describe('out-of-band protocol', () => {
  it('creates and parses invitations', async () => {
    const p = new OutOfBandProtocol();
    p.register({ sendType: async () => true });
    const { ok, invitation, url } = await p.invokeClientMethod('createInvitation', [{ baseUrl: 'https://x' }]);
    expect(ok).toBe(true);
    expect(invitation).toBeTruthy();
    const parsed = await p.invokeClientMethod('parseInvitation', [url]);
    expect(parsed.ok).toBe(true);
  });

  it('handleIncoming stores valid invitations', async () => {
    const p = new OutOfBandProtocol();
    p.register({ sendType: async () => true });
    const created = await p.invokeClientMethod('createInvitation', [{}]);
    const ok = await p.handleIncoming(created.invitation);
    expect(ok).toBe(true);
  });
});


