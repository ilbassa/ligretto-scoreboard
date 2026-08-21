import type { SyncAction, SyncMessage, SyncSnapshot } from '@/models'
import { parseDrafts, parseGame } from '@/repositories/gameRepository'

const PEER_ID_PATTERN = /^[a-zA-Z0-9](?:[a-zA-Z0-9_-]*[a-zA-Z0-9])?$/

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}

export function isValidPeerId(value: string): boolean {
  return value.length <= 128 && PEER_ID_PATTERN.test(value)
}

export function buildJoinUrl(peerId: string): string {
  const url = new URL(import.meta.env.BASE_URL, window.location.origin)
  url.hash = `/?v=1&join=${encodeURIComponent(peerId)}`
  return url.toString()
}

export function parseJoinCode(value: string): string | undefined {
  const candidate = value.trim()
  if (isValidPeerId(candidate)) return candidate
  try {
    const url = new URL(candidate)
    const hashQuery = url.hash.includes('?') ? url.hash.slice(url.hash.indexOf('?') + 1) : ''
    const peerId = new URLSearchParams(hashQuery).get('join')?.trim()
    return peerId && isValidPeerId(peerId) ? peerId : undefined
  } catch { return undefined }
}

export function parseSyncAction(value: unknown): SyncAction | undefined {
  if (!isRecord(value) || value.schemaVersion !== 1 || typeof value.id !== 'string' || !value.id || typeof value.origin !== 'string' || !value.origin) return
  if (value.type === 'advance-hand') return { schemaVersion: 1, id: value.id, origin: value.origin, type: 'advance-hand' }
  if (typeof value.playerId !== 'string' || !value.playerId) return
  if (value.type === 'save-score') return { schemaVersion: 1, id: value.id, origin: value.origin, type: 'save-score', playerId: value.playerId }
  if (value.type === 'select-winner' && typeof value.selected === 'boolean') {
    return { schemaVersion: 1, id: value.id, origin: value.origin, type: 'select-winner', playerId: value.playerId, selected: value.selected }
  }
  if (value.type === 'set-draft' && (value.field === 'positive' || value.field === 'negative') && isNonNegativeInteger(value.value)) {
    return { schemaVersion: 1, id: value.id, origin: value.origin, type: 'set-draft', playerId: value.playerId, field: value.field, value: value.value }
  }
}

export function parseSyncSnapshot(value: unknown): SyncSnapshot | undefined {
  if (!isRecord(value) || value.schemaVersion !== 1 || !isNonNegativeInteger(value.revision)) return
  const game = parseGame(value.game)
  if (!game) return
  const drafts = parseDrafts(value.drafts, game)
  if (!drafts) return
  return { schemaVersion: 1, revision: value.revision, game, drafts }
}

export function parseSyncMessage(value: unknown): SyncMessage | undefined {
  if (!isRecord(value) || value.schemaVersion !== 1 || typeof value.type !== 'string') return
  if (value.type === 'snapshot-request') return { schemaVersion: 1, type: 'snapshot-request' }
  if (value.type === 'action') {
    const action = parseSyncAction(value.action)
    return action ? { schemaVersion: 1, type: 'action', action } : undefined
  }
  if (value.type === 'snapshot') {
    const snapshot = parseSyncSnapshot(value.snapshot)
    return snapshot ? { schemaVersion: 1, type: 'snapshot', snapshot } : undefined
  }
  if (value.type === 'presence' && isNonNegativeInteger(value.connectedDevices) && value.connectedDevices >= 1) {
    return { schemaVersion: 1, type: 'presence', connectedDevices: value.connectedDevices }
  }
}
