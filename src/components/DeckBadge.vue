<script setup lang="ts">
import { CircleDot, Zap } from 'lucide-vue-next'
import { computed } from 'vue'
import type { DeckDefinition } from '@/models'
import { deckAccent, deckLabel, scoreboardDeckLabel } from '@/constants/decks'
const props = defineProps<{ deck: DeckDefinition; compact?: boolean; showBox?: boolean }>()
const accessibleLabel = computed(() => props.showBox === false ? scoreboardDeckLabel(props.deck) : deckLabel(props.deck))
</script>

<template><span class="deck-badge" :class="{ 'deck-badge--compact': compact }" :aria-label="accessibleLabel"><span class="deck-badge__card" :style="{ color: deckAccent(deck) }"><Zap v-if="deck.symbol === 'Fulmine'" :size="21" aria-hidden="true" /><CircleDot v-else :size="21" aria-hidden="true" /></span><span class="deck-badge__label"><strong v-if="showBox !== false">{{ deck.box }}</strong><small>{{ deck.symbol }} {{ deck.deckColor }}</small></span></span></template>

<style scoped>
.deck-badge{display:inline-flex;align-items:center;gap:var(--space-2);min-width:0}.deck-badge__card{position:relative;width:40px;height:52px;display:grid;place-items:center;flex:0 0 auto;border:3px solid currentColor;border-radius:7px;background:var(--color-surface);box-shadow:0 2px 0 rgb(31 21 12/.13)}.deck-badge__card::before,.deck-badge__card::after{content:"";position:absolute;border:1px solid currentColor;border-radius:3px;opacity:.35}.deck-badge__card::before{inset:4px}.deck-badge__card::after{inset:7px}.deck-badge__card svg{position:relative;z-index:1;fill:color-mix(in srgb,currentColor 20%,transparent)}.deck-badge__label{display:grid;line-height:1.15}.deck-badge__label strong{font-size:var(--text-sm)}.deck-badge__label small{margin-top:3px;color:var(--color-text-muted)}.deck-badge--compact .deck-badge__card{width:34px;height:44px}.deck-badge--compact .deck-badge__label{display:none}
</style>
