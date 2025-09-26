export { AppSdkError } from './AppSdkError.js';
export { ErrorCodes } from './codes.js';

import { AppSdkError } from './AppSdkError.js';
import { ErrorCodes } from './codes.js';

export function createValidationError(message, details) {
  return new AppSdkError('validation', ErrorCodes.validation.VALIDATION_FAILED, message || 'Validation failed', { details });
}

export function createPermissionError(message, details) {
  return new AppSdkError('permissions', ErrorCodes.permissions.PERMISSION_DENIED, message || 'Permission denied', { details });
}

export function createRoutingError(message, details) {
  return new AppSdkError('routing', ErrorCodes.routing.DEST_NOT_FOUND, message || 'Destination not found', { details });
}

export function createRpcError(message, details) {
  return new AppSdkError('serviceWorker', ErrorCodes.serviceWorker.RPC_FAILED, message || 'RPC failed', { details });
}


