import { useEffect, useRef, useCallback } from 'react'
import { io, type Socket } from 'socket.io-client'
import { getTokenPayload } from '../api'

type EventCallback = (data: unknown) => void

/**
 * Connects to the backend WebSocket gateway at /notifications,
 * joins the restaurante room, and listens to domain events.
 *
 * Supports automatic reconnection catch-up (`onReconnect`) and fresh callback execution via refs.
 */
export function useSocket(
  onEvent?: (channel: string, data: unknown) => void,
  onReconnect?: () => void,
  explicitRestauranteId?: string
) {
  const socketRef = useRef<Socket | null>(null)
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent

  const onReconnectRef = useRef(onReconnect)
  onReconnectRef.current = onReconnect

  const subscribe = useCallback(
    (channel: string, cb: EventCallback) => {
      const socket = socketRef.current
      if (!socket) return () => {}
      socket.on(channel, cb)
      return () => {
        socket.off(channel, cb)
      }
    },
    []
  )

  useEffect(() => {
    const profile = getTokenPayload()
    const targetRestauranteId = explicitRestauranteId || profile?.restaurante_id
    if (!targetRestauranteId) return

    const socket = io({
      path: '/notifications',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    })
    socketRef.current = socket

    let isInitialConnect = true

    socket.on('connect', () => {
      socket.emit('join', targetRestauranteId)
      if (!isInitialConnect) {
        onReconnectRef.current?.()
      }
      isInitialConnect = false
    })

    socket.io.on('reconnect', () => {
      socket.emit('join', targetRestauranteId)
      onReconnectRef.current?.()
    })

    // Relay all domain events upward using fresh ref
    const channels = [
      'pedido:CREADO',
      'pedido:ESTADO_ACTUALIZADO',
      'mesa:ACTIVADA',
      'mesa:LIBERADA',
      'mesa:CREADA',
      'mesa:CAPACIDAD_ACTUALIZADA',
      'mesa:ELIMINADA',
    ]
    channels.forEach((ch) => {
      socket.on(ch, (data: unknown) => onEventRef.current?.(ch, data))
    })

    // Reconciliation on page visibility or when returning online
    const handleSyncOnWake = () => {
      if (document.visibilityState === 'visible' || navigator.onLine) {
        if (!socket.connected) {
          socket.connect()
        } else {
          onReconnectRef.current?.()
        }
      }
    }

    window.addEventListener('online', handleSyncOnWake)
    document.addEventListener('visibilitychange', handleSyncOnWake)

    return () => {
      window.removeEventListener('online', handleSyncOnWake)
      document.removeEventListener('visibilitychange', handleSyncOnWake)
      socket.disconnect()
      socketRef.current = null
    }
  }, [])

  return { subscribe }
}
