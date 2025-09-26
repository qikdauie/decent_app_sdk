/** Client-side permission helpers (proxy to SW) */
import { isPermissionSuccess, isSuccess, getErrorMessage } from '../utils/response-helpers.js';
import { RpcMethods } from '../constants/index.js';

export function createPermissionHelpers(messenger) {
  return {
    check: (protocolUri, messageTypeUri) => 
      messenger.rpc(RpcMethods.CHECK_PERMISSION, { protocolUri, messageTypeUri })
        .catch(() => false),
    
    checkMultiple: (protocolUris, messageTypeUris) => 
      messenger.rpc(RpcMethods.CHECK_MULTIPLE_PERMISSIONS, { protocolUris, messageTypeUris })
        .catch(() => []),
    
    request: (requests) => 
      messenger.rpc(RpcMethods.REQUEST_PERMISSIONS, { requests })
        .catch(() => ({ success: false, grantedPermissions: [], failedProtocols: [], errorMessage: 'RPC failed' })),
    
    listGranted: (protocolUris) => 
      messenger.rpc(RpcMethods.LIST_GRANTED_PERMISSIONS, { protocolUris })
        .catch(() => []),
    
    async requestOk(requests) {
      const result = await this.request(requests);
      return isPermissionSuccess(result);
    },
    
    async getRequestError(requests) {
      const result = await this.request(requests);
      return getErrorMessage(result);
    },
    
    isSuccess: (result) => isSuccess(result),
    getError: (result) => getErrorMessage(result)
  };
}


