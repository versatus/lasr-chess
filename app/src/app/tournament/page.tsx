'use client'
import { Bracket, IRenderSeedProps, IRoundProps } from 'react-brackets'
import { Seed, SeedItem, SeedTeam } from 'react-brackets'

import React, { useState } from 'react'
import clsx from 'clsx'

type Team = {
  name: string
}

type Seed = {
  id: number
  date: string
  teams: Team[]
}

const users = [
  'Versatus',
  'Eigen',
  'Movement',
  'Open Layer',
  'Monad',
  'Swell',
  'Cube',
  'ZKSync',
  'Omega',
  'Avail',
  'Mantle',
  'Vertex',
  'Layer N',
  'Polkadot',
  'Ethereum',
  'Fuel',
].map((name, i) => ({
  address: `${name}@example.com`,
  name: `${name}`,
}))

console.log(users)

type User = {
  address: string
  name: string
}

type Game = {
  id: number
  player1: User
  player2: User
  winner?: string
}

type TournamentState = 'initialized' | 'inProgress' | 'finished'

interface StandingsEntry {
  user: User
  roundReached: number
}

interface Tournament {
  state: TournamentState
  rounds: IRoundProps[]
  standings: StandingsEntry[]
}

const createTournament = (users: User[]): Tournament => {
  const rounds: IRoundProps[] = []
  let roundNumber = 1
  let currentRoundUsers = [...users]
  let gameId = 1

  while (currentRoundUsers.length > 1) {
    const seeds: Seed[] = []
    for (let i = 0; i < currentRoundUsers.length; i += 2) {
      const player1 = currentRoundUsers[i]
      const player2 = currentRoundUsers[i + 1]
      seeds.push({
        id: gameId++,
        date: new Date().toDateString(),
        teams: [{ name: player1.name }, { name: player2.name }],
      })
    }
    rounds.push({ title: `Round ${roundNumber}`, seeds })
    roundNumber++
    currentRoundUsers = new Array(Math.ceil(currentRoundUsers.length / 2))
      .fill(null)
      .map(() => ({ address: '', name: '' }))
  }

  return {
    state: 'initialized',
    rounds,
    standings: [],
  }
}

const updateTournament = (
  tournament: Tournament,
  gameId: number,
  winnerName: string
): Tournament => {
  if (tournament.state === 'finished') {
    throw new Error('Tournament has already finished.')
  }

  let gameFound = false
  let currentRoundIndex = 0
  let currentGameIndex = 0
  let losingPlayer: User | null = null

  for (const round of tournament.rounds) {
    currentGameIndex = 0
    for (const game of round.seeds) {
      if (game.id === gameId) {
        const winnerTeam = game.teams.find((team) => team.name === winnerName)
        if (!winnerTeam) {
          throw new Error('Winner name does not match any team in the game.')
        }
        const loserTeam = game.teams.find((team) => team.name !== winnerName)
        if (loserTeam) {
          // @ts-ignore
          losingPlayer = { address: loserTeam.name, name: loserTeam.name }
        }
        gameFound = true
        break
      }
      currentGameIndex++
    }
    if (gameFound) break
    currentRoundIndex++
  }

  if (!gameFound) {
    throw new Error('Game not found.')
  }

  if (currentRoundIndex < tournament.rounds.length - 1) {
    const currentRound = tournament.rounds[currentRoundIndex]
    const nextRound = tournament.rounds[currentRoundIndex + 1]

    const nextGameIndex = Math.floor(currentGameIndex / 2)
    const nextGame = nextRound.seeds[nextGameIndex]

    if (currentGameIndex % 2 === 0) {
      nextGame.teams[0] = { name: winnerName }
    } else {
      nextGame.teams[1] = { name: winnerName }
    }

    tournament.state = 'inProgress'
  }

  if (losingPlayer) {
    tournament.standings.push({
      user: losingPlayer,
      roundReached: currentRoundIndex + 1,
    })
  }

  const lastRound = tournament.rounds[tournament.rounds.length - 1]
  if (
    lastRound.seeds.every((seed) =>
      seed.teams.some((team) => team.name === winnerName)
    )
  ) {
    tournament.state = 'finished'
    const winner = lastRound.seeds[0].teams.find(
      (team) => team.name === winnerName
    )!

    tournament.standings.push({
      // @ts-ignore
      user: { address: winner.name, name: winner.name },
      roundReached: tournament.rounds.length,
    })
    tournament.standings.reverse()
  } else {
    tournament.state = 'inProgress'
  }

  return tournament
}

const CustomSeed = ({
  seed,
  breakpoint,
  roundIndex,
  seedIndex,
}: IRenderSeedProps) => {
  const winnerAddress = seed.winner
  return (
    <Seed mobileBreakpoint={breakpoint} style={{ fontSize: 12 }}>
      <SeedItem>
        <div>
          <SeedTeam
            className={clsx(
              winnerAddress === seed.teams[0]?.name
                ? 'text-pink-600'
                : 'inherit',
              'font-black text-xl'
            )}
          >
            {seed.teams[0]?.name || '---'}
          </SeedTeam>
          <SeedTeam
            className={clsx(
              winnerAddress === seed.teams[1]?.name
                ? 'text-pink-600'
                : 'inherit',
              'font-black text-xl'
            )}
          >
            {seed.teams[1]?.name || '---'}
          </SeedTeam>
        </div>
      </SeedItem>
    </Seed>
  )
}

const Component = () => {
  const [tournament, setTournament] = useState(createTournament(users))
  const [gameId, setGameId] = useState(1)
  const [winner, setWinner] = useState('')

  console.log(JSON.stringify(tournament))

  const handleUpdate = () => {
    setTournament(updateTournament(tournament, gameId, winner))
    setGameId(gameId + 1)
  }

  return (
    <div className="relative mx-auto p-4">
      <h1 className="text-4xl font-bold mb-8 text-center">
        Versatus Chess Tournament League
      </h1>
      <Bracket rounds={tournament.rounds} renderSeedComponent={CustomSeed} />

      <div className="w-1/5 fixed right-0 height-[600px] bg-pink-600 text-white font-black top-10 rounded-l-2xl shadow-2xl p-12">
        <div className="mt-8">
          <div className="mb-4 text-black">
            <label className="block mb-2 text-lg font-semibold">
              Game ID:
              <input
                type="number"
                value={gameId}
                onChange={(e) => setGameId(parseInt(e.target.value))}
                className="text-black ml-2 p-1 border rounded w-20"
              />
            </label>
            <label className="block mb-2 text-lg font-semibold">
              Winner Name:
              <input
                type="text"
                value={winner}
                onChange={(e) => setWinner(e.target.value)}
                className="text-black ml-2 p-1 border rounded w-60"
              />
            </label>
            <button
              onClick={handleUpdate}
              className="bg-blue-500 text-white py-2 px-6 rounded"
            >
              Update
            </button>
          </div>
        </div>
        <h2 className="text-2xl font-semibold mb-4">Standings</h2>
        <ul className="list-disc list-inside">
          {tournament.standings.map((entry, index) => (
            <li key={index} className="text-lg">
              {entry.user.name} - Round {entry.roundReached}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default Component
