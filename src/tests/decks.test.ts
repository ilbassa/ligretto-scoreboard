import { describe, expect, it } from 'vitest'
import { decks } from '@/constants/decks'

describe('decks', () => {
  it('provides the twelve real box, symbol and color combinations', () => {
    expect(decks).toHaveLength(12)
    expect(new Set(decks.map((deck) => deck.id)).size).toBe(12)
    expect(new Set(decks.map((deck) => deck.box)).size).toBe(3)
    expect(decks.filter((deck) => deck.box === 'Verde')).toEqual(expect.arrayContaining([
      expect.objectContaining({ symbol: 'Fulmine', deckColor: 'Viola' }),
      expect.objectContaining({ symbol: 'Fulmine', deckColor: 'Fucsia' }),
      expect.objectContaining({ symbol: 'Fulmine', deckColor: 'Verde' }),
      expect.objectContaining({ symbol: 'Fulmine', deckColor: 'Marrone' })
    ]))
    expect(decks.filter((deck) => deck.box === 'Blu').every((deck) => deck.symbol === 'Palline')).toBe(true)
    expect(decks.filter((deck) => deck.box === 'Rossa').every((deck) => deck.symbol === 'Fulmine')).toBe(true)
  })
})
