<script setup lang="ts">
import type { Component } from 'vue'
defineProps<{ label: string; icon: Component; disabled?: boolean }>()
</script>

<template><button type="button" class="icon-button" :aria-label="label" :title="label" :disabled="disabled"><component :is="icon" :size="22" aria-hidden="true" /></button></template>

<style scoped>
.icon-button{width:44px;height:44px;display:grid;place-items:center;padding:0;color:var(--color-text);border:1px solid var(--color-border);border-radius:12px;background:var(--color-surface);cursor:pointer}.icon-button:hover:not(:disabled){background:var(--color-surface-subtle)}.icon-button:disabled{opacity:.4;cursor:not-allowed}
</style>
