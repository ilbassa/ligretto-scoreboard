<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
defineProps<{ title: string; subtitle?: string; back?: boolean }>()
const router = useRouter()
</script>

<template><header class="page-header"><button v-if="back" type="button" class="back" aria-label="Torna indietro" @click="router.back()"><ArrowLeft :size="22" aria-hidden="true" /></button><div><p v-if="subtitle">{{ subtitle }}</p><h1>{{ title }}</h1></div><div v-if="$slots.actions" class="actions"><slot name="actions" /></div></header></template>

<style scoped>
.page-header{display:flex;align-items:center;gap:var(--space-3)}.page-header>div:nth-child(2){min-width:0;flex:1}.page-header p{margin:0 0 2px;color:var(--color-text-muted);font-size:var(--text-sm);font-weight:700}.page-header h1{margin:0;font-size:clamp(1.65rem,5vw,2.25rem);letter-spacing:-.035em}.back{width:44px;height:44px;display:grid;place-items:center;flex:0 0 auto;padding:0;color:var(--color-text);border:1px solid var(--color-border);border-radius:12px;background:var(--color-surface);cursor:pointer}.actions{display:flex;align-items:center;gap:var(--space-2)}
</style>
