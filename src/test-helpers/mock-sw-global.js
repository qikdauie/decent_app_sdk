export function createSdkMockServiceWorkerGlobal(options = {}) {
  const {
    overrides = {},
    packFailsOnce = false,
    packErrorMessage = 'pack failed (simulated)',
    unpackReturns = null,
    sendResult = 'success',
  } = options || {};

  const listeners = { delivery: [], message: [], 'rpc-delivery': [] };
  const windowClients = [];
  const fakeClient = (id) => ({ id: String(id), messages: [], postMessage(m) { this.messages.push(m); } });
  windowClients.push(fakeClient('sdk-c1'));
  windowClients.push(fakeClient('sdk-c2'));

  let packFailBudget = packFailsOnce ? 1 : 0;

  const selfMock = {
    addEventListener(type, fn) { (listeners[type] || (listeners[type] = [])).push(fn); },
    clients: { async matchAll() { return windowClients; } },
    async packMessage(dest, type, bodyJson, attachments = [], replyTo = "") {
      if (packFailBudget > 0) {
        packFailBudget -= 1;
        return { success: false, error_code: 1, error: String(packErrorMessage), message: '' };
      }
      try {
        const parsed = typeof bodyJson === 'string' ? JSON.parse(bodyJson) : bodyJson;
        const thid = parsed?.thid || parsed?.['~thread']?.thid || 'thr-sdk';
        return { success: true, error_code: 0, error: '', message: JSON.stringify({ dest, type, body: parsed, thid, attachments, reply_to: replyTo }), thid };
      } catch (e) {
        return { success: false, error_code: -1, error: String(e), message: '' };
      }
    },
    async unpackMessage(raw) {
      if (unpackReturns) return unpackReturns;
      try { return { success: true, error_code: 0, error: '', message: typeof raw === 'string' ? raw : JSON.stringify(raw) }; } catch (e) { return { success: false, error_code: -1, error: String(e), message: '' }; }
    },
    async sendMessage() { return sendResult; },
    getDID: async () => ({ success: true, error_code: 0, error: '', did: 'did:example:sdk', did_document: '{}', public_key: 'pk' }),
    checkDidcommPermission: async () => true,
    checkMultipleDidcommPermissions: async () => [true, false],
    requestDidcommPermissions: async () => ({ success: true, grantedPermissions: [], failedProtocols: [] }),
    listGrantedDidcommPermissions: async () => [],
    __listeners: listeners,
    __clients: windowClients,
  };

  Object.defineProperties(selfMock, {
    __dispatchDelivery: { value: (data) => { for (const fn of listeners.delivery) { try { fn({ data }); } catch {} } } },
    __dispatchMessage: { value: (payload) => { for (const fn of listeners.message) { try { fn({ data: payload, source: { id: 'sdk-client' } }); } catch {} } } },
    __dispatchRpcDelivery: { value: (envelope) => { for (const fn of listeners['rpc-delivery']) { try { fn({ data: envelope }); } catch {} } } },
  });

  Object.assign(selfMock, overrides);
  return selfMock;
}
