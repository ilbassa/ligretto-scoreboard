import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { getDeck } from '@/constants/decks'
import type { GameState, HandResult, PlayerHandDraft, PlayerSetup, SyncSnapshot } from '@/models'
import { gameRepository } from '@/repositories/gameRepository'
import { calculateHandScore, calculateTotal } from '@/services/scoring'
import { createId } from '@/utils/id'

function snapshotOf(result: HandResult) {
  return { positive: result.positive, negative: result.negative, isWinner: result.isWinner }
}

function plainClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export const useGameStore = defineStore('game', () => {
  const game = ref<GameState | undefined>()
  const drafts = ref<Record<string, PlayerHandDraft>>({})
  const initialized = ref(false)

  const hasActiveGame = computed(() => Boolean(game.value?.gameActive))
  const currentHand = computed(() => game.value?.currentHand ?? 1)
  const players = computed(() => game.value?.players ?? [])
  const allPlayersSaved = computed(() => players.value.length > 0 && players.value.every((player) => isDraftSaved(player.id)))
  const winnerCount = computed(() => Object.values(drafts.value).filter((draft) => draft.isWinner).length)
  const canAdvance = computed(() => allPlayersSaved.value && winnerCount.value === 1)

  function initialize() {
    if (initialized.value) return
    game.value = gameRepository.load()
    initialized.value = true
    resetDrafts(false)
    if (game.value) drafts.value = gameRepository.loadDrafts(game.value) ?? drafts.value
  }

  function resetDrafts(persist = true) {
    const next: Record<string, PlayerHandDraft> = {}
    for (const player of players.value) {
      const saved = player.history.find((result) => result.hand === currentHand.value)
      next[player.id] = saved
        ? { playerId: player.id, positive: saved.positive, negative: saved.negative, isWinner: saved.isWinner, savedSnapshot: snapshotOf(saved) }
        : { playerId: player.id, positive: 0, negative: 0, isWinner: false }
    }
    drafts.value = next
    if (persist && game.value) gameRepository.saveDrafts(drafts.value)
  }

  function startGame(setup: PlayerSetup[]) {
    if (setup.length < 2 || setup.length > 12) throw new Error('Servono da 2 a 12 giocatori.')
    const names = setup.map((player) => player.name.trim())
    if (names.some((name) => !name)) throw new Error('Inserisci il nome di ogni giocatore.')
    if (new Set(names.map((name) => name.toLocaleLowerCase('it-IT'))).size !== names.length) throw new Error('I nomi dei giocatori devono essere diversi.')
    if (new Set(setup.map((player) => player.deckId)).size !== setup.length) throw new Error('Ogni giocatore deve avere un dorso diverso.')
    const newPlayers = setup.map((player) => {
      const deck = getDeck(player.deckId)
      if (!deck) throw new Error('Scegli un dorso per ogni giocatore.')
      return { id: createId(), name: player.name.trim(), deckId: deck.id, box: deck.box, deckColor: deck.deckColor, totalScore: 0, history: [] }
    })
    game.value = { schemaVersion: 1, gameActive: true, currentHand: 1, players: newPlayers }
    gameRepository.save(game.value)
    resetDrafts()
  }

  function clearGame() {
    gameRepository.clear()
    game.value = undefined
    drafts.value = {}
  }

  function draftFor(playerId: string): PlayerHandDraft {
    const draft = drafts.value[playerId]
    if (!draft) throw new Error('Giocatore non trovato.')
    return draft
  }

  function setDraftValue(playerId: string, field: 'positive' | 'negative', value: number) {
    const draft = draftFor(playerId)
    if (field === 'negative' && draft.isWinner) return
    draft[field] = Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0
    gameRepository.saveDrafts(drafts.value)
  }

  function selectWinner(playerId: string, selected: boolean) {
    const selectedDraft = draftFor(playerId)
    for (const draft of Object.values(drafts.value)) {
      if (draft.playerId !== playerId && draft.isWinner) {
        draft.isWinner = false
        draft.negative = draft.negativeBeforeWinner ?? draft.negative
        draft.negativeBeforeWinner = undefined
      }
    }
    if (selected) {
      if (!selectedDraft.isWinner) selectedDraft.negativeBeforeWinner = selectedDraft.negative
      selectedDraft.isWinner = true
      selectedDraft.negative = 0
    } else {
      selectedDraft.isWinner = false
      selectedDraft.negative = selectedDraft.negativeBeforeWinner ?? selectedDraft.negative
      selectedDraft.negativeBeforeWinner = undefined
    }
    gameRepository.saveDrafts(drafts.value)
  }

  function isDraftSaved(playerId: string): boolean {
    const draft = drafts.value[playerId]
    const snapshot = draft?.savedSnapshot
    return Boolean(draft && snapshot && draft.positive === snapshot.positive && draft.negative === snapshot.negative && draft.isWinner === snapshot.isWinner)
  }

  function savePlayerScore(playerId: string): number {
    if (!game.value) throw new Error('Nessuna partita attiva.')
    const player = game.value.players.find((item) => item.id === playerId)
    if (!player) throw new Error('Giocatore non trovato.')
    const draft = draftFor(playerId)
    const result: HandResult = {
      hand: game.value.currentHand,
      positive: draft.positive,
      negative: draft.negative,
      handScore: calculateHandScore(draft.positive, draft.negative),
      isWinner: draft.isWinner
    }
    if (result.isWinner) {
      for (const other of game.value.players) {
        const saved = other.history.find((item) => item.hand === game.value?.currentHand)
        if (saved) saved.isWinner = other.id === playerId
      }
    }
    const index = player.history.findIndex((item) => item.hand === game.value?.currentHand)
    if (index >= 0) player.history[index] = result
    else player.history.push(result)
    for (const item of game.value.players) item.totalScore = calculateTotal(item.history)
    draft.savedSnapshot = snapshotOf(result)
    gameRepository.save(game.value)
    gameRepository.saveDrafts(drafts.value)
    return result.handScore
  }

  function advanceHand() {
    if (!game.value || !canAdvance.value) throw new Error('Salva tutti i punteggi e indica il vincitore prima di continuare.')
    game.value.currentHand += 1
    gameRepository.save(game.value)
    resetDrafts()
  }

  function createSyncSnapshot(revision: number): SyncSnapshot {
    if (!game.value) throw new Error('Nessuna partita attiva.')
    return plainClone({ schemaVersion: 1, revision, game: game.value, drafts: drafts.value })
  }

  function applySyncSnapshot(snapshot: SyncSnapshot) {
    game.value = plainClone(snapshot.game)
    drafts.value = plainClone(snapshot.drafts)
    initialized.value = true
    gameRepository.save(game.value)
    gameRepository.saveDrafts(drafts.value)
  }

  return { game, drafts, initialized, hasActiveGame, currentHand, players, allPlayersSaved, winnerCount, canAdvance, initialize, startGame, clearGame, draftFor, setDraftValue, selectWinner, isDraftSaved, savePlayerScore, advanceHand, createSyncSnapshot, applySyncSnapshot }
})
