import { beforeEach, describe, expect, it } from 'vitest'
import { decks } from '@/constants/decks'
import { GAME_STORAGE_KEY, GameRepository } from '@/repositories/gameRepository'

describe('GameRepository', () => {
  beforeEach(() => localStorage.clear())

  it('round-trips a valid game and recalculates derived scores', () => {
    const repository = new GameRepository(localStorage)
    const game = {
      schemaVersion: 1 as const,
      gameActive: true as const,
      currentHand: 1,
      players: [
        { id: '1', name: 'Marco', deckId: decks[0]!.id, box: decks[0]!.box, deckColor: decks[0]!.deckColor, totalScore: 999, history: [{ hand: 1, positive: 16, negative: 2, handScore: 999, isWinner: true }] },
        { id: '2', name: 'Elena', deckId: decks[1]!.id, box: decks[1]!.box, deckColor: decks[1]!.deckColor, totalScore: 0, history: [] }
      ]
    }
    repository.save(game)
    expect(repository.load()?.players[0]?.totalScore).toBe(12)
    expect(repository.load()?.players[0]?.history[0]?.handScore).toBe(12)
  })

  it('ignores corrupt and incompatible data', () => {
    const repository = new GameRepository(localStorage)
    localStorage.setItem(GAME_STORAGE_KEY, '{broken')
    expect(repository.load()).toBeUndefined()
    localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify({ schemaVersion: 2 }))
    expect(repository.load()).toBeUndefined()
  })
})
