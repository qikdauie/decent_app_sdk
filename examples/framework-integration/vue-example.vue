<script setup>
import { ref, onMounted } from 'vue';
import { getReadyDecentClientSingleton } from '../../src/client/singleton.js';

const ready = ref(false);
const did = ref(null);

onMounted(async () => {
  const sdk = await getReadyDecentClientSingleton({ serviceWorkerUrl: '/sw.js' });
  ready.value = true;
  did.value = await sdk.getDID();
});
</script>

<template>
  <div>
    <div>Ready: {{ String(ready) }}</div>
    <pre>{{ JSON.stringify(did, null, 2) }}</pre>
  </div>
  
</template>


