<script setup lang="ts">
import { computed } from 'vue'
import { Crown } from 'lucide-vue-next'
import AppModal from '@/components/ui/AppModal.vue'
import type { Player } from '@/models'
import { progressiveTotal } from '@/services/scoring'

const props = defineProps<{ open: boolean; players: Player[] }>()
defineEmits<{ close: [] }>()

const hands = computed(() => {
  const numbers = new Set(props.players.flatMap((player) => player.history.map((result) => result.hand)))
  return [...numbers].sort((a, b) => a - b)
})
</script>

<template>
  <AppModal :open="open" title="Storico della partita" wide @close="$emit('close')">
    <div v-if="!hands.length" class="empty-history"><Crown :size="32" aria-hidden="true" /><h3>Nessuna mano salvata</h3><p>I risultati compariranno qui dopo il primo salvataggio.</p></div>
    <div v-else class="history-list">
      <section v-for="hand in hands" :key="hand" class="hand-group">
        <h3>Mano {{ hand }}</h3>
        <ul>
          <li v-for="player in players" :key="player.id">
            <template v-if="player.history.find((item) => item.hand === hand)">
              <div class="player-name"><Crown v-if="player.history.find((item) => item.hand === hand)?.isWinner" :size="17" aria-label="Vincitore della mano" /><strong>{{ player.name }}</strong></div>
              <p v-if="player.history.find((item) => item.hand === hand)" class="formula">
                <strong :class="{ negative: (player.history.find((item) => item.hand === hand)?.handScore ?? 0) < 0 }">{{ (player.history.find((item) => item.hand === hand)?.handScore ?? 0) >= 0 ? '+' : '' }}{{ player.history.find((item) => item.hand === hand)?.handScore }}</strong>
                <span>{{ player.history.find((item) => item.hand === hand)?.positive }} pos − {{ player.history.find((item) => item.hand === hand)?.negative }} neg × 2</span>
              </p>
              <span class="progressive">Totale {{ progressiveTotal(player.history, hand) }}</span>
            </template>
            <template v-else><strong>{{ player.name }}</strong><span class="missing">Non salvato</span></template>
          </li>
        </ul>
      </section>
    </div>
  </AppModal>
</template>

<style scoped>
.empty-history{display:grid;justify-items:center;padding:var(--space-8) 0;text-align:center}.empty-history h3{margin:var(--space-3) 0 var(--space-2)}.empty-history p{margin:0;color:var(--color-text-muted)}.history-list{display:grid;gap:var(--space-5)}.hand-group{display:grid;gap:var(--space-3)}.hand-group h3{margin:0;font-size:var(--text-lg)}.hand-group ul{display:grid;gap:1px;margin:0;padding:0;border:1px solid var(--color-border);border-radius:var(--radius-md);background:var(--color-border);overflow:hidden;list-style:none}.hand-group li{display:grid;grid-template-columns:minmax(110px,.8fr) minmax(180px,1.4fr) auto;align-items:center;gap:var(--space-3);padding:var(--space-3);background:var(--color-surface)}.player-name{display:flex;align-items:center;gap:var(--space-2)}.player-name svg{color:#c48400}.formula{display:flex;align-items:center;gap:var(--space-3);margin:0}.formula strong{min-width:42px;color:var(--color-positive);font-size:var(--text-lg);font-variant-numeric:tabular-nums}.formula strong.negative{color:var(--color-danger)}.formula span,.progressive,.missing{color:var(--color-text-muted);font-size:var(--text-sm)}.progressive{font-weight:750;white-space:nowrap}@media(max-width:620px){.hand-group li{grid-template-columns:1fr auto}.formula{grid-column:1/-1;grid-row:2}.progressive{grid-column:2;grid-row:1}.missing{grid-column:2}}
</style>
