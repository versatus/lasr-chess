import process from 'process'
import axios from 'axios'
import { IGame } from '@/lib/types'

export const getAccount = async (address: string) => {
  try {
    const LASR_RPC_URL = process.env['LASR_RPC_URL']
    if (!LASR_RPC_URL) {
      throw new Error('lasr rpc url missing from ENV')
    }

    return await axios
      .post(LASR_RPC_URL, {
        jsonrpc: '2.0',
        method: 'lasr_getAccount',
        params: [address],
        id: 1,
      })
      .then((res) => JSON.parse(res.data?.result))
  } catch (e) {
    throw e
  }
}

export const extractGamesServer = (obj: Record<string, string>): IGame[] => {
  const games: Record<string, IGame> = {}

  Object.keys(obj).forEach((key) => {
    if (key.startsWith('game-')) {
      const [gameId, property] = key.split('-').slice(1)

      if (!games[gameId]) {
        games[gameId] = { gameId }
      }

      if (property) {
        ;(games[gameId] as any)[property] = obj[key]
      }
    }
  })

  return Object.values(games).filter((game) => game.address1)
}
