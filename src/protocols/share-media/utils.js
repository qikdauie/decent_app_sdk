export const SHARE_MEDIA_TYPE = 'https://didcomm.org/share-media/1.0/share';
export const REQUEST_MEDIA_TYPE = 'https://didcomm.org/share-media/1.0/request';

const SUPPORTED_MEDIA_PREFIXES = ['image/', 'video/', 'audio/', 'application/pdf'];
const DEFAULT_SIZE_LIMIT = 2 * 1024 * 1024; // 2 MB
import { normalizeAttachment, validateAttachment, generateAttachmentId } from '../../utils/attachments.js';

export function validateMediaAttachment(att, { sizeLimit = DEFAULT_SIZE_LIMIT } = {}) {
  const canonical = normalizeAttachment(att);
  const base = validateAttachment(canonical, { mimeWhitelist: SUPPORTED_MEDIA_PREFIXES, maxSizeBytes: sizeLimit });
  return Boolean(base && base.ok);
}

export function isSupportedMime(mime) {
  const m = String(mime || '');
  return SUPPORTED_MEDIA_PREFIXES.some(prefix => m === prefix || m.startsWith(prefix));
}

/**
 * @param {{ mime_type?: string, filename?: string, base64?: string, url?: string }} [opts]
 */
export function buildMediaAttachment({ mime_type, mimeType, filename, base64, url, data, externalUrl, id } = /** @type {any} */ ({})) {
  const raw = { id, mime_type: mime_type || undefined, mimeType, filename, base64, url, data, externalUrl };
  const canonical = normalizeAttachment(raw);
  if (!canonical.id) canonical.id = generateAttachmentId();
  return canonical;
}

/**
 * @param {{ items?: any[], note?: string }} [opts]
 */
export function buildMediaMessage({ items, note } = /** @type {any} */ ({})) {
  const body = {};
  if (Array.isArray(items)) body.items = items.map(it => ({ attachment_id: String(it?.id || ''), caption: typeof it?.caption === 'string' ? it.caption : undefined })).filter(x => x.attachment_id);
  if (note != null) body.note = String(note);
  return body;
}

export function extractMediaFromEnvelope(envelope) {
  const b = envelope?.body || {};
  const topAttachments = Array.isArray(envelope?.attachments) ? envelope.attachments : [];
  const legacyAttachments = Array.isArray(b.attachments) ? b.attachments : [];
  const byId = new Map();
  for (const a of [...topAttachments, ...legacyAttachments]) if (a?.id) byId.set(String(a.id), a);
  const items = Array.isArray(b.items) ? b.items : [];
  const resolved = (items.length ? items.map(it => byId.get(String(it?.attachment_id))) : [...topAttachments]).filter(Boolean);
  return resolved.map(a => {
    const n = normalizeAttachment(a);
    return {
      mime_type: n.mimeType,
      filename: n.filename,
      base64: n.data,
      url: n.externalUrl,
    };
  });
}


