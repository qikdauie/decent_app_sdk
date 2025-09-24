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

  async handleIncoming({ type, from, body }) {
    if (type === 'https://didcomm.org/greeting/1.0/hello' && from) {
      await this.runtime.sendType(from, 'https://didcomm.org/greeting/1.0/hello-response', { message: 'Hi from provider!' });
      return true;
    }
    return false;
  }
}


