<script setup lang="ts">
import AppToast from '@/components/ui/AppToast.vue'
</script>

<template>
  <div class="app-shell">
    <a class="skip-link" href="#contenuto">Vai al contenuto</a>
    <main id="contenuto"><RouterView /></main>
    <AppToast />
  </div>
</template>
