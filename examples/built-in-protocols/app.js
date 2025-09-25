import { getReadyDecentClientSingleton } from '../../src/client/singleton.js';

const out = document.querySelector('#out');
const btn = document.querySelector('#discover');

const sdk = await getReadyDecentClientSingleton({ serviceWorkerUrl: '/worker/sw.js' });

btn.addEventListener('click', async () => {
  const providers = await sdk.protocols.intents.discover(['*'], 800);
  out.textContent = JSON.stringify(providers, null, 2);
});


