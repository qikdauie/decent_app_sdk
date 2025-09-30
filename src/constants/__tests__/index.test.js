import { describe, it, expect } from 'vitest';
import * as C from '../index.js';

describe('constants index', () => {
  it('exposes core exports', () => {
    expect(C.PIURI).toBeTruthy();
    expect(C.MessageTypes).toBeTruthy();
    expect(C.RouterResults).toBeTruthy();
    expect(C.OperationResults).toBeTruthy();
    expect(C.PermissionMethods).toBeTruthy();
    expect(C.RpcMethods).toBeTruthy();
    expect(C.Headers).toBeTruthy();
  });
});


