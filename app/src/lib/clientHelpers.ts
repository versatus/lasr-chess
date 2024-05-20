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

interface ChessOdds {
  whiteOdds: number
  blackOdds: number
}

const pieceValues: Record<string, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
  P: 1,
  N: 3,
  B: 3,
  R: 5,
  Q: 9,
  K: 0,
}

export const calculateMaterialValue = (
  fen: string
): { white: number; black: number } => {
  const pieces = fen.split(' ')[0] // Get the pieces part of the FEN
  let whiteValue = 0
  let blackValue = 0

  for (const char of pieces) {
    if (char in pieceValues) {
      if (char === char.toUpperCase()) {
        whiteValue += pieceValues[char]
      } else {
        blackValue += pieceValues[char]
      }
    }
  }

  return { white: whiteValue, black: blackValue }
}

export const calculateChessOdds = (fen: string): ChessOdds => {
  const { white, black } = calculateMaterialValue(fen)

  const totalMaterial = white + black
  let whiteOdds = (white / totalMaterial) * 100
  let blackOdds = (black / totalMaterial) * 100

  whiteOdds = Math.round(whiteOdds)
  blackOdds = 100 - whiteOdds

  return {
    whiteOdds,
    blackOdds,
  }
}
