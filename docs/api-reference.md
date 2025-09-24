### API Reference

#### DecentApp
- new DecentApp(options)
- ready: Promise<void>
- getDID(): Promise<PeerDIDResult>
- pack(dest, type, bodyJson, attachments?, replyTo?): Promise<MessageOpResult>
- unpack(raw): Promise<MessageOpResult>
- send(dest, packed, threadId?): Promise<RouterResult>
- sendOk(dest, packed, threadId?): Promise<boolean>
- registerAddress(did): Promise<RouterResult>
- registerAddressOk(did): Promise<boolean>
- getDIDOk(): Promise<boolean>
- packOk(...): Promise<boolean>
- unpackOk(...): Promise<boolean>
- isLastOperationSuccess(result): boolean
- getLastError(result): string | null
- onMessage(cb): () => void

#### Protocol helpers
- protocols.discover(matchers, timeout?): Promise<{ ok: boolean, result?: Record<string, any[]>, error?: string }>
- protocols.advertise(featureType, id, roles?): Promise<boolean>
- protocols.discoverOk(matchers, timeout?): Promise<boolean>
- protocols.getDiscoverError(matchers, timeout?): Promise<string | null>
- protocols.intents.advertise(actionOrRequestType, roles?): Promise<boolean>
- protocols.intents.discover(matchers?, timeout?): Promise<{ ok: boolean, result?: Record<string, any[]>, error?: string }>
- protocols.intents.request(dest, requestBody, opts?): Promise<{ ok: boolean, result?: any, error?: string }>
- protocols.intents.requestOk(...): Promise<boolean>
- protocols.intents.getRequestError(...): Promise<string | null>

#### Permissions helpers
- permissions.check(protocolUri, messageTypeUri): Promise<boolean>
- permissions.checkMultiple(protocolUris, messageTypeUris): Promise<boolean[]>
- permissions.request(requests): Promise<ProtocolPermissionResult>
- permissions.requestOk(requests): Promise<boolean>
- permissions.getRequestError(requests): Promise<string | null>
- permissions.listGranted(protocolUris): Promise<DIDCommProtocolPermission[]>


### Service Worker RPC Contract

All RPCs are invoked via `MessageChannel` to the Service Worker. Each request includes `{ kind, data }` and a `port` for replies. Every response uses one of the two shapes:
- Success: `{ ok: true, ...payload }`
- Failure: `{ ok: false, error: string, ...extra }`

Supported kinds and payloads:

- getDID():
  - Request: `{ kind: 'getDID' }`
  - Response: `{ ok: true, did: string }`

- packMessage({ dest, type, body, attachments?, replyTo? }):
  - Request: `{ kind: 'packMessage', data: { dest, type, body, attachments, replyTo } }`
  - Response: environment-dependent (pass-through), typically `{ success: boolean, message?: string, error?: string }`

  

- unpackMessage({ raw }):
  - Request: `{ kind: 'unpackMessage', data: { raw } }`
  - Response: environment-dependent (pass-through)

- send({ dest, packed, threadId? }):
  - Request: `{ kind: 'send', data: { dest, packed, threadId? } }`
  - Response: RouterResult (string), typically `'success' | ...`

- discover({ matchers, timeout }):
  - Request: `{ kind: 'discover', data: { matchers, timeout } }`
  - Response: `{ ok: true, result: Record<string, Feature[]> }`

- advertise({ featureType, id, roles }):
  - Request: `{ kind: 'advertise', data: { featureType, id, roles } }`
  - Response: `{ ok: true }`

- intentAdvertise({ action | requestType, roles }):
  - Request: `{ kind: 'intentAdvertise', data: { action?, requestType?, roles? } }`
  - Response: `{ ok: true }`

- intentDiscover({ matchers, timeout }):
  - Request: `{ kind: 'intentDiscover', data: { matchers, timeout } }`
  - Response: `{ ok: true, result: Record<string, IntentProvider[]> }`

- intentRequest({ dest, requestBody, waitForResult, timeout, requestType? }):
  - Request: `{ kind: 'intentRequest', data: { dest, requestBody, waitForResult?, timeout?, requestType } }`
  - Response: `{ ok: true, response?: Envelope, declined?: boolean }`
  - Note: when an intent is declined by the provider, `declined` will be `true` and `response` will contain the decline envelope (`type: 'https://didcomm.org/app-intent/1.0/decline'`).
  - Note: requestType is required and cannot be inferred automatically due to current packMessage limitations.

- Permissions:
  - checkDidcommPermission({ protocolUri, messageTypeUri }) → `{ ok: true, granted: boolean }`
  - checkMultipleDidcommPermissions({ protocolUris, messageTypeUris }) → `{ ok: true, results: boolean[] }`
  - requestDidcommPermissions({ requests }) → `{ ok: true, result: any }`
  - listGrantedDidcommPermissions({ protocolUris }) → `{ ok: true, list: any[] }`

Delivery event fan-out:
- The Service Worker forwards inbound messages to controlled window clients as `postMessage({ kind: 'incoming', raw })`.
- When configured with `deliveryStrategy: 'thread'`, the Service Worker targets delivery to the originating client based on DIDComm thread IDs. This requires `autoUnpack=true`.

### initServiceWorker(config)

Configuration options:
- autoUnpack?: boolean = true
  - When true, inbound delivery events are automatically unpacked and routed to protocols.
  - When false, raw messages are forwarded; protocols receive raw payloads.
- deliveryStrategy?: 'broadcast' | 'thread' = 'broadcast'
  - 'broadcast': forward inbound messages to all clients (default).
  - 'thread': target messages back to the originating client based on DIDComm `~thread` IDs.
  - Constraint: 'thread' requires `autoUnpack=true`. If configured otherwise, the SDK automatically enables `autoUnpack` and logs a warning.
 - appIntents?:
   - router?: { onRequest?: Function, onCancel?: Function }
   - roles?: string[]
   - advertise?: boolean
   - When provided, the app-intents protocol will use your router handlers. Ensure handlers are functions.

Examples:

```js
// Thread-based targeted delivery (autoUnpack enabled automatically if needed)
initServiceWorker({ builtInProtocols: true, deliveryStrategy: 'thread', autoUnpack: false });
// Logs a warning and forces autoUnpack=true.

// Raw delivery without auto-unpacking using broadcast
initServiceWorker({ builtInProtocols: true, deliveryStrategy: 'broadcast', autoUnpack: false });

// App-intents with custom router handlers
initServiceWorker({
  builtInProtocols: true,
  appIntents: {
    router: {
      async onRequest(envelope) {
        // Decide and return outcome
        return { accept: true, result: { ok: true } };
      },
      onCancel(envelope) {
        // Handle cancellation
      }
    }
  }
});
```

### Intent request/response correlation

- TODO: Remove this section once packMessage returns thread ID
- Currently, correlation is implemented using a custom `_correlationId` embedded in request bodies and echoed by responses. The service worker will match responses to pending requests using this ID when `waitForResult=true`.
- Timeout behavior: `intentRequest` accepts `timeout` (ms), default 5000. If no response is matched in time, the promise rejects with a timeout error.

Error handling and return types

- Many APIs provide both raw and convenience variants (`...Ok`, `get...Error`).
- Raw variants typically return objects with `{ ok: boolean, ... }` or IDL-shaped results with `{ success: boolean, ... }`.
- Convenience variants map to `boolean` success or return extracted error messages.

Configuration options defaults

- `autoUnpack`: default `true`
- `deliveryStrategy`: default `'broadcast'`
- `appIntents.roles`: default `['provider']`


