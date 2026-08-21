<script setup lang="ts">
import { computed, ref } from 'vue'
import { History, Home, Plus, Trophy } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import HandHistoryModal from '@/components/HandHistoryModal.vue'
import PlayerScoreCard from '@/components/PlayerScoreCard.vue'
import { deckAccent, getDeck } from '@/constants/decks'
import { useGameStore } from '@/stores/game'
import { useUiStore } from '@/stores/ui'

const router = useRouter()
const gameStore = useGameStore()
const ui = useUiStore()
gameStore.initialize()
const historyOpen = ref(false)

const progressLabel = computed(() => {
  const saved = gameStore.players.filter((player) => gameStore.isDraftSaved(player.id)).length
  if (gameStore.canAdvance) return 'Mano completa: puoi continuare.'
  if (gameStore.winnerCount === 0) return `${saved}/${gameStore.players.length} salvati · scegli chi ha detto Ligretto!`
  return `${saved}/${gameStore.players.length} punteggi salvati`
})

const ranking = computed(() => {
  const sorted = [...gameStore.players].sort((first, second) => second.totalScore - first.totalScore || first.name.localeCompare(second.name, 'it-IT'))
  let position = 0
  return sorted.map((player, index) => {
    if (index === 0 || player.totalScore !== sorted[index - 1]?.totalScore) position = index + 1
    const deck = getDeck(player.deckId)
    return { player, position, accent: deck ? deckAccent(deck) : 'var(--color-primary)' }
  })
})

function save(playerId: string, playerName: string) {
  try {
    const score = gameStore.savePlayerScore(playerId)
    ui.notify(`${playerName}: ${score >= 0 ? '+' : ''}${score} punti salvati.`, 'success')
  } catch (error) { ui.notify(error instanceof Error ? error.message : 'Salvataggio non riuscito.', 'error') }
}

