/**
 * AppSdkError — structured error for the SDK with stable shape for postMessage.
 */
import { ErrorCodes } from './codes.js';
export class AppSdkError extends Error {
  /**
   * @param {string} domain
   * @param {string} code
   * @param {string} message
   * @param {{ cause?: any, details?: any }} [opts]
   */
  constructor(domain, code, message, opts = {}) {
    super(String(message || code || domain || 'Error'));
    this.name = 'AppSdkError';
    this.domain = String(domain || 'internal');
    this.code = String(code || ErrorCodes.internal.UNEXPECTED);
    if (opts && 'cause' in opts) this.cause = opts.cause;
    if (opts && 'details' in opts) this.details = opts.details;
  }

  toJSON() {
    return {
      name: this.name,
      domain: this.domain,
      code: this.code,
      message: this.message,
      ...(this.details !== undefined ? { details: this.details } : {}),
    };
  }

  static from(domain, code, message, opts) {
    return new AppSdkError(domain, code, message, opts);
  }

  static validation(message, details) {
    return new AppSdkError('validation', ErrorCodes.validation.VALIDATION_FAILED, message || 'Validation failed', { details });
  }

  static permissionDenied(message, details) {
    return new AppSdkError('permissions', ErrorCodes.permissions.PERMISSION_DENIED, message || 'Permission denied', { details });
  }

  static routingNotFound(message, details) {
    return new AppSdkError('routing', ErrorCodes.routing.DEST_NOT_FOUND, message || 'Destination not found', { details });
  }

  static rpcFailed(message, details) {
    return new AppSdkError('serviceWorker', ErrorCodes.serviceWorker.RPC_FAILED, message || 'RPC failed', { details });
  }
}


