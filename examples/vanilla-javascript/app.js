// This example uses the published package exports. When developing the SDK itself,
// you may instead import from '../../src/client/singleton.js'.
import { getReadyDecentClient } from 'decent_app_sdk';

const out = document.querySelector('#out');
const btn = document.querySelector('#init');

btn.addEventListener('click', async () => {
  try {
    const sdk = await getReadyDecentClient({ serviceWorkerUrl: '/sw.js' });
    out.textContent = 'SDK ready\n';
    const did = await sdk.getDID();
    out.textContent += 'DID: ' + JSON.stringify(did) + '\n';
    const features = await sdk.protocols.discover(['*']);
    out.textContent += 'Features: ' + JSON.stringify(features, null, 2) + '\n';

    // Example: sending with a thread ID (service worker may target responses back)
    const dest = 'did:example:receiver';
    const packed = await sdk.pack(dest, 'https://didcomm.org/test/1.0/ping', JSON.stringify({}));
    if (packed?.success) {
      const thid = packed.thid || 'thread-demo-123';
      const ok = await sdk.send(dest, packed.message, thid);
      out.textContent += 'Sent with threadId=' + thid + ': ' + ok + '\n';
    }
  } catch (e) {
    out.textContent += 'Error: ' + String(e?.message || e) + '\n';
  }
});


