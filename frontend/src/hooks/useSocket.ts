import { useEffect, useRef, useCallback } from 'react'
import { io, type Socket } from 'socket.io-client'
import { getTokenPayload } from '../api'

type EventCallback = (data: unknown) => void

/**
 * Connects to the backend WebSocket gateway at /notifications,
 * joins the restaurante room, and listens to domain events.
 *
 * Returns a function to subscribe to a specific event channel.
 */
export function useSocket(onEvent?: (channel: string, data: unknown) => void) {
  const socketRef = useRef<Socket | null>(null)

  const subscribe = useCallback(
    (channel: string, cb: EventCallback) => {
      const socket = socketRef.current
      if (!socket) return () => {}
      socket.on(channel, cb)
      return () => { socket.off(channel, cb) }
    },
    [],
  )

  useEffect(() => {
    const profile = getTokenPayload()
    if (!profile?.restaurante_id) return

    const socket = io({
      path: '/notifications',
      transports: ['websocket'],
    })
    socketRef.current = socket

    socket.on('connect', () => {
      socket.emit('join', profile.restaurante_id)
    })

    // Relay all domain events upward
    const channels = [
      'pedido:CREADO',
      'pedido:ESTADO_ACTUALIZADO',
      'mesa:ACTIVADA',
      'mesa:LIBERADA',
    ]
    channels.forEach((ch) => {
      socket.on(ch, (data: unknown) => onEvent?.(ch, data))
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { subscribe }
}
