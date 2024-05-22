'use client'
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'
import { CHESS_PROGRAM_ADDRESS } from '@/consts/public'
import useProgram from '@/hooks/useProgram'
import { useLasrWallet } from '@/providers/LasrWalletProvider'
import { fetchAddressDetails } from '@/lib/clientHelpers'
import { IGame } from '@/lib/types'
import axios from 'axios'
import { delay } from '@/utils'

const ChessContext = createContext<any>(undefined)

export const ChessProvider = ({ children }: { children: ReactNode }) => {
  const { data, programAccountData, isFetching, getProgram } = useProgram(
    CHESS_PROGRAM_ADDRESS
  )
  const [users, setUsers] = useState<any[] | undefined>()
  const [isLoadingGames, setIsLoadingGames] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [games, setGames] = useState<IGame[] | undefined>()
  const [isLoadingLeaderBoard, setIsLoadingLeaderBoard] =
    useState<boolean>(true)
  const [leaderBoard, setLeaderBoard] = useState<
    | {
        address: string
        username: string
        wins: number
        losses: number
        games: number
        amountWon: number
        amountLost: number
      }[]
    | undefined
  >()

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setIsLoadingGames(true)
        const response = await axios.get<IGame[]>('/api/games')
        setGames(response.data)
      } catch (error) {
        setError(error instanceof Error ? error.message : 'An error occurred')
      } finally {
        await delay(5000)
        setIsLoadingGames(false)
      }
    }

    fetchGames()
  }, [])

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoadingLeaderBoard(true)
        const response = await axios.get<
          {
            address: string
            username: string
            wins: number
            losses: number
            games: number
            amountWon: number
            amountLost: number
          }[]
        >('/api/users')
        // @ts-ignore
        setLeaderBoard(response.data)
      } catch (error) {
        setError(error instanceof Error ? error.message : 'An error occurred')
      } finally {
        setIsLoadingLeaderBoard(false)
      }
    }

    fetchUsers()
  }, [])

  const getUser = (address: string) => {
    return leaderBoard?.find(
      (user) => user?.address?.toLowerCase() === address?.toLowerCase()
    )
  }

  return (
    <ChessContext.Provider
      value={{
        users,
        isLoading: isFetching,
        fetch: getProgram,
        games,
        isLoadingGames,
        leaderBoard,
        isLoadingLeaderBoard,
        getUser,
      }}
    >
      {children}
    </ChessContext.Provider>
  )
}

// Custom hook to use the context
export const useChess = () => {
  const context = useContext(ChessContext)
  if (context === undefined) {
    throw new Error('useChessContext must be used within a ChessProvider')
  }
  return context
}
