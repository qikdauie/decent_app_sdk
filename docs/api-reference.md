# API Reference

## Table of Contents

- [DecentClient](#decentclient)
- [Dynamic Protocol Helpers](#dynamic-protocol-helpers)
- [Permissions Helpers](#permissions-helpers)
- [Service Worker RPC Contract](#service-worker-rpc-contract)
- [Attachments](#attachments)
- [initServiceWorker](#initserviceworker)
- [Thread-based Matching](#thread-based-matching)
- [Error Handling](#error-handling)
- [Type Definitions](#type-definitions)

---

## DecentClient

The main client class for interacting with the Decent Application SDK.

### Constructor

```ts
new DecentClient(options?: {
  serviceWorkerUrl?: string;
  readinessTimeoutMs?: number;  // default 8000
  rpcTimeoutMs?: number;        // default 60000
})
```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `ready` | `Promise<void>` | Resolves when the SDK is connected to the Service Worker |

> [!NOTE]
> The `ready` promise is crucial for ensuring the SDK is properly initialized before making any API calls. Always await this promise before invoking methods.

### Methods

| Method | Parameters | Return Type | Description |
|--------|------------|-------------|-------------|
| `getDID()` | None | `Promise<{ success: boolean; did: string; did_document?: any; public_key?: string; error?: string }>` | Get the current DID and associated information |
| `registerAddress(did)` | `did: string` | `Promise<string>` | Register a DID address (RouterResult) |
| `send(dest, packed, threadId?)` | `dest: string, packed: any, threadId?: string` | `Promise<string>` | Send a packed message (RouterResult) |
| `sendOk(dest, packed, threadId?)` | `dest: string, packed: any, threadId?: string` | `Promise<boolean>` | Send a packed message, returns boolean success |
| `pack(dest, type, bodyJson, attachments?, replyTo?)` | `dest: string, type: string, bodyJson: any, attachments?: any[], replyTo?: string` | `Promise<{ success: boolean; message?: string; thid?: string; error?: string }>` | Pack a message for sending |
| `unpack(raw)` | `raw: any` | `Promise<{ success: boolean; message?: string; error?: string }>` | Unpack a received message |
| `packOk(...)` | Same as `pack` | `Promise<boolean>` | Pack a message, returns boolean success |
| `unpackOk(...)` | Same as `unpack` | `Promise<boolean>` | Unpack a message, returns boolean success |
| `getDIDOk()` | None | `Promise<boolean>` | Get DID, returns boolean success |
| `isLastOperationSuccess(result)` | `result: any` | `boolean` | Check if the last operation was successful |
| `getLastError(result)` | `result: any` | `string \| null` | Get the last error message |
| `onMessage(cb)` | `cb: (raw: any) => void` | `() => void` | Subscribe to incoming messages (returns unsubscribe function) |

### Examples

**Basic SDK initialization and usage:**

```js
const sdk = new DecentClient({ serviceWorkerUrl: '/sw.js' });
await sdk.ready;
const did = await sdk.getDID();
const packed = await sdk.pack('did:peer:xyz', 'https://didcomm.org/test/1.0/ping', JSON.stringify({}));
await sdk.send('did:peer:xyz', packed.message, packed.thid);
```

---

## Dynamic Protocol Helpers

Dynamic protocol helpers provide access to built-in and custom protocols through a unified interface.

### Methods

| Method | Parameters | Return Type | Description |
|--------|------------|-------------|-------------|
| `protocols.refresh()` | None | `Promise<string[]>` | Refresh available protocols and return list of IDs |
| `protocols.list()` | None | `string[]` | Get list of currently available protocol IDs |
| `protocols.has(protocolId)` | `protocolId: string` | `boolean` | Check if a specific protocol is available |
| `protocols[protocolId][method](...args)` | `...args: any[]` | `Promise<any>` | Invoke a method on a specific protocol |
| `protocols.advertise(featureType, id, roles?)` | `featureType: string, id: string, roles?: string[]` | `Promise<boolean>` | Advertise a feature for discovery |
| `protocols.discover(matchers, timeoutMs?)` | `matchers: string[], timeoutMs?: number` | `Promise<{ ok: boolean; result?: Record<string, any[]>; error?: string }>` | Discover available features |

### App-Intents Convenience Methods

| Method | Parameters | Return Type | Description |
|--------|------------|-------------|-------------|
| `protocols.intents.advertise(actionOrRequestType, roles?)` | `actionOrRequestType: string, roles?: string[]` | `Promise<boolean>` | Advertise an app intent |
| `protocols.intents.discover(matchers?, timeoutMs?)` | `matchers?: string[], timeoutMs?: number` | `Promise<{ ok: boolean; result?: Record<string, any[]>; error?: string }>` | Discover available app intents |
| `protocols.intents.request(dest, body, opts?)` | `dest: string, body: any, opts?: { requestType: string; timeout?: number; waitForResult?: boolean }` | `Promise<{ ok: boolean; response?: any; declined?: boolean; error?: string }>` | Send an app intent request |

### Examples

**Discovering and using protocols:**

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

### Availability and Proxy Pattern

- After `protocols.refresh()`, helpers are attached under `sdk.protocols[protocolId]`
- Use `protocols.has(id)` or `protocols.list()` to check availability
- Feature discovery is exposed under the `discover-features-v2` helper: `sdk.protocols['discover-features-v2'].discover(...)`

> [!IMPORTANT]
> App Intents are accessed via `sdk.protocols.intents.*` convenience methods; there is **no** `sdk.protocols.appIntents`.

---

## Permissions Helpers

Manage protocol and message type permissions for your application.

### Methods

| Method | Parameters | Return Type | Description |
|--------|------------|-------------|-------------|
| `permissions.check(protocolUri, messageTypeUri)` | `protocolUri: string, messageTypeUri: string` | `Promise<boolean>` | Check if a specific permission is granted |
| `permissions.checkMultiple(protocolUris, messageTypeUris)` | `protocolUris: string[], messageTypeUris: string[]` | `Promise<boolean[]>` | Check multiple permissions at once |
| `permissions.request(requests)` | `requests: Array<{ protocolUri: string; protocolName?: string; description?: string; messageTypes: Array<{ typeUri: string; description?: string }> }>` | `Promise<any>` | Request permissions from the user |
| `permissions.requestOk(requests)` | Same as `request` | `Promise<boolean>` | Request permissions, returns boolean success |
| `permissions.getRequestError(requests)` | Same as `request` | `Promise<string \| null>` | Get error message from permission request |
| `permissions.listGranted(protocolUris)` | `protocolUris: string[]` | `Promise<any[]>` | List currently granted permissions |

---

## Service Worker RPC Contract

The Service Worker communicates with the client via `MessageChannel` using a structured RPC protocol.

### Request Format

Requests are sent with `{ kind, data }` structure. Responses are either `{ ok: true, ... }` or `{ ok: false, error }`.

### Supported RPC Kinds

| Kind | Purpose | Data Structure |
|------|---------|----------------|
| `getProtocolMethods` | Get available protocol methods | None |
| `protocolInvoke` | Invoke a protocol method | `{ protocolId, method, args, timeout }` |
| `getDID` | Get current DID | None |
| `packMessage` | Pack a message for sending | `{ dest, type, body, attachments?, replyTo? }` |
| `unpackMessage` | Unpack a received message | `{ raw }` |
| `send` | Send a packed message | `{ dest, packed, threadId? }` |
| `discover` | Discover features | Discovery parameters |
| `advertise` | Advertise features | Advertisement parameters |
| `intentAdvertise` | Advertise app intents | Intent advertisement parameters |
| `intentDiscover` | Discover app intents | Intent discovery parameters |
| `intentRequest` | Send app intent request | Intent request parameters |

### Permission RPC Kinds

| Kind | Purpose |
|------|---------|
| `checkDidcommPermission` | Check single permission |
| `checkMultipleDidcommPermissions` | Check multiple permissions |
| `requestDidcommPermissions` | Request permissions |
| `listGrantedDidcommPermissions` | List granted permissions |

---

## Attachments

Attachments allow you to include files and media in your DIDComm messages.

### Canonical Format

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | Unique identifier for the attachment |
| `mimeType` | `string` | Yes | MIME type of the content |
| `filename` | `string` | No | Original filename |
| `description` | `string` | No | Human-readable description |
| `data` | `string` | No | Base64-encoded data or stringified JSON |
| `externalUrl` | `string` | No | URL to external content (implies `isExternal=true`) |
| `isExternal` | `boolean` | No | Whether the content is external |

### Examples

**Image attachment:**
```js
{ 
  id: 'photo-1', 
  mimeType: 'image/jpeg', 
  filename: 'photo.jpg', 
  data: 'base64...' 
}
```

**Audio attachment:**
```js
{ 
  id: 'audio-1', 
  mimeType: 'audio/mpeg', 
  filename: 'song.mp3', 
  data: 'base64...' 
}
```

**External document:**
```js
{ 
  id: 'doc-1', 
  mimeType: 'application/pdf', 
  filename: 'file.pdf', 
  externalUrl: 'https://example.org/file.pdf' 
}
```

> [!NOTE]
> Legacy compatibility: `mime_type`, nested `data.base64`, `url`, `links` are accepted and normalized to the canonical format.

---

## initServiceWorker

Initialize the Service Worker with configuration options.

### Configuration

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

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `builtInProtocols` | `boolean \| { [key: string]: boolean }` | `true` | Enable built-in protocols or configure specific ones |
| `autoUnpack` | `boolean` | `true` | Automatically unpack incoming messages |
| `deliveryStrategy` | `'broadcast' \| 'thread'` | `'broadcast'` | Message delivery strategy |
| `appIntents.router` | `{ onRequest?: Function; onCancel?: Function }` | `undefined` | App intent router handlers |
| `appIntents.roles` | `string[]` | `['provider']` | App intent roles |
| `appIntents.advertise` | `boolean` | `undefined` | Whether to advertise app intents |

> [!WARNING]
> `thread` delivery requires `autoUnpack=true`; if not set, it will be enforced automatically.

> [!NOTE]
> Provide router handlers as functions; invalid handlers are ignored with warnings.

---

## Thread-based Matching

Thread-based matching enables request/response correlation using DIDComm thread IDs.

### Key Concepts

- When present, `thid` is used to correlate request/response pairs
- Request/response helpers accept `timeout`/`timeoutMs` to bound waits
- Thread IDs are automatically generated for outgoing messages and preserved in responses

---

## Error Handling

The SDK provides structured error handling with both low-level and convenience APIs.

### Error Handling Patterns

**Structured Results:**
- Low-level APIs return structured results with `success`/`ok` fields
- Use `isLastOperationSuccess(result)` and `getLastError(result)` helpers
- Convenience `...Ok` helpers map to booleans for simpler usage

**Recommended Pattern:**
```js
const packed = await app.pack(dest, type, body);
if (!packed.success) throw new Error(packed.error || 'pack failed');
const ok = await app.sendOk(dest, packed.message, packed.thid);
```

> [!TIP]
> Use the convenience `...Ok` helpers when you only need boolean success/failure, or structured results when you need detailed error information.

---

## Type Definitions

TypeScript declaration files are published under `src/types/*.d.ts` and referenced via package exports. These provide full type safety for all SDK APIs and configuration options.
