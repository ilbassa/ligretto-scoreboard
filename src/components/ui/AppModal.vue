<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { X } from 'lucide-vue-next'
import AppIconButton from './AppIconButton.vue'

const props = defineProps<{ open: boolean; title: string; wide?: boolean }>()
const emit = defineEmits<{ close: [] }>()
const dialog = ref<HTMLElement | null>(null)
let returnFocus: HTMLElement | null = null

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') emit('close')
  if (event.key !== 'Tab' || !dialog.value) return
  const items = [...dialog.value.querySelectorAll<HTMLElement>('button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])')].filter((item) => !item.hasAttribute('disabled'))
  if (!items.length) return
  const first = items[0]
  const last = items[items.length - 1]
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
}

watch(() => props.open, async (open) => {
  if (open) {
    returnFocus = document.activeElement as HTMLElement
    document.addEventListener('keydown', onKeydown)
    document.body.classList.add('modal-open')
    await nextTick()
    dialog.value?.querySelector<HTMLElement>('button, input, select, textarea')?.focus()
  } else {
    document.removeEventListener('keydown', onKeydown)
    document.body.classList.remove('modal-open')
    returnFocus?.focus()
  }
})
onBeforeUnmount(() => { document.removeEventListener('keydown', onKeydown); document.body.classList.remove('modal-open') })
</script>

<template>
  <Teleport to="body"><Transition name="fade"><div v-if="open" class="overlay" @mousedown.self="emit('close')"><section ref="dialog" class="modal" :class="{ 'modal--wide': wide }" role="dialog" aria-modal="true" :aria-labelledby="`modal-${title}`"><header><h2 :id="`modal-${title}`">{{ title }}</h2><AppIconButton label="Chiudi" :icon="X" @click="emit('close')" /></header><div class="modal__body"><slot /></div><footer v-if="$slots.footer"><slot name="footer" /></footer></section></div></Transition></Teleport>
</template>

<style scoped>
.overlay{position:fixed;inset:0;z-index:var(--z-overlay);display:grid;align-items:end;padding:var(--space-3);background:rgb(31 21 12/.66)}.modal{width:min(100%,540px);max-height:min(88vh,820px);display:flex;flex-direction:column;margin:0 auto;border:1px solid var(--color-border);border-radius:var(--radius-xl);background:var(--color-surface);overflow:hidden;box-shadow:0 28px 80px rgb(31 21 12/.32)}.modal--wide{width:min(100%,860px)}.modal header{display:flex;align-items:center;justify-content:space-between;gap:var(--space-3);padding:var(--space-4) var(--space-5);border-bottom:1px solid var(--color-border)}.modal h2{margin:0;font-size:var(--text-lg)}.modal__body{padding:var(--space-5);overflow:auto}.modal footer{display:flex;justify-content:flex-end;gap:var(--space-3);padding:var(--space-4) var(--space-5);border-top:1px solid var(--color-border)}@media(min-width:600px){.overlay{align-items:center}}
</style>
