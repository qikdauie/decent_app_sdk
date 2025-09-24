import { MessengerClient } from './messenger.js';
import { createProtocolHelpers } from './protocols.js';
import { createPermissionHelpers } from './permissions.js';
import { isSuccess, isRouterSuccess, isDIDSuccess, isMessageOpSuccess, getErrorMessage } from '../utils/response-helpers.js';

/**
 * Main SDK class exposed to developers.
 */
export class DecentApp {
  constructor(config = {}) {
    this.messenger = new MessengerClient({
      serviceWorkerUrl: config.serviceWorkerUrl || '/worker/sw.js',
      readinessTimeoutMs: config.readinessTimeoutMs || 8000,
      rpcTimeoutMs: config.rpcTimeoutMs || 60000,
    });
    this.ready = this.messenger.ready;
    this.protocols = createProtocolHelpers(this.messenger);
    this.permissions = createPermissionHelpers(this.messenger);
  }

  // Low-level convenience wrappers with basic error boundaries
  async getDID() {
    try { return await this.messenger.rpc('getDID'); }
    catch (e) { return { success: false, error_code: 1, error: String(e?.message || e), did: '', did_document: '', public_key: '' }; }
  }
  async registerAddress(did) {
    try { return await this.messenger.rpc('registerAddress', { did }); }
    catch (e) { return 'unknown-error'; }
  }
  async pack(dest, type, bodyJson, attachments = [], replyTo = "") {
    try { return await this.messenger.rpc('packMessage', { dest, type, body: bodyJson, attachments, replyTo }); }
    catch (e) { return { success: false, error_code: 1, error: String(e?.message || e), message: '' }; }
  }
  async unpack(raw) {
    try { return await this.messenger.rpc('unpackMessage', { raw }); }
    catch (e) { return { success: false, error_code: 1, error: String(e?.message || e), message: '' }; }
  }
  async send(dest, packed, threadId) {
    try { return await this.messenger.rpc('send', { dest, packed, threadId }); }
    catch (e) { return 'unknown-error'; }
  }

  // Convenience: boolean wrappers mapping RouterResult to success boolean
  async sendOk(dest, packed, threadId) {
    const res = await this.send(dest, packed, threadId);
    return isRouterSuccess(res);
  }

  async registerAddressOk(did) {
    const res = await this.registerAddress(did);
    return isRouterSuccess(res);
  }

  // DID operation helpers
  async getDIDOk() {
    const result = await this.getDID();
    return isDIDSuccess(result);
  }

  // Message operation helpers
  async packOk(dest, type, bodyJson, attachments = [], replyTo = "") {
    const result = await this.pack(dest, type, bodyJson, attachments, replyTo);
    return isMessageOpSuccess(result);
  }

  async unpackOk(raw) {
    const result = await this.unpack(raw);
    return isMessageOpSuccess(result);
  }

  // Universal helpers
  isLastOperationSuccess(result) {
    return isSuccess(result);
  }

  getLastError(result) {
    return getErrorMessage(result);
  }

  onMessage(cb) {
    if (typeof cb !== 'function') throw new TypeError('onMessage callback must be a function.');
    const handler = (e) => { if (e && e.data && e.data.kind === 'incoming') cb(e.data.raw); };
    navigator.serviceWorker.addEventListener('message', handler);
    return () => navigator.serviceWorker.removeEventListener('message', handler);
  }
}

export { createProtocolHelpers } from './protocols.js';
export { createPermissionHelpers } from './permissions.js';
export { isRouterSuccess } from '../utils/response-helpers.js';
