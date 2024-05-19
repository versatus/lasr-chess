import { NextRequest, NextResponse } from 'next/server'
import { CHESS_PROGRAM_ADDRESS } from '@/consts/public'
import { IGame } from '@/lib/types'
import { extractGamesServer, getAccount } from '@/lib/serverHelpers'

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
      const games = extractGamesServer(
        account.programs[CHESS_PROGRAM_ADDRESS].data
      )
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
