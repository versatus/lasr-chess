import { NextRequest, NextResponse } from 'next/server'
import process from 'process'
import axios from 'axios'
import { CHESS_PROGRAM_ADDRESS } from '@/consts/public'
import { IGame } from '@/lib/types'

export async function GET() {
  try {
    if (!CHESS_PROGRAM_ADDRESS) {
      throw new Error('chess address not found')
    }

    const response = await getAccount(CHESS_PROGRAM_ADDRESS)
    const users = JSON.parse(response.programAccountData.users)
    const chessGames = []
    for await (const [address, username] of Object.entries(users)) {
      const account = await getAccount(address)
      const games = extractGames(account.programs[CHESS_PROGRAM_ADDRESS].data)
      if (games?.length > 0) {
        chessGames.push(...games)
      }
    }

    return NextResponse.json(chessGames)
  } catch (e) {
    if (e instanceof Error) {
      return NextResponse.json({ error: e.message }, { status: 500 })
    } else {
      return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
    }
  }
}

const getAccount = async (address: string) => {
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

const extractGames = (obj: Record<string, string>): IGame[] => {
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
