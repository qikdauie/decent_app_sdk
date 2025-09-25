import { initServiceWorker } from '../../src/service-worker/index.js';
import { GreetingProtocol } from '../custom-protocol/my-protocol.js';

const { registry } = initServiceWorker({ builtInProtocols: true, deliveryStrategy: 'broadcast' });
registry.register(new GreetingProtocol());


