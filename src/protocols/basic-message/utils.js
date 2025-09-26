import { MessageTypes } from '../../constants/index.js';
export const MESSAGE_TYPE = MessageTypes.BASIC_MESSAGE.MESSAGE;

export function isValidBasicMessage(body) {
  if (!body || typeof body !== 'object') return false;
  if (typeof body.content !== 'string' || !body.content) return false;
  if (body.sent_time !== undefined && typeof body.sent_time !== 'string') return false;
  return true;
}

/**
 * @param {{ content?: string, sent_time?: string }} [opts]
 */
export function buildBasicMessageBody({ content, sent_time } = /** @type {any} */ ({})) {
  const nowIso = new Date().toISOString();
  const body = { content: String(content || '') };
  if (!body.content) throw new Error('content is required');
  body.sent_time = typeof sent_time === 'string' && sent_time ? sent_time : nowIso;
  return body;
}

export function parseBasicMessage(envelope) {
  const body = envelope?.body || {};
  return {
    content: String(body?.content || ''),
    sent_time: typeof body?.sent_time === 'string' ? body.sent_time : undefined,
  };
}


