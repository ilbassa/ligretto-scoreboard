import { getDeck } from '@/constants/decks'
import type { GameState, HandResult, Player } from '@/models'
import { calculateHandScore, calculateTotal } from '@/services/scoring'

export const GAME_STORAGE_KEY = 'ligretto-scoreboard.game.v1'

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}

function parseResult(value: unknown): HandResult | undefined {
  if (!value || typeof value !== 'object') return
  const item = value as Partial<HandResult>
  if (!isNonNegativeInteger(item.positive) || !isNonNegativeInteger(item.negative) || !isNonNegativeInteger(item.hand) || item.hand < 1 || typeof item.isWinner !== 'boolean') return
  return {
    hand: item.hand,
    positive: item.positive,
    negative: item.negative,
    handScore: calculateHandScore(item.positive, item.negative),
    isWinner: item.isWinner
  }
}

function parsePlayer(value: unknown): Player | undefined {
  if (!value || typeof value !== 'object') return
  const item = value as Partial<Player>
  const deck = typeof item.deckId === 'string' ? getDeck(item.deckId) : undefined
  if (!deck || typeof item.id !== 'string' || typeof item.name !== 'string' || !item.name.trim() || !Array.isArray(item.history)) return
  const history = item.history.map(parseResult)
  if (history.some((result) => !result)) return
  const validHistory = history as HandResult[]
  return { id: item.id, name: item.name.trim(), deckId: deck.id, box: deck.box, deckColor: deck.deckColor, totalScore: calculateTotal(validHistory), history: validHistory }
}

export function parseGame(value: unknown): GameState | undefined {
  if (!value || typeof value !== 'object') return
  const item = value as Partial<GameState>
  if (item.schemaVersion !== 1 || item.gameActive !== true || !isNonNegativeInteger(item.currentHand) || item.currentHand < 1 || !Array.isArray(item.players) || item.players.length < 2 || item.players.length > 12) return
  const players = item.players.map(parsePlayer)
  if (players.some((player) => !player)) return
  const validPlayers = players as Player[]
  const names = new Set(validPlayers.map((player) => player.name.toLocaleLowerCase('it-IT')))
  const deckIds = new Set(validPlayers.map((player) => player.deckId))
  if (names.size !== validPlayers.length || deckIds.size !== validPlayers.length) return
  return { schemaVersion: 1, gameActive: true, currentHand: item.currentHand, players: validPlayers }
}

export class GameRepository {
  constructor(private readonly storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> = localStorage) {}

  load(): GameState | undefined {
    try {
      const raw = this.storage.getItem(GAME_STORAGE_KEY)
      return raw ? parseGame(JSON.parse(raw)) : undefined
    } catch { return undefined }
  }

  save(game: GameState): void { this.storage.setItem(GAME_STORAGE_KEY, JSON.stringify(game)) }
  clear(): void { this.storage.removeItem(GAME_STORAGE_KEY) }
  hasActiveGame(): boolean { return Boolean(this.load()) }
}

export const gameRepository = new GameRepository()