function advance() {
  try {
    gameStore.advanceHand()
    ui.notify(`Mano ${gameStore.currentHand} iniziata.`, 'success')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (error) { ui.notify(error instanceof Error ? error.message : 'Completa la mano prima di continuare.', 'error') }
}
</script>

<template>
  <div v-if="gameStore.game" class="scoreboard-page">
    <header class="scoreboard-nav"><button type="button" class="brand-button" aria-label="Torna alla pagina iniziale" @click="router.push({ name: 'landing' })"><span><Home :size="20" aria-hidden="true" /></span><strong>Ligretto</strong></button><span class="current-hand">Mano {{ gameStore.currentHand }}</span><AppButton variant="secondary" :icon="History" @click="historyOpen=true">Mostra storico</AppButton></header>
    <div class="scoreboard-content">
      <section class="game-overview" aria-label="Classifica e avanzamento mano">
        <div class="ranking-panel" aria-labelledby="ranking-title">
          <h2 id="ranking-title"><Trophy :size="17" aria-hidden="true" /> Classifica</h2>
          <ol>
            <li v-for="item in ranking" :key="item.player.id" :style="{ '--player-accent': item.accent }">
              <span class="rank">{{ item.position }}°</span>
              <span class="ranking-name">{{ item.player.name }}</span>
              <strong>{{ item.player.totalScore }}</strong>
            </li>
          </ol>
        </div>
        <div class="hand-status" :class="{ 'hand-status--ready': gameStore.canAdvance }" aria-live="polite"><div><span>{{ progressLabel }}</span><div class="progress-track"><i :style="{ width: `${(gameStore.players.filter((player) => gameStore.isDraftSaved(player.id)).length / gameStore.players.length) * 100}%` }"></i></div></div><AppButton :variant="gameStore.canAdvance ? 'primary' : 'secondary'" :disabled="!gameStore.canAdvance" :icon="Plus" @click="advance">Mano successiva</AppButton></div>
      </section>

      <section class="score-grid" aria-label="Punteggi giocatori">
        <PlayerScoreCard v-for="player in gameStore.players" :key="player.id" :player="player" :draft="gameStore.draftFor(player.id)" :saved="gameStore.isDraftSaved(player.id)" @update-score="(field, value) => gameStore.setDraftValue(player.id, field, value)" @update-winner="gameStore.selectWinner(player.id, $event)" @save="save(player.id, player.name)" />
      </section>
    </div>
    <HandHistoryModal :open="historyOpen" :players="gameStore.players" @close="historyOpen=false" />
  </div>
</template>

<style scoped>
.scoreboard-page{min-height:100vh;padding-bottom:var(--space-8)}.scoreboard-nav{position:sticky;z-index:var(--z-nav);top:0;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:var(--space-3);min-height:72px;padding:var(--space-2) max(var(--space-4),calc((100% - 1120px)/2));border-bottom:1px solid var(--color-border);background:color-mix(in srgb,var(--color-bg) 90%,transparent);backdrop-filter:blur(14px)}.brand-button{display:flex;align-items:center;gap:var(--space-2);justify-self:start;padding:0;border:0;background:transparent;color:var(--color-text);font-size:var(--text-md);cursor:pointer}.brand-button>span{width:38px;height:38px;display:grid;place-items:center;color:var(--color-on-primary);border-radius:11px;background:var(--color-primary)}.current-hand{padding:5px var(--space-3);border-radius:99px;background:var(--color-surface-subtle);font-size:var(--text-lg);font-weight:500;white-space:nowrap}.scoreboard-nav :deep(.app-button){min-height:42px;justify-self:end;gap:6px;padding-right:10px;padding-left:10px}.scoreboard-content{width:min(100% - 32px,1120px);display:grid;gap:var(--space-5);margin:0 auto;padding-top:var(--space-5)}.game-overview{border:1px solid var(--color-border);border-radius:var(--radius-md);background:var(--color-surface);overflow:hidden}.hand-status{display:flex;align-items:center;justify-content:space-between;gap:var(--space-3);padding:9px var(--space-3);border-top:1px solid var(--color-border)}.hand-status>div{display:grid;gap:6px;min-width:0;flex:1}.hand-status span{color:var(--color-text-muted);font-size:var(--text-xs);font-weight:750}.hand-status :deep(.app-button){min-height:38px;padding-right:var(--space-3);padding-left:var(--space-3);font-size:var(--text-sm);white-space:nowrap;box-shadow:none}.progress-track{height:4px;border-radius:99px;background:var(--color-surface-subtle);overflow:hidden}.progress-track i{display:block;height:100%;border-radius:inherit;background:var(--color-primary);transition:width 180ms ease}.hand-status--ready{background:var(--color-positive-soft)}.hand-status--ready span{color:var(--color-positive)}.ranking-panel{min-width:0;display:flex;align-items:center;gap:var(--space-3);padding:7px var(--space-3)}.ranking-panel h2{display:flex;align-items:center;gap:6px;flex:0 0 auto;margin:0;color:var(--color-text-muted);font-size:var(--text-sm)}.ranking-panel h2 svg{color:#ad7600}.ranking-panel ol{display:flex;gap:6px;min-width:0;margin:0;padding:0;overflow-x:auto;scrollbar-width:thin;list-style:none}.ranking-panel li{display:flex;align-items:center;gap:6px;flex:0 0 auto;min-height:34px;padding:0 9px;border-left:3px solid var(--player-accent);border-radius:7px;background:var(--color-surface-subtle);font-size:var(--text-sm)}.rank{color:var(--color-text-muted);font-size:var(--text-xs);font-weight:850}.ranking-name{max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ranking-panel li strong{font-variant-numeric:tabular-nums}.score-grid{display:grid;gap:var(--space-4)}@media(min-width:640px){.score-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:520px){.scoreboard-nav :deep(.app-button){gap:0;font-size:0}.scoreboard-nav :deep(.app-button svg){margin:0}.hand-status :deep(.app-button){flex:0 0 auto}.ranking-panel{gap:var(--space-2);padding-left:var(--space-2)}.ranking-panel h2{font-size:0}.ranking-panel h2 svg{width:18px;height:18px}}@media(max-width:390px){.brand-button strong{display:none}}@media(max-width:370px){.hand-status{gap:var(--space-2)}.hand-status :deep(.app-button){padding-right:var(--space-2);padding-left:var(--space-2)}.hand-status span{font-size:.7rem}}
</style>
