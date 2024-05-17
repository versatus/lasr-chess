import { createServer } from 'node:http'
import next from 'next'
import { Server, Socket } from 'socket.io'
import { GameRoom, IGame } from '@/lib/types'
import axios from 'axios'
import { extractGames } from '@/lib/clientHelpers'

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = 3000
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port })
const handler = app.getRequestHandler()

const gameRooms: Record<string, GameRoom> = {}
const LASR_API_URL = 'http://lasr-sharks.versatus.io:9292'
const CHESS_MAIN_PROGRAM = process.env["NEXT_PUBLIC_CHESS_PROGRAM_ADDRESS"] ?? "xxx"
const NEW_GAME_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

app.prepare().then(() => {
  const httpServer = createServer(handler)

  const io = new Server(httpServer, {
    cors: {
      origin: '*',
    },
  })

  const fetchAccountData = async (address1: string): Promise<IGame[]> => {
    try {
      const response = await axios.post(LASR_API_URL, {
        jsonrpc: '2.0',
        method: 'lasr_getAccount',
        params: [address1],
        id: 1,
      })
      const data = JSON.parse(response.data.result)
      const accountData = data.programs?.[CHESS_MAIN_PROGRAM]?.data
      return accountData ? extractGames(accountData) : []
    } catch (error) {
      console.error('Error fetching account data:', error)
      return []
    }
  }

  const updateGameRoom = async (gameId: string, address1: string) => {
    const games = await fetchAccountData(address1)
    console.log('games', games)
    const game = games.find((g: any) => g.gameId === gameId)
    if (game) {
      const { fen } = game
      const uniqueGameId = `${gameId}-${address1}`
      console.log(uniqueGameId)
      if (!gameRooms[uniqueGameId]) {
        gameRooms[uniqueGameId] = {
          members: new Set(),
          fen: fen!,
        }
      } else if (gameRooms[uniqueGameId].fen !== fen) {
        gameRooms[uniqueGameId].fen = fen!
        io.to(uniqueGameId).emit('updateFen', fen)
      }
    }
  }

  const updateGameRooms = async (address1: string) => {
    const games = await fetchAccountData(address1)
    for (const game of games) {
      const { gameId, fen } = game
      const uniqueGameId = `${gameId}-${address1}`
      if (!gameRooms[uniqueGameId]) {
        gameRooms[uniqueGameId] = {
          members: new Set(),
          fen: fen!,
        }
      } else if (gameRooms[uniqueGameId].fen !== fen) {
        gameRooms[uniqueGameId].fen = fen!
        io.to(uniqueGameId).emit('updateFen', fen)
      }
    }
    io.emit('currentGames', Object.keys(gameRooms))
  }

  setInterval(() => {
    const addressList = Object.keys(gameRooms).map((key) => key.split('-')[1])
    addressList.forEach((address1) => updateGameRooms(address1))
  }, 5000)

  const handleDisconnection = (uniqueGameId: string, userId: string) => {
    if (gameRooms[uniqueGameId]) {
      gameRooms[uniqueGameId].members.delete(userId)

      io.to(uniqueGameId).emit('gameMembers', [
        // @ts-ignore
        ...gameRooms[uniqueGameId].members,
      ])
      if (gameRooms[uniqueGameId].members.size === 0) {
        delete gameRooms[uniqueGameId]
      }
    }
    console.log(`User ${userId} disconnected from game ${uniqueGameId}`)
  }

  io.on('connection', (socket: Socket) => {
    socket.emit('currentGames', Object.keys(gameRooms))

    socket.on('createGame', (userId: string, address1: string) => {
      const gameId = generateGameId()
      const uniqueGameId = `${gameId}-${address1}`
      gameRooms[uniqueGameId] = {
        members: new Set([userId]),
        fen: NEW_GAME_FEN,
      }
      socket.join(uniqueGameId)
      io.emit('newGame', uniqueGameId)
      console.log(`User ${userId} created game ${uniqueGameId}`)
    })

    socket.on(
      'joinGame',
      async (gameId: string, address1: string, userId: string) => {
        const uniqueGameId = `${gameId}-${address1}`

        if (!gameRooms[uniqueGameId]) {
          console.log('updating game room')
          await updateGameRoom(gameId, address1)
          console.log('game room!', gameRooms[uniqueGameId])
        }

        if (gameRooms[uniqueGameId]) {
          socket.join(uniqueGameId)
          gameRooms[uniqueGameId].members.add(userId)
          io.to(uniqueGameId).emit('gameMembers', [
            // @ts-ignore
            ...gameRooms[uniqueGameId].members,
          ])
          console.log(`User ${userId} joined game ${uniqueGameId}`)

          const accountData = await fetchAccountData(address1)
          const game = accountData.find((g: any) => g.gameId === gameId)
          if (game) {
            gameRooms[uniqueGameId].fen = game.fen!
            io.to(uniqueGameId).emit('updateFen', game.fen)
          }

          socket.on('disconnect', () => {
            handleDisconnection(uniqueGameId, userId)
          })
        } else {
          socket.emit('error', 'Game not found')
        }
      }
    )

    socket.on(
      'leaveGame',
      (gameId: string, address1: string, userId: string) => {
        const uniqueGameId = `${gameId}-${address1}`
        if (gameRooms[uniqueGameId]) {
          gameRooms[uniqueGameId].members.delete(userId)

          io.to(uniqueGameId).emit('gameMembers', [
            // @ts-ignore
            ...gameRooms[uniqueGameId].members,
          ])
          if (gameRooms[uniqueGameId].members.size === 0) {
            delete gameRooms[uniqueGameId]
          }
        }
        socket.leave(uniqueGameId)
        console.log(`User ${userId} left game ${uniqueGameId}`)
      }
    )

    socket.on('refreshGameState', async (gameId: string, address1: string) => {
      const uniqueGameId = `${gameId}-${address1}`
      const games = await fetchAccountData(address1)
      const game = games.find((g: any) => g.gameId === gameId)
      if (game) {
        gameRooms[uniqueGameId].fen = game.fen!
        io.to(uniqueGameId).emit('updateFen', game.fen)
      }
    })
  })

  httpServer
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
    })
})

const generateGameId = (): string => {
  return `game-${Math.random().toString(36).substr(2, 9)}`
}
