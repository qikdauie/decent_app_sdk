/** Attachment utilities: normalization, validation, and helpers */

import { generateCorrelationId } from './message-helpers.js';

/**
 * Generate a stable attachment id.
 */
export function generateAttachmentId() {
  return generateCorrelationId();
}

/**
 * Normalize a single attachment from legacy shapes into canonical DIDCommAttachment.
 * - Accepts legacy fields: mime_type, data.base64, data.links, url, links
 * - Produces: { id, mimeType, filename, description, data, externalUrl, isExternal }
 * - Generates missing id
 * - Stringifies non-string data
 * - Sets isExternal=true when externalUrl present
 * - Drops unknown legacy fields
 * @param {any} input
 * @param {{ allowBoth?: boolean, allowNeither?: boolean }} [opts]
 */
export function normalizeAttachment(input, opts = /** @type {any} */({})) {
  const a = (input && typeof input === 'object') ? input : {};

  const id = (typeof a.id === 'string' && a.id) ? a.id : generateAttachmentId();
  const legacyMime = typeof a.mime_type === 'string' ? a.mime_type : undefined;
  const mimeType = typeof a.mimeType === 'string' ? a.mimeType : legacyMime;
  const filename = a.filename != null ? String(a.filename) : undefined;
  const description = a.description != null ? String(a.description) : undefined;

  // Extract data (embedded) and external url from multiple legacy shapes
  const legacyData = (a.data && typeof a.data === 'object') ? a.data : {};
  const topLevelBase64 = typeof a.base64 === 'string' ? a.base64 : undefined;
  const nestedBase64 = typeof legacyData.base64 === 'string' ? legacyData.base64 : undefined;
  const dataRaw = (typeof a.data === 'string' ? a.data : undefined) || topLevelBase64 || nestedBase64;

  const topUrl = typeof a.url === 'string' ? a.url : undefined;
  const topLinks = Array.isArray(a.links) ? a.links : undefined;
  const nestedLinks = Array.isArray(legacyData.links) ? legacyData.links : undefined;
  const externalUrl = (Array.isArray(topLinks) && topLinks[0]) || (Array.isArray(nestedLinks) && nestedLinks[0]) || topUrl || (typeof a.externalUrl === 'string' ? a.externalUrl : undefined);

  let data = undefined;
  if (dataRaw != null) {
    data = typeof dataRaw === 'string' ? dataRaw : safeStringify(dataRaw);
  }

  const isExternal = Boolean(externalUrl);

  // Dev-time deprecation warnings when legacy fields are present
  try {
    const isDev = (typeof process !== 'undefined' && process?.env?.NODE_ENV !== 'production');
    if (isDev) {
      if (a.mime_type || legacyData?.base64 || legacyData?.links || a.base64 || a.url || a.links) {
        console.warn('[attachments] Deprecated legacy attachment fields detected. Please use canonical format { mimeType, data | externalUrl }');
      }
    }
  } catch {}

  /** @type {{ id: string, mimeType?: string, filename?: string, description?: string, data?: string, externalUrl?: string, isExternal?: boolean }} */
  const out = { id, mimeType, filename, description, data, externalUrl, isExternal };
  // Drop undefineds to keep clean output
  for (const k of Object.keys(out)) if (out[/** @type {keyof typeof out} */(k)] === undefined) delete out[/** @type {keyof typeof out} */(k)];
  return out;
}

/**
 * Validate a single canonical attachment.
 * Rules:
 * - id, mimeType: required non-empty strings
 * - Exactly one of data or externalUrl must be present unless relaxed via opts
 * - data must be a string when present
 * - externalUrl must be a valid URL when present; when isExternal=true, URL is required
 * - Optional filename/description must be non-empty strings when provided
 * - Optional protocol constraints supported via opts: mimeWhitelist, maxSizeBytes
 * @param {any} att
 * @param {{ allowBoth?: boolean, allowNeither?: boolean, mimeWhitelist?: string[]|RegExp[]|string, maxSizeBytes?: number }} [opts]
 */
export function validateAttachment(att, opts = /** @type {any} */({})) {
  const a = (att && typeof att === 'object') ? att : {};
  const idOk = typeof a.id === 'string' && a.id.length > 0;
  if (!idOk) return { ok: false, error: 'attachment.id is required' };
  const mimeOk = typeof a.mimeType === 'string' && a.mimeType.length > 0;
  if (!mimeOk) return { ok: false, error: 'attachment.mimeType is required' };

  const hasData = typeof a.data === 'string' && a.data.length > 0;
  const hasUrl = typeof a.externalUrl === 'string' && a.externalUrl.length > 0;
  const allowBoth = Boolean(opts.allowBoth);
  const allowNeither = Boolean(opts.allowNeither);
  if (!allowBoth && !allowNeither) {
    if (hasData === hasUrl) return { ok: false, error: 'attachment must have exactly one of data or externalUrl' };
  } else if (!allowNeither && !hasData && !hasUrl) {
    return { ok: false, error: 'attachment must include data or externalUrl' };
  }

  if (hasUrl) {
    try { new URL(String(a.externalUrl)); } catch { return { ok: false, error: 'attachment.externalUrl must be a valid URL' }; }
  }

  if (a.filename != null && !String(a.filename)) return { ok: false, error: 'attachment.filename must be a non-empty string when provided' };
  if (a.description != null && !String(a.description)) return { ok: false, error: 'attachment.description must be a non-empty string when provided' };

  // MIME whitelist support
  if (opts?.mimeWhitelist) {
    const list = Array.isArray(opts.mimeWhitelist) ? opts.mimeWhitelist : [opts.mimeWhitelist];
    const ok = list.some(rule => typeof rule === 'string' ? (a.mimeType === rule || String(a.mimeType).startsWith(rule)) : (rule instanceof RegExp ? rule.test(String(a.mimeType)) : false));
    if (!ok) return { ok: false, error: 'attachment.mimeType not allowed' };
  }

  // Size check for base64 payloads (approximate)
  if (Number.isFinite(opts?.maxSizeBytes) && opts.maxSizeBytes > 0 && hasData) {
    const approxBytes = Math.ceil((a.data.length * 3) / 4);
    if (approxBytes > opts.maxSizeBytes) return { ok: false, error: 'attachment.data exceeds size limit' };
  }

  return { ok: true };
}

/** Map normalizeAttachment over array input. */
export function normalizeAttachments(arr) {
  const list = Array.isArray(arr) ? arr : [];
  return list.map(a => normalizeAttachment(a));
}

/** Validate all attachments, returning { ok, errors? } */
export function validateAttachments(arr, opts = /** @type {any} */({})) {
  const list = Array.isArray(arr) ? arr : [];
  const errors = [];
  for (let i = 0; i < list.length; i++) {
    const res = validateAttachment(list[i], opts);
    if (!res.ok) errors.push({ index: i, error: res.error });
  }
  return errors.length ? { ok: false, errors } : { ok: true };
}

/** Identity helpers for clarity/future compatibility */
export function toWireAttachment(att) { return att; }
export function fromWireAttachment(wire) { return wire; }

function safeStringify(val) {
  try { return JSON.stringify(val); } catch { return String(val); }
}


