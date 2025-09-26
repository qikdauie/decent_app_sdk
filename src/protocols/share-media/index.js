import { BaseProtocol } from '../base.js';
import { SHARE_MEDIA_TYPE, REQUEST_MEDIA_TYPE, validateMediaAttachment, buildMediaAttachment, buildMediaMessage, extractMediaFromEnvelope } from './utils.js';

export class ShareMediaProtocol extends BaseProtocol {
  constructor() {
    super({
      id: 'share-media-v1',
      piuri: 'https://didcomm.org/share-media/1.0',
      version: '1.0',
      messageTypes: [SHARE_MEDIA_TYPE, REQUEST_MEDIA_TYPE],
    });
    /** @type {Array<{ from?: string, items: any[] }>} */
    this._received = [];
    /** @type {{ keepLast?: number, maxAgeMs?: number|null }} */
    this._retention = { keepLast: 100, maxAgeMs: null };
  }

  declareClientMethods() {
    return {
      shareMedia: { params: ['to', 'media', 'options?'], description: 'Share media items' },
      requestMedia: { params: ['to', 'options?'], description: 'Request media from peer', timeoutMs: 8000 },
      getSharedMedia: { params: ['options?'], description: 'Get received media' },
    };
  }

  async handleIncoming(envelope) {
    const { type, from, body } = envelope || {};
    if (!type) return false;
    if (type === SHARE_MEDIA_TYPE) {
      const items = extractMediaFromEnvelope(envelope);
      if (!Array.isArray(items) || !items.length) return false;
      this._received.push({ from, items });
      this._pruneRetention();
      return true;
    }
    if (type === REQUEST_MEDIA_TYPE) {
      // For now no auto-response; could integrate with local store
      return true;
    }
    return false;
  }

  async invokeClientMethod(methodName, args) {
    if (methodName === 'shareMedia') {
      const [to, media, options = {}] = Array.isArray(args) ? args : [args];
      if (!to || typeof to !== 'string') throw new Error('to is required');
      const items = Array.isArray(media) ? media : [media];
      const atts = items.map(m => {
        const att = buildMediaAttachment({ mime_type: m?.mime_type || m?.mimeType, filename: m?.filename, base64: m?.base64, url: m?.url });
        if (!validateMediaAttachment(att, { sizeLimit: options?.sizeLimit })) throw new Error('invalid media attachment');
        return att;
      });
      // Build body.items referencing top-level attachments
      const itemsForBody = atts.map((a, idx) => {
        const id = String(a?.id || `item-${idx}`);
        return { id, ...a };
      });
      // Construct body.items referencing attachments; carry optional caption from input
      const body = buildMediaMessage({ items: itemsForBody.map((it, i) => ({ id: it.id, caption: items?.[i]?.caption })) });
      // Send with top-level attachments
      await this.runtime.sendType(to, SHARE_MEDIA_TYPE, body, { attachments: itemsForBody });
      return { ok: true };
    }
    if (methodName === 'requestMedia') {
      const [to, options = {}] = Array.isArray(args) ? args : [args];
      if (!to || typeof to !== 'string') throw new Error('to is required');
      const body = { query: String(options?.query || '*') };
      const timeoutMs = Number.isFinite(options?.timeoutMs) ? Number(options.timeoutMs) : 8000;
      const match = (env) => env?.type === SHARE_MEDIA_TYPE && (env?.from === to || !to);
      const resp = await this.sendAndWaitForResponse(to, REQUEST_MEDIA_TYPE, body, { timeoutMs, match });
      return { ok: true, response: resp };
    }
    if (methodName === 'getSharedMedia') {
      const [options = {}] = Array.isArray(args) ? args : [args];
      const limit = Number.isFinite(options?.limit) ? Number(options.limit) : undefined;
      const from = typeof options?.from === 'string' ? options.from : undefined;
      let list = this._received.slice();
      if (from) list = list.filter(x => x?.from === from);
      if (Number.isFinite(limit) && limit > 0) list = list.slice(-limit);
      return { ok: true, items: list };
    }
    throw new Error(`Unknown method: ${methodName}`);
  }

  _pruneRetention() {
    try {
      const { keepLast, maxAgeMs } = this._retention || {};
      if (Number.isFinite(keepLast) && keepLast > 0 && this._received.length > keepLast) {
        this._received = this._received.slice(-keepLast);
      }
      if (Number.isFinite(maxAgeMs) && maxAgeMs > 0) {
        const now = Date.now();
        // No timestamps; skip age-based pruning for media for now
        void now;
      }
    } catch {}
  }
}

export default ShareMediaProtocol;


