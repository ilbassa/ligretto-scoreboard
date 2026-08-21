<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { Minus, Plus, Users } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppIconButton from '@/components/ui/AppIconButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import DeckBadge from '@/components/DeckBadge.vue'
import { deckLabel, decks, getDeck } from '@/constants/decks'
import type { PlayerSetup } from '@/models'
import { useGameStore } from '@/stores/game'
import { useUiStore } from '@/stores/ui'

const router = useRouter()
const gameStore = useGameStore()
const ui = useUiStore()
gameStore.initialize()
const playerCount = ref(2)
const entries = reactive<PlayerSetup[]>([
  { name: '', deckId: decks[0]?.id ?? '' },
  { name: '', deckId: decks[1]?.id ?? '' }
])
const submitted = ref(false)

watch(playerCount, (count) => {
  while (entries.length < count) entries.push({ name: '', deckId: firstAvailableDeck() })
  if (entries.length > count) entries.splice(count)
})

const usedDeckIds = computed(() => new Set(entries.map((entry) => entry.deckId).filter(Boolean)))
const normalizedNames = computed(() => entries.map((entry) => entry.name.trim().toLocaleLowerCase('it-IT')))

function firstAvailableDeck() {
  return decks.find((deck) => !entries.some((entry) => entry.deckId === deck.id))?.id ?? ''
}

function optionsFor(index: number) {
  const selected = entries[index]?.deckId
  return decks.map((deck) => ({ value: deck.id, label: deckLabel(deck), disabled: deck.id !== selected && usedDeckIds.value.has(deck.id) }))
}

function nameError(index: number) {
  if (!submitted.value) return
  const name = normalizedNames.value[index]
  if (!name) return 'Inserisci il nome.'
  if (normalizedNames.value.filter((item) => item === name).length > 1) return 'Nome già utilizzato.'
}

function deckError(index: number) {
  if (!submitted.value) return
  const deckId = entries[index]?.deckId
  if (!deckId) return 'Scegli un dorso.'
  if (entries.filter((entry) => entry.deckId === deckId).length > 1) return 'Dorso già assegnato.'
}

function changeCount(delta: number) {
  playerCount.value = Math.min(12, Math.max(2, playerCount.value + delta))
}

function submit() {
  submitted.value = true
  if (entries.some((_, index) => nameError(index) || deckError(index))) {
    ui.notify('Controlla i dati dei giocatori.', 'error')
    return
  }
  try {
    gameStore.startGame(entries)
    router.push({ name: 'scoreboard' })
  } catch (error) {
    ui.notify(error instanceof Error ? error.message : 'Non è stato possibile creare la partita.', 'error')
  }
}
</script>

<template>
  <div class="app-page setup-page">
    <AppPageHeader title="Nuova partita" subtitle="Configura il tavolo" back />
    <AppCard>
      <section class="player-count">
        <div class="player-count__copy"><span class="count-icon"><Users :size="23" aria-hidden="true" /></span><div><h2>Quanti giocatori?</h2><p>Da 2 a 12 partecipanti</p></div></div>
        <div class="stepper"><AppIconButton label="Riduci giocatori" :icon="Minus" :disabled="playerCount <= 2" @click="changeCount(-1)" /><output aria-live="polite">{{ playerCount }}</output><AppIconButton label="Aumenta giocatori" :icon="Plus" :disabled="playerCount >= 12" @click="changeCount(1)" /></div>
      </section>
    </AppCard>

    <form class="setup-form" novalidate @submit.prevent="submit">
      <div class="players-grid">
        <AppCard v-for="(entry, index) in entries" :key="index">
          <section class="player-setup">
            <div class="player-number"><span>{{ index + 1 }}</span><strong>Giocatore {{ index + 1 }}</strong></div>
            <AppInput v-model="entry.name" label="Nome" autocomplete="off" :error="nameError(index)" required />
            <AppSelect v-model="entry.deckId" label="Dorso delle carte" :options="optionsFor(index)" :error="deckError(index)" required />
            <div v-if="getDeck(entry.deckId)" class="deck-preview"><span>Dorso scelto</span><DeckBadge :deck="getDeck(entry.deckId)!" /></div>
          </section>
        </AppCard>
      </div>
      <div class="submit-bar"><div><strong>Tutto pronto?</strong><span>{{ playerCount }} giocatori · Mano 1</span></div><AppButton type="submit">Inizia partita</AppButton></div>
    </form>
  </div>
</template>

<style scoped>
.setup-page{padding-bottom:120px}.player-count{display:flex;align-items:center;justify-content:space-between;gap:var(--space-4)}.player-count__copy{display:flex;align-items:center;gap:var(--space-3)}.count-icon{width:48px;height:48px;display:grid;place-items:center;color:var(--color-accent-text);border-radius:14px;background:var(--color-primary-soft)}.player-count h2{margin:0;font-size:var(--text-lg)}.player-count p{margin:3px 0 0;color:var(--color-text-muted);font-size:var(--text-sm)}.stepper{display:flex;align-items:center;gap:var(--space-2)}.stepper output{min-width:42px;text-align:center;font-size:var(--text-xl);font-weight:900;font-variant-numeric:tabular-nums}.setup-form{display:grid;gap:var(--space-5)}.players-grid{display:grid;gap:var(--space-4)}.player-setup{display:grid;gap:var(--space-4)}.player-number{display:flex;align-items:center;gap:var(--space-2)}.player-number>span{width:30px;height:30px;display:grid;place-items:center;color:var(--color-on-primary);border-radius:50%;background:var(--color-primary);font-weight:900}.deck-preview{display:flex;align-items:center;justify-content:space-between;gap:var(--space-3);padding:var(--space-3);border-radius:var(--radius-md);background:var(--color-surface-subtle)}.deck-preview>span{color:var(--color-text-muted);font-size:var(--text-sm);font-weight:750}.submit-bar{position:fixed;z-index:var(--z-nav);right:0;bottom:0;left:0;display:flex;align-items:center;justify-content:space-between;gap:var(--space-4);padding:var(--space-3) max(var(--space-4),calc((100% - 960px)/2));padding-bottom:calc(var(--space-3) + env(safe-area-inset-bottom));border-top:1px solid var(--color-border);background:color-mix(in srgb,var(--color-bg) 92%,transparent);backdrop-filter:blur(12px)}.submit-bar>div{display:grid}.submit-bar span{color:var(--color-text-muted);font-size:var(--text-sm)}@media(min-width:720px){.players-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:520px){.player-count{align-items:flex-start;flex-direction:column}.stepper{align-self:stretch;justify-content:space-between}.submit-bar>div{display:none}.submit-bar :deep(button){width:100%}}
</style>
