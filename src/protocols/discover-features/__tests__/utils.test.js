import { describe, it, expect } from 'vitest';
import { buildQueryBody, isDisclosePacket, extractFeatures, matchFeatures } from '../utils.js';

describe('discover-features utils', () => {
  it('buildQueryBody normalizes strings and objects', () => {
    const { queries } = buildQueryBody(['https://didcomm.org/*', { 'feature-type': 'protocol', match: 'urn:x:*' }]);
    expect(Array.isArray(queries)).toBe(true);
    expect(queries[0]['feature-type']).toBe('message-type');
    expect(queries[1]['feature-type']).toBe('protocol');
  });

  it('isDisclosePacket detects type', () => {
    expect(isDisclosePacket({ type: 'https://didcomm.org/discover-features/2.0/disclose' })).toBe(true);
    expect(isDisclosePacket({ type: 'x' })).toBe(false);
  });

  it('extractFeatures supports disclosures/features arrays', () => {
    expect(extractFeatures({ body: { disclosures: [{ id: 'a' }] } }).length).toBe(1);
    expect(extractFeatures({ body: { features: [{ id: 'b' }] } }).length).toBe(1);
    expect(extractFeatures({ body: {} }).length).toBe(0);
  });

  it('matchFeatures filters by feature-type and glob pattern', () => {
    const local = [
      { featureType: 'protocol', id: 'https://didcomm.org/basicmessage/1.0' },
      { featureType: 'message-type', id: 'https://didcomm.org/trust-ping/2.0/ping' },
    ];
    const queries = [{ 'feature-type': 'message-type', match: 'https://didcomm.org/trust-ping/2.0/*' }];
    const res = matchFeatures(local, queries);
    expect(res.length).toBe(1);
    expect(res[0].id).toContain('trust-ping');
  });

  it('matchFeatures returns [] on malformed inputs', () => {
    expect(matchFeatures(null, null)).toEqual([]);
    expect(matchFeatures([], [{ 'feature-type': 'protocol', match: '[' }])).toEqual([]);
  });
});


