import { BaseProtocol } from '../base.js';
import { TYPE_PROFILE, TYPE_REQUEST_PROFILE, isValidProfileData, buildProfileBody, buildRequestProfileBody, extractProfileFromEnvelope } from './utils.js';

/**
 * User Profile 1.0 — share and request basic user profile
 */
export class UserProfileProtocol extends BaseProtocol {
  constructor() {
    super({
      id: 'user-profile-v1',
      piuri: 'https://didcomm.org/user-profile/1.0',
      version: '1.0',
      messageTypes: [TYPE_PROFILE, TYPE_REQUEST_PROFILE],
    });
    /** @type {Map<string, any>} */
    this._profilesByPeer = new Map();
  }

  declareClientMethods() {
    return {
      sendProfile: { params: ['to', 'profile', 'options?'], description: 'Send your profile' },
      requestProfile: { params: ['to', 'options?'], description: 'Request peer profile', timeoutMs: 6000 },
      getProfile: { params: ['peer'], description: 'Get last known profile for peer' },
    };
  }

  async handleIncoming(envelope) {
    const { type, from } = envelope || {};
    if (!type || !from) return false;
    if (type === TYPE_PROFILE) {
      const prof = extractProfileFromEnvelope(envelope);
      if (!isValidProfileData(prof)) return false;
      this._profilesByPeer.set(from, { ...prof, raw: envelope?.raw });
      return true;
    }
    if (type === TYPE_REQUEST_PROFILE) {
      const sendBack = Boolean(envelope?.body?.send_back_yours);
      if (sendBack) {
        try {
          const existing = this._profilesByPeer.get('self') || {};
          const body = buildProfileBody(existing);
          const topLevelAttachments = Array.isArray((/** @type {any} */ (body))._attachments) ? (/** @type {any} */ (body))._attachments : [];
          if (topLevelAttachments.length) delete (/** @type {any} */ (body))._attachments;
          await this.runtime.sendType(from, TYPE_PROFILE, body, { attachments: topLevelAttachments });
        } catch {}
      }
      return true;
    }
    return false;
  }

  async invokeClientMethod(methodName, args) {
    if (methodName === 'sendProfile') {
      const [to, profile, options = {}] = Array.isArray(args) ? args : [args];
      if (!to || typeof to !== 'string') throw new Error('to is required');
      if (!isValidProfileData(profile)) throw new Error('invalid profile');
      const body = buildProfileBody({ ...profile, send_back_yours: Boolean(options?.send_back_yours) });
      const topLevelAttachments = Array.isArray((/** @type {any} */ (body))._attachments) ? (/** @type {any} */ (body))._attachments : [];
      if (topLevelAttachments.length) delete (/** @type {any} */ (body))._attachments;
      await this.runtime.sendType(to, TYPE_PROFILE, body, { attachments: topLevelAttachments });
      // Save own profile (under 'self') for quick reuse
      this._profilesByPeer.set('self', { ...profile });
      return { ok: true };
    }
    if (methodName === 'requestProfile') {
      const [to, options = {}] = Array.isArray(args) ? args : [args];
      if (!to || typeof to !== 'string') throw new Error('to is required');
      const body = buildRequestProfileBody({ query: options?.query, send_back_yours: options?.send_back_yours });
      const timeoutMs = Number.isFinite(options?.timeoutMs) ? Number(options.timeoutMs) : 6000;
      const match = (env) => env?.type === TYPE_PROFILE && (env?.from === to || !to);
      const result = await this.sendAndWaitForResponse(to, TYPE_REQUEST_PROFILE, body, { timeoutMs, match });
      if (result) {
        const prof = extractProfileFromEnvelope(result);
        if (isValidProfileData(prof)) this._profilesByPeer.set(to, prof);
      }
      return { ok: true, profile: this._profilesByPeer.get(to) };
    }
    if (methodName === 'getProfile') {
      const [peer] = Array.isArray(args) ? args : [args];
      if (!peer || typeof peer !== 'string') throw new Error('peer is required');
      return { ok: true, profile: this._profilesByPeer.get(peer) || null };
    }
    throw new Error(`Unknown method: ${methodName}`);
  }
}

export default UserProfileProtocol;


