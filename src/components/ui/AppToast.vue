<script setup lang="ts">
import { CheckCircle2, CircleAlert, Info } from 'lucide-vue-next'
import { useUiStore } from '@/stores/ui'
const ui = useUiStore()
</script>

<template><Teleport to="body"><Transition name="toast"><div v-if="ui.toast" class="toast" :class="`toast--${ui.toast.tone}`" role="status"><CheckCircle2 v-if="ui.toast.tone === 'success'" :size="20" aria-hidden="true" /><CircleAlert v-else-if="ui.toast.tone === 'error'" :size="20" aria-hidden="true" /><Info v-else :size="20" aria-hidden="true" /><span>{{ ui.toast.message }}</span></div></Transition></Teleport></template>

<style scoped>
.toast{position:fixed;z-index:var(--z-toast);right:var(--space-4);bottom:calc(var(--space-4) + env(safe-area-inset-bottom));left:var(--space-4);display:flex;align-items:center;gap:var(--space-3);width:min(calc(100% - 32px),440px);min-height:52px;margin-left:auto;padding:var(--space-3) var(--space-4);color:#fff;border-radius:var(--radius-md);background:#29241e;box-shadow:0 16px 40px rgb(31 21 12/.25);font-weight:700}.toast--success{background:var(--color-positive)}.toast--error{background:var(--color-danger)}.toast-enter-active,.toast-leave-active{transition:opacity 160ms ease,transform 160ms ease}.toast-enter-from,.toast-leave-to{opacity:0;transform:translateY(12px)}
</style>
