import { getDeck } from '@/constants/decks'
import type { GameState, HandResult, Player, PlayerHandDraft } from '@/models'
import { calculateHandScore, calculateTotal } from '@/services/scoring'

export const GAME_STORAGE_KEY = 'ligretto-scoreboard.game.v1'
export const DRAFT_STORAGE_KEY = 'ligretto-scoreboard.drafts.v1'

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

function parseDraft(value: unknown, playerId: string): PlayerHandDraft | undefined {
  if (!value || typeof value !== 'object') return
  const item = value as Partial<PlayerHandDraft>
  if (item.playerId !== playerId || !isNonNegativeInteger(item.positive) || !isNonNegativeInteger(item.negative) || typeof item.isWinner !== 'boolean') return
  const draft: PlayerHandDraft = { playerId, positive: item.positive, negative: item.negative, isWinner: item.isWinner }
  if (isNonNegativeInteger(item.negativeBeforeWinner)) draft.negativeBeforeWinner = item.negativeBeforeWinner
  if (item.savedSnapshot !== undefined) {
    const snapshot = item.savedSnapshot
    if (!snapshot || !isNonNegativeInteger(snapshot.positive) || !isNonNegativeInteger(snapshot.negative) || typeof snapshot.isWinner !== 'boolean') return
    draft.savedSnapshot = { positive: snapshot.positive, negative: snapshot.negative, isWinner: snapshot.isWinner }
  }
  return draft
}

export function parseDrafts(value: unknown, game: GameState): Record<string, PlayerHandDraft> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return
  const source = value as Record<string, unknown>
  const expectedIds = new Set(game.players.map((player) => player.id))
  if (Object.keys(source).length !== expectedIds.size || Object.keys(source).some((id) => !expectedIds.has(id))) return
  const drafts: Record<string, PlayerHandDraft> = {}
  for (const player of game.players) {
    const draft = parseDraft(source[player.id], player.id)
    if (!draft) return
    drafts[player.id] = draft
  }
  if (Object.values(drafts).filter((draft) => draft.isWinner).length > 1) return
  return drafts
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
  loadDrafts(game: GameState): Record<string, PlayerHandDraft> | undefined {
    try {
      const raw = this.storage.getItem(DRAFT_STORAGE_KEY)
      return raw ? parseDrafts(JSON.parse(raw), game) : undefined
    } catch { return undefined }
  }
  saveDrafts(drafts: Record<string, PlayerHandDraft>): void { this.storage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts)) }
  clear(): void { this.storage.removeItem(GAME_STORAGE_KEY); this.storage.removeItem(DRAFT_STORAGE_KEY) }
  hasActiveGame(): boolean { return Boolean(this.load()) }
}

export const gameRepository = new GameRepository()
