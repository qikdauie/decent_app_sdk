import { DecentClient } from './index.js';

let cachedInstance = null;

export function getDecentClientSingleton(options = {}) {
  if (!cachedInstance) {
    cachedInstance = new DecentClient(options);
  }
  return cachedInstance;
}

export async function getReadyDecentClientSingleton(options = {}) {
  const app = getDecentClientSingleton(options);
  await app.ready;
  return app;
}


