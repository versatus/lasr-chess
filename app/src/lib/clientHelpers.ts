import axios from 'axios'
import { IGame } from '@/lib/types'

export const fetchAddressDetails = async ({ address }: { address: string }) => {
  if (!address) return
  return await axios.get(`/api/addresses/${address}`).then((res) => res.data)
}

export const fetchProgramDetails = async ({
  programAddress,
}: {
  programAddress: string
}) => {
  try {
    return await axios
      .get(`/api/programs/${programAddress}`)
      .then((res: { data: any }) => res.data)
  } catch (e) {
    throw e
  }
}

export const extractGames = (obj: Record<string, string>): IGame[] => {
  const games: Record<string, IGame> = {}
  Object.keys(obj).forEach((key) => {
    if (key.startsWith('game-')) {
      const [gameId, property] = key.split('-').slice(1)
      if (!games[gameId]) {
        games[gameId] = { gameId, address1: obj[`game-${gameId}-address1`] }
      }
      if (property) {
        ;(games[gameId] as any)[property] = obj[key]
      }
    }
  })

  return Object.values(games).filter((game) => game.address1)
}
