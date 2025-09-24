/** Response helper utilities for SDK/browser API results */

/**
 * Check if a PeerDIDResult indicates success
 * @param {any} result - PeerDIDResult object
 * @returns {boolean}
 */
export function isDIDSuccess(result) {
  return result && typeof result === 'object' && result.success === true;
}

/**
 * Check if a MessageOpResult indicates success
 * @param {any} result - MessageOpResult object
 * @returns {boolean}
 */
export function isMessageOpSuccess(result) {
  return result && typeof result === 'object' && result.success === true;
}

/**
 * Check if a RouterResult indicates success
 * @param {any} result - RouterResult string
 * @returns {boolean}
 */
export function isRouterSuccess(result) {
  const val = (result && typeof result === 'object') ? (result.result || result.status || result.value) : result;
  return String(val) === 'success';
}

/**
 * Check if a ProtocolPermissionResult indicates success
 * @param {any} result - ProtocolPermissionResult object
 * @returns {boolean}
 */
export function isPermissionSuccess(result) {
  return result && typeof result === 'object' && result.success === true;
}

/**
 * Universal success checker - works with any SDK response type
 * @param {any} result - Any SDK response
 * @returns {boolean}
 */
export function isSuccess(result) {
  if (!result) return false;
  if (typeof result === 'string') return result === 'success';
  if (typeof result === 'object') {
    if ('ok' in result) return result.ok === true;
    if ('success' in result) return result.success === true;
    if ('result' in result) return String(result.result) === 'success';
  }
  return false;
}

/**
 * Extract error message from any SDK response
 * @param {any} result - Any SDK response
 * @returns {string|null}
 */
export function getErrorMessage(result) {
  if (!result) return null;
  if (typeof result === 'object' && result.error) {
    return String(result.error);
  }
  if (typeof result === 'string' && result !== 'success') {
    return result;
  }
  if (typeof result === 'object' && result.errorMessage) {
    return String(result.errorMessage);
  }
  return null;
}

/**
 * Extract error code from SDK responses that have them
 * @param {any} result - SDK response
 * @returns {number|null}
 */
export function getErrorCode(result) {
  if (result && typeof result === 'object' && typeof result.error_code === 'number') {
    return result.error_code;
  }
  return null;
}


