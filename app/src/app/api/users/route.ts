import { NextResponse } from 'next/server'
import { CHESS_PROGRAM_ADDRESS } from '@/consts/public'
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

    const usersStats = calculateUserStats(users, chessGames)

    return NextResponse.json(usersStats)
  } catch (e) {
    if (e instanceof Error) {
      return NextResponse.json({ error: e.message }, { status: 500 })
    } else {
      return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
    }
  }
}

const calculateUserStats = (users: { [x: string]: any }, games: any) => {
  // Initialize user stats
  const userStats = {}

  // Populate initial user data
  for (const address in users) {
    // @ts-ignore
    userStats[address.toLowerCase()] = {
      address: address.toLowerCase(),
      username: users[address],
      wins: 0,
      losses: 0,
      games: 0,
    }
  }

  // Calculate wins, losses, and total games
  for (const game of games) {
    const address1 = game.address1.toLowerCase()
    const address2 = game.address2.toLowerCase()
    const winnerAddress = game.winnerAddress.toLowerCase()

    // Increment game counts
    // @ts-ignore
    if (userStats[address1]) {
      // @ts-ignore
      userStats[address1].games += 1
    }
    // @ts-ignore
    if (userStats[address2]) {
      // @ts-ignore
      userStats[address2].games += 1
    }

    // Increment win/loss counts
    if (winnerAddress === address1) {
      // @ts-ignore
      userStats[address1].wins += 1
      // @ts-ignore
      userStats[address2].losses += 1
    } else if (winnerAddress === address2) {
      // @ts-ignore
      userStats[address2].wins += 1
      // @ts-ignore
      userStats[address1].losses += 1
    }
  }

  return Object.values(userStats).sort(
    // @ts-ignore
    (a, b) => b.wins - a.wins
  )
}
