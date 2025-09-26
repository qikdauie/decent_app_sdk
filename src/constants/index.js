export { PIURI } from './piuri.js';
export { MessageTypes } from './message-types.js';
export { RouterResults, OperationResults } from './results.js';
export { PermissionMethods } from './permissions.js';
export { RpcMethods } from './rpc.js';
export { Headers } from './headers.js';

// Ensure locally scoped bindings for aggregates
import { RouterResults as _RouterResults, OperationResults as _OperationResults } from './results.js';
import { PermissionMethods as _PermissionMethods } from './permissions.js';

// Aggregates for convenience (non-breaking additions)
export const Results = Object.freeze({ RouterResults: _RouterResults, OperationResults: _OperationResults });
export const Permissions = Object.freeze({ PermissionMethods: _PermissionMethods });


