### Protocol Development Guide (New Client Method System)

This guide covers building protocols that expose a clean client API using dynamic helpers.

1) Extend `BaseProtocol` and declare metadata (`id`, `piuri`, `messageTypes`).
2) Implement `declareClientMethods()` to expose client-callable methods.
3) Implement `invokeClientMethod(methodName, args)` to handle client invocations.
4) Optionally override `advertiseCapabilities()` for discover-features.
5) Register your protocol at Service Worker init.

Example:

```js
import { BaseProtocol } from 'decent_app_sdk/protocols';

class GreetingProtocol extends BaseProtocol {
  constructor() {
    super({ id: 'greet', piuri: 'https://didcomm.org/greet/1.0', messageTypes: ['https://didcomm.org/greet/1.0/hello', 'https://didcomm.org/greet/1.0/hello-response'] });
  }

  declareClientMethods() {
    return {
      sayHello: { params: ['to', 'message?'] },
      sayHelloAndWait: { params: ['to', 'message?', 'timeout?'], timeoutMs: 3000 },
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
    if (methodName === 'sayHello') {
      await this.runtime.sendType(to, 'https://didcomm.org/greet/1.0/hello', { message: String(msg || 'Hello!') });
      return { ok: true };
    }
    if (methodName === 'sayHelloAndWait') {
      const body = { message: String(msg || 'Hello!') };
      const packed = await this.runtime.pack(to, 'https://didcomm.org/greet/1.0/hello', JSON.stringify(body));
      await this.runtime.send(to, packed.message);
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

Testing Tips:
- Use `sdk.protocols.refresh()` to fetch methods from the Service Worker.
- Call `sdk.protocols.greet.sayHello(did)` directly without manual pack/send.
- For request/response flows, prefer `sayHelloAndWait` with timeouts.


