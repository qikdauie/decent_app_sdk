# Protocol Development Guide

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Step-by-Step Guide](#step-by-step-guide)
- [Example (GreetingProtocol)](#example-greetingprotocol)
- [Advanced Features](#advanced-features)
- [Message Handling](#message-handling)
- [Client Methods](#client-methods)
- [Feature Discovery](#feature-discovery)
- [Testing Protocols](#testing-protocols)
- [Registration & Deployment](#registration--deployment)
- [Common Patterns](#common-patterns)
- [Troubleshooting](#troubleshooting)

---

## Overview

Custom protocols extend `BaseProtocol`, declare metadata, and expose client methods via `declareClientMethods`. The Service Worker registers and routes them; the client discovers and invokes them dynamically.

> [!IMPORTANT]
> Always extend `BaseProtocol` rather than implementing from scratch. This provides essential runtime helpers and ensures compatibility.

---

## Architecture

### Core Components

- **`BaseProtocol`** - Provides runtime helpers: `sendType`, `sendAndWaitForResponse`, `pack`, `send`, logging, etc.
- **Protocol metadata** - `{ id, piuri, version?, messageTypes }`
- **Service Worker registry** - Loads and routes protocols

### Protocol Lifecycle

| Step | Method/Action | Purpose | Required |
|------|---------------|---------|----------|
| **1** | Extend `BaseProtocol` | Create protocol class | ✅ Yes |
| **2** | Declare metadata | Define protocol identity | ✅ Yes |
| **3** | Implement `declareClientMethods()` | Expose client methods | ✅ Yes |
| **4** | Implement `handleIncoming()` | Handle inbound messages | ✅ Yes |
| **5** | Implement `invokeClientMethod()` | Handle client calls | ✅ Yes |
| **6** | Implement `advertiseCapabilities()` | Feature discovery | ❌ Optional |
| **7** | Register in Service Worker | Make protocol available | ✅ Yes |

---

## Step-by-Step Guide

### Step 1: Extend BaseProtocol and Declare Metadata

```js
import { BaseProtocol } from 'decent_app_sdk/protocols';

class MyProtocol extends BaseProtocol {
  constructor() {
    super({
      id: 'my-protocol',
      piuri: 'https://example.org/my-protocol/1.0',
      version: '1.0',
      messageTypes: [
        'https://example.org/my-protocol/1.0/request',
        'https://example.org/my-protocol/1.0/response'
      ]
    });
  }
}
```

### Step 2: Implement declareClientMethods()

```js
declareClientMethods() {
  return {
    sendRequest: { 
      params: ['to', 'data'], 
      description: 'Send a request',
      timeoutMs: 5000 
    },
    sendRequestAndWait: { 
      params: ['to', 'data', 'timeout?'], 
      description: 'Send request and wait for response',
      timeoutMs: 10000 
    }
  };
}
```

### Step 3: Implement handleIncoming()

```js
async handleIncoming({ type, from, body }) {
  if (type === 'https://example.org/my-protocol/1.0/request' && from) {
    // Process incoming request
    const response = await this.processRequest(body);
    await this.runtime.sendType(from, 'https://example.org/my-protocol/1.0/response', response);
    return true;
  }
  return false;
}
```

### Step 4: Implement invokeClientMethod()

```js
async invokeClientMethod(methodName, args) {
  const [to, data, timeout = 5000] = Array.isArray(args) ? args : [args];
  
  if (methodName === 'sendRequest') {
    await this.runtime.sendType(to, 'https://example.org/my-protocol/1.0/request', data);
    return { ok: true };
  }
  
  if (methodName === 'sendRequestAndWait') {
    const result = await this.sendAndWaitForResponse(to, 'https://example.org/my-protocol/1.0/request', data, {
      timeoutMs: Number(timeout) || 5000,
      match: (env) => env?.type === 'https://example.org/my-protocol/1.0/response'
    });
    
    if (!result) throw new Error('Request timeout');
    return { ok: true, response: result };
  }
  
  throw new Error(`Unknown method: ${methodName}`);
}
```

### Step 5: Implement advertiseCapabilities() (Optional)

```js
advertiseCapabilities() {
  return {
    'https://example.org/my-protocol/1.0': ['request', 'response']
  };
}
```

### Step 6: Register Protocol in Service Worker

```js
import { initServiceWorker } from 'decent_app_sdk/service-worker';
import { MyProtocol } from './my-protocol.js';

initServiceWorker({
  builtInProtocols: true,
  customProtocols: [new MyProtocol()]
});
```

---

## Example (GreetingProtocol)

**Complete working example:**

```js
import { BaseProtocol } from 'decent_app_sdk/protocols';

class GreetingProtocol extends BaseProtocol {
  constructor() {
    super({ 
      id: 'greet', 
      piuri: 'https://didcomm.org/greet/1.0', 
      messageTypes: [
        'https://didcomm.org/greet/1.0/hello', 
        'https://didcomm.org/greet/1.0/hello-response'
      ] 
    });
  }

  declareClientMethods() {
    return {
      sayHello: { 
        params: ['to', 'message?'], 
        description: 'Send hello' 
      },
      sayHelloAndWait: { 
        params: ['to', 'message?', 'timeout?'], 
        description: 'Send hello and wait', 
        timeoutMs: 3000 
      },
    };
  }

  async handleIncoming({ type, from }) {
    if (type === 'https://didcomm.org/greet/1.0/hello' && from) {
      await this.runtime.sendType(from, 'https://didcomm.org/greet/1.0/hello-response', { message: 'hi!' });
      return true;
    }
    return false;
  }

  async invokeClientMethod(methodName, args) {
    const [to, msg, timeout = 3000] = Array.isArray(args) ? args : [args];
    if (!to || typeof to !== 'string') throw new Error('to is required');
    
    if (methodName === 'sayHello') {
      await this.runtime.sendType(to, 'https://didcomm.org/greet/1.0/hello', { message: String(msg || 'Hello!') });
      return { ok: true };
    }
    
    if (methodName === 'sayHelloAndWait') {
      const body = { message: String(msg || 'Hello!') };
      const result = await this.sendAndWaitForResponse(to, 'https://didcomm.org/greet/1.0/hello', body, {
        timeoutMs: Number(timeout) || 3000,
        match: (env) => env?.type === 'https://didcomm.org/greet/1.0/hello-response' && (env?.from === to || !to),
      });
      if (!result) throw new Error('timeout');
      return { ok: true, response: result };
    }
    
    throw new Error(`Unknown method: ${methodName}`);
  }
}
```

---

## Advanced Features

### State Management

- **State across messages** - Use in-memory maps keyed by DID or thid
- **Multi-step flows** - Implement complex workflows with timeouts and retries
- **Protocol composition** - Send-and-wait then forward to other protocols

### BaseProtocol Methods Reference

| Method | Parameters | Returns | Use Case |
|--------|------------|---------|----------|
| `sendType(to, type, body)` | `to: string, type: string, body: any` | `Promise<void>` | Send a message of specific type |
| `sendAndWaitForResponse(to, type, body, options)` | `to: string, type: string, body: any, options: { timeoutMs, match }` | `Promise<any>` | Send and wait for response |
| `pack(dest, type, body, attachments?, replyTo?)` | Standard pack parameters | `Promise<{ success, message, thid, error }>` | Pack a message |
| `send(dest, packed, threadId?)` | Standard send parameters | `Promise<string>` | Send a packed message |
| `log(level, message, data?)` | `level: string, message: string, data?: any` | `void` | Log messages |

---

## Message Handling

### Best Practices

- **Validate message bodies and types** - Ensure incoming messages match expected structure
- **Extract thread IDs** - Use `thid` for request/response correlation
- **Use `replyTo`** - Maintain conversation threading

### Thread ID Correlation

> [!NOTE]
> Thread ID correlation and the `match` function are crucial for request/response patterns. The `match` function determines which response belongs to which request.

---

## Client Methods

### Validation

- **Validate parameters** - Check required fields and types
- **Provide clear error messages** - Help developers understand what went wrong
- **Use `timeoutMs`** - Set appropriate timeouts for request/response methods

---

## Feature Discovery

### advertiseCapabilities()

Implement `advertiseCapabilities()` to publish features via discover-features:

```js
advertiseCapabilities() {
  return {
    'https://example.org/my-protocol/1.0': ['request', 'response', 'notification']
  };
}
```

---

## Testing Protocols

### Unit Testing

> [!TIP]
> Mock runtime helpers and test timeouts and matches

**Test Example:**
```js
import { GreetingProtocol } from './greeting-protocol.js';

describe('GreetingProtocol', () => {
  let protocol;
  let mockRuntime;

  beforeEach(() => {
    mockRuntime = {
      sendType: jest.fn(),
      sendAndWaitForResponse: jest.fn()
    };
    protocol = new GreetingProtocol();
    protocol.runtime = mockRuntime;
  });

  test('handleIncoming should respond to hello messages', async () => {
    const result = await protocol.handleIncoming({
      type: 'https://didcomm.org/greet/1.0/hello',
      from: 'did:example:peer'
    });
    
    expect(result).toBe(true);
    expect(mockRuntime.sendType).toHaveBeenCalledWith(
      'did:example:peer',
      'https://didcomm.org/greet/1.0/hello-response',
      { message: 'hi!' }
    );
  });
});
```

---

## Registration & Deployment

### Service Worker Registration

```js
import { initServiceWorker } from 'decent_app_sdk/service-worker';
import { MyProtocol } from './my-protocol.js';

initServiceWorker({
  builtInProtocols: true,
  customProtocols: [new MyProtocol()]
});
```

### Versioning

- **Version protocols** - Use semantic versioning for protocol changes
- **Provide migration paths** - Handle breaking changes gracefully
- **Document changes** - Keep changelog of protocol modifications

---

## Common Patterns

| Pattern | Use Case | Key Methods |
|---------|----------|-------------|
| **Request/Response** | Two-way communication | `sendAndWaitForResponse`, `match` function |
| **Notification** | One-way messaging | `sendType` |
| **Stateful** | Multi-step workflows | State management, timeouts, retries |

---

## Troubleshooting

### Common Issues

**Unknown method errors:**
- Ensure `declareClientMethods` and `invokeClientMethod` names match exactly
- Check method name casing and spelling

**No responses:**
- Verify `match` function logic
- Check timeout values
- Ensure response message type matches expected type

**Custom protocol blocked by browser:**

> [!WARNING]
> qikfox enforces a registry of approved DIDComm protocol URIs. For local development, enable `qikfox://flags` → `#didcomm-allow-custom-protocols` to allow developer-defined (non-registered) protocol URIs. **Revert before shipping.**

### Development Flags

| Flag | Flag ID | Purpose | Use Case | Warning |
|------|---------|---------|----------|---------|
| Allow Custom DIDComm Protocols | `#didcomm-allow-custom-protocols` | Enable custom protocols | Development only | **Never use in production** |

> [!WARNING]
> Browser flags are for development only. Always revert flags before shipping to production.
