/**
 * Common operation and router results used across the SDK.
 */

export const RouterResults = Object.freeze({
  SUCCESS: 'success',
  ABORTED: 'aborted',
  ACCESS_DENIED: 'access-denied',
  INVALID_ADDRESS: 'invalid-address',
  ADDRESS_IN_USE: 'address-in-use',
  INVALID_MESSAGE: 'invalid-message',
  NO_ROUTE: 'no-route',
  VALIDATION_FAILED: 'validation-failed',
  AUTHENTICATION_FAILED: 'authentication-failed',
  REQUEST_EXPIRED: 'request-expired',
  RATE_LIMIT_EXCEEDED: 'rate-limit-exceeded',
  UNKNOWN_ERROR: 'unknown-error',
  // Legacy aliases retained for backward compatibility
  DEST_NOT_FOUND: 'destination-not-found',
  INBOUND_ERROR: 'inbound-error',
});

export const OperationResults = Object.freeze({
  OK: 'ok',
  ERROR: 'error',
});


