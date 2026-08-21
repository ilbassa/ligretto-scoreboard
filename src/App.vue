<script setup lang="ts">
import AppToast from '@/components/ui/AppToast.vue'
import { useP2pStore } from '@/stores/p2p'

useP2pStore().initialize()
</script>

<template>
  <div class="app-shell">
    <a class="skip-link" href="#contenuto">Vai al contenuto</a>
    <main id="contenuto"><RouterView /></main>
    <AppToast />
  </div>
</template>
