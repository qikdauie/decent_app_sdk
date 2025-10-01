### Getting Started

Introduction

The Decent Application SDK helps web apps use DIDComm v2 with a client API and a Service Worker runtime. This guide walks you from a blank page to sending and receiving messages.

Prerequisites

- JavaScript/ESM basics
- Service Workers (registration, scope, lifecycle)
- DIDComm basics (message types, `~thread`)

Installation (Preferred: Git Submodule)

Installation via Git Submodule

- Adding as a Submodule (to an existing project):

```bash
git submodule add <repository-url> path/to/decent_app_sdk
```

- Cloning with Submodules:

```bash
git clone --recurse-submodules <your-repo-url>
```

- Initializing Submodules (after a regular clone):

```bash
git submodule init && git submodule update
```

- Updating Submodules:

```bash
git submodule update --remote --merge
```

- Building the SDK (when using as a submodule):

```bash
cd path/to/decent_app_sdk && npm install && npm run build
```

Importing when using as a submodule

When using the submodule, import from the built `dist/` outputs:

```js
import { DecentClient } from './path/to/decent_app_sdk/dist/client/index.js';
import { initServiceWorker } from './path/to/decent_app_sdk/dist/service-worker/index.js';
```

 

Your First App

Project structure:

```
public/
  index.html
  sw.js
src/
  app.js
```

1) Service Worker: `public/sw.js`

```js
import { initServiceWorker } from 'decent_app_sdk/service-worker';

initServiceWorker({ builtInProtocols: true });
```

2) HTML: `public/index.html`

```html
<!doctype html>
<html>
  <body>
    <button id="init">Init SDK</button>
    <pre id="out"></pre>
    <script type="module" src="/src/app.js"></script>
  </body>
  </html>
```

3) App: `src/app.js`

```js
import { getReadyDecentClient } from 'decent_app_sdk';

document.querySelector('#init').addEventListener('click', async () => {
  const out = document.querySelector('#out');
  try {
    const sdk = await getReadyDecentClient({ serviceWorkerUrl: '/sw.js' });
    out.textContent = 'SDK ready\n';
    const did = await sdk.getDID();
    out.textContent += 'DID: ' + JSON.stringify(did) + '\n';
  } catch (e) {
    out.textContent += 'Error: ' + String(e?.message || e);
  }
});
```

Receiving Messages

```js
const sdk = await getReadyDecentClient({ serviceWorkerUrl: '/sw.js' });
const unsubscribe = sdk.onMessage((raw) => {
  console.log('incoming', raw);
});
// Later: unsubscribe()
```

Working with Protocols

- Use built-ins via `sdk.protocols['basic-message-v2']`, `['user-profile-v1']`, `['trust-ping-v2']`, etc.
- Discover features: `await sdk.protocols.discover(['*'])`
- Invoke client methods directly: `await sdk.protocols['trust-ping-v2'].pingAndWait(did, { timeoutMs: 3000 })`

Delivery Strategies

- broadcast: forward all inbound messages to window clients
- thread: target replies to the originating client using DIDComm `thid` (requires autoUnpack)

Next Steps

- See `docs/api-reference.md` for detailed APIs
- Explore `examples/` for runnable samples
- Learn protocol development in `docs/protocol-development-guide.md`



