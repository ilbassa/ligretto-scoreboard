import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { decks } from '@/constants/decks'
import { GAME_STORAGE_KEY } from '@/repositories/gameRepository'
import { useGameStore } from '@/stores/game'

describe('game store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.stubGlobal('crypto', { randomUUID: vi.fn().mockReturnValueOnce('p1').mockReturnValueOnce('p2') })
  })

  it('validates setup constraints', () => {
    const store = useGameStore()
    expect(() => store.startGame([{ name: 'Marco', deckId: decks[0]!.id }])).toThrow()
    expect(() => store.startGame([{ name: 'Marco', deckId: decks[0]!.id }, { name: 'marco', deckId: decks[1]!.id }])).toThrow(/nomi/i)
    expect(() => store.startGame([{ name: 'Marco', deckId: decks[0]!.id }, { name: 'Elena', deckId: decks[0]!.id }])).toThrow(/dorso/i)
  })

  it('saves idempotently and advances only after every player is saved with one winner', () => {
    const store = useGameStore()
    store.startGame([{ name: 'Marco', deckId: decks[0]!.id }, { name: 'Elena', deckId: decks[1]!.id }])
    const [marco, elena] = store.players
    expect(marco).toBeDefined()
    expect(elena).toBeDefined()
    store.setDraftValue(marco!.id, 'positive', 16)
    store.setDraftValue(marco!.id, 'negative', 2)
    store.selectWinner(marco!.id, true)
    store.savePlayerScore(marco!.id)
    store.savePlayerScore(marco!.id)
    expect(marco!.totalScore).toBe(16)
    expect(marco!.history).toHaveLength(1)
    expect(store.canAdvance).toBe(false)
    store.setDraftValue(elena!.id, 'positive', 8)
    store.setDraftValue(elena!.id, 'negative', 3)
    store.savePlayerScore(elena!.id)
    expect(store.canAdvance).toBe(true)
    store.advanceHand()
    expect(store.currentHand).toBe(2)
    expect(localStorage.getItem(GAME_STORAGE_KEY)).toContain('"currentHand":2')
  })

  it('keeps the winner unique and restores the previous negative draft', () => {
    const store = useGameStore()
    store.startGame([{ name: 'Marco', deckId: decks[0]!.id }, { name: 'Elena', deckId: decks[1]!.id }])
    const [marco, elena] = store.players
    store.setDraftValue(marco!.id, 'negative', 4)
    store.selectWinner(marco!.id, true)
    expect(store.draftFor(marco!.id).negative).toBe(0)
    store.selectWinner(elena!.id, true)
    expect(store.draftFor(marco!.id).isWinner).toBe(false)
    expect(store.draftFor(marco!.id).negative).toBe(4)
    expect(store.draftFor(elena!.id).isWinner).toBe(true)
  })
})
