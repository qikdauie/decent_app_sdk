import { PIURI } from './piuri.js';

/**
 * Consolidated DIDComm message type URIs grouped by protocol.
 */
export const MessageTypes = Object.freeze({
  DISCOVER_FEATURES: Object.freeze({
    QUERIES: `${PIURI.DISCOVER_FEATURES_V2}/queries`,
    DISCLOSE: `${PIURI.DISCOVER_FEATURES_V2}/disclose`,
  }),
  BASIC_MESSAGE: Object.freeze({
    MESSAGE: `${PIURI.BASIC_MESSAGE_V2}/message`,
  }),
  TRUST_PING: Object.freeze({
    PING: `${PIURI.TRUST_PING_V2}/ping`,
    PING_RESPONSE: `${PIURI.TRUST_PING_V2}/ping-response`,
  }),
  APP_INTENTS: Object.freeze({
    DECLINE: `${PIURI.APP_INTENT_V1}/decline`,
    CANCEL: `${PIURI.APP_INTENT_V1}/cancel`,
    PROGRESS: `${PIURI.APP_INTENT_V1}/progress`,
  }),
  USER_PROFILE: Object.freeze({
    PROFILE: `${PIURI.USER_PROFILE_V1}/profile`,
    REQUEST_PROFILE: `${PIURI.USER_PROFILE_V1}/request-profile`,
  }),
  REPORT_PROBLEM: Object.freeze({
    PROBLEM_REPORT: `${PIURI.REPORT_PROBLEM_V2}/problem-report`,
  }),
  OUT_OF_BAND: Object.freeze({
    INVITATION: `${PIURI.OUT_OF_BAND_V2}/invitation`,
  }),
  SHARE_MEDIA: Object.freeze({
    SHARE: `${PIURI.SHARE_MEDIA_V1}/share`,
    REQUEST: `${PIURI.SHARE_MEDIA_V1}/request`,
  }),
  PRESENT_PROOF: Object.freeze({
    PROPOSE_PRESENTATION: `${PIURI.PRESENT_PROOF_V2}/propose-presentation`,
    REQUEST_PRESENTATION: `${PIURI.PRESENT_PROOF_V2}/request-presentation`,
    PRESENTATION: `${PIURI.PRESENT_PROOF_V2}/presentation`,
  }),
  ISSUE_CREDENTIAL: Object.freeze({
    PROPOSE_CREDENTIAL: `${PIURI.ISSUE_CREDENTIAL_V2}/propose-credential`,
    OFFER_CREDENTIAL: `${PIURI.ISSUE_CREDENTIAL_V2}/offer-credential`,
    REQUEST_CREDENTIAL: `${PIURI.ISSUE_CREDENTIAL_V2}/request-credential`,
    ISSUE_CREDENTIAL: `${PIURI.ISSUE_CREDENTIAL_V2}/issue-credential`,
  }),
  DIDEXCHANGE: Object.freeze({
    REQUEST: `${PIURI.DIDEXCHANGE_V1_1}/request`,
    RESPONSE: `${PIURI.DIDEXCHANGE_V1_1}/response`,
    COMPLETE: `${PIURI.DIDEXCHANGE_V1_1}/complete`,
    PROBLEM_REPORT: `${PIURI.DIDEXCHANGE_V1_1}/problem_report`,
  }),
  ACTION_MENU: Object.freeze({
    MENU_REQUEST: `${PIURI.ACTION_MENU_V1}/menu-request`,
    MENU: `${PIURI.ACTION_MENU_V1}/menu`,
    PERFORM: `${PIURI.ACTION_MENU_V1}/perform`,
  }),
});


