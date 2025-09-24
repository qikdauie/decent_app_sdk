export const APP_INTENT_BASE = 'https://didcomm.org/app-intent/1.0';

export const INTENTS = {
  SHARE: 'share',
  COMPOSE_EMAIL: 'compose-email',
  DIAL_CALL: 'dial-call',
  OPEN_URL: 'open-url',
  PICK_FILE: 'pick-file',
  PICK_CONTACT: 'pick-contact',
  PICK_DATETIME: 'pick-datetime',
  PICK_LOCATION: 'pick-location',
  CAPTURE_PHOTO: 'capture-photo',
  CAPTURE_VIDEO: 'capture-video',
  CAPTURE_AUDIO: 'capture-audio',
  SCAN_QR: 'scan-qr',
  SCAN_DOCUMENT: 'scan-document',
  OPEN_MAP_NAVIGATION: 'open-map-navigation',
  ADD_CALENDAR_EVENT: 'add-calendar-event',
  ADD_CONTACT: 'add-contact',
  SAVE_TO: 'save-to',
  PRINT: 'print',
  TRANSLATE: 'translate',
  PAY: 'pay',
  SIGN: 'sign',
  VERIFY_SIGNATURE: 'verify-signature',
  ENCRYPT: 'encrypt',
  DECRYPT: 'decrypt'
};

const INTENT_CODES_SET = new Set(Object.values(INTENTS));

export function toActionCode(intentKeyOrCode) {
  if (!intentKeyOrCode) throw new Error('intent/action is required');
  const val = String(intentKeyOrCode);
  if (INTENT_CODES_SET.has(val)) return val;
  const key = val.toUpperCase();
  if (INTENTS[key]) return INTENTS[key];
  throw new Error(`Unknown intent/action: ${intentKeyOrCode}`);
}

export function actionToRequestType(actionCode) {
  const code = toActionCode(actionCode);
  return `${APP_INTENT_BASE}/${code}-request`;
}

export function actionToResponseType(actionCode) {
  const code = toActionCode(actionCode);
  return `${APP_INTENT_BASE}/${code}-response`;
}

export function requestTypeToAction(type) {
  const t = String(type || '');
  if (!t.startsWith(APP_INTENT_BASE + '/')) return '';
  const suffix = '-request';
  if (!t.endsWith(suffix)) return '';
  const middle = t.slice(APP_INTENT_BASE.length + 1, t.length - suffix.length);
  return INTENT_CODES_SET.has(middle) ? middle : '';
}

export function responseTypeToAction(type) {
  const t = String(type || '');
  if (!t.startsWith(APP_INTENT_BASE + '/')) return '';
  const suffix = '-response';
  if (!t.endsWith(suffix)) return '';
  const middle = t.slice(APP_INTENT_BASE.length + 1, t.length - suffix.length);
  return INTENT_CODES_SET.has(middle) ? middle : '';
}

export function advertiseIntentsList(registry, list, roles = ['provider']) {
  const codes = Array.isArray(list) ? list : [list];
  for (const item of codes) {
    try {
      const reqType = actionToRequestType(item);
      registry.advertiseFeature('message-type', reqType, roles);
    } catch {}
  }
}


