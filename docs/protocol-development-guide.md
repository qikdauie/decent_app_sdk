### Protocol Development Guide

1) Extend BaseProtocol and declare metadata (id, piuri, messageTypes).
2) Implement handleIncoming(envelope) to process message types.
3) Optionally override advertiseCapabilities().
4) Register your protocol at Service Worker init.

Example:

```js
import { BaseProtocol } from 'decent_app_sdk/protocols';

class GreetingProtocol extends BaseProtocol {
  constructor() {
    super({ id: 'greet', piuri: 'https://didcomm.org/greet/1.0', messageTypes: ['https://didcomm.org/greet/1.0/hello'] });
  }
  async handleIncoming({ type, from, body }) {
    if (type === 'https://didcomm.org/greet/1.0/hello') {
      await this.runtime.sendType(from, 'https://didcomm.org/greet/1.0/hello-response', { message: 'hi!' });
      return true;
    }
    return false;
  }
}
```


