import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import Peer, { type DataConnection, type PeerError, type PeerErrorType } from 'peerjs'
import type { ConnectionStatus, SessionRole, SyncAction, SyncMessage } from '@/models'
import { parseSyncMessage } from '@/services/syncProtocol'
import { useGameStore } from '@/stores/game'
import { createId } from '@/utils/id'

export const SESSION_STORAGE_KEY = 'ligretto-scoreboard.p2p-session.v1'
const APP_PROTOCOL = 'ligretto-scoreboard-v1'

interface StoredSession {
  schemaVersion: 1
  role: SessionRole
  hostId: string
  peerId?: string
  revision: number
}

type SyncActionInput =
  | { type: 'set-draft'; playerId: string; field: 'positive' | 'negative'; value: number }
  | { type: 'select-winner'; playerId: string; selected: boolean }
  | { type: 'save-score'; playerId: string }
  | { type: 'advance-hand' }

function loadSession(): StoredSession | undefined {
  try {
    const parsed = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) ?? 'null') as Partial<StoredSession> | null
    if (!parsed || parsed.schemaVersion !== 1 || (parsed.role !== 'host' && parsed.role !== 'client') || typeof parsed.hostId !== 'string' || !parsed.hostId || typeof parsed.revision !== 'number' || !Number.isInteger(parsed.revision) || parsed.revision < 0) return
    return { schemaVersion: 1, role: parsed.role, hostId: parsed.hostId, peerId: typeof parsed.peerId === 'string' ? parsed.peerId : undefined, revision: parsed.revision }
  } catch { return undefined }
}

