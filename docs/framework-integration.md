### Framework Integration

Table of Contents

- Overview
- React
- Vue
- Angular
- Svelte
- Next.js / SSR
- Common Patterns
- Best Practices

Overview

- Create a single SDK instance and share it across your app
- Register the Service Worker early; wait for `sdk.ready` before invoking methods
- Clean up message listeners on unmount

React

Provider pattern:

```jsx
import { createContext, useContext, useMemo, useEffect, useState } from 'react';
import { getDecentClient } from 'decent_app_sdk';

const DecentClientContext = createContext(null);

export function DecentClientProvider({ children }) {
  const sdk = useMemo(() => getDecentClient({ serviceWorkerUrl: '/sw.js' }), []);
  const [ready, setReady] = useState(false);
  useEffect(() => { let c=false; (async()=>{ await sdk.ready; if(!c) setReady(true); })(); return ()=>{c=true}; }, [sdk]);
  return <DecentClientContext.Provider value={{ sdk, ready }}>{children}</DecentClientContext.Provider>;
}

export const useDecentClient = () => useContext(DecentClientContext);
```

Hooks:

```jsx
export function useDID() {
  const { sdk, ready } = useDecentClient();
  const [did, setDid] = useState(null);
  useEffect(() => { if (!ready) return; let c=false; (async()=>{ const res=await sdk.getDID(); if(!c) setDid(res); })(); return ()=>{c=true}; }, [ready, sdk]);
  return did;
}
```

Vue (Composition API)

Provide/Inject:

```vue
<script setup>
import { ref, onMounted, provide } from 'vue';
import { getReadyDecentClient } from 'decent_app_sdk';

const ready = ref(false);
onMounted(async () => { const sdk = await getReadyDecentClient({ serviceWorkerUrl: '/sw.js' }); provide('decentSdk', sdk); ready.value = true; });
</script>
```

Angular

- Wrap the SDK in an Injectable service; expose `ready$` via RxJS
- Initialize once in `AppModule` or a root provider; guard routes on readiness

Svelte

- Create a writable store for `{ sdk, ready }`; set after `await sdk.ready`
- Cleanup listeners in `onDestroy`

Next.js / SSR

- Initialize client-side only (e.g., inside `useEffect`) and lazy-load modules

Common Patterns

- Singleton vs instance: prefer a single instance per app
- Register SW early, especially in SPA shells
- Guard UI with readiness flags

Best Practices

- Avoid creating multiple SDK instances
- Unsubscribe `onMessage` listeners on unmount
- Handle errors and timeouts explicitly
