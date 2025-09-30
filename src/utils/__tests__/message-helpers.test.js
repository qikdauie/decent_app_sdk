import { describe, it, expect } from 'vitest';
import { extractThid, ensureJson, parseJson, isIntentResponse, isIntentDecline } from '../message-helpers.js';

describe('message-helpers', () => {
  it('extractThid handles v2 top-level thid/pthid', () => {
    expect(extractThid({ thid: 'A' })).toBe('A');
    expect(extractThid({ pthid: 'P' })).toBe('P');
  });
  it('extractThid handles v1 ~thread decorator', () => {
    expect(extractThid({ ['~thread']: { thid: 'T1' } })).toBe('T1');
    expect(extractThid({ ['~thread']: { pthid: 'PT' } })).toBe('PT');
  });
  it('extractThid parses JSON strings', () => {
    const s = JSON.stringify({ ['~thread']: { thid: 'S1' } });
    expect(extractThid(s)).toBe('S1');
  });
  it('extractThid returns null for invalid', () => {
    expect(extractThid(null)).toBeNull();
    expect(extractThid('{}')).toBeNull();
    expect(extractThid('{not json')).toBeNull();
  });

  it('ensureJson stringifies objects and passes through strings', () => {
    expect(ensureJson({ a: 1 })).toContain('"a"');
    expect(ensureJson('x')).toBe('x');
  });

  it('parseJson parses strings and returns null on invalid', () => {
    expect(parseJson('{"a":1}')).toEqual({ a: 1 });
    expect(parseJson('{oops')).toBeNull();
    const obj = { a: 1 };
    expect(parseJson(obj)).toBe(obj);
  });

  it('intent helpers detect response/decline types', () => {
    expect(isIntentResponse('https://didcomm.org/app-intent/1.0/share-response')).toBe(true);
    expect(isIntentDecline('https://didcomm.org/app-intent/1.0/decline')).toBe(true);
    expect(isIntentResponse('x')).toBe(false);
    expect(isIntentDecline('x')).toBe(false);
  });
});


