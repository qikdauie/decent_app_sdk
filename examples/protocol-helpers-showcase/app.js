import { getReadyDecentClient} from '../../src/client/singleton.js';

const out = document.querySelector('#out');
const log = (label, value) => { out.textContent += `${label}: ${typeof value === 'string' ? value : JSON.stringify(value)}\n`; };

let sdk = null;

document.querySelector('#init').addEventListener('click', async () => {
  out.textContent = '';
  sdk = await getReadyDecentClient({ serviceWorkerUrl: './sw.js' });
  await sdk.protocols.refresh();
  log('SDK ready, protocols', sdk.protocols.list());
});

document.querySelector('#discover').addEventListener('click', async () => {
  out.textContent = '';
  try {
    const list = sdk.protocols.list();
    log('Available protocols', list);
  } catch (e) { log('discover error', String(e)); }
});

document.querySelector('#ping').addEventListener('click', async () => {
  out.textContent = '';
  try {
    await sdk.protocols.refresh();
    if (sdk.protocols.has('trust-ping-v2')) {
      await sdk.protocols.trustPing.ping('did:all:all', { comment: 'hello' });
      log('trustPing.ping', 'ok');
    } else {
      log('trustPing not available', sdk.protocols.list());
    }
  } catch (e) { log('trustPing.ping error', String(e)); }
});

document.querySelector('#pingWait').addEventListener('click', async () => {
  out.textContent = '';
  try {
    await sdk.protocols.refresh();
    if (sdk.protocols.has('trust-ping-v2')) {
      const res = await sdk.protocols.trustPing.pingAndWait('did:all:all', { comment: 'hello', timeoutMs: 2000 });
      log('trustPing.pingAndWait', res);
    } else {
      log('trustPing not available', sdk.protocols.list());
    }
  } catch (e) { log('trustPing.pingAndWait error', String(e)); }
});

document.querySelector('#discoverFeatures').addEventListener('click', async () => {
  out.textContent = '';
  try {
    const res = await sdk.protocols.discoverFeatures.discover(['*'], 500);
    log('discoverFeatures.discover', res);
  } catch (e) { log('discoverFeatures error', String(e)); }
});

document.querySelector('#intentRequest').addEventListener('click', async () => {
  out.textContent = '';
  try {
    const res = await sdk.protocols.appIntents.request('did:all:all', { example: true }, { requestType: 'https://didcomm.org/app-intent/1.0/example-request', timeout: 3000 });
    log('appIntents.request', res);
  } catch (e) { log('appIntents.request error', String(e)); }
});


