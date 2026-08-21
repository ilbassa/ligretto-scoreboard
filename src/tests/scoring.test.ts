import { describe, expect, it } from 'vitest'
import { calculateHandScore, calculateTotal, progressiveTotal } from '@/services/scoring'

describe('scoring', () => {
  it('subtracts twice the cards left in the deck', () => {
    expect(calculateHandScore(16, 2)).toBe(12)
    expect(calculateHandScore(0, 4)).toBe(-8)
    expect(calculateHandScore(0, 0)).toBe(0)
  })

  it('calculates total and progressive totals', () => {
    const history = [
      { hand: 1, positive: 16, negative: 2, handScore: 12, isWinner: true },
      { hand: 2, positive: 3, negative: 4, handScore: -5, isWinner: false }
    ]
    expect(calculateTotal(history)).toBe(7)
    expect(progressiveTotal(history, 1)).toBe(12)
    expect(progressiveTotal(history, 2)).toBe(7)
  })
})
