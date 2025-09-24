import { initServiceWorker } from '../../src/service-worker/index.js';
import { GreetingProtocol } from './my-protocol.js';

// Example: thread delivery with auto-correction forcing autoUnpack=true when needed
const registry = initServiceWorker({ builtInProtocols: true, deliveryStrategy: 'thread', autoUnpack: false });
// The above will log a warning and enable autoUnpack automatically.

registry.register(new GreetingProtocol());


