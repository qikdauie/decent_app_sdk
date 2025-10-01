# Decent Application SDK (JavaScript)

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Documentation](#documentation)
- [Architecture](#architecture)
- [Troubleshooting](#troubleshooting)
- [Examples](#examples)
- [Thread IDs and `packMessage`](#thread-ids-and-packmessage)
- [Browser Support](#browser-support)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

The **Decent Application SDK** is a browser-first DIDComm v2 toolkit that provides:

- **Client-side API** (`DecentClient`) for DID operations, packing/unpacking, and messaging
- **Service Worker runtime** with RPC bridge, delivery strategies, and protocol routing
- **Pluggable protocol framework** with dynamic discovery, app-intents, and built-in protocols

This SDK targets modern web apps and PWAs and emphasizes a clean client/SW separation, robust error handling, and approachable APIs.

> [!NOTE]
> The SDK uses a client/Service Worker architecture where the client handles UI interactions and the Service Worker manages message routing and protocol execution.

## Key Features

### Core Capabilities

| Feature | Description |
|---------|-------------|
| **DIDComm v2 Implementation** | Browser-first implementation of DIDComm v2 messaging |
| **Service Worker Runtime** | Background message handling and protocol execution |
| **Built-in Protocols** | 8 ready-to-use protocols for common DIDComm operations |
| **Dynamic Protocol System** | Register and discover custom protocols at runtime |
| **Permission Management** | Granular permission system for protocol and message access |
| **Delivery Strategies** | Broadcast and thread-based message delivery options |

### Built-in Protocols

| Protocol | Version | Purpose |
|----------|---------|---------|
| **Discover Features** | 2.0 | Feature discovery and capability negotiation |
| **App Intents** | 1.0 | Cross-application intent-based communication |
| **Trust Ping** | 2.0 | Liveness testing and latency measurement |
| **Basic Message** | 2.0 | Simple text-based messaging |
| **User Profile** | 1.0 | Profile sharing and management |
| **Out-of-Band** | 2.0 | Connection invitation handling |
| **Report Problem** | 2.0 | Error reporting and handling |
| **Share Media** | 1.0 | Media and file sharing |

## Installation

### Installation Methods

| Method | Command | Use Case |
|--------|---------|----------|
| **Adding as Submodule** | `git submodule add <repository-url> path/to/decent_app_sdk` | Existing project
| **Cloning with Submodules** | `git clone --recurse-submodules <your-repo-url>` | New project
| **Initializing Submodules** | `git submodule init && git submodule update` | After regular clone
| **Updating Submodules** | `git submodule update --remote --merge` | Keeping current

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

### Importing from Submodule

When using the submodule, import from the built `dist/` outputs:

```js
// Example submodule imports
import { DecentClient } from './path/to/decent_app_sdk/dist/client/index.js';
import { initServiceWorker } from './path/to/decent_app_sdk/dist/service-worker/index.js';
```

> [!IMPORTANT]
> When using as a submodule, you must build the SDK before importing. The build step creates the necessary `dist/` files.

> [!NOTE]
> This is an ESM-only package. Use native `import` or a bundler with ESM support. When developing in this repo, examples may import from `src/*`. Consumers should use package exports.

## Quick Start

### Step 1: Service Worker

Create `public/sw.js`:

```js
import { initServiceWorker } from 'decent_app_sdk/service-worker';

initServiceWorker({ builtInProtocols: true });
```

### Step 2: Client Application

```js
import { DecentClient } from 'decent_app_sdk';

// Register the Service Worker
await navigator.serviceWorker.register('/sw.js');

// Initialize the SDK
const app = new DecentClient({ serviceWorkerUrl: '/sw.js' });
await app.ready;

// Get your DID
const did = await app.getDID();
console.log('DID:', did);

// Listen for incoming messages
const unsubscribe = app.onMessage((raw) => {
  console.log('incoming', raw);
});
```

> [!TIP]
> Use `getReadyDecentClient` helper for simpler initialization that combines registration and ready waiting.

## Documentation

| Document | Purpose | What You'll Learn |
|----------|---------|-------------------|
| **[Getting Started](docs/getting-started.md)** | Quick setup guide | Installation, first app, basic usage |
| **[API Reference](docs/api-reference.md)** | Complete API documentation | All methods, parameters, examples |
| **[Built-in Protocols](docs/built-in-protocols.md)** | Available protocols | Protocol features, usage patterns |
| **[Protocol Development](docs/protocol-development-guide.md)** | Custom protocol creation | Building your own protocols |
| **[Framework Integration](docs/framework-integration.md)** | Framework-specific guides | React, Vue, Angular, Svelte, Next.js |
| **[Permissions Guide](docs/permissions-guide.md)** | Permission management | Requesting, checking, managing permissions |
| **[Security Guide](docs/security-guide.md)** | Security best practices | Security considerations, threat model |
| **[Troubleshooting](docs/troubleshooting.md)** | Common issues and fixes | Debugging, problem resolution |
| **[Examples](examples/README.md)** | Runnable examples | Complete sample applications |

---

## Architecture

### System Components

| Component | Purpose | Technology |
|-----------|---------|------------|
| **Client** | UI interactions, user-facing API | `DecentClient` class |
| **Service Worker** | Message routing, protocol execution | Background script |
| **RPC Bridge** | Client ↔ Service Worker communication | `MessageChannel` |
| **Protocol Registry** | Protocol management and routing | Dynamic registration system |
| **Delivery System** | Message delivery strategies | Broadcast vs thread-based |

### Key Concepts

- **Client ↔ Service Worker** communication via `MessageChannel` RPC
- **Protocol registry and routing** in the Service Worker
- **Delivery strategies**: broadcast vs thread-based
- **Dynamic protocol helpers** attach client methods at runtime

## Troubleshooting

See [`docs/troubleshooting.md`](docs/troubleshooting.md) for a comprehensive guide.

### Common Issues & Quick Fixes

| Issue | Solution |
|-------|----------|
| **SDK not ready** | Ensure Service Worker is registered and controlling the page |
| **Thread delivery not working** | For `deliveryStrategy: 'thread'`, `autoUnpack` is required |
| **Protocol not found** | Verify both peers support the same protocol versions |
| **Message Router denial** | Check origin allowlist or enable development flag |
| **Custom protocol blocked** | Enable development flag for custom protocols |

### Development Flags

> [!WARNING]
> These flags are for development only. Never use in production.

| Flag | Flag ID | Purpose |
|------|---------|---------|
| **Allow Unlisted Origins in Message Router** | `#message-router-allow-unlisted-origins` | Bypass origin allowlist |
| **Allow Custom DIDComm Protocols** | `#didcomm-allow-custom-protocols` | Enable custom protocols |

---

## Examples

See [`examples/README.md`](examples/README.md) for an index and running instructions.

### Available Examples

- **Vanilla JavaScript** - Basic usage without frameworks
- **Framework Integration** - React, Vue, Angular examples
- **Built-in Protocols** - Demonstrations of all 8 protocols
- **Custom Protocol** - Creating your own protocol
- **Thread-based Messaging** - Advanced messaging patterns

---

## Thread IDs and `packMessage`

### Thread Correlation

- When available, `packMessage` returns `thid` for correlating requests/responses
- Higher-level helpers propagate `thid` for routing and matching
- Use `thid` to maintain conversation context across message exchanges

### Example Usage

```js
// Pack a message and get thread ID
const packed = await sdk.pack(dest, type, body);
console.log('Thread ID:', packed.thid);

// Use thread ID for response correlation
await sdk.send(dest, packed.message, packed.thid);
```

---

## Browser Support

### Current Support

| Browser | Support Level | Notes |
|---------|---------------|-------|
| **qikfox Browser** | ✅ Full Support | Primary target browser |
| **Other Browsers** | ❌ Not Supported | Service Worker limitations |

> [!NOTE]
> qikfox Browser is the only browser that currently supports this SDK due to specific Service Worker and DIDComm requirements.

---

## Contributing

### Getting Started

1. **Fork the repository**
2. **Follow development setup** guidelines in the repository
3. **Submit pull requests** for improvements

### Development Guidelines

- Follow existing code style and patterns
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass

> [!TIP]
> PRs welcome! See development setup and guidelines in the repository.

---

## License

**MIT License** - See LICENSE file for details.


