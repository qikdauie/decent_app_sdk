import { requestTypeToAction, actionToResponseType } from './intents.js';
import { extractCorrelationId } from '../../utils/message-helpers.js'; // TODO: Remove once threadId is available

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
        // TODO: Remove correlation ID extraction once packMessage returns thread ID
        const correlationId = extractCorrelationId(envelope);
        const outcome = await this.onRequest({ ...envelope, correlationId });
        if (outcome && (outcome.accept || outcome.response)) {
          const result = (outcome.result || (outcome.response && outcome.response.result) || {});
          const responseType = actionToResponseType(action);
          // TODO: Include correlationId in response body until thread-based matching is available
          await runtime.sendType(from, responseType, { status: 'ok', result, _correlationId: correlationId });
          return true;
        } else if (outcome && outcome.decline) {
          const d = outcome.decline;
          await runtime.sendType(from, 'https://didcomm.org/app-intent/1.0/decline', {
            reason: d.reason || 'not_supported',
            ...(d.detail ? { detail: d.detail } : {}),
            ...(d.retry_after_ms ? { retry_after_ms: d.retry_after_ms } : {}),
            // TODO: Include correlationId in decline body until thread-based matching is available
            _correlationId: correlationId,
          });
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


