/** Client-side permission helpers (proxy to SW) */
import { isPermissionSuccess, isSuccess, getErrorMessage } from '../utils/response-helpers.js';

export function createPermissionHelpers(messenger) {
  return {
    check: (protocolUri, messageTypeUri) => 
      messenger.rpc('checkDidcommPermission', { protocolUri, messageTypeUri })
        .catch(() => false),
    
    checkMultiple: (protocolUris, messageTypeUris) => 
      messenger.rpc('checkMultipleDidcommPermissions', { protocolUris, messageTypeUris })
        .catch(() => []),
    
    request: (requests) => 
      messenger.rpc('requestDidcommPermissions', { requests })
        .catch(() => ({ success: false, grantedPermissions: [], failedProtocols: [], errorMessage: 'RPC failed' })),
    
    listGranted: (protocolUris) => 
      messenger.rpc('listGrantedDidcommPermissions', { protocolUris })
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


