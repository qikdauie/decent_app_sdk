import { useEffect, useMemo, useState } from 'react';
import { DecentApp } from '../../src/client/index.js';

export function DecentAppDemo() {
  const sdk = useMemo(() => new DecentApp({ serviceWorkerUrl: '/worker/sw.js' }), []);
  const [ready, setReady] = useState(false);
  const [did, setDid] = useState(null);

  useEffect(() => {
    let canceled = false;
    (async () => {
      await sdk.ready; if (canceled) return; setReady(true);
      const info = await sdk.getDID(); if (!canceled) setDid(info);
    })();
    return () => { canceled = true; };
  }, [sdk]);

  return (
    <div>
      <div>Ready: {String(ready)}</div>
      <pre>{JSON.stringify(did, null, 2)}</pre>
    </div>
  );
}


