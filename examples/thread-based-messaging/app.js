import { getReadyDecentClientSingleton } from '../../src/client/singleton.js';

const out = document.querySelector('#out');
const btnInit = document.querySelector('#init');
const btnA = document.querySelector('#send-a');
const btnB = document.querySelector('#send-b');

let sdk;

btnInit.addEventListener('click', async () => {
  sdk = await getReadyDecentClientSingleton({ serviceWorkerUrl: './sw.js' });
  out.textContent += 'SDK ready (thread-based delivery configured in sw.js)\n';
  sdk.onMessage((incoming) => {
    out.textContent += 'Incoming: ' + JSON.stringify(incoming) + '\n';
  });
});

async function sendOnce(thid) {
  const dest = 'did:example:receiver';
  const packed = await sdk.pack(dest, 'https://didcomm.org/test/1.0/ping', JSON.stringify({}));
  if (packed?.success) {
    const ok = await sdk.send(dest, packed.message, thid);
    out.textContent += `Sent to ${dest} with threadId=${thid}: ${ok}\n`;
  }
}

btnA.addEventListener('click', () => sendOnce('thread-A'));
btnB.addEventListener('click', () => sendOnce('thread-B'));


