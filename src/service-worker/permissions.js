/**
 * Minimal facade over environment-provided DIDComm permission APIs.
 * Protocols can use these helpers to check/request permissions.
 */

export async function checkPermission(protocolUri, messageTypeUri) {
  try { return await self.checkDidcommPermission(protocolUri, messageTypeUri); } catch { return false; }
}

export async function checkMultiple(protocolUris, messageTypeUris) {
  try { return await self.checkMultipleDidcommPermissions(protocolUris, messageTypeUris); } catch { return []; }
}

export async function requestPermissions(requests) {
  try { return await self.requestDidcommPermissions(requests); } catch (err) { return { ok: false, error: String(err) }; }
}

export async function listGranted(protocolUris) {
  try { return await self.listGrantedDidcommPermissions(protocolUris); } catch { return []; }
}


