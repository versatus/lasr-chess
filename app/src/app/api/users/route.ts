import { NextResponse } from 'next/server'
import { CHESS_PROGRAM_ADDRESS } from '@/consts/public'
import { extractGamesServer, getAccount } from '@/lib/serverHelpers'

export async function GET() {
  try {
    if (!CHESS_PROGRAM_ADDRESS) {
      throw new Error('chess address not found')
    }

    console.log('getting all users')

    const response = await getAccount(CHESS_PROGRAM_ADDRESS)
    const users = JSON.parse(response.programAccountData.users)
    const chessGames = []
    for await (const [address] of Object.entries(users)) {
      try {
        const account = await getAccount(address)
        const games = extractGamesServer(
          account.programs[CHESS_PROGRAM_ADDRESS].data
        )
        if (games?.length > 0) {
          chessGames.push(...games)
        }
      } catch (e) {
        console.error(`couldn't get ${address}`)
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
  const userStats = {}

  for (const address in users) {
    // @ts-ignore
    userStats[address.toLowerCase()] = {
      address: address.toLowerCase(),
      username: users[address],
      wins: 0,
      losses: 0,
      games: 0,
      amountWon: 0,
      amountLost: 0,
    }
  }

  for (const game of games) {
    const address1 = game?.address1?.toLowerCase()
    const address2 = game?.address2?.toLowerCase()
    const winnerAddress = game?.winnerAddress?.toLowerCase()
    const totalPot = parseFloat(game.wager) * 2

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

    // @ts-ignore
    if (userStats?.[address1] && winnerAddress === address1) {
      // @ts-ignore
      userStats[address1].wins += 1
      // @ts-ignore
      userStats[address1].amountWon += totalPot
      // @ts-ignore
      userStats[address2].losses += 1
      // @ts-ignore
      userStats[address2].amountLost += totalPot
      // @ts-ignore
    } else if (userStats[address2] && winnerAddress === address2) {
      // @ts-ignore
      userStats[address2].wins += 1
      // @ts-ignore
      userStats[address2].amountWon += totalPot
      // @ts-ignore
      userStats[address1].losses += 1
      // @ts-ignore
      userStats[address1].amountLost += totalPot
    }
  }

  return Object.values(userStats).sort(
    // @ts-ignore
    (a, b) => b.wins - a.wins
  )
}
