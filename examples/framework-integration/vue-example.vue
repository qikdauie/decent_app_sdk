<script setup>
import { ref, onMounted, provide, inject } from 'vue';
// Prefer package export in apps; for SDK development, you may import from '../../src/client/singleton.js'.
import { getReadyDecentClient } from 'decent_app_sdk';

const ready = ref(false);
const did = ref(null);

onMounted(async () => {
  const sdk = await getReadyDecentClient({ serviceWorkerUrl: '/sw.js' });
  provide('decentSdk', sdk);
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


