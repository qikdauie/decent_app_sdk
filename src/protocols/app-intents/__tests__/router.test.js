import { describe, it, expect } from 'vitest';
import { IntentRouter } from '../router.js';

describe('IntentRouter', () => {
  it('handles request with onRequest accept path', async () => {
    const router = new IntentRouter({ onRequest: async () => ({ accept: true, response: { result: { ok: true } } }) });
    const runtime = { sendType: async () => {} };
    const handled = await router.handleIncoming({ type: 'https://didcomm.org/app-intent/1.0/share-request', from: 'did:x', thid: 't' }, runtime);
    expect(handled).toBe(true);
  });
});


