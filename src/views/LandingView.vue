<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowRight, Calculator, Crown, Play, ShieldCheck, Sparkles } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
import { useGameStore } from '@/stores/game'

const router = useRouter()
const gameStore = useGameStore()
gameStore.initialize()
const replaceOpen = ref(false)
const resumeLabel = computed(() => gameStore.game ? `Riprendi · Mano ${gameStore.currentHand}` : 'Riprendi partita')

function newGame() {
  if (gameStore.hasActiveGame) replaceOpen.value = true
  else router.push({ name: 'setup' })
}

function confirmNewGame() {
  gameStore.clearGame()
  replaceOpen.value = false
  router.push({ name: 'setup' })
}
</script>

<template>
  <div class="landing">
    <header class="landing-header"><RouterLink to="/" class="brand" aria-label="Ligretto Scoreboard, pagina iniziale"><span class="brand__mark"><Crown :size="23" aria-hidden="true" /></span><span>Ligretto <strong>Scoreboard</strong></span></RouterLink><button v-if="gameStore.hasActiveGame" class="header-link" type="button" @click="router.push({ name: 'scoreboard' })">{{ resumeLabel }}</button></header>
    <main>
      <section class="hero">
        <div class="hero__content">
          <p class="hero__eyebrow"><Sparkles :size="17" aria-hidden="true" /> Niente più conti a mente</p>
          <h1>Più veloce del gioco.<br><span>Preciso fino all’ultima carta.</span></h1>
          <p class="hero__copy">Segna ogni mano, trova subito il totale e lascia che la matematica la faccia il tabellone. Tu pensa solo a gridare “Ligretto!”.</p>
          <div class="hero__actions"><AppButton :icon="Play" @click="newGame">Nuova partita</AppButton><AppButton v-if="gameStore.hasActiveGame" variant="secondary" :icon="ArrowRight" @click="router.push({ name: 'scoreboard' })">Riprendi partita</AppButton></div>
          <p class="privacy-note"><ShieldCheck :size="18" aria-hidden="true" /> Partita salvata solo su questo dispositivo</p>
        </div>
        <div class="score-preview" aria-label="Anteprima del tabellone">
          <div class="score-preview__top"><span>Mano 4</span><span class="live"><i></i> In corso</span></div>
          <div class="preview-player preview-player--winner"><span class="mini-deck red"></span><div><small>Giulia</small><strong>42</strong></div><Crown :size="21" aria-label="Vincitrice" /></div>
          <div class="preview-player"><span class="mini-deck blue"></span><div><small>Marco</small><strong>35</strong></div><span class="round-score">+8</span></div>
          <div class="preview-player"><span class="mini-deck green"></span><div><small>Elena</small><strong>29</strong></div><span class="round-score negative">−2</span></div>
          <div class="formula-preview"><Calculator :size="18" aria-hidden="true" /><span>14 carte − (2 × 2)</span><strong>= 10</strong></div>
        </div>
      </section>
      <section class="feature-strip" aria-label="Caratteristiche"><article><strong>2–12</strong><span>giocatori</span></article><article><strong>12</strong><span>dorsi unici</span></article><article><strong>0</strong><span>calcoli manuali</span></article></section>
    </main>
    <footer><strong>Ligretto Scoreboard</strong><span>Veloce, locale, sempre pronto.</span></footer>
    <AppConfirmDialog :open="replaceOpen" title="Iniziare una nuova partita?" message="La partita in corso verrà eliminata definitivamente per lasciare spazio alla nuova." confirm-label="Nuova partita" @close="replaceOpen=false" @confirm="confirmNewGame" />
  </div>
</template>

