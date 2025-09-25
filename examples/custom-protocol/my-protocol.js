import { BaseProtocol } from '../../src/protocols/base.js';

export class GreetingProtocol extends BaseProtocol {
  constructor() {
    super({
      id: 'greeting',
      piuri: 'https://didcomm.org/greeting/1.0',
      messageTypes: [
        'https://didcomm.org/greeting/1.0/hello',
        'https://didcomm.org/greeting/1.0/hello-response',
      ],
    });
  }

  declareClientMethods() {
    return {
      sayHello: { params: ['to', 'message?'], description: 'Send a hello message' },
      sayHelloAndWait: { params: ['to', 'message?', 'timeout?'], description: 'Send hello and wait for response', timeoutMs: 3000 },
    };
  }

  async handleIncoming({ type, from, body }) {
    if (type === 'https://didcomm.org/greeting/1.0/hello' && from) {
      await this.runtime.sendType(from, 'https://didcomm.org/greeting/1.0/hello-response', { message: 'Hi from provider!' });
      return true;
    }
    return false;
  }

  async invokeClientMethod(methodName, args) {
    const [to, message, timeout = 3000] = Array.isArray(args) ? args : [args];
    if (!to || typeof to !== 'string') throw new Error('to is required');
    if (methodName === 'sayHello') {
      await this.runtime.sendType(to, 'https://didcomm.org/greeting/1.0/hello', { message: String(message || 'Hello!') });
      return { ok: true };
    }
    if (methodName === 'sayHelloAndWait') {
      const body = { message: String(message || 'Hello!') };
      const result = await this.sendAndWaitForResponse(
        to,
        'https://didcomm.org/greeting/1.0/hello',
        body,
        { timeoutMs: Number(timeout) || 3000, match: (env) => env?.type === 'https://didcomm.org/greeting/1.0/hello-response' && (env?.from === to || !to) }
      );
      if (!result) throw new Error('sayHelloAndWait timed out');
      return { ok: true, response: result };
    }
    throw new Error(`Unknown method: ${methodName}`);
  }
}


