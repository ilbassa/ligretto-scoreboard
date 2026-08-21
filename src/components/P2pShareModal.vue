<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Copy, Radio } from 'lucide-vue-next'
import QRCode from 'qrcode'
import AppButton from '@/components/ui/AppButton.vue'
import AppModal from '@/components/ui/AppModal.vue'
import { buildJoinUrl } from '@/services/syncProtocol'
import { useP2pStore } from '@/stores/p2p'
import { useUiStore } from '@/stores/ui'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()
const sync = useP2pStore()
const ui = useUiStore()
const qrDataUrl = ref('')
const qrError = ref('')
const joinUrl = computed(() => sync.hostId ? buildJoinUrl(sync.hostId) : '')

async function renderQr() {
  if (!joinUrl.value) return
  try {
    qrDataUrl.value = await QRCode.toDataURL(joinUrl.value, { width: 320, margin: 2, errorCorrectionLevel: 'M', color: { dark: '#24150e', light: '#ffffff' } })
    qrError.value = ''
  } catch { qrError.value = 'Non è stato possibile generare il QR Code.' }
}

watch(() => props.open, (open) => {
  if (!open) return
  if (sync.role !== 'host') {
    try { sync.startHost() } catch (error) { qrError.value = error instanceof Error ? error.message : 'Condivisione non disponibile.' }
  } else void renderQr()
})
watch(() => sync.hostId, () => { if (props.open) void renderQr() })

async function copyCode() {
  if (!sync.hostId) return
  try {
    await navigator.clipboard.writeText(sync.hostId)
    ui.notify('Codice sessione copiato.', 'success')
  } catch { ui.notify('Copia non disponibile: seleziona il codice manualmente.', 'error') }
}
</script>

<template>
  <AppModal :open="open" title="Condividi Partita" @close="emit('close')">
    <div class="share-content">
      <div v-if="sync.status === 'connecting'" class="loading"><Radio :size="24" aria-hidden="true" /><strong>Creazione della sessione…</strong></div>
      <template v-else-if="sync.hostId">
        <p>Fai scansionare questo codice agli altri dispositivi. I dati della partita passeranno direttamente tra i browser.</p>
        <img v-if="qrDataUrl" class="qr-code" :src="qrDataUrl" alt="QR Code per entrare nella partita" width="320" height="320">
        <p v-if="qrError" class="error" role="alert">{{ qrError }}</p>
        <div class="session-code"><span>Codice sessione</span><code>{{ sync.hostId }}</code></div>
        <AppButton variant="secondary" :icon="Copy" block @click="copyCode">Copia codice</AppButton>
        <p class="presence">{{ sync.connectedDevices > 1 ? `${sync.connectedDevices} dispositivi collegati` : 'In attesa di partecipanti…' }}</p>
      </template>
      <p v-else class="error" role="alert">{{ sync.errorMessage || qrError }}</p>
    </div>
  </AppModal>
</template>

<style scoped>
.share-content{display:grid;justify-items:center;gap:var(--space-4);text-align:center}.share-content>p{margin:0;color:var(--color-text-muted);line-height:1.55}.loading{display:flex;align-items:center;gap:var(--space-3);padding:var(--space-6);color:var(--color-accent-text)}.loading svg{animation:pulse 1.2s ease-in-out infinite}.qr-code{width:min(100%,320px);height:auto;padding:8px;border:1px solid var(--color-border);border-radius:var(--radius-md);background:#fff}.session-code{width:100%;display:grid;gap:6px;padding:var(--space-3);border-radius:var(--radius-md);background:var(--color-surface-subtle);text-align:left}.session-code span{color:var(--color-text-muted);font-size:var(--text-xs);font-weight:800;text-transform:uppercase}.session-code code{overflow-wrap:anywhere;font-size:var(--text-sm);user-select:all}.presence{font-size:var(--text-sm)}.error{color:var(--color-danger)!important}@keyframes pulse{50%{opacity:.35}}
</style>
