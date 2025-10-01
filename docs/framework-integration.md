# Framework Integration

## Table of Contents

- [Overview](#overview)
- [React](#react)
- [Vue](#vue)
- [Angular](#angular)
- [Svelte](#svelte)
- [Next.js / SSR](#nextjs--ssr)
- [Common Patterns](#common-patterns)
- [Best Practices](#best-practices)

---

## Overview

The Decent Application SDK can be integrated with any modern JavaScript framework. The key principles remain consistent across all frameworks:

- Create a single SDK instance and share it across your app
- Register the Service Worker early; wait for `sdk.ready` before invoking methods
- Clean up message listeners on unmount

> [!IMPORTANT]
> Always use the singleton pattern to avoid creating multiple SDK instances. Multiple instances can cause conflicts and unexpected behavior.

### Quick Reference

| Framework | Pattern | State Management | Cleanup Approach | SSR Support |
|-----------|---------|------------------|------------------|-------------|
| **React** | Context + Hooks | `useState`/`useEffect` | `useEffect` cleanup | Limited |
| **Vue** | Provide/Inject | `ref`/`reactive` | `onUnmounted` | Limited |
| **Angular** | Injectable Service | RxJS | `ngOnDestroy` | Limited |
| **Svelte** | Writable Store | `writable` | `onDestroy` | Limited |
| **Next.js** | Client-side only | Framework-specific | Framework-specific | Yes (with caveats) |

---

## React

### Provider Pattern

**Context Provider Setup:**

```jsx
import { createContext, useContext, useMemo, useEffect, useState } from 'react';
import { getDecentClient } from 'decent_app_sdk';

const DecentClientContext = createContext(null);

export function DecentClientProvider({ children }) {
  const sdk = useMemo(() => getDecentClient({ serviceWorkerUrl: '/sw.js' }), []);
  const [ready, setReady] = useState(false);
  useEffect(() => { 
    let cancelled = false; 
    (async () => { 
      await sdk.ready; 
      if (!cancelled) setReady(true); 
    })(); 
    return () => { cancelled = true; }; 
  }, [sdk]);
  return <DecentClientContext.Provider value={{ sdk, ready }}>{children}</DecentClientContext.Provider>;
}

export const useDecentClient = () => useContext(DecentClientContext);
```

### Custom Hooks

**DID Hook:**
```jsx
export function useDID() {
  const { sdk, ready } = useDecentClient();
  const [did, setDid] = useState(null);
  useEffect(() => { 
    if (!ready) return; 
    let cancelled = false; 
    (async () => { 
      const res = await sdk.getDID(); 
      if (!cancelled) setDid(res); 
    })(); 
    return () => { cancelled = true; }; 
  }, [ready, sdk]);
  return did;
}
```

**Message Hook:**
```jsx
export function useMessages() {
  const { sdk, ready } = useDecentClient();
  const [messages, setMessages] = useState([]);
  
  useEffect(() => {
    if (!ready) return;
    
    const unsubscribe = sdk.onMessage((raw) => {
      setMessages(prev => [...prev, raw]);
    });
    
    return unsubscribe;
  }, [sdk, ready]);
  
  return messages;
}
```

---

## Vue

### Composition API

**Provide/Inject Pattern:**

```vue
<script setup>
import { ref, onMounted, provide } from 'vue';
import { getReadyDecentClient } from 'decent_app_sdk';

const ready = ref(false);
onMounted(async () => { 
  const sdk = await getReadyDecentClient({ serviceWorkerUrl: '/sw.js' }); 
  provide('decentSdk', sdk); 
  ready.value = true; 
});
</script>
```

**Composable Hook:**

```js
// composables/useDecentClient.js
import { inject, ref, onUnmounted } from 'vue';

export function useDecentClient() {
  const sdk = inject('decentSdk');
  const ready = ref(false);
  const unsubscribe = ref(null);
  
  onMounted(async () => {
    if (sdk) {
      await sdk.ready;
      ready.value = true;
    }
  });
  
  onUnmounted(() => {
    if (unsubscribe.value) {
      unsubscribe.value();
    }
  });
  
  return { sdk, ready, unsubscribe };
}
```

---

## Angular

### Injectable Service

**Service Implementation:**
```typescript
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { getDecentClient } from 'decent_app_sdk';

@Injectable({
  providedIn: 'root'
})
export class DecentClientService {
  private sdk = getDecentClient({ serviceWorkerUrl: '/sw.js' });
  private readySubject = new BehaviorSubject<boolean>(false);
  
  public ready$: Observable<boolean> = this.readySubject.asObservable();
  
  constructor() {
    this.initialize();
  }
  
  private async initialize() {
    await this.sdk.ready;
    this.readySubject.next(true);
  }
  
  getSdk() {
    return this.sdk;
  }
}
```

**Component Usage:**
```typescript
import { Component, OnInit } from '@angular/core';
import { DecentClientService } from './decent-client.service';

@Component({
  selector: 'app-root',
  template: '<div *ngIf="ready$ | async">SDK Ready</div>'
})
export class AppComponent implements OnInit {
  ready$ = this.decentClient.ready$;
  
  constructor(private decentClient: DecentClientService) {}
  
  ngOnInit() {
    // SDK is ready when ready$ emits true
  }
}
```

---

## Svelte

### Writable Store

**Store Implementation:**
```js
// stores/decentClient.js
import { writable } from 'svelte/store';
import { getDecentClient } from 'decent_app_sdk';

const sdk = getDecentClient({ serviceWorkerUrl: '/sw.js' });
const ready = writable(false);

// Initialize
(async () => {
  await sdk.ready;
  ready.set(true);
})();

export { sdk, ready };
```

**Component Usage:**
```svelte
<script>
  import { onDestroy } from 'svelte';
  import { sdk, ready } from './stores/decentClient.js';
  
  let unsubscribe;
  
  $: if ($ready) {
    unsubscribe = sdk.onMessage((raw) => {
      console.log('Message received:', raw);
    });
  }
  
  onDestroy(() => {
    if (unsubscribe) unsubscribe();
  });
</script>

{#if $ready}
  <p>SDK is ready!</p>
{/if}
```

---

## Next.js / SSR

### Client-Side Only Initialization

**Custom Hook:**
```js
// hooks/useDecentClient.js
import { useEffect, useState } from 'react';
import { getReadyDecentClient } from 'decent_app_sdk';

export function useDecentClient() {
  const [sdk, setSdk] = useState(null);
  const [ready, setReady] = useState(false);
  
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    let cancelled = false;
    
    (async () => {
      try {
        const client = await getReadyDecentClient({ serviceWorkerUrl: '/sw.js' });
        if (!cancelled) {
          setSdk(client);
          setReady(true);
        }
      } catch (error) {
        console.error('Failed to initialize SDK:', error);
      }
    })();
    
    return () => { cancelled = true; };
  }, []);
  
  return { sdk, ready };
}
```

**Page Component:**
```jsx
import { useDecentClient } from '../hooks/useDecentClient';

export default function HomePage() {
  const { sdk, ready } = useDecentClient();
  
  if (!ready) {
    return <div>Loading SDK...</div>;
  }
  
  return <div>SDK Ready!</div>;
}
```

> [!WARNING]
> SSR/Next.js requires client-side-only initialization. Always check `typeof window !== 'undefined'` before initializing the SDK.

---

## Common Patterns

### Singleton Management
- **Singleton vs instance**: prefer a single instance per app
- **Early registration**: register SW early, especially in SPA shells
- **Readiness guards**: guard UI with readiness flags

### State Management
- Use framework-specific state management (React hooks, Vue refs, Angular services, Svelte stores)
- Keep SDK instance separate from UI state
- Handle loading states gracefully

### Cleanup Patterns
- **Message listeners**: unsubscribe `onMessage` listeners on unmount
- **Timeouts**: clear any pending timeouts
- **Promises**: cancel pending operations where possible

---

## Best Practices

> [!TIP]
> Wait for `sdk.ready` before rendering UI that depends on the SDK

> [!NOTE]
> Always clean up message listeners and other subscriptions to prevent memory leaks

> [!WARNING]
> Handle errors and timeouts explicitly in your framework's error handling system

### 1. **Avoid Multiple Instances**
```js
// ❌ Don't do this
const sdk1 = new DecentClient();
const sdk2 = new DecentClient();

// ✅ Do this instead
const sdk = getDecentClient(); // Uses singleton
```

### 2. **Proper Cleanup**
```js
// React example
useEffect(() => {
  const unsubscribe = sdk.onMessage(handleMessage);
  return unsubscribe; // Cleanup function
}, [sdk]);
```

### 3. **Error Handling**
```js
// Always handle errors
try {
  const result = await sdk.pack(dest, type, body);
  if (!result.success) {
    throw new Error(result.error);
  }
} catch (error) {
  // Handle error in your framework's way
  console.error('SDK operation failed:', error);
}
```

### 4. **Loading States**
```js
// Show loading state until ready
if (!ready) {
  return <LoadingSpinner />;
}
```
