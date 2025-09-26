/**
 * Service Worker RPC method names.
 */

export const RpcMethods = Object.freeze({
  GET_PROTOCOL_METHODS: 'getProtocolMethods',
  PROTOCOL_INVOKE: 'protocolInvoke',
  REGISTER_ADDRESS: 'registerAddress',
  GET_DID: 'getDID',
  PACK_MESSAGE: 'packMessage',
  UNPACK_MESSAGE: 'unpackMessage',
  SEND: 'send',
  DISCOVER: 'discover',
  ADVERTISE: 'advertise',
  INTENT_ADVERTISE: 'intentAdvertise',
  INTENT_DISCOVER: 'intentDiscover',
  INTENT_REQUEST: 'intentRequest',
  CHECK_PERMISSION: 'checkDidcommPermission',
  CHECK_MULTIPLE_PERMISSIONS: 'checkMultipleDidcommPermissions',
  REQUEST_PERMISSIONS: 'requestDidcommPermissions',
  LIST_GRANTED_PERMISSIONS: 'listGrantedDidcommPermissions',
});


