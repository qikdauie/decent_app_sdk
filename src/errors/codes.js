/**
 * Structured error codes categorized by domain.
 */

export const ErrorCodes = Object.freeze({
  routing: Object.freeze({
    DEST_NOT_FOUND: 'ROUTING_DEST_NOT_FOUND',
    UNKNOWN_ERROR: 'ROUTING_UNKNOWN_ERROR',
  }),
  messaging: Object.freeze({
    PACK_FAILED: 'MSG_PACK_FAILED',
    UNPACK_FAILED: 'MSG_UNPACK_FAILED',
    SEND_FAILED: 'MSG_SEND_FAILED',
    MESSAGE_TYPE_UNSUPPORTED: 'MSG_TYPE_UNSUPPORTED',
  }),
  permissions: Object.freeze({
    PERMISSION_DENIED: 'PERMISSION_DENIED',
    REQUEST_FAILED: 'PERMISSION_REQUEST_FAILED',
  }),
  protocol: Object.freeze({
    INVALID_ENVELOPE: 'PROTOCOL_INVALID_ENVELOPE',
    PROBLEM_REPORT: 'PROTOCOL_PROBLEM_REPORT',
  }),
  serviceWorker: Object.freeze({
    REGISTRATION_FAILED: 'SW_REGISTRATION_FAILED',
    NOT_SUPPORTED: 'SW_NOT_SUPPORTED',
    RPC_TIMEOUT: 'SW_RPC_TIMEOUT',
    RPC_FAILED: 'SW_RPC_FAILED',
  }),
  transport: Object.freeze({
    NETWORK_ERROR: 'TRANSPORT_NETWORK_ERROR',
  }),
  parsing: Object.freeze({
    JSON_PARSE_ERROR: 'PARSING_JSON_ERROR',
  }),
  validation: Object.freeze({
    INVALID_ARGUMENT: 'VALIDATION_INVALID_ARGUMENT',
    VALIDATION_FAILED: 'VALIDATION_FAILED',
  }),
  security: Object.freeze({
    ACCESS_DENIED: 'SECURITY_ACCESS_DENIED',
  }),
  internal: Object.freeze({
    UNEXPECTED: 'INTERNAL_UNEXPECTED',
  }),
});


