<script setup lang="ts">
import { computed, useId } from 'vue'

export interface SelectOption { value: string; label: string; disabled?: boolean }
const props = defineProps<{ modelValue: string; label: string; options: SelectOption[]; error?: string; required?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const id = useId()
const describedBy = computed(() => props.error ? `${id}-error` : undefined)
</script>

<template>
  <label class="field" :for="id">
    <span class="field__label">{{ label }}<span v-if="required" aria-hidden="true"> *</span></span>
    <select :id="id" class="field__control" :class="{ 'field__control--error': error }" :value="modelValue" :required="required" :aria-invalid="Boolean(error)" :aria-describedby="describedBy" @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)">
      <option value="">Scegli un dorso</option>
      <option v-for="option in options" :key="option.value" :value="option.value" :disabled="option.disabled">{{ option.label }}</option>
    </select>
    <span v-if="error" :id="`${id}-error`" class="field__error">{{ error }}</span>
  </label>
</template>

<style scoped>
.field{display:grid;gap:var(--space-2)}.field__label{font-size:var(--text-sm);font-weight:750}.field__control{width:100%;min-height:var(--control-height);padding:0 var(--space-3);color:var(--color-text);border:1px solid var(--color-border);border-radius:var(--radius-sm);background:var(--color-surface)}.field__control--error{border-color:var(--color-danger)}.field__error{color:var(--color-danger);font-size:var(--text-sm)}
</style>
