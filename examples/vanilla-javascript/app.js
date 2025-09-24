import { DecentApp } from '../../src/client/index.js';

const out = document.querySelector('#out');
const btn = document.querySelector('#init');

btn.addEventListener('click', async () => {
  const sdk = new DecentApp({ serviceWorkerUrl: '/worker/sw.js' });
  await sdk.ready;
  out.textContent = 'SDK ready\n';
  const did = await sdk.getDID();
  out.textContent += 'DID: ' + JSON.stringify(did) + '\n';
  const features = await sdk.protocols.discover(['*']);
  out.textContent += 'Features: ' + JSON.stringify(features, null, 2) + '\n';

  // Example: sending with a thread ID (service worker may target responses back)
  try {
    const dest = 'did:example:receiver';
    const packed = await sdk.pack(dest, 'https://didcomm.org/test/1.0/ping', JSON.stringify({}));
    if (packed?.success) {
      const thid = 'thread-demo-123';
      const ok = await sdk.send(dest, packed.message, thid);
      out.textContent += 'Sent with threadId=' + thid + ': ' + ok + '\n';
    }
  } catch (e) {
    out.textContent += 'Send error: ' + (e && e.message || e) + '\n';
  }
});


