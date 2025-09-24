import { initServiceWorker } from '../../src/service-worker/index.js';

// Configure thread-based delivery. If autoUnpack were set to false, it will be auto-corrected to true with a warning.
initServiceWorker({ builtInProtocols: true, deliveryStrategy: 'thread', autoUnpack: true });


