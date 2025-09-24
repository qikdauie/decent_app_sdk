import { BaseProtocol } from '../base.js';
import { INTENTS, advertiseIntentsList, requestTypeToAction } from './intents.js';
import { IntentRouter } from './router.js';

export { INTENTS } from './intents.js';
export { IntentRouter } from './router.js';

export class AppIntentsProtocol extends BaseProtocol {
  constructor(options = {}) {
    super({
      id: 'app-intents-v1',
      piuri: 'https://didcomm.org/app-intent/1.0',
      version: '1.0',
      messageTypes: [
        'https://didcomm.org/app-intent/1.0/*',
      ],
    });
    this.router = new IntentRouter(options.router || {});
    this.roles = Array.isArray(options.roles) ? options.roles : ['provider'];
    this.advertise = options.advertise !== false;
  }

  register(runtime) {
    super.register(runtime);
    if (this.advertise) {
      advertiseIntentsList(runtime.registry, Object.values(INTENTS), this.roles);
      runtime.registry.advertiseFeature('protocol', this.meta.piuri, this.roles);
    }
  }

  async handleIncoming(envelope) {
    const { type } = envelope || {};
    if (!type) return false;
    if (type.startsWith('https://didcomm.org/app-intent/1.0/')) {
      return await this.router.handleIncoming(envelope, this.runtime);
    }
    return false;
  }
}


