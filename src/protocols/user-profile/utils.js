export const TYPE_PROFILE = 'https://didcomm.org/user-profile/1.0/profile';
export const TYPE_REQUEST_PROFILE = 'https://didcomm.org/user-profile/1.0/request-profile';

import { normalizeAttachment, validateAttachment } from '../../utils/attachments.js';

export function isValidProfileData(profile) {
  if (!profile || typeof profile !== 'object') return false;
  if (profile.displayName !== undefined && typeof profile.displayName !== 'string') return false;
  if (profile.description !== undefined && typeof profile.description !== 'string') return false;
  if (profile.displayPicture !== undefined && typeof profile.displayPicture !== 'object') return false;
  return true;
}

/**
 * @param {{ displayName?: string, description?: string, displayPicture?: { mimeType?: string, base64?: string, filename?: string, url?: string }, send_back_yours?: boolean }} [opts]
 */
export function buildProfileBody({ displayName, description, displayPicture, send_back_yours } = /** @type {any} */ ({})) {
  const body = { profile: {} };
  if (displayName != null) body.profile.displayName = String(displayName);
  if (description != null) body.profile.description = String(description);
  if (displayPicture && typeof displayPicture === 'object') {
    const raw = { id: 'display-picture', mimeType: displayPicture.mimeType, filename: displayPicture.filename, data: displayPicture.base64, externalUrl: displayPicture.url };
    const attachment = normalizeAttachment(raw);
    attachment.id = 'display-picture';
    const v = validateAttachment(attachment);
    if (!v.ok) throw new Error(`invalid display picture: ${v.error}`);
    body._attachments = [attachment];
  }
  if (send_back_yours !== undefined) body.send_back_yours = Boolean(send_back_yours);
  return body;
}

/**
 * @param {{ query?: string, send_back_yours?: boolean }} [opts]
 */
export function buildRequestProfileBody({ query, send_back_yours } = /** @type {any} */ ({})) {
  const body = {};
  if (query != null) body.query = String(query);
  if (send_back_yours !== undefined) body.send_back_yours = Boolean(send_back_yours);
  return body;
}

export function extractProfileFromEnvelope(envelope) {
  const b = envelope?.body || {};
  const bodyProfile = b?.profile || b; // backward-compat: old schema placed fields at body root
  const topAttachments = Array.isArray(envelope?.attachments) ? envelope.attachments : [];
  const legacyAttachments = Array.isArray(b.attachments) ? b.attachments : [];
  const pic = [...topAttachments, ...legacyAttachments].find(a => a?.id === 'display-picture');
  let displayPicture;
  if (pic) {
    const n = normalizeAttachment(pic);
    displayPicture = { mimeType: n.mimeType, filename: n.filename, base64: n.data, url: n.externalUrl };
  }
  return {
    displayName: typeof bodyProfile?.displayName === 'string' ? bodyProfile.displayName : undefined,
    description: typeof bodyProfile?.description === 'string' ? bodyProfile.description : undefined,
    displayPicture,
  };
}


