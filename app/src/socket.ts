'use client'

import { io } from 'socket.io-client'

export const socket = io({
  reconnection: true,
  autoConnect: true,
})
