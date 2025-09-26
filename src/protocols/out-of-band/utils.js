import { MessageTypes } from '../../constants/index.js';
export const INVITATION_TYPE = MessageTypes.OUT_OF_BAND.INVITATION;

export function base64urlEncode(input) {
  try {
    const s = typeof input === 'string' ? input : JSON.stringify(input || {});
    const b64 = (typeof btoa === 'function' ? btoa(unescape(encodeURIComponent(s))) : Buffer.from(s, 'utf8').toString('base64'));
    return b64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  } catch { return ''; }
}

export function base64urlDecode(b64url) {
  try {
    const pad = (s) => s + '='.repeat((4 - (s.length % 4)) % 4);
    const b64 = pad(String(b64url || '').replace(/-/g, '+').replace(/_/g, '/'));
    const s = (typeof atob === 'function' ? decodeURIComponent(escape(atob(b64))) : Buffer.from(b64, 'base64').toString('utf8'));
    return JSON.parse(s);
  } catch { return null; }
}

export function validateInvitation(inv) {
  if (!inv || typeof inv !== 'object') return false;
  if (inv.type !== INVITATION_TYPE) return false;
  // Required/optional top-level per spec
  if (typeof inv.id !== 'string' || !inv.id) return false;
  if (inv.from !== undefined && typeof inv.from !== 'string') return false;
  if (inv.attachments !== undefined && !Array.isArray(inv.attachments)) return false;
  const b = inv.body || {};
  if (b.goal_code !== undefined && typeof b.goal_code !== 'string') return false;
  if (b.goal !== undefined && typeof b.goal !== 'string') return false;
  if (b.accept !== undefined && !Array.isArray(b.accept)) return false;
  return true;
}

/**
 * @param {{ goal_code?: string, goal?: string, accept?: string[] }} [opts]
 */
export function buildInvitationBody({ goal_code, goal, accept } = /** @type {any} */ ({})) {
  const body = {};
  if (goal_code != null) body.goal_code = String(goal_code);
  if (goal != null) body.goal = String(goal);
  if (Array.isArray(accept)) body.accept = accept.map(String);
  return body;
}

import { normalizeAttachment as sharedNormalizeAttachment, validateAttachment } from '../../utils/attachments.js';
/** @param {any} a */
export function normalizeAttachment(a) {
  return sharedNormalizeAttachment(a);
}

/**
 * @param {{ type: string, id: string, from?: string, body: any, attachments?: any[] }} invitation
 * @param {{ baseUrl?: string }} [options]
 */
export function buildInvitationUrl(invitation, { baseUrl } = /** @type {any} */ ({})) {
  const payload = {
    type: INVITATION_TYPE,
    id: String(invitation?.id || ''),
    from: invitation?.from ? String(invitation.from) : undefined,
    body: invitation?.body || {},
    attachments: Array.isArray(invitation?.attachments) ? invitation.attachments.map((a) => sharedNormalizeAttachment(a)) : undefined,
  };
  const encoded = base64urlEncode(JSON.stringify(payload));
  const origin = baseUrl || (typeof location !== 'undefined' ? location.origin : 'https://example.org');
  const url = new URL(origin);
  url.searchParams.set('_oob', encoded);
  return url.toString();
}

/** @param {string} urlStr */
export function parseInvitationUrl(urlStr) {
  try {
    const url = new URL(String(urlStr));
    const oob = url.searchParams.get('_oob');
    const oobid = url.searchParams.get('_oobid');
    if (oob) {
      const decoded = base64urlDecode(oob);
      if (decoded && decoded.type === INVITATION_TYPE) return decoded;
    }
    if (oobid) {
      // Shortened invitations require external resolution; return reference
      return { type: INVITATION_TYPE, id: String(oobid), body: { _oobid: oobid } };
    }
  } catch {}
  return null;
}


