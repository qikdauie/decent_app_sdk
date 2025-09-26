import { BaseProtocol } from '../base.js';
import { INVITATION_TYPE, buildInvitationBody, validateInvitation, buildInvitationUrl, parseInvitationUrl } from './utils.js';
import { generateCorrelationId } from '../../utils/message-helpers.js';

export class OutOfBandProtocol extends BaseProtocol {
  constructor() {
    super({
      id: 'out-of-band-v2',
      piuri: 'https://didcomm.org/out-of-band/2.0',
      version: '2.0',
      messageTypes: [INVITATION_TYPE],
    });
    /** @type {Array<any>} */
    this._invitations = [];
  }

  declareClientMethods() {
    return {
      createInvitation: { params: ['options?'], description: 'Create an OOB invitation' },
      parseInvitation: { params: ['input'], description: 'Parse URL or payload into invitation' },
      encodeInvitationUrl: { params: ['invitation', 'options?'], description: 'Encode invitation into URL' },
    };
  }

  async handleIncoming(envelope) {
    const { type } = envelope || {};
    if (type !== INVITATION_TYPE) return false;
    if (!validateInvitation(envelope)) return false;
    this._invitations.push(envelope);
    return true;
  }

  async invokeClientMethod(methodName, args) {
    if (methodName === 'createInvitation') {
      const [options = {}] = Array.isArray(args) ? args : [args];
      const body = buildInvitationBody(options || {});
      const id = String(options?.id || generateCorrelationId());
      const from = options?.from ? String(options.from) : undefined;
      const attachments = Array.isArray(options?.attachments) ? options.attachments : undefined;
      const invitation = { type: INVITATION_TYPE, id, from, body, attachments };
      if (!validateInvitation(invitation)) throw new Error('invalid invitation');
      const url = buildInvitationUrl(invitation, { baseUrl: options?.baseUrl });
      return { ok: true, invitation, url };
    }
    if (methodName === 'parseInvitation') {
      const [input] = Array.isArray(args) ? args : [args];
      if (typeof input === 'string') {
        const parsed = parseInvitationUrl(input);
        if (parsed) return { ok: true, invitation: parsed };
      }
      if (input && typeof input === 'object') {
        // normalize provided object; accept legacy body.attachments for backward-compat
        const legacyBody = input?.body || input;
        const attachments = Array.isArray(legacyBody?.attachments) ? legacyBody.attachments : input?.attachments;
        const inv = { type: INVITATION_TYPE, id: String(input?.id || generateCorrelationId()), from: input?.from, body: legacyBody?.body || legacyBody, attachments };
        if (validateInvitation(inv)) return { ok: true, invitation: inv };
      }
      throw new Error('invalid invitation input');
    }
    if (methodName === 'encodeInvitationUrl') {
      const [invitation, options = {}] = Array.isArray(args) ? args : [args];
      const inv = invitation?.type ? invitation : { type: INVITATION_TYPE, id: String(invitation?.id || generateCorrelationId()), from: invitation?.from, body: invitation?.body || invitation, attachments: invitation?.attachments };
      if (!validateInvitation(inv)) throw new Error('invalid invitation');
      const url = buildInvitationUrl(inv, { baseUrl: options?.baseUrl });
      return { ok: true, url };
    }
    throw new Error(`Unknown method: ${methodName}`);
  }
}

export default OutOfBandProtocol;


