import { useCallback, useEffect, useState } from 'react'
import { IGame } from '@/lib/types'
import axios from 'axios'

export default function useChessGame(gameId: string) {
  const [game, setGame] = useState<IGame | undefined>()
  const [isLoadingGame, setIsLoadingGame] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchGame = useCallback(async () => {
    try {
      const response = await axios.get<IGame>(`/api/games/${gameId}`)
      setGame(response.data)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoadingGame(false)
    }
  }, [gameId])

  useEffect(() => {
    fetchGame()
  }, [fetchGame, gameId])

  return {
    game,
    isLoadingGame,
    fetchGame,
  }
}
