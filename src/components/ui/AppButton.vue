<script setup lang="ts">
import type { Component } from 'vue'

withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  type?: 'button' | 'submit' | 'reset'
  block?: boolean
  disabled?: boolean
  icon?: Component
}>(), { variant: 'primary', type: 'button', block: false, disabled: false })
</script>

<template>
  <button :type="type" class="app-button" :class="[`app-button--${variant}`, { 'app-button--block': block }]" :disabled="disabled">
    <component :is="icon" v-if="icon" :size="20" aria-hidden="true" />
    <slot />
  </button>
</template>

<style scoped>
.app-button{min-height:var(--control-height);display:inline-flex;align-items:center;justify-content:center;gap:var(--space-2);padding:0 var(--space-5);border:1px solid transparent;border-radius:var(--radius-md);font-weight:800;cursor:pointer;transition:transform 140ms ease,background 140ms ease}.app-button:not(:disabled):active{transform:translateY(1px)}.app-button:disabled{opacity:.45;cursor:not-allowed}.app-button--block{width:100%}.app-button--primary{color:var(--color-on-primary);background:var(--color-primary);box-shadow:0 8px 20px rgb(224 74 25/.2)}.app-button--primary:hover{background:var(--color-primary-strong)}.app-button--secondary{color:var(--color-text);border-color:var(--color-border);background:var(--color-surface)}.app-button--secondary:hover{background:var(--color-surface-subtle)}.app-button--danger{color:#fff;background:var(--color-danger)}.app-button--ghost{color:var(--color-text);background:transparent}.app-button--ghost:hover{background:var(--color-surface-subtle)}
</style>
