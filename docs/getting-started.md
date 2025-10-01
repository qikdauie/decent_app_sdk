# Getting Started

## Introduction

The **Decent Application SDK** helps web apps use DIDComm v2 with a client API and a Service Worker runtime. This guide walks you from a blank page to sending and receiving messages.

---

## Prerequisites

- **JavaScript/ESM basics** - Modern JavaScript with ES modules
- **Service Workers** - Registration, scope, and lifecycle understanding
- **DIDComm basics** - Message types, `thid` threading, and protocol concepts

---

## Installation

### Installation Methods

| Method | Command | Use Case | Pros/Cons |
|--------|---------|----------|-----------|
| **Adding as Submodule** | `git submodule add <repository-url> path/to/decent_app_sdk` | Existing project | ✅ Version control, ❌ Requires build step |
| **Cloning with Submodules** | `git clone --recurse-submodules <your-repo-url>` | New project | ✅ Complete setup, ❌ Requires build step |
| **Initializing Submodules** | `git submodule init && git submodule update` | After regular clone | ✅ Updates existing, ❌ Manual step |
| **Updating Submodules** | `git submodule update --remote --merge` | Keeping current | ✅ Latest changes, ❌ May break compatibility |

### Git Submodule Installation

**Step 1: Add as Submodule (to an existing project):**
```bash
git submodule add <repository-url> path/to/decent_app_sdk
```

**Step 2: Cloning with Submodules:**
```bash
git clone --recurse-submodules <your-repo-url>
```

**Step 3: Initializing Submodules (after a regular clone):**
```bash
git submodule init && git submodule update
```

**Step 4: Updating Submodules:**
```bash
git submodule update --remote --merge
```

**Step 5: Building the SDK (when using as a submodule):**
```bash
cd path/to/decent_app_sdk && npm install && npm run build
```

> [!IMPORTANT]
> When using as a submodule, you must build the SDK before importing. The build step creates the necessary `dist/` files.

### Importing from Submodule

When using the submodule, import from the built `dist/` outputs:

```js
import { DecentClient } from './path/to/decent_app_sdk/dist/client/index.js';
import { initServiceWorker } from './path/to/decent_app_sdk/dist/service-worker/index.js';
```

---

## Your First App

### Project Structure

```
public/
  index.html
  sw.js
src/
  app.js
```

### Step 1: Service Worker

Create `public/sw.js`:

```js
import { initServiceWorker } from 'decent_app_sdk/service-worker';

initServiceWorker({ builtInProtocols: true });
```

> [!NOTE]
> Service Workers are background scripts that run independently of your web page. They're required for the SDK to handle DIDComm messages and protocol routing.

### Step 2: HTML Page

Create `public/index.html`:

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

### Step 3: Application Code

Create `src/app.js`:

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

> [!TIP]
> Use `getReadyDecentClient` helper instead of manual `await sdk.ready` for simpler initialization.

---

## Receiving Messages

**Setting up message listeners:**

```js
const sdk = await getReadyDecentClient({ serviceWorkerUrl: '/sw.js' });
const unsubscribe = sdk.onMessage((raw) => {
  console.log('incoming', raw);
});
// Later: unsubscribe()
```

---

## Working with Protocols

### Built-in Protocols

Use built-in protocols via the `protocols` namespace:

- `sdk.protocols['basic-message-v2']` - Simple messaging
- `sdk.protocols['user-profile-v1']` - Profile sharing
- `sdk.protocols['trust-ping-v2']` - Liveness testing

### Feature Discovery

Discover available capabilities:

```js
await sdk.protocols.discover(['*']);
```

### Protocol Methods

Invoke client methods directly:

```js
await sdk.protocols['trust-ping-v2'].pingAndWait(did, { timeoutMs: 3000 });
```

---

## Delivery Strategies

### Broadcast Strategy

- **Pattern**: Forward all inbound messages to window clients
- **Use case**: Simple applications, development
- **Configuration**: `deliveryStrategy: 'broadcast'` (default)

### Thread Strategy

- **Pattern**: Target replies to the originating client using DIDComm `thid`
- **Use case**: Multi-client applications, request/response patterns
- **Configuration**: `deliveryStrategy: 'thread'`

> [!WARNING]
> Thread delivery requires `autoUnpack=true`; if not set, it will be enforced automatically.

> [!TIP]
> Use **broadcast** for simple apps and **thread** for complex multi-client scenarios.

---

## Next Steps

| Topic | Document | What You'll Learn |
|-------|----------|-------------------|
| **API Reference** | `docs/api-reference.md` | Detailed API documentation and examples |
| **Built-in Protocols** | `docs/built-in-protocols.md` | Available protocols and their usage |
| **Framework Integration** | `docs/framework-integration.md` | React, Vue, Angular, and other frameworks |
| **Protocol Development** | `docs/protocol-development-guide.md` | Creating custom protocols |
| **Examples** | `examples/` | Runnable sample applications |

> [!WARNING]
> HTTPS is required for Service Workers outside of localhost. Make sure your production environment uses HTTPS.



