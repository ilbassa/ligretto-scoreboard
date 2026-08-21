import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { decks } from '@/constants/decks'
import type { SyncAction } from '@/models'
import { useGameStore } from '@/stores/game'
import { SESSION_STORAGE_KEY, useP2pStore } from '@/stores/p2p'

const peerMock = vi.hoisted(() => ({ instances: [] as any[] }))

vi.mock('peerjs', () => {
  class MockEmitter {
    handlers = new Map<string, Array<(...args: any[]) => void>>()
    on(event: string, handler: (...args: any[]) => void) { this.handlers.set(event, [...(this.handlers.get(event) ?? []), handler]); return this }
    emit(event: string, ...args: any[]) { for (const handler of this.handlers.get(event) ?? []) handler(...args) }
  }
  class MockConnection extends MockEmitter {
    open = false
    sent: any[] = []
    constructor(public peer: string, public metadata: any = {}) { super() }
    send(value: any) { this.sent.push(value) }
    close() { const wasOpen = this.open; this.open = false; if (wasOpen) this.emit('close') }
    openNow() { this.open = true; this.emit('open') }
  }
  class MockPeer extends MockEmitter {
    id = ''
    destroyed = false
    disconnected = false
    connectionsCreated: MockConnection[] = []
    constructor(public preferredId?: string) { super(); peerMock.instances.push(this) }
    connect(id: string, options: any) { const connection = new MockConnection(id, options?.metadata); this.connectionsCreated.push(connection); return connection }
    openNow(id = this.preferredId || 'generated-peer') { this.id = id; this.emit('open', id) }
    destroy() { if (this.destroyed) return; this.destroyed = true; this.emit('close') }
    reconnect() { this.disconnected = false }
  }
  return { default: MockPeer }
})

function createGame() {
  const game = useGameStore()
  game.startGame([{ name: 'Marco', deckId: decks[0]!.id }, { name: 'Elena', deckId: decks[1]!.id }])
  return game
}

describe('P2P store', () => {
  beforeEach(() => {
    localStorage.clear()
    peerMock.instances.length = 0
    setActivePinia(createPinia())
    vi.stubGlobal('crypto', { randomUUID: vi.fn(() => `id-${Math.random().toString(16).slice(2)}`) })
  })

  it('applies client actions on the Host and broadcasts an authoritative snapshot', () => {
    const game = createGame()
    const sync = useP2pStore()
    sync.startHost()
    const peer = peerMock.instances[0]
    peer.openNow('host-peer')
    const connection = new (peer.connect('client-peer', { metadata: { protocol: 'ligretto-scoreboard-v1' } }).constructor)('client-peer', { protocol: 'ligretto-scoreboard-v1' })
    peer.emit('connection', connection)
    connection.openNow()
    const action: SyncAction = { schemaVersion: 1, id: 'action-1', origin: 'client-peer', type: 'set-draft', playerId: game.players[0]!.id, field: 'positive', value: 12 }
    connection.emit('data', { schemaVersion: 1, type: 'action', action })

    expect(game.draftFor(game.players[0]!.id).positive).toBe(12)
    expect(sync.revision).toBe(1)
    expect(connection.sent.some((message: any) => message.type === 'snapshot' && message.snapshot.revision === 1)).toBe(true)
    expect(sync.connectedDevices).toBe(2)
    sync.stopSession()
  })

  it('keeps a client read-only until the first Host snapshot and after disconnect', () => {
    const game = createGame()
    const snapshot = game.createSyncSnapshot(4)
    const sync = useP2pStore()
    sync.joinHost('host-peer')
    const peer = peerMock.instances[0]
    peer.openNow('client-peer')
    const connection = peer.connectionsCreated[0]
    connection.openNow()
    expect(sync.canEdit).toBe(false)
    connection.emit('data', { schemaVersion: 1, type: 'snapshot', snapshot })
    expect(sync.canEdit).toBe(true)
    expect(JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) ?? '{}').revision).toBe(4)
    connection.close()
    expect(sync.canEdit).toBe(false)
    sync.stopSession()
  })
})
