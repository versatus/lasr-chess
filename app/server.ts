import { createServer } from 'node:http'
import next from 'next'
import { Server, Socket } from 'socket.io'
import { GameRoom, IGame } from '@/lib/types'
import axios from 'axios'
import { extractGames } from '@/lib/clientHelpers'
import { extractGamesServer, getAccount } from '@/lib/serverHelpers'
import { CHESS_PROGRAM_ADDRESS } from '@/consts/public'

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = 3000
const app = next({ dev, hostname, port })
const handler = app.getRequestHandler()

const LASR_API_URL = 'http://lasr-sharks.versatus.io:9292'
const CHESS_MAIN_PROGRAM =
  process.env['NEXT_PUBLIC_CHESS_PROGRAM_ADDRESS'] ?? 'xxx'
const NEW_GAME_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

app.prepare().then(() => {
  const httpServer = createServer(handler)

  const io = new Server(httpServer, {
    cors: {
      origin: '*',
    },
  })

  const gameCenterMembers: Set<string> = new Set()
  let currentGames: IGame[] = []
  const gameRooms: Record<string, GameRoom> = {}

  const fetchAllNonFinishedGames = async () => {
    console.log('fetching all games')
    const response = await getAccount(CHESS_PROGRAM_ADDRESS)
    const users = JSON.parse(response.programAccountData.users)
    const chessGames = []
    for await (const [address, username] of Object.entries(users)) {
      const account = await getAccount(address)
      const games = extractGamesServer(
        account.programs[CHESS_PROGRAM_ADDRESS].data
      )
      if (games?.length > 0) {
        chessGames.push(...games)
      }
    }
    return chessGames.filter((g: IGame) => g.gameState !== 'finished')
  }

  const fetchAccountData = async (address1: string): Promise<IGame[]> => {
    try {
      console.log({ address1 })
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

  const updateGameRoom = async (
    gameId: string,
    address1: string,
    userId: string
  ) => {
    const games = await fetchAccountData(address1)
    console.log('games', games)
    const game = games.find((g: any) => g.gameId === gameId)
    if (game) {
      const { fen } = game
      const uniqueGameId = `${gameId}-${address1}`
      if (!gameRooms[uniqueGameId]) {
        console.log('DIDNT FIND GAME ROOM! MAKING ANEW')
        gameRooms[uniqueGameId] = {
          members: new Set(),
          fen: fen!,
        }
        gameRooms[uniqueGameId].members.add(userId)
      } else if (gameRooms[uniqueGameId].fen !== fen) {
        gameRooms[uniqueGameId].fen = fen!
        io.to(uniqueGameId).emit('updateFen', fen)
      }
    }
  }

  const updateGameRooms = async (address1: string) => {
    const games = await fetchAccountData(address1)
    for (const game of games) {
      const { gameId, fen, gameState } = game
      if (gameState === 'finished') return
      const uniqueGameId = `${gameId}-${address1}`
      if (!gameRooms[uniqueGameId]) {
        console.log('game not found, creating')
        gameRooms[uniqueGameId] = {
          members: new Set(),
          fen: fen!,
        }
      } else if (gameRooms[uniqueGameId].fen !== fen) {
        gameRooms[uniqueGameId].fen = fen!
        io.to(uniqueGameId).emit('updateFen', fen)
      }
    }
    // io.emit('currentGames', Object.keys(gameRooms))
  }

  setInterval(() => {
    fetchAllNonFinishedGames().then((games) => {
      console.log(games)
      // currentGames = games
      io.emit('currentGames', games)
    })
  }, 7000)

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

  const handleGameCenterDisconnection = (userId: string) => {
    gameCenterMembers.delete(userId)
    io.emit('gameCenterMembers', Array.from(gameCenterMembers))
    console.log(`User ${userId} disconnected from gameCenter`)
  }

  io.on('connection', (socket: Socket) => {
    socket.emit('currentGames', Object.keys(gameRooms))

    socket.on('joinGameCenter', (userId: string) => {
      gameCenterMembers.add(userId)
      io.emit('gameCenterMembers', Array.from(gameCenterMembers))
      console.log(`User ${userId} joined gameCenter`)

      socket.on('disconnect', () => {
        handleGameCenterDisconnection(userId)
      })
    })

    socket.on(
      'createGame',
      (userId: string, address1: string, gameId: string) => {
        // const gameId = generateGameId()
        // const uniqueGameId = `game-${gameId}-${address1}`
        // gameRooms[uniqueGameId] = {
        //   members: new Set([userId]),
        //   fen: NEW_GAME_FEN,
        // }
        // socket.join(uniqueGameId)
        // io.emit('newGame', uniqueGameId)
        // console.log(`User ${userId} created game ${uniqueGameId}`)
      }
    )

    socket.on(
      'joinGame',
      async (gameId: string, address1: string, userId: string) => {
        const uniqueGameId = `${gameId}-${address1}`

        if (!gameRooms[uniqueGameId]) {
          await updateGameRoom(gameId, address1, userId)
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
          if (game && gameRooms[uniqueGameId]) {
            if (gameRooms[uniqueGameId].fen) {
              gameRooms[uniqueGameId].fen = game.fen!
            }
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