<style scoped>
.landing{min-height:100vh;background:radial-gradient(circle at 82% 14%,rgb(213 190 161/.22),transparent 28%),var(--color-bg)}.landing-header{width:min(100% - 32px,1120px);min-height:76px;display:flex;align-items:center;justify-content:space-between;gap:var(--space-3);margin:0 auto}.brand{display:flex;align-items:center;gap:var(--space-3);font-weight:700;text-decoration:none}.brand strong{font-weight:900}.brand__mark{width:42px;height:42px;display:grid;place-items:center;color:var(--color-on-primary);border-radius:13px;background:var(--color-primary);transform:rotate(-4deg)}.header-link{min-height:44px;padding:0 var(--space-4);color:var(--color-text);border:1px solid var(--color-border);border-radius:var(--radius-sm);background:var(--color-surface);font-weight:800;cursor:pointer}.hero{width:min(100% - 32px,1120px);display:grid;align-items:center;gap:var(--space-8);margin:0 auto;padding:70px 0 88px}.hero__content{max-width:680px}.hero__eyebrow{display:flex;align-items:center;gap:var(--space-2);margin:0 0 var(--space-4);color:var(--color-accent-text);font-size:var(--text-sm);font-weight:900;letter-spacing:.075em;text-transform:uppercase}.hero h1{margin:0;font-size:clamp(2.75rem,8vw,5.5rem);line-height:.98;letter-spacing:-.06em}.hero h1 span{color:var(--color-accent-text)}.hero__copy{max-width:620px;margin:var(--space-6) 0 0;color:var(--color-text-muted);font-size:clamp(1.05rem,2vw,1.22rem);line-height:1.65}.hero__actions{display:flex;flex-wrap:wrap;gap:var(--space-3);margin-top:var(--space-8)}.privacy-note{display:flex;align-items:center;gap:var(--space-2);margin:var(--space-5) 0 0;color:var(--color-text-muted);font-size:var(--text-sm)}.score-preview{display:grid;gap:var(--space-3);padding:var(--space-4);border:1px solid var(--color-border);border-radius:var(--radius-xl);background:var(--color-surface);box-shadow:0 26px 70px rgb(71 46 24/.15);transform:rotate(1.5deg)}.score-preview__top{display:flex;justify-content:space-between;padding:var(--space-1) var(--space-1) var(--space-2);font-size:var(--text-sm);font-weight:850}.live{display:flex;align-items:center;gap:6px;color:var(--color-positive)}.live i{width:8px;height:8px;border-radius:50%;background:currentColor}.preview-player{min-height:68px;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:var(--space-3);padding:var(--space-3);border-radius:var(--radius-md);background:var(--color-surface-subtle)}.preview-player--winner{border:1px solid #f0c14b;background:#fff3bf}.preview-player>div{display:flex;align-items:baseline;justify-content:space-between}.preview-player small{font-size:var(--text-sm);font-weight:800}.preview-player strong{font-size:1.7rem}.preview-player svg{color:#b67800}.mini-deck{width:30px;height:40px;border:3px solid;border-radius:5px;background:#fff}.mini-deck.red{color:#d64545}.mini-deck.blue{color:#3372c5}.mini-deck.green{color:#299660}.round-score{color:var(--color-positive);font-weight:900}.round-score.negative{color:var(--color-danger)}.formula-preview{display:flex;align-items:center;gap:var(--space-2);padding:var(--space-2) var(--space-3);color:var(--color-text-muted);font-size:var(--text-sm)}.formula-preview strong{margin-left:auto;color:var(--color-text)}.feature-strip{display:grid;grid-template-columns:repeat(3,1fr);width:min(100% - 32px,1120px);margin:0 auto;padding:var(--space-5) 0;border-top:1px solid var(--color-border);border-bottom:1px solid var(--color-border)}.feature-strip article{display:grid;justify-items:center;gap:4px;padding:var(--space-3);text-align:center}.feature-strip article+article{border-left:1px solid var(--color-border)}.feature-strip strong{font-size:clamp(1.6rem,4vw,2.4rem)}.feature-strip span{color:var(--color-text-muted);font-size:var(--text-sm)}footer{width:min(100% - 32px,1120px);display:flex;justify-content:space-between;gap:var(--space-4);margin:0 auto;padding:var(--space-6) 0;color:var(--color-text-muted);font-size:var(--text-sm)}footer strong{color:var(--color-text)}@media(min-width:820px){.hero{grid-template-columns:minmax(0,1.25fr) minmax(340px,.75fr);min-height:650px}}@media(max-width:560px){.landing-header .brand>span:last-child strong{display:none}.hero{padding:48px 0 64px}.hero__actions,.hero__actions :deep(button){width:100%}.score-preview{transform:none}.feature-strip{grid-template-columns:1fr}.feature-strip article+article{border-top:1px solid var(--color-border);border-left:0}footer{flex-direction:column}}
</style>
