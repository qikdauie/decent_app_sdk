### Protocol Development Guide (Dynamic Client Methods)

Table of Contents

- Overview
- Architecture
- Step-by-Step Guide
- Example (GreetingProtocol)
- Advanced Features
- Message Handling
- Client Methods
- Feature Discovery
- Testing Protocols
- Registration & Deployment
- Complete Example (outline)
- Common Patterns
- Troubleshooting

Overview

Custom protocols extend `BaseProtocol`, declare metadata, and expose client methods via `declareClientMethods`. The Service Worker registers and routes them; the client discovers and invokes them dynamically.

Architecture

- `BaseProtocol` provides runtime helpers: `sendType`, `sendAndWaitForResponse`, `pack`, `send`, logging, etc.
- Protocol metadata: `{ id, piuri, version?, messageTypes }`
- Service Worker registry loads and routes protocols

Step-by-Step Guide

1) Extend `BaseProtocol` and declare metadata
2) Implement `declareClientMethods()` to expose client-callable methods
3) Implement `handleIncoming` for inbound messages
4) Implement `invokeClientMethod` to handle client invocations and validation
5) Optionally implement `advertiseCapabilities()` for discover-features
6) Register protocol during SW init

Example (GreetingProtocol)

```js
import { BaseProtocol } from 'decent_app_sdk/protocols';

class GreetingProtocol extends BaseProtocol {
  constructor() {
    super({ id: 'greet', piuri: 'https://didcomm.org/greet/1.0', messageTypes: ['https://didcomm.org/greet/1.0/hello', 'https://didcomm.org/greet/1.0/hello-response'] });
  }

  declareClientMethods() {
    return {
      sayHello: { params: ['to', 'message?'], description: 'Send hello' },
      sayHelloAndWait: { params: ['to', 'message?', 'timeout?'], description: 'Send hello and wait', timeoutMs: 3000 },
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

Advanced Features

- State across messages (e.g., in-memory maps keyed by DID or thid)
- Multi-step flows with timeouts and retries
- Composition with other protocols (send-and-wait then forward)

Message Handling

- Validate message bodies and types
- Extract thread IDs where relevant
- Use `replyTo` to maintain conversation threading

Client Methods

- Validate parameters; provide clear error messages
- Use `timeoutMs` in request/response methods

Feature Discovery

- Implement `advertiseCapabilities()` to publish features via discover-features

Testing Protocols

- Unit test `handleIncoming` and `invokeClientMethod`
- Mock runtime helpers; test timeouts and matches

Registration & Deployment

- Register in the Service Worker during initialization
- Version protocols and provide migration paths when message shapes change

Complete Example (outline)

- Full-featured protocol with state, retries, and a test suite

Common Patterns

- Request/response, notification-only, and stateful protocols

Troubleshooting

- Unknown method errors: ensure `declareClientMethods` and `invokeClientMethod` names match
- No responses: verify match function and timeout values
- Custom protocol blocked by browser: qikfox enforces a registry of approved DIDComm protocol URIs. For local development, enable `qikfox://flags` → `#didcomm-allow-custom-protocols` to allow developer-defined (non-registered) protocol URIs. Revert before shipping.
