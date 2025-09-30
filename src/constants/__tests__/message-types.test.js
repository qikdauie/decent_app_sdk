import { describe, it, expect } from 'vitest';
import { MessageTypes } from '../message-types.js';

describe('message-types constants', () => {
  it('has entries', () => {
    expect(Object.keys(MessageTypes).length).toBeGreaterThan(0);
  });
});


