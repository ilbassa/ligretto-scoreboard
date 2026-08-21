import type { HandResult } from '@/models'

export function calculateHandScore(positive: number, negative: number): number {
  return positive - negative * 2
}

export function calculateTotal(history: HandResult[]): number {
  return history.reduce((total, result) => total + result.handScore, 0)
}

export function progressiveTotal(history: HandResult[], hand: number): number {
  return history.filter((result) => result.hand <= hand).reduce((total, result) => total + result.handScore, 0)
}
