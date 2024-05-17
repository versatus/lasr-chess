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

const ChessContext = createContext<any>(undefined)

export const ChessProvider = ({ children }: { children: ReactNode }) => {
  const { address } = useLasrWallet()
  const { data, programAccountData, isFetching, getProgram } = useProgram(
    CHESS_PROGRAM_ADDRESS
  )
  const [users, setUsers] = useState<any[] | undefined>()
  const [profile, setProfile] = useState<any | undefined>()
  const [isLoadingGames, setIsLoadingGames] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [games, setGames] = useState<IGame[] | undefined>()

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setIsLoadingGames(true)
        const response = await axios.get<IGame[]>('/api/games')
        setGames(response.data)
      } catch (error) {
        setError(error instanceof Error ? error.message : 'An error occurred')
      } finally {
        setIsLoadingGames(false)
      }
    }

    fetchGames()
  }, [])

  useEffect(() => {
    if (programAccountData && programAccountData?.users) {
      setUsers(
        Object.entries(JSON.parse(programAccountData?.users)).map(
          ([key, value]) => {
            return { address: key, username: value }
          }
        )
      )
    }
  }, [programAccountData])

  useEffect(() => {
    if (data && address) {
      // requestAccount()
      const foundUser = Object.entries(data).find(
        ([userAddress]) => address.toLowerCase() === userAddress.toLowerCase()
      )?.[1]
      if (foundUser) {
        setProfile(JSON.parse(foundUser))
      }
    }
  }, [address, data])

  const getUser = (address: string) => {
    return users?.find(
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
