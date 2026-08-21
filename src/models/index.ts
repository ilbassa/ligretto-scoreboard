export const boxColors = ['Rossa', 'Blu', 'Verde'] as const
export const deckColors = ['Marrone', 'Viola', 'Verde', 'Fucsia', 'Blu', 'Arancio', 'Rosso', 'Azzurro', 'Rosa', 'Nero'] as const
export const deckSymbols = ['Fulmine', 'Palline'] as const

export type BoxColor = typeof boxColors[number]
export type DeckColor = typeof deckColors[number]
export type DeckSymbol = typeof deckSymbols[number]

export interface DeckDefinition {
  id: string
  box: BoxColor
  deckColor: DeckColor
  symbol: DeckSymbol
}

export interface HandResult {
  hand: number
  positive: number
  negative: number
  handScore: number
  isWinner: boolean
}

export interface Player {
  id: string
  name: string
  deckId: string
  box: BoxColor
  deckColor: DeckColor
  totalScore: number
  history: HandResult[]
}

export interface GameState {
  schemaVersion: 1
  gameActive: boolean
  currentHand: number
  players: Player[]
}

export interface PlayerSetup {
  name: string
  deckId: string
}

export interface PlayerHandDraft {
  playerId: string
  positive: number
  negative: number
  isWinner: boolean
  negativeBeforeWinner?: number
  savedSnapshot?: Pick<HandResult, 'positive' | 'negative' | 'isWinner'>
}

export type SessionRole = 'host' | 'client'
export type ConnectionStatus = 'disconnected' | 'connecting' | 'waiting' | 'connected' | 'error'

export type SyncAction = {
  schemaVersion: 1
  id: string
  origin: string
} & (
  | { type: 'set-draft'; playerId: string; field: 'positive' | 'negative'; value: number }
  | { type: 'select-winner'; playerId: string; selected: boolean }
  | { type: 'save-score'; playerId: string }
  | { type: 'advance-hand' }
)

export interface SyncSnapshot {
  schemaVersion: 1
  revision: number
  game: GameState
  drafts: Record<string, PlayerHandDraft>
}

export type SyncMessage =
  | { schemaVersion: 1; type: 'action'; action: SyncAction }
  | { schemaVersion: 1; type: 'snapshot'; snapshot: SyncSnapshot }
  | { schemaVersion: 1; type: 'presence'; connectedDevices: number }
  | { schemaVersion: 1; type: 'snapshot-request' }
