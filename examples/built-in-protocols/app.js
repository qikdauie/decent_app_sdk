import { DecentApp } from '../../src/client/index.js';

const out = document.querySelector('#out');
const btn = document.querySelector('#discover');

const sdk = new DecentApp({ serviceWorkerUrl: '/worker/sw.js' });
await sdk.ready;

btn.addEventListener('click', async () => {
  const providers = await sdk.protocols.intents.discover(['*'], 800);
  out.textContent = JSON.stringify(providers, null, 2);
});


