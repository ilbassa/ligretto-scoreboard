<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { Camera, Link } from 'lucide-vue-next'
import { Html5Qrcode } from 'html5-qrcode'
import { useRouter } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppModal from '@/components/ui/AppModal.vue'
import { parseJoinCode } from '@/services/syncProtocol'
import { useGameStore } from '@/stores/game'
import { useP2pStore } from '@/stores/p2p'
import { createId } from '@/utils/id'

const props = withDefaults(defineProps<{ open: boolean; initialCode?: string }>(), { initialCode: '' })
const emit = defineEmits<{ close: [] }>()
const router = useRouter()
const gameStore = useGameStore()
const sync = useP2pStore()
const scannerId = `qr-reader-${createId()}`
const manualCode = ref('')
const error = ref('')
const scannerActive = ref(false)
const replaceOpen = ref(false)
const pendingPeerId = ref('')
let scanner: Html5Qrcode | undefined
let joiningStartedAt = 0

async function stopScanner() {
  if (!scanner) return
  const current = scanner
  scanner = undefined
  scannerActive.value = false
  try { if (current.isScanning) await current.stop() } catch { /* Camera may already be closed. */ }
  try { current.clear() } catch { /* Reader may already be detached. */ }
}

async function startScanner() {
  await stopScanner()
  error.value = ''
  try {
    const current = new Html5Qrcode(scannerId)
    scanner = current
    scannerActive.value = true
    await current.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 230, height: 230 }, aspectRatio: 1 },
      (decodedText) => { void acceptScannedCode(decodedText) },
      () => undefined
    )
  } catch {
    error.value = 'Fotocamera non disponibile. Inserisci il codice sessione qui sotto.'
    await stopScanner()
  }
}

async function acceptScannedCode(decodedText: string) {
  const peerId = parseJoinCode(decodedText)
  if (!peerId) {
    error.value = 'QR o codice sessione non valido.'
    return
  }
  manualCode.value = peerId
  await stopScanner()
  submitCode()
}

function connect(peerId: string) {
  replaceOpen.value = false
  joiningStartedAt = Date.now()
  error.value = ''
  sync.joinHost(peerId)
}

function submitCode() {
  const peerId = parseJoinCode(manualCode.value)
  if (!peerId) { error.value = 'QR o codice sessione non valido.'; return }
  manualCode.value = peerId
  if (peerId === sync.localPeerId && sync.role === 'host') { error.value = 'Questo è il codice del dispositivo Host.'; return }
  pendingPeerId.value = peerId
  if (gameStore.hasActiveGame && !(sync.role === 'client' && sync.hostId === peerId)) replaceOpen.value = true
  else connect(peerId)
}

async function close() {
  await stopScanner()
  replaceOpen.value = false
  emit('close')
}

watch(() => props.open, async (open) => {
  if (!open) { await stopScanner(); return }
  manualCode.value = props.initialCode
  error.value = ''
  await nextTick()
  if (manualCode.value) submitCode()
  else await startScanner()
}, { immediate: true })

watch(() => sync.lastSnapshotAt, async (timestamp) => {
  if (!props.open || !timestamp || timestamp < joiningStartedAt) return
  await stopScanner()
  emit('close')
  await router.push({ name: 'scoreboard' })
})

watch(() => sync.errorMessage, (message) => { if (props.open && message) error.value = message })
onBeforeUnmount(() => { void stopScanner() })
</script>

<template>
  <AppModal :open="open" title="Connetti tramite QR" @close="close">
    <div class="join-content">
      <p>Inquadra il QR Code mostrato dall’Host oppure inserisci il codice della sessione.</p>
      <div :id="scannerId" class="scanner" :class="{ 'scanner--hidden': Boolean(props.initialCode) }"></div>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <div class="manual-entry">
        <AppInput v-model="manualCode" label="Codice sessione" autocomplete="off" @keyup.enter="submitCode" />
        <AppButton :icon="Link" :disabled="sync.status === 'connecting'" @click="submitCode">{{ sync.status === 'connecting' ? 'Connessione…' : 'Connetti' }}</AppButton>
      </div>
      <AppButton v-if="!scannerActive && !props.initialCode" variant="ghost" :icon="Camera" @click="startScanner">Riprova fotocamera</AppButton>
      <small>La fotocamera richiede HTTPS o localhost. Non vengono registrate immagini.</small>
    </div>
  </AppModal>
  <AppConfirmDialog :open="replaceOpen" title="Sostituire la partita locale?" message="Quando la connessione sarà stabilita, la partita ricevuta dall’Host sostituirà quella salvata su questo dispositivo." confirm-label="Connetti e sostituisci" @close="replaceOpen=false" @confirm="connect(pendingPeerId)" />
</template>

<style scoped>
.join-content{display:grid;gap:var(--space-4)}.join-content>p{margin:0;color:var(--color-text-muted);line-height:1.55}.scanner{min-height:260px;border-radius:var(--radius-md);background:var(--color-surface-subtle);overflow:hidden}.scanner--hidden{display:none}.manual-entry{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:end;gap:var(--space-3)}.error{color:var(--color-danger)!important;font-size:var(--text-sm)}small{color:var(--color-text-muted);line-height:1.45}@media(max-width:520px){.manual-entry{grid-template-columns:1fr}.manual-entry :deep(button){width:100%}}
</style>
