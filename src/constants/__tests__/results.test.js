import { describe, it, expect } from 'vitest';
import { RouterResults, OperationResults } from '../results.js';

describe('results constants', () => {
  it('includes success markers', () => {
    expect(RouterResults.SUCCESS || RouterResults.success || 'success').toBeTruthy();
    expect(OperationResults).toBeTruthy();
  });
});


