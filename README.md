Decent Application SDK (JavaScript)

Table of Contents

- Overview
- Key Features
- Installation
- Quick Start
- Documentation
- Architecture
- Troubleshooting
- Examples
- Thread IDs and `packMessage`
- Browser Support
- Contributing
- License


Overview

The Decent Application SDK is a browser-first DIDComm v2 toolkit. It provides:

- A client-side API (`DecentClient`) for DID operations, packing/unpacking, and messaging
- A Service Worker runtime with RPC bridge, delivery strategies, and protocol routing
- A pluggable protocol framework with dynamic discovery, app-intents, and built-in protocols

This SDK targets modern web apps and PWAs and emphasizes a clean client/SW separation, robust error handling, and approachable APIs.

Key Features

- Browser-first DIDComm v2 implementation
- Service Worker–based message handling and delivery
- Built-in protocols (8): Discover Features, App Intents, Trust Ping, Basic Message 2.0, User Profile, Out-of-Band, Report Problem, Share Media
- Dynamic protocol registration and discovery helpers
- Permission system and helpers
- Broadcast and thread-based delivery strategies

Installation (Preferred: Git Submodule)

Installation via Git Submodule

Add this SDK to your repository as a Git submodule if you prefer vendoring the source:

- Adding as a submodule to an existing project:

```bash
git submodule add <repository-url> path/to/decent_app_sdk
```

- Cloning a project with submodules:

```bash
git clone --recurse-submodules <your-repo-url>
```

- Initializing submodules after a regular clone:

```bash
git submodule init && git submodule update
```

- Updating submodules to the latest upstream changes:

```bash
git submodule update --remote --merge
```

- Building the SDK when used as a submodule:

```bash
cd path/to/decent_app_sdk && npm install && npm run build
```

Importing when using as a submodule

When using the submodule directly in your app, import from the built `dist/` outputs:

```js
// Example submodule imports
import { DecentClient } from './path/to/decent_app_sdk/dist/client/index.js';
import { initServiceWorker } from './path/to/decent_app_sdk/dist/service-worker/index.js';
```

Notes

- Ensure the submodule is built (see build step above) before importing from `dist/`.

Notes

- ESM-only package. Use native `import` or a bundler with ESM support.
- When developing in this repo, examples may import from `src/*`. Consumers should use package exports.

Quick Start

1) Service Worker (`/sw.js`):

```js
import { initServiceWorker } from 'decent_app_sdk/service-worker';

initServiceWorker({ builtInProtocols: true });
```

2) Client:

```js
import { DecentClient } from 'decent_app_sdk';

await navigator.serviceWorker.register('/sw.js');

const app = new DecentClient({ serviceWorkerUrl: '/sw.js' });
await app.ready;

const did = await app.getDID();
console.log('DID:', did);

const unsubscribe = app.onMessage((raw) => {
  console.log('incoming', raw);
});
```

Documentation

- docs/getting-started.md
- docs/api-reference.md
- docs/built-in-protocols.md
- docs/protocol-development-guide.md
- docs/framework-integration.md
- docs/permissions-guide.md
- docs/security-guide.md
- docs/troubleshooting.md
- examples/README.md

Architecture

- Client ↔ Service Worker via `MessageChannel` RPC
- Protocol registry and routing in the Service Worker
- Delivery strategies: broadcast vs thread-based
- Dynamic protocol helpers attach client methods at runtime

Troubleshooting

See `docs/troubleshooting.md` for a comprehensive guide. Common fixes:
- Ensure the SW is registered and controlling the page before using the client
- For `deliveryStrategy: 'thread'`, `autoUnpack` is required
- Verify both peers support the same protocol versions
- If requests are denied by the Message Router or a custom DIDComm protocol is blocked, see `qikfox://flags`:
  - Allow Unlisted Origins in Message Router — `#message-router-allow-unlisted-origins`
  - Allow Custom DIDComm Protocols — `#didcomm-allow-custom-protocols`

Examples

See `examples/README.md` for an index and running instructions.

Thread IDs and `packMessage`

- When available, `packMessage` returns `thid` for correlating requests/responses
- Higher-level helpers propagate `thid` for routing and matching

Browser Support

- qikfox Browser is the only browser that currently supports this SDK.

Contributing

See development setup and guidelines in the repository. PRs welcome.

License

MIT


