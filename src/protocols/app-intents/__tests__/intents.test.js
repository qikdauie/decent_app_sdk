import { describe, it, expect } from 'vitest';
import { actionToRequestType, actionToResponseType, requestTypeToAction, responseTypeToAction } from '../intents.js';

describe('app-intents intents', () => {
  it('maps action codes and types', () => {
    const req = actionToRequestType('share');
    expect(req).toContain('/share-request');
    const res = actionToResponseType('share');
    expect(res).toContain('/share-response');
    expect(requestTypeToAction(req)).toBe('share');
    expect(responseTypeToAction(res)).toBe('share');
  });
});


