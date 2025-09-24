/** Common constants used across the SDK */

export const PIURI = {
  DISCOVER_FEATURES_V2: 'https://didcomm.org/discover-features/2.0',
  APP_INTENT_V1: 'https://didcomm.org/app-intent/1.0',
};

export const MESSAGE_TYPES = {
  DF2_QUERIES: `${PIURI.DISCOVER_FEATURES_V2}/queries`,
  DF2_DISCLOSE: `${PIURI.DISCOVER_FEATURES_V2}/disclose`,
};

export const ROUTER_RESULT = {
  SUCCESS: 'success',
  DEST_NOT_FOUND: 'destination-not-found',
  INBOUND_ERROR: 'inbound-error',
  UNKNOWN_ERROR: 'unknown-error',
};


