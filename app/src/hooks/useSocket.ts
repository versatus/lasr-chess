import { useEffect } from 'react'
import io from 'socket.io-client'

const socket = io()

export default function useSocket(eventName: unknown, cb: unknown) {
  useEffect(() => {
    // @ts-ignore
    socket.on(eventName, cb)

    return function socketCleanup() {
      // @ts-ignore
      socket.off(eventName, cb)
    }
  }, [eventName, cb])

  return socket
}
