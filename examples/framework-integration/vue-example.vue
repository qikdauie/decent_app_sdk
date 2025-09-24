<script setup>
import { ref, onMounted } from 'vue';
import { DecentApp } from '../../src/client/index.js';

const ready = ref(false);
const did = ref(null);

onMounted(async () => {
  const sdk = new DecentApp({ serviceWorkerUrl: '/worker/sw.js' });
  await sdk.ready;
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


