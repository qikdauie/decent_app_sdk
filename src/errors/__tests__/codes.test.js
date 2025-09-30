import { describe, it, expect } from 'vitest';
import * as Codes from '../codes.js';

describe('error codes', () => {
  it('exports code map', () => {
    expect(Object.keys(Codes).length).toBeGreaterThan(0);
  });
});


