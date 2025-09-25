Decent Application SDK (JavaScript)

Overview

The Decent Application SDK is a JavaScript-first DIDComm v2 toolkit for the web. It provides:

- A browser-friendly client API (`DecentClient`) for common DID operations and messaging
- A Service Worker runtime with an RPC bridge, message delivery strategies, and protocol routing
- A pluggable protocol framework with helpers for feature discovery and app intents

This SDK is designed for modern web apps and PWAs and emphasizes clean separation of concerns, robust error handling, and clear APIs.

Installation

```bash
npm install decent_app_sdk
```

Quick Start

1) Add a Service Worker (sw.js):

```js
// sw.js
import { initServiceWorker } from 'decent_app_sdk/service-worker';

// Enable built-in protocols and default broadcast delivery
initServiceWorker({ builtInProtocols: true });
```

2) Register the Service Worker and use the client:

```js
// app.js
import { DecentClient } from 'decent_app_sdk';

// Register the Service Worker
await navigator.serviceWorker.register('/sw.js');

// Create the SDK client
const app = new DecentClient({ serviceWorkerUrl: '/sw.js' });

// Wait for the SDK to be ready
await app.ready;

// Get your Peer DID
const didRes = await app.getDID();
if (didRes.success) {
  console.log('DID:', didRes.did);
}

// Listen for incoming messages (unpacked when autoUnpack=true in SW)
const unsubscribe = app.onMessage((raw) => {
  console.log('incoming', raw);
});
```

Note on Service Worker registration

- The SDK will attempt to register the Service Worker if it is not already registered when the client initializes (via `MessengerClient`). Manual registration, as shown above, is optional but recommended to keep explicit control over registration timing, scope, and update lifecycle.

See also `examples/vanilla-javascript/app.js` for a minimal usage example.

API Reference

For complete APIs, see `docs/api-reference.md`.

- `DecentClient` methods for DID and messaging
- Protocol helpers (feature discovery, app intents)
- Permission helpers
- Response helpers and error formats

Service Worker Setup

The Service Worker is initialized via `initServiceWorker(config)` from `decent_app_sdk/service-worker`.

Key configuration options (defaults shown):

- `autoUnpack?: boolean = true`
  - When true, inbound delivery events are unpacked and routed to protocols.
  - When false, raw messages are forwarded to clients and protocols receive raw payloads.
- `deliveryStrategy?: 'broadcast' | 'thread' = 'broadcast'`
  - `broadcast`: forward inbound messages to all clients.
  - `thread`: target messages to the originating client based on DIDComm `~thread` IDs. Requires `autoUnpack=true`.
- `appIntents?: { router?: { onRequest?: Function, onCancel?: Function }, roles?: string[], advertise?: boolean }`
  - Provide custom handlers to process app-intents requests and cancellations.

Examples

- Broadcast delivery of raw messages:

```js
import { initServiceWorker } from 'decent_app_sdk/service-worker';
initServiceWorker({ builtInProtocols: true, deliveryStrategy: 'broadcast', autoUnpack: false });
```

- Thread-based targeted delivery (auto-unpack enforced):

```js
import { initServiceWorker } from 'decent_app_sdk/service-worker';
initServiceWorker({ builtInProtocols: true, deliveryStrategy: 'thread', autoUnpack: false });
// Logs a warning and forces autoUnpack=true
```

- App-intents with custom router handlers:

```js
import { initServiceWorker } from 'decent_app_sdk/service-worker';
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
    },
    roles: ['provider'],
    advertise: true
  }
});
```

Configuration and Defaults

See `docs/api-reference.md` for a complete list of RPC kinds and configuration defaults. The SDK validates handler shapes where applicable and logs warnings for invalid configurations.

Troubleshooting

- Ensure the Service Worker is registered and controlling the page before using the client API.
- If using `deliveryStrategy: 'thread'`, `autoUnpack` must be enabled.
- Some operations require both parties to support the same protocol versions and message types.
- For app-intents, a `requestType` is currently required due to thread ID limitations in `packMessage`.

Contributing

Contributions are welcome. Please open a pull request or file an issue with a clear description and, if possible, a minimal reproduction.

License

MIT


