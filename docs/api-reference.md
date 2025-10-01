### API Reference

Table of Contents

- DecentClient
- Dynamic Protocol Helpers
- Permissions Helpers
- Service Worker RPC Contract
- Attachments
- initServiceWorker
- Thread-based Matching
- Error Handling
- Type Definitions

DecentClient

Constructor

```ts
new DecentClient(options?: {
  serviceWorkerUrl?: string;
  readinessTimeoutMs?: number;  // default 8000
  rpcTimeoutMs?: number;        // default 60000
})
```

Properties

- `ready: Promise<void>` — resolves when the SDK is connected to the Service Worker

Methods

```ts
getDID(): Promise<{ success: boolean; did: string; did_document?: any; public_key?: string; error?: string }>
registerAddress(did: string): Promise<string> // RouterResult
send(dest: string, packed: any, threadId?: string): Promise<string> // RouterResult
sendOk(dest: string, packed: any, threadId?: string): Promise<boolean>
pack(dest: string, type: string, bodyJson: any, attachments?: any[], replyTo?: string): Promise<{ success: boolean; message?: string; thid?: string; error?: string }>
unpack(raw: any): Promise<{ success: boolean; message?: string; error?: string }>
packOk(...): Promise<boolean>
unpackOk(...): Promise<boolean>
getDIDOk(): Promise<boolean>
isLastOperationSuccess(result: any): boolean
getLastError(result: any): string | null
onMessage(cb: (raw: any) => void): () => void // unsubscribe
```

Examples

```js
const sdk = new DecentClient({ serviceWorkerUrl: '/sw.js' });
await sdk.ready;
const did = await sdk.getDID();
const packed = await sdk.pack('did:peer:xyz', 'https://didcomm.org/test/1.0/ping', JSON.stringify({}));
await sdk.send('did:peer:xyz', packed.message, packed.thid);
```

Dynamic Protocol Helpers

```ts
protocols.refresh(): Promise<string[]>
protocols.list(): string[]
protocols.has(protocolId: string): boolean
protocols[protocolId][method](...args: any[]): Promise<any>
protocols.advertise(featureType: string, id: string, roles?: string[]): Promise<boolean>
protocols.discover(matchers: string[], timeoutMs?: number): Promise<{ ok: boolean; result?: Record<string, any[]>; error?: string }>
// App-Intents convenience
protocols.intents.advertise(actionOrRequestType: string, roles?: string[]): Promise<boolean>
protocols.intents.discover(matchers?: string[], timeoutMs?: number): Promise<{ ok: boolean; result?: Record<string, any[]>; error?: string }>
protocols.intents.request(dest: string, body: any, opts?: { requestType: string; timeout?: number; waitForResult?: boolean }): Promise<{ ok: boolean; response?: any; declined?: boolean; error?: string }>
```

Examples

```js
await sdk.protocols.refresh();
const available = sdk.protocols.list();

// Feature discovery via per-protocol helper
const df = await sdk.protocols['discover-features-v2'].discover(['*'], 500);

// Trust Ping via per-protocol helper
const ok = await sdk.protocols['trust-ping-v2'].ping('did:all:all', { comment: 'hello' });

// App Intents via the intents facade (no protocols.appIntents)
const intent = await sdk.protocols.intents.request(
  'did:all:all',
  { example: true },
  { requestType: 'https://didcomm.org/app-intent/1.0/example-request', timeout: 3000 }
);
```

Availability and Proxy Pattern

- After `protocols.refresh()`, helpers are attached under `sdk.protocols[protocolId]`.
- Use `protocols.has(id)` or `protocols.list()` to check availability.
- Feature discovery is exposed under the `discover-features-v2` helper: `sdk.protocols['discover-features-v2'].discover(...)`.
- App Intents are accessed via `sdk.protocols.intents.*` convenience methods; there is no `sdk.protocols.appIntents`.

Permissions Helpers

```ts
permissions.check(protocolUri: string, messageTypeUri: string): Promise<boolean>
permissions.checkMultiple(protocolUris: string[], messageTypeUris: string[]): Promise<boolean[]>
permissions.request(requests: Array<{ protocolUri: string; protocolName?: string; description?: string; messageTypes: Array<{ typeUri: string; description?: string }> }>): Promise<any>
permissions.requestOk(requests: ...): Promise<boolean>
permissions.getRequestError(requests: ...): Promise<string | null>
permissions.listGranted(protocolUris: string[]): Promise<any[]>
```

Service Worker RPC Contract

Requests are sent via `MessageChannel` with `{ kind, data }`. Responses are `{ ok: true, ... }` or `{ ok: false, error }`.

Supported kinds include:

- `getProtocolMethods`
- `protocolInvoke({ protocolId, method, args, timeout })`
- `getDID`
- `packMessage({ dest, type, body, attachments?, replyTo? })` — may include `thid`
- `unpackMessage({ raw })`
- `send({ dest, packed, threadId? })`
- `discover`, `advertise`, `intentAdvertise`, `intentDiscover`, `intentRequest`
- Permissions: `checkDidcommPermission`, `checkMultipleDidcommPermissions`, `requestDidcommPermissions`, `listGrantedDidcommPermissions`

Attachments

Canonical format

```ts
{
  id: string;
  mimeType: string;
  filename?: string;
  description?: string;
  data?: string;        // base64 or stringified JSON
  externalUrl?: string; // when provided, isExternal=true is implied
  isExternal?: boolean;
}
```

Examples

```js
{ id: 'photo-1', mimeType: 'image/jpeg', filename: 'photo.jpg', data: 'base64...' }
{ id: 'audio-1', mimeType: 'audio/mpeg', filename: 'song.mp3', data: 'base64...' }
{ id: 'doc-1', mimeType: 'application/pdf', filename: 'file.pdf', externalUrl: 'https://example.org/file.pdf' }
```

Legacy compatibility: `mime_type`, nested `data.base64`, `url`, `links` are accepted and normalized.

initServiceWorker

```ts
initServiceWorker(config?: {
  builtInProtocols?: boolean | { [key: string]: boolean };
  autoUnpack?: boolean;            // default true
  deliveryStrategy?: 'broadcast' | 'thread'; // default 'broadcast'
  appIntents?: {
    router?: { onRequest?: Function; onCancel?: Function };
    roles?: string[];              // default ['provider']
    advertise?: boolean;
  };
})
```

Notes

- `thread` delivery requires `autoUnpack=true`; if not set, it will be enforced.
- Provide router handlers as functions; invalid handlers are ignored with warnings.

Thread-based Matching

- When present, `thid` is used to correlate request/response pairs.
- Request/response helpers accept `timeout`/`timeoutMs` to bound waits.

Error Handling

- Low-level APIs return structured results; use `isLastOperationSuccess(result)` and `getLastError(result)`.
- Convenience `...Ok` helpers map to booleans.
- Recommended pattern:

```js
const packed = await app.pack(dest, type, body);
if (!packed.success) throw new Error(packed.error || 'pack failed');
const ok = await app.sendOk(dest, packed.message, packed.thid);
```

Type Definitions

- TypeScript declaration files are published under `src/types/*.d.ts` and referenced via package exports.
