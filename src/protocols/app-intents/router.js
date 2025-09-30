import { requestTypeToAction, actionToResponseType } from './intents.js';
import { extractThid } from '../../utils/message-helpers.js';

/**
 * IntentRouter — minimal, framework-agnostic router with pluggable handlers.
 */
export class IntentRouter {
  constructor(options = {}) {
    this.onRequest = typeof options.onRequest === 'function' ? options.onRequest : null;
    this.onCancel = typeof options.onCancel === 'function' ? options.onCancel : null;
    this.logger = options.logger || console;
  }

  async handleIncoming(envelope, runtime) {
    const { type, from } = envelope || {};
    if (!type || !from) return false;
    const action = requestTypeToAction(type);
    if (action && this.onRequest) {
      try {
        const thid = extractThid(envelope?.raw || envelope);
        const outcome = await this.onRequest({ ...envelope, thid });
        if (outcome && (outcome.accept || outcome.response)) {
          const result = (outcome.result || (outcome.response && outcome.response.result) || {});
          const responseType = actionToResponseType(action);
          const headers = thid ? { thid } : undefined;
          await runtime.sendType(from, responseType, { status: 'ok', result }, { headers, replyTo: JSON.stringify(envelope?.raw || {}) });
          return true;
        } else if (outcome && outcome.decline) {
          const d = outcome.decline;
          const headers = thid ? { thid } : undefined;
          await runtime.sendType(from, 'https://didcomm.org/app-intent/1.0/decline', {
            reason: d.reason || 'not_supported',
            ...(d.detail ? { detail: d.detail } : {}),
            ...(d.retry_after_ms ? { retry_after_ms: d.retry_after_ms } : {}),
          }, { headers, replyTo: JSON.stringify(envelope?.raw || {}) });
          return true;
        }
      } catch (err) {
        this.logger.error('[IntentRouter] onRequest failed', err);
      }
      return true;
    }
    if (type === 'https://didcomm.org/app-intent/1.0/cancel') {
      try { this.onCancel?.(envelope); } catch {}
      return true;
    }
    return false;
  }
}


