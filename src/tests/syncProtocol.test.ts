import { describe, expect, it } from 'vitest'
import { decks } from '@/constants/decks'
import type { GameState, SyncSnapshot } from '@/models'
import { buildJoinUrl, parseJoinCode, parseSyncMessage, parseSyncSnapshot } from '@/services/syncProtocol'

function snapshot(): SyncSnapshot {
  const game: GameState = {
    schemaVersion: 1,
    gameActive: true,
    currentHand: 1,
    players: [
      { id: 'p1', name: 'Marco', deckId: decks[0]!.id, box: decks[0]!.box, deckColor: decks[0]!.deckColor, totalScore: 0, history: [] },
      { id: 'p2', name: 'Elena', deckId: decks[1]!.id, box: decks[1]!.box, deckColor: decks[1]!.deckColor, totalScore: 0, history: [] }
    ]
  }
  return {
    schemaVersion: 1,
    revision: 3,
    game,
    drafts: {
      p1: { playerId: 'p1', positive: 7, negative: 0, isWinner: true },
      p2: { playerId: 'p2', positive: 4, negative: 2, isWinner: false }
    }
  }
}

describe('sync protocol', () => {
  it('parses raw IDs and versioned join URLs', () => {
    expect(parseJoinCode('host_123')).toBe('host_123')
    const url = buildJoinUrl('host-456')
    expect(parseJoinCode(url)).toBe('host-456')
    expect(parseJoinCode('https://example.test/#/?join=bad%20id')).toBeUndefined()
  })

  it('accepts valid snapshots and recalculates derived game data', () => {
    const value = snapshot()
    value.game.players[0]!.totalScore = 999
    expect(parseSyncSnapshot(value)?.game.players[0]?.totalScore).toBe(0)
    expect(parseSyncMessage({ schemaVersion: 1, type: 'snapshot', snapshot: value })?.type).toBe('snapshot')
  })

  it('rejects malformed actions and inconsistent drafts', () => {
    expect(parseSyncMessage({ schemaVersion: 1, type: 'action', action: { schemaVersion: 1, id: 'a', origin: 'x', type: 'set-draft', playerId: 'p1', field: 'positive', value: -1 } })).toBeUndefined()
    const value = snapshot()
    value.drafts.p2!.isWinner = true
    expect(parseSyncSnapshot(value)).toBeUndefined()
  })
})
