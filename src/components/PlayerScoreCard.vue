<script setup lang="ts">
import { computed, type CSSProperties } from 'vue'
import { Check, Crown, Save } from 'lucide-vue-next'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppInput from '@/components/ui/AppInput.vue'
import DeckBadge from '@/components/DeckBadge.vue'
import { deckAccent, getDeck, scoreboardDeckLabel } from '@/constants/decks'
import type { Player, PlayerHandDraft } from '@/models'
import { calculateHandScore } from '@/services/scoring'

const props = withDefaults(defineProps<{ player: Player; draft: PlayerHandDraft; saved: boolean; disabled?: boolean }>(), { disabled: false })
const emit = defineEmits<{
  'update-score': [field: 'positive' | 'negative', value: number]
  'update-winner': [selected: boolean]
  save: []
}>()
const deck = computed(() => getDeck(props.player.deckId))
const cardStyle = computed<CSSProperties>(() => ({ '--deck-accent': deck.value ? deckAccent(deck.value) : 'var(--color-primary)' } as CSSProperties))
const preview = computed(() => calculateHandScore(props.draft.positive, props.draft.negative))
const scoreLabel = computed(() => `${preview.value >= 0 ? '+' : ''}${preview.value}`)

function setNumber(field: 'positive' | 'negative', value: string) {
  emit('update-score', field, value === '' ? 0 : Number(value))
}
</script>

<template>
  <AppCard class="player-shell" :style="cardStyle">
    <article class="player-card" :class="{ 'player-card--winner': draft.isWinner }">
      <header>
        <div class="identity"><DeckBadge v-if="deck" :deck="deck" compact :show-box="false" /><div><p>{{ deck ? scoreboardDeckLabel(deck) : 'Mazzo' }}</p><h2>{{ player.name }}</h2></div></div>
        <div class="total"><span>Totale</span><strong>{{ player.totalScore }}</strong></div>
      </header>

      <div class="score-entry">
        <AppInput :model-value="draft.negative" label="Pozzetto" type="number" inputmode="numeric" min="0" step="1" :disabled="disabled || draft.isWinner" @update:model-value="setNumber('negative', $event)" />
        <AppInput :model-value="draft.positive" label="Carte sul tavolo" type="number" inputmode="numeric" min="0" step="1" :disabled="disabled" @update:model-value="setNumber('positive', $event)" />
        <AppButton :variant="saved ? 'secondary' : 'primary'" :icon="saved ? Check : Save" :disabled="disabled" :aria-label="saved ? `Punteggio di ${player.name} salvato` : `Salva punteggio di ${player.name}`" :title="saved ? 'Punteggio salvato' : 'Salva punteggio'" @click="emit('save')" />
      </div>

      <div class="result-row">
        <label class="winner-toggle" :class="{ 'winner-toggle--active': draft.isWinner }" :title="draft.isWinner ? 'Vincitore della mano' : 'Imposta come vincitore'">
          <input class="sr-only" type="checkbox" :checked="draft.isWinner" :disabled="disabled" :aria-label="`${player.name} vincitore della mano`" @change="emit('update-winner', ($event.target as HTMLInputElement).checked)" />
          <Crown :size="21" aria-hidden="true" />
        </label>
        <div class="calculation" aria-live="polite">
          <span>{{ draft.positive }} − ({{ draft.negative }} × 2)</span>
          <strong :class="{ negative: preview < 0 }">{{ scoreLabel }}</strong>
        </div>
      </div>

    </article>
  </AppCard>
</template>

<style scoped>
.player-shell{position:relative;border-top:4px solid var(--deck-accent);background:linear-gradient(145deg,color-mix(in srgb,var(--deck-accent) 7%,var(--color-surface)) 0,var(--color-surface) 42%)}.player-card{--action-column:52px;display:grid;gap:var(--space-4)}.player-card>header{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:var(--space-3)}.identity{display:flex;align-items:center;gap:var(--space-3);min-width:0}.identity>div:last-child{min-width:0}.identity p,.total span{margin:0;color:var(--color-text-muted);font-size:var(--text-xs);font-weight:750;text-transform:uppercase;letter-spacing:.055em}.identity h2{margin:3px 0 0;font-size:var(--text-lg);overflow-wrap:anywhere}.total{display:grid;justify-items:end;flex:0 0 auto}.total strong{font-size:2.15rem;line-height:1;font-variant-numeric:tabular-nums;letter-spacing:-.05em}.winner-toggle{width:var(--action-column);min-height:44px;display:inline-flex;align-items:center;justify-content:center;padding:0;color:var(--color-text-muted);border:1px solid var(--color-border);border-radius:var(--radius-sm);background:var(--color-surface);cursor:pointer}.winner-toggle:has(input:disabled){opacity:.45;cursor:not-allowed}.winner-toggle:has(input:focus-visible){outline:3px solid color-mix(in srgb,var(--deck-accent) 55%,transparent);outline-offset:2px}.winner-toggle--active{color:var(--deck-accent);border-color:var(--deck-accent);background:color-mix(in srgb,var(--deck-accent) 12%,var(--color-surface))}.winner-toggle--active svg{fill:color-mix(in srgb,var(--deck-accent) 24%,transparent)}.score-entry{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) var(--action-column);align-items:end;gap:var(--space-3)}.score-entry :deep(.app-button){width:var(--action-column);min-width:var(--action-column);padding:0}.result-row{display:grid;grid-template-columns:var(--action-column) minmax(0,1fr);gap:var(--space-3)}.calculation{grid-column:2;min-height:44px;display:flex;align-items:center;justify-content:space-between;padding:6px var(--space-3);border-radius:var(--radius-sm);background:color-mix(in srgb,var(--deck-accent) 7%,var(--color-surface-subtle));font-variant-numeric:tabular-nums}.calculation span{color:var(--color-text-muted);font-size:var(--text-sm)}.calculation strong{color:var(--color-positive);font-size:var(--text-xl)}.calculation strong.negative{color:var(--color-danger)}.player-card--winner .total strong{color:var(--deck-accent)}@media(max-width:500px){.player-card{--action-column:50px}.score-entry,.result-row{gap:var(--space-2)}.winner-toggle svg{width:18px}}@media(max-width:370px){.identity{gap:var(--space-2)}.identity p{display:none}.total strong{font-size:1.8rem}.calculation{padding-right:var(--space-2);padding-left:var(--space-2)}}
</style>
