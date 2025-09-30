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
 * Extract DIDComm thread identifier (thid) from an unpacked message object.
 * Supports both DIDComm v2 (top-level thid/pthid) and v1 (~thread decorator).
 * Returns null if not present or parsing fails.
 * @param {any} msg - Message object or JSON string
 * @returns {string|null} - The thid if found, null otherwise
 */
export function extractThid(msg) {
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

