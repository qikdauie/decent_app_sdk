import { useEffect, useMemo, useState, createContext, useContext } from 'react';
// Use package export in apps; for SDK development, you may import from '../../src/client/singleton.js'.
import { getDecentClient } from 'decent_app_sdk';

// Simple demo component and Provider example
const DecentClientContext = createContext(null);

export function DecentClientProvider({ children }) {
  const sdk = useMemo(() => getDecentClient({ serviceWorkerUrl: '/sw.js' }), []);
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
    <DecentClientContext.Provider value={{ sdk, ready, did }}>
      {children}
    </DecentClientContext.Provider>
  );
}

export function useDecentClient() { return useContext(DecentClientContext); }

export function DecentClientDemo() {
  const { sdk, ready, did } = useDecentClient();
  return (
    <div>
      <div>Ready: {String(ready)}</div>
      <pre>{JSON.stringify(did, null, 2)}</pre>
      <button onClick={async () => { await sdk?.protocols?.refresh?.(); }}>Refresh Protocols</button>
    </div>
  );
}


