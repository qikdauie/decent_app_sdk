import { MessageTypes } from '../../constants/index.js';
export const TYPE_PING = MessageTypes.TRUST_PING.PING;
export const TYPE_PING_RESPONSE = MessageTypes.TRUST_PING.PING_RESPONSE;

/** @type {Map<string, any>} */
const timeoutsByKey = new Map();

export function isValidPingBody(body) {
  if (!body || typeof body !== 'object') return false;
  if (body.response_requested !== undefined && typeof body.response_requested !== 'boolean') return false;
  if (body.comment !== undefined && typeof body.comment !== 'string') return false;
  return true;
}

export function isValidPingResponseBody(body) {
  // ping-response typically has empty body or optional comment
  if (!body) return true;
  if (typeof body !== 'object') return false;
  if (body.comment !== undefined && typeof body.comment !== 'string') return false;
  return true;
}

/**
 * Build trust-ping body (DIDComm v2: threading via top-level thid, not body)
 * @param {{ comment?: string; responseRequested?: boolean }} [opts]
 */
export function buildPingBody({ comment, responseRequested = true } = {}) {
  const body = {};
  if (comment) body.comment = String(comment);
  if (responseRequested === false) body.response_requested = false;
  return body;
}

/**
 * Build trust-ping-response body (DIDComm v2: threading via top-level thid, not body)
 * @param {{ comment?: string }} [opts]
 */
export function buildPingResponseBody({ comment } = {}) {
  const body = {};
  if (comment) body.comment = String(comment);
  return body;
}

import { extractThreadId as extractFromMessage } from '../../utils/message-helpers.js';

export function extractThreadId(envelope) {
  try {
    // Prefer DIDComm v2: top-level thid/pthid from raw/unpacked message
    const rawMsg = envelope?.raw ? envelope.raw : envelope;
    const th = extractFromMessage(rawMsg);
    if (typeof th === 'string' && th) return th;
    // Fallback: v1 '~thread.thid' in body, if present
    const b = envelope?.body || {};
    if (b['~thread'] && typeof b['~thread'].thid === 'string' && b['~thread'].thid) return b['~thread'].thid;
  } catch {}
  return '';
}

export function startPingTimeout(peer, thid, timeoutMs, onTimeout) {
  if (!peer || !thid) return;
  const key = `${peer}|${thid}`;
  clearPingTimeout(peer, thid);
  const handle = setTimeout(() => {
    timeoutsByKey.delete(key);
    try { onTimeout?.(); } catch {}
  }, Math.max(1, Number(timeoutMs) || 0));
  timeoutsByKey.set(key, handle);
}

export function clearPingTimeout(peer, thid) {
  if (!peer || !thid) return;
  const key = `${peer}|${thid}`;
  const handle = timeoutsByKey.get(key);
  if (handle) {
    try { clearTimeout(handle); } catch {}
    timeoutsByKey.delete(key);
  }
}


