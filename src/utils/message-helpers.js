/** DIDComm message construction and parsing helpers */

export function ensureJson(value) {
  if (typeof value === 'string') return value;
  try { return JSON.stringify(value == null ? {} : value); } catch { return '{}'; }
}

export function parseJson(value) {
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { return null; }
}

export function makeEnvelope(type, body = {}, extra = {}) {
  return { type: String(type), body: body || {}, ...extra };
}

/**
 * Extract DIDComm thread identifier from an unpacked message object.
 * Supports '~thread' decorator with 'thid' (preferred) and 'pthid'.
 * Returns null if not present or parsing fails.
 * @param {any} msg
 * @returns {string|null}
 */
export function extractThreadId(msg) {
  try {
    const m = typeof msg === 'string' ? JSON.parse(msg) : (msg || {});
    // DIDComm v2: prefer top-level thid/pthid when present
    const topLevelThid = typeof m?.thid === 'string' ? m.thid : null;
    const topLevelPthid = typeof m?.pthid === 'string' ? m.pthid : null;
    if (topLevelThid || topLevelPthid) return topLevelThid || topLevelPthid || null;

    // DIDComm v1: '~thread' decorator with thid/pthid
    const thread = m['~thread'] || {};
    const thid = thread?.thid;
    const pthid = thread?.pthid;
    const id = (typeof thid === 'string' && thid) || (typeof pthid === 'string' && pthid) || null;
    return id || null;
  } catch {
    return null;
  }
}

// ================= Intents correlation helpers (temporary) =================
// TODO: Remove correlation ID utilities once packMessage returns thread ID

export function generateCorrelationId() {
  try { return (self?.crypto?.randomUUID && self.crypto.randomUUID()) || `${Date.now()}-${Math.random().toString(36).slice(2)}`; } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

// TODO: Remove correlation ID utilities once packMessage returns thread ID
export function extractCorrelationId(envelopeOrBody) {
  try {
    const src = envelopeOrBody?.body ? envelopeOrBody.body : envelopeOrBody;
    const val = src?._correlationId || src?.correlationId || null;
    return typeof val === 'string' && val ? val : null;
  } catch { return null; }
}

// Useful utility that can remain
import { PIURI } from '../constants/index.js';

export function isIntentResponse(type) {
  try {
    const t = String(type || '');
    return t.startsWith(PIURI.APP_INTENT_V1 + '/') && t.endsWith('-response');
  } catch { return false; }
}

export function isIntentDecline(type) {
  try {
    const t = String(type || '');
    return t === (PIURI.APP_INTENT_V1 + '/decline');
  } catch { return false; }
}

// TODO: Remove correlation ID utilities once packMessage returns thread ID
export function embedCorrelationId(body, correlationId) {
  const b = (body && typeof body === 'object') ? { ...body } : {};
  Object.defineProperty(b, '_correlationId', { value: String(correlationId), enumerable: true, configurable: true, writable: false });
  return b;
}

// TODO: Remove correlation ID utilities once packMessage returns thread ID
export function createIntentResponseMatcher(correlationId) {
  const cid = String(correlationId || '');
  return function matches(envelope) {
    try {
      if (!isIntentResponse(envelope?.type)) return false;
      const got = extractCorrelationId(envelope);
      return String(got || '') === cid;
    } catch { return false; }
  };
}


