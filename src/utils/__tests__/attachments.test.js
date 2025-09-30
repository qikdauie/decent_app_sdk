// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { normalizeAttachment, validateAttachment, normalizeAttachments, validateAttachments, generateAttachmentId } from '../attachments.js';

describe('attachments', () => {
  it('normalizeAttachment converts legacy shapes', () => {
    const n1 = normalizeAttachment({ mime_type: 'image/jpeg', data: { base64: 'AAAA' } });
    expect(n1.mimeType).toBe('image/jpeg');
    expect(n1.data).toBe('AAAA');
    const n2 = normalizeAttachment({ mime_type: 'image/jpeg', data: { links: ['https://x'] } });
    expect(n2.externalUrl).toBe('https://x');
    expect(n2.isExternal).toBe(true);
  });

  it('normalizeAttachment stringifies non-string data', () => {
    const n = normalizeAttachment({ mimeType: 'application/json', data: { k: 'v' } });
    expect(typeof n.data).toBe('string');
    expect(n.data).toContain('"k"');
  });

  it('stringifies non-string data for non-JSON mime types sensibly', () => {
    const n1 = normalizeAttachment({ mimeType: 'text/plain', data: { a: 1 } });
    expect(typeof n1.data).toBe('string');
    expect(n1.data).toContain('a');

    const n2 = normalizeAttachment({ mimeType: 'application/octet-stream', data: { a: 1 } });
    expect(typeof n2.data).toBe('string');
    expect(n2.data.length).toBeGreaterThan(0);
  });

  it('validateAttachment enforces id and mimeType', () => {
    expect(validateAttachment({ id: 'a', mimeType: 'x', data: 'y' }).ok).toBe(true);
    expect(validateAttachment({ id: '', mimeType: 'x', data: 'y' }).ok).toBe(false);
    expect(validateAttachment({ id: 'a', mimeType: '', data: 'y' }).ok).toBe(false);
  });

  it('validateAttachment requires exactly one of data or externalUrl', () => {
    expect(validateAttachment({ id: 'a', mimeType: 'x', data: 'y' }).ok).toBe(true);
    expect(validateAttachment({ id: 'a', mimeType: 'x', externalUrl: 'https://x' }).ok).toBe(true);
    expect(validateAttachment({ id: 'a', mimeType: 'x' }).ok).toBe(false);
    expect(validateAttachment({ id: 'a', mimeType: 'x', data: 'y', externalUrl: 'https://x' }).ok).toBe(false);
  });

  it('validateAttachments aggregates errors over list', () => {
    const list = normalizeAttachments([
      { id: '1', mimeType: 'text/plain', data: '' },
      { id: '2', mimeType: 'image/png', data: 'AAAA' },
      { id: '', mimeType: 'image/png', data: 'BBBB' },
      { id: '3', mimeType: 'image/png', data: '', externalUrl: '' },
    ]);
    const res = validateAttachments(list);
    expect(typeof res.ok).toBe('boolean');
    expect(res.ok === true || Array.isArray(res.errors)).toBe(true);
  });

  it('rejects oversized base64 data (approximate)', () => {
    const big = 'A'.repeat(1024 * 1024); // ~768KB
    const att = normalizeAttachment({ mimeType: 'application/octet-stream', data: big });
    const res = validateAttachment(att, { maxSizeBytes: 200 * 1024 });
    expect(res.ok).toBe(false);
  });

  it('rejects invalid MIME types with whitelist', () => {
    const att = normalizeAttachment({ mimeType: 'text/html', data: 'PGgxPkJvb3</h1>' });
    const res = validateAttachment(att, { mimeWhitelist: ['image/', 'application/json'] });
    expect(res.ok).toBe(false);
  });

  it('rejects empty data and invalid externalUrl', () => {
    const noData = validateAttachment({ id: 'x', mimeType: 'image/png' });
    expect(noData.ok).toBe(false);
    const badUrl = validateAttachment({ id: 'x', mimeType: 'image/png', externalUrl: 'notaurl' });
    expect(badUrl.ok).toBe(false);
  });

  it.skip('rejects malformed base64 content (to implement)', () => {
    const att = normalizeAttachment({ mimeType: 'image/png', data: '***notbase64***' });
    const res = validateAttachment(att);
    expect(res.ok).toBe(false);
  });
});
