import { useEffect, useState } from 'react'
import { socket } from '@/socket'

export default function useSocket() {
  const [isConnected, setIsConnected] = useState(socket.connected)
  const [transport, setTransport] = useState(
    socket.io.engine.transport.name || 'N/A'
  )

  useEffect(() => {
    function onConnect() {
      setIsConnected(true)
      setTransport(socket.io.engine.transport.name)

      socket.io.engine.on('upgrade', (transport) => {
        setTransport(transport.name)
      })
    }

    function onDisconnect() {
      setIsConnected(false)
      setTransport('N/A')
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)

    // Check the initial connection status
    if (socket.connected) {
      onConnect()
    }

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
    }
  }, []) // Empty dependency array to run the effect only once

  return { isConnected, socket }
}
