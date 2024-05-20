import { useEffect, useState } from 'react'
import io from 'socket.io-client'
import { Socket } from 'socket.io'
import { useLasrWallet } from '@/providers/LasrWalletProvider'

export default function useSocket(address: string) {
  const [socket, setSocket] = useState<Socket | undefined>()
  const [isConnected, setIsConnected] = useState(false)
  const [transport, setTransport] = useState('N/A')

  useEffect(() => {
    if (address) {
      const temp = io({
        reconnection: true,
      })
      // @ts-ignore
      setSocket(temp)
    }
  }, [address])

  useEffect(() => {
    function onConnect() {
      setIsConnected(true)
      if (socket) {
        // @ts-ignore
        setTransport(socket?.io.engine.transport.name)
        // @ts-ignore
        socket?.io?.engine.on('upgrade', (transport) => {
          setTransport(transport.name)
        })
      }
    }

    function onDisconnect() {
      setIsConnected(false)
      setTransport('N/A')
    }
    if (socket) {
      if (socket.connected) {
        console.log('on connect')
        onConnect()
      }

      socket.on('connect', onConnect)
      socket.on('disconnect', onDisconnect)

      return () => {
        socket.off('connect', onConnect)
        socket.off('disconnect', onDisconnect)
      }
    }
  }, [socket])

  return socket
}
