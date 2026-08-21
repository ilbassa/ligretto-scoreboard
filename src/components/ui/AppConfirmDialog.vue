<script setup lang="ts">
import AppButton from './AppButton.vue'
import AppModal from './AppModal.vue'
defineProps<{ open: boolean; title: string; message: string; confirmLabel?: string }>()
defineEmits<{ close: []; confirm: [] }>()
</script>

<template><AppModal :open="open" :title="title" @close="$emit('close')"><p class="message">{{ message }}</p><template #footer><AppButton variant="ghost" @click="$emit('close')">Annulla</AppButton><AppButton variant="danger" @click="$emit('confirm')">{{ confirmLabel ?? 'Conferma' }}</AppButton></template></AppModal></template>

<style scoped>.message{margin:0;color:var(--color-text-muted);line-height:1.65}</style>
