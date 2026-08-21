<script setup lang="ts">
import { computed, useId } from 'vue'

const props = withDefaults(defineProps<{
  modelValue?: string | number
  label: string
  type?: string
  error?: string
  hint?: string
  inputmode?: 'none' | 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url'
  min?: string | number
  max?: string | number
  step?: string | number
  autocomplete?: string
  required?: boolean
  disabled?: boolean
}>(), { modelValue: '', type: 'text', disabled: false })
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const id = useId()
const describedBy = computed(() => props.error ? `${id}-error` : props.hint ? `${id}-hint` : undefined)
</script>

<template>
  <label class="field" :for="id">
    <span class="field__label">{{ label }}<span v-if="required" aria-hidden="true"> *</span></span>
    <input :id="id" class="field__control" :class="{ 'field__control--error': error }" :value="modelValue" :type="type" :inputmode="inputmode" :min="min" :max="max" :step="step" :autocomplete="autocomplete" :required="required" :disabled="disabled" :aria-invalid="Boolean(error)" :aria-describedby="describedBy" @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)" />
    <span v-if="error" :id="`${id}-error`" class="field__error">{{ error }}</span>
    <span v-else-if="hint" :id="`${id}-hint`" class="field__hint">{{ hint }}</span>
  </label>
</template>

<style scoped>
.field{display:grid;gap:var(--space-2)}.field__label{font-size:var(--text-sm);font-weight:750}.field__control{width:100%;min-height:var(--control-height);padding:0 var(--space-3);color:var(--color-text);border:1px solid var(--color-border);border-radius:var(--radius-sm);background:var(--color-surface);font-variant-numeric:tabular-nums}.field__control:disabled{color:var(--color-text-muted);background:var(--color-surface-subtle);cursor:not-allowed}.field__control--error{border-color:var(--color-danger)}.field__error{color:var(--color-danger);font-size:var(--text-sm)}.field__hint{color:var(--color-text-muted);font-size:var(--text-sm)}
</style>