export const useP2pStore = defineStore('p2p', () => {
  const gameStore = useGameStore()
  const role = ref<SessionRole>()
  const status = ref<ConnectionStatus>('disconnected')
  const hostId = ref('')
  const localPeerId = ref('')
  const connectedDevices = ref(1)
  const revision = ref(0)
  const lastSnapshotAt = ref(0)
  const errorMessage = ref('')
  const initialized = ref(false)
  const synced = ref(false)

  let peer: Peer | undefined
  let hostConnection: DataConnection | undefined
  const clientConnections = new Map<string, DataConnection>()
  const processedActions = new Set<string>()
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined
  let generation = 0
  let fallbackAttempted = false

  const canEdit = computed(() => role.value !== 'client' || (status.value === 'connected' && synced.value))
  const isSessionActive = computed(() => Boolean(role.value))

  function persistSession() {
    if (!role.value || !hostId.value) return
    const data: StoredSession = { schemaVersion: 1, role: role.value, hostId: hostId.value, peerId: localPeerId.value || undefined, revision: revision.value }
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data))
  }

  function send(connection: DataConnection, message: SyncMessage) {
    if (!connection.open) return
    try { void connection.send(message) } catch { /* Connection events handle recovery. */ }
  }

  function snapshotMessage(): SyncMessage {
    return { schemaVersion: 1, type: 'snapshot', snapshot: gameStore.createSyncSnapshot(revision.value) }
  }

  function broadcastPresence() {
    if (role.value !== 'host') return
    connectedDevices.value = 1 + clientConnections.size
    const message: SyncMessage = { schemaVersion: 1, type: 'presence', connectedDevices: connectedDevices.value }
    for (const connection of clientConnections.values()) send(connection, message)
    status.value = clientConnections.size ? 'connected' : 'waiting'
  }

  function broadcastSnapshot() {
    if (role.value !== 'host' || !gameStore.game) return
    const message = snapshotMessage()
    for (const connection of clientConnections.values()) send(connection, message)
    broadcastPresence()
  }

  function applyAction(action: SyncAction): number | undefined {
    if (action.type === 'set-draft') gameStore.setDraftValue(action.playerId, action.field, action.value)
    else if (action.type === 'select-winner') gameStore.selectWinner(action.playerId, action.selected)
    else if (action.type === 'save-score') return gameStore.savePlayerScore(action.playerId)
    else gameStore.advanceHand()
  }

  function acceptHostAction(action: SyncAction, source?: DataConnection) {
    if (processedActions.has(action.id)) return
    try {
      applyAction(action)
      processedActions.add(action.id)
      if (processedActions.size > 1000) processedActions.delete(processedActions.values().next().value ?? '')
      revision.value += 1
      persistSession()
      broadcastSnapshot()
    } catch {
      if (source && gameStore.game) send(source, snapshotMessage())
    }
  }

  function onHostData(connection: DataConnection, data: unknown) {
    const message = parseSyncMessage(data)
    if (!message) return
    if (message.type === 'action') acceptHostAction(message.action, connection)
    else if (message.type === 'snapshot-request' && gameStore.game) {
      send(connection, snapshotMessage())
      send(connection, { schemaVersion: 1, type: 'presence', connectedDevices: connectedDevices.value })
    }
  }

  function attachClient(connection: DataConnection) {
    if (connection.metadata?.protocol !== APP_PROTOCOL) { connection.close(); return }
    connection.on('open', () => {
      const previous = clientConnections.get(connection.peer)
      if (previous && previous !== connection) previous.close()
      clientConnections.set(connection.peer, connection)
      send(connection, snapshotMessage())
      broadcastPresence()
    })
    connection.on('data', (data) => onHostData(connection, data))
    connection.on('close', () => {
      if (clientConnections.get(connection.peer) === connection) clientConnections.delete(connection.peer)
      broadcastPresence()
    })
    connection.on('error', () => {
      if (clientConnections.get(connection.peer) === connection) clientConnections.delete(connection.peer)
      broadcastPresence()
    })
  }

  function scheduleClientReconnect(expectedGeneration: number) {
    clearTimeout(reconnectTimer)
    reconnectTimer = setTimeout(() => {
      if (generation !== expectedGeneration || role.value !== 'client' || status.value === 'connected') return
      if (!peer || peer.destroyed) createClientPeer(expectedGeneration)
      else connectToHost(expectedGeneration)
    }, 2000)
  }

  function onClientData(data: unknown) {
    const message = parseSyncMessage(data)
    if (!message) return
    if (message.type === 'snapshot') {
      if (message.snapshot.revision < revision.value) return
      gameStore.applySyncSnapshot(message.snapshot)
      revision.value = message.snapshot.revision
      synced.value = true
      lastSnapshotAt.value = Date.now()
      persistSession()
    } else if (message.type === 'presence') connectedDevices.value = message.connectedDevices
  }

  function attachHostConnection(connection: DataConnection, expectedGeneration: number) {
    if (connection.metadata?.protocol !== APP_PROTOCOL) { connection.close(); return }
    hostConnection?.close()
    hostConnection = connection
    connection.on('open', () => {
      if (generation !== expectedGeneration) return connection.close()
      clearTimeout(reconnectTimer)
      status.value = 'connected'
      errorMessage.value = ''
      connectedDevices.value = Math.max(2, connectedDevices.value)
      send(connection, { schemaVersion: 1, type: 'snapshot-request' })
    })
    connection.on('data', onClientData)
    connection.on('close', () => {
      if (generation !== expectedGeneration || hostConnection !== connection) return
      hostConnection = undefined
      synced.value = false
      status.value = 'connecting'
      connectedDevices.value = 1
      scheduleClientReconnect(expectedGeneration)
    })
    connection.on('error', () => {
      if (generation !== expectedGeneration) return
      status.value = 'connecting'
      scheduleClientReconnect(expectedGeneration)
    })
  }

  function connectToHost(expectedGeneration: number) {
    if (!peer || peer.destroyed || generation !== expectedGeneration || !hostId.value) return
    status.value = 'connecting'
    const connection = peer.connect(hostId.value, { reliable: true, serialization: 'json', metadata: { protocol: APP_PROTOCOL } })
    attachHostConnection(connection, expectedGeneration)
  }

  function bindPeerEvents(instance: Peer, expectedGeneration: number) {
    instance.on('disconnected', () => {
      if (generation !== expectedGeneration || instance.destroyed) return
      status.value = role.value === 'host' && clientConnections.size ? 'connected' : 'connecting'
      try { instance.reconnect() } catch { /* A new connection attempt will follow. */ }
    })
    instance.on('close', () => {
      if (generation !== expectedGeneration) return
      synced.value = false
      status.value = role.value === 'client' ? 'connecting' : 'disconnected'
      connectedDevices.value = 1
      if (role.value === 'client') scheduleClientReconnect(expectedGeneration)
    })
    instance.on('error', (error: PeerError<`${PeerErrorType}`>) => {
      if (generation !== expectedGeneration) return
      if (role.value === 'host' && error.type === 'unavailable-id' && !fallbackAttempted) {
        fallbackAttempted = true
        createHostPeer(undefined, expectedGeneration)
        return
      }
      if (role.value === 'client' && (error.type === 'peer-unavailable' || error.type === 'network')) {
        status.value = 'connecting'
        errorMessage.value = 'Host non raggiungibile. Nuovo tentativo in corso.'
        scheduleClientReconnect(expectedGeneration)
        return
      }
      status.value = 'error'
      errorMessage.value = error.message || 'Connessione P2P non disponibile.'
    })
  }

  function resetTransport() {
    generation += 1
    clearTimeout(reconnectTimer)
    reconnectTimer = undefined
    hostConnection?.close()
    hostConnection = undefined
    for (const connection of clientConnections.values()) connection.close()
    clientConnections.clear()
    processedActions.clear()
    peer?.destroy()
    peer = undefined
    connectedDevices.value = 1
    synced.value = false
  }

  function createHostPeer(preferredId: string | undefined, expectedGeneration: number) {
    peer?.destroy()
    peer = preferredId ? new Peer(preferredId) : new Peer()
    const instance = peer
    bindPeerEvents(instance, expectedGeneration)
    instance.on('open', (id) => {
      if (generation !== expectedGeneration) return instance.destroy()
      localPeerId.value = id
      hostId.value = id
      status.value = 'waiting'
      errorMessage.value = ''
      persistSession()
    })
    instance.on('connection', attachClient)
  }

  function startHost(preferredId?: string, restoredRevision = 0) {
    if (!gameStore.game) throw new Error('Crea una partita prima di condividerla.')
    resetTransport()
    const expectedGeneration = generation
    role.value = 'host'
    status.value = 'connecting'
    hostId.value = preferredId ?? ''
    localPeerId.value = preferredId ?? ''
    revision.value = restoredRevision
    fallbackAttempted = false
    createHostPeer(preferredId, expectedGeneration)
  }

  function createClientPeer(expectedGeneration: number) {
    peer?.destroy()
    peer = new Peer()
    const instance = peer
    bindPeerEvents(instance, expectedGeneration)
    instance.on('open', (idValue) => {
      if (generation !== expectedGeneration) return instance.destroy()
      localPeerId.value = idValue
      persistSession()
      connectToHost(expectedGeneration)
    })
    instance.on('connection', (connection) => connection.close())
  }

  function joinHost(id: string, restoredRevision = 0) {
    resetTransport()
    const expectedGeneration = generation
    role.value = 'client'
    status.value = 'connecting'
    hostId.value = id
    localPeerId.value = ''
    revision.value = restoredRevision
    errorMessage.value = ''
    createClientPeer(expectedGeneration)
    persistSession()
  }

  function makeAction(action: SyncActionInput): SyncAction {
    return { schemaVersion: 1, id: createId(), origin: localPeerId.value || 'local', ...action } as SyncAction
  }

  function dispatch(action: SyncAction): number | undefined {
    if (!canEdit.value) throw new Error('Riconnessione all’Host in corso.')
    const result = applyAction(action)
    if (role.value === 'host') {
      processedActions.add(action.id)
      revision.value += 1
      persistSession()
      broadcastSnapshot()
    } else if (role.value === 'client' && hostConnection) {
      send(hostConnection, { schemaVersion: 1, type: 'action', action })
    }
    return result
  }

  function setDraftValue(playerId: string, field: 'positive' | 'negative', value: number) {
    dispatch(makeAction({ type: 'set-draft', playerId, field, value }))
  }

  function selectWinner(playerId: string, selected: boolean) {
    dispatch(makeAction({ type: 'select-winner', playerId, selected }))
  }

  function savePlayerScore(playerId: string): number {
    return dispatch(makeAction({ type: 'save-score', playerId })) ?? 0
  }

  function advanceHand() {
    dispatch(makeAction({ type: 'advance-hand' }))
  }

  function initialize() {
    if (initialized.value) return
    initialized.value = true
    gameStore.initialize()
    const stored = loadSession()
    if (!stored || !gameStore.game) {
      if (!gameStore.game) localStorage.removeItem(SESSION_STORAGE_KEY)
      return
    }
    if (stored.role === 'host') startHost(stored.hostId, stored.revision)
    else joinHost(stored.hostId, stored.revision)
  }

  function stopSession(clearStored = true) {
    resetTransport()
    role.value = undefined
    status.value = 'disconnected'
    hostId.value = ''
    localPeerId.value = ''
    revision.value = 0
    errorMessage.value = ''
    if (clearStored) localStorage.removeItem(SESSION_STORAGE_KEY)
  }

  return {
    role, status, hostId, localPeerId, connectedDevices, revision, lastSnapshotAt, errorMessage,
    canEdit, isSessionActive, initialize, startHost, joinHost, stopSession,
    setDraftValue, selectWinner, savePlayerScore, advanceHand
  }
})
