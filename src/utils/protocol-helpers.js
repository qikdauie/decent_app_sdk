/** Shared protocol utilities: timeouts, error formatting, and optional arg validation */

/**
 * Run an async task with a timeout. If the timeout expires, reject with a clear error.
 * Ensures the timer is cleared in all paths.
 * @template T
 * @param {() => Promise<T>} task
 * @param {number|undefined} ms
 * @param {string} [label]
 * @returns {Promise<T>}
 */
export async function withTimeout(task, ms, label = 'operation') {
  const timeoutMs = Number.isFinite(ms) ? Number(ms) : 0;
  if (!timeoutMs || timeoutMs <= 0) return await task();
  return await new Promise((resolve, reject) => {
    const tid = setTimeout(() => reject(new Error(`${label} timed out`)), timeoutMs);
    (async () => {
      try {
        const v = await task();
        resolve(v);
      } catch (err) {
        reject(err);
      } finally {
        try { clearTimeout(tid); } catch {}
      }
    })();
  });
}

/**
 * Normalize an error value into a consistent message string.
 * @param {any} err
 * @param {string} fallback
 */
export function formatError(err, fallback = 'Unknown error') {
  try {
    if (err == null) return String(fallback);
    if (typeof err === 'string') return err || String(fallback);
    if (typeof err?.message === 'string' && err.message) return err.message;
    if (typeof err?.toString === 'function') {
      const s = String(err);
      return s && s !== '[object Object]' ? s : String(fallback);
    }
    return String(fallback);
  } catch {
    return String(fallback);
  }
}

/**
 * Best-effort validation of args against a declared params list.
 * Returns true/false and logs a console.warn if validation fails.
 * The validation is intentionally lightweight and non-throwing.
 * @param {string[]|undefined} params
 * @param {any[]|undefined} args
 * @param {Console|undefined} logger
 * @returns {boolean}
 */
export function validateArgs(params, args, logger = console) {
  try {
    if (!Array.isArray(params) || !params.length) return true;
    const a = Array.isArray(args) ? args : [];
    if (a.length < params.length) {
      try { logger?.warn?.('[protocol-helpers] Argument count mismatch', { expected: params.length, received: a.length, params }); } catch {}
      return false;
    }
    return true;
  } catch {
    return true;
  }
}

// Note: DIDComm-specific correlation utilities remain in src/utils/message-helpers.js

/**
 * Protocol helpers: validation, errors, and timeouts utilities shared across registry and protocols.
 */

/**
 * Validate provided args against declared params list.
 * @param {any[]} args
 * @param {string[]|undefined} params
 * @returns {{ ok: boolean, error?: string }}
 */
export function validateMethodArgs(args, params) {
  try {
    if (!Array.isArray(params) || params.length === 0) return { ok: true };
    const requiredCount = params.filter(p => p && !p.endsWith('?')).length;
    if (!Array.isArray(args)) return { ok: false, error: `Expected arguments array, got ${typeof args}` };
    if (args.length < requiredCount) return { ok: false, error: `Expected at least ${requiredCount} arguments` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  }
}

/**
 * Standardize error formatting to message string.
 * @param {unknown} err
 */
export function toErrorMessage(err) {
  try { return String((/** @type {any} */ (err))?.message || err); } catch { return 'Unknown error'; }
}

/**
 * Wrap a promise-returning function with a timeout that is always cleared.
 * @template T
 * @param {() => Promise<T>} fn
 * @param {number|undefined} timeoutMs
 * @param {string} [timeoutMessage]
 * @returns {Promise<T>}
 */
// Duplicate withTimeout removed; canonical implementation above.

/**
 * Optional correlation helpers (placeholder until packer exposes threadId properly).
 * Currently no-op; callers should prefer explicit match functions.
 */
export const correlation = {
  // Intentionally left minimal; rely on explicit matchers for now.
};


