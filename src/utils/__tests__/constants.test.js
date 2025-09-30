import { describe, it, expect } from 'vitest';
import { PIURI, MessageTypes, RouterResults, OperationResults, PermissionMethods, RpcMethods, Headers, Results, Permissions } from '../../constants/index.js';

describe('constants', () => {
  it('exports expected namespaces', () => {
    expect(PIURI).toBeTruthy();
    expect(MessageTypes).toBeTruthy();
    expect(RouterResults).toBeTruthy();
    expect(OperationResults).toBeTruthy();
    expect(PermissionMethods).toBeTruthy();
    expect(RpcMethods).toBeTruthy();
    expect(Headers).toBeTruthy();
    expect(Results).toBeTruthy();
    expect(Permissions).toBeTruthy();
  });
});


