import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from 'react'

import { CHESS_PROGRAM_ADDRESS } from '@/consts/public'
import useUserAccount from '@/hooks/useUserAccount'
import { delay, getNewNonceForAccount } from '@/utils'
import { useLasrWallet } from '@/providers/LasrWalletProvider'
import { toast } from 'react-hot-toast'
import { Move } from 'chess.js'
import axios from 'axios'
import { useChess } from '@/hooks/useChess'
import { IProgram, ZERO_VALUE } from '@versatus/versatus-javascript'
import { useRouter } from 'next/navigation'

const ChessAccountContext = createContext<any>(undefined)
export const ChessAccountProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter()
  const { address, accountInfo, call, requestAccount } = useLasrWallet()
  const { profile, fetch } = useChess()
  const { refetchAccount, isFetching: isFetchingAccount } =
    useUserAccount(address)

  const [chessAccount, setChessAccount] = useState<IProgram | undefined>()
  const [isApproving, setIsApproving] = useState(false)
  const [isCreatingGame, setIsCreatingGame] = useState(false)
  const [isAcceptingGame, setIsAcceptingGame] = useState(false)
  const [isForfeitingGame, setIsForfeitingGame] = useState(false)
  const [isMakingMove, setIsMakingMove] = useState(false)
  const [game, setGame] = useState('')
  const [isSigningUp, setIsSigningUp] = useState(false)
  const [hasAccount, setHasAccount] = useState(false)

  useEffect(() => {
    if (accountInfo && accountInfo?.data?.programs[CHESS_PROGRAM_ADDRESS]) {
      setChessAccount(accountInfo.data.programs[CHESS_PROGRAM_ADDRESS])
      setHasAccount(true)
    } else {
      setHasAccount(false)
    }
  }, [accountInfo, address, isApproving])

  const isApproved = (addressToCheckApproval: string) =>
    !!chessAccount?.approvals[addressToCheckApproval]

  const signUp = async (username: string) => {
    setIsSigningUp(true)
    try {
      await axios.post('/api/register-user', {
        address,
        username,
      })
      await delay(1000)
      await requestAccount()
    } catch (e) {
      if (e instanceof Error) {
        toast.error("Couldn't sign up")
        setIsSigningUp(false)
      }
    }
  }

  const getNewGames = async () => {
    try {
      return await axios
        .get(`/api/addresses/${address}/games`)
        .then((res) => res.data)
    } catch (e) {
      if (e instanceof Error) {
        toast.error("Couldn't get new game...")
      }
    }
  }

  const approve = useCallback(async () => {
    try {
      setIsApproving(true)
      const nonce = getNewNonceForAccount(accountInfo)
      const payload = {
        from: address.toLowerCase(),
        op: 'approve',
        programId: CHESS_PROGRAM_ADDRESS,
        to: CHESS_PROGRAM_ADDRESS,
        transactionInputs: `[["${CHESS_PROGRAM_ADDRESS}",["${ZERO_VALUE}"]]]`,
        transactionType: {
          call: nonce,
        },
        value: ZERO_VALUE,
      }
      await call(payload)
      await delay(2500)
      await refetchAccount()
      toast.success('Transaction sent successfully')
    } catch (e) {
      if (e instanceof Error) {
        toast.error(e.message.replace('Custom error:', ''))
      }
    } finally {
      setIsApproving(false)
    }
  }, [address, accountInfo, call, refetchAccount])

  const createNewGame = useCallback(
    async (wager: string, gameType: string, opponentAddress?: string) => {
      try {
        setIsCreatingGame(true)
        const nonce = getNewNonceForAccount(accountInfo)
        const payload = {
          from: address.toLowerCase(),
          op: 'newGame',
          programId: CHESS_PROGRAM_ADDRESS,
          to: CHESS_PROGRAM_ADDRESS,
          transactionInputs: JSON.stringify({
            address1: address,
            address2: opponentAddress,
            wager,
            gameType,
          }),
          transactionType: {
            call: nonce,
          },
          value: ZERO_VALUE,
        }
        await call(payload)
        await fetch()
        toast.success('Transaction sent successfully... Redirecting to game.')
      } catch (e) {
        if (e instanceof Error) {
          toast.error(e.message.replace('Custom error:', ''))
          setIsCreatingGame(false)
        }
      } finally {
      }
    },
    [accountInfo, address, call, fetch]
  )

  const acceptGame = useCallback(
    async (gameId: string, address1: string, wager: string) => {
      try {
        setIsAcceptingGame(true)
        const nonce = getNewNonceForAccount(accountInfo)
        const payload = {
          from: address.toLowerCase(),
          op: 'acceptGame',
          programId: CHESS_PROGRAM_ADDRESS,
          to: CHESS_PROGRAM_ADDRESS,
          transactionInputs: JSON.stringify({
            gameId,
            address1,
            wager,
          }),
          transactionType: {
            call: nonce,
          },
          value: ZERO_VALUE,
        }
        await call(payload)
        await delay(1500)
        await refetchAccount()
        toast.success('Transaction sent successfully')
      } catch (e) {
        if (e instanceof Error) {
          toast.error(e.message.replace('Custom error:', ''))
        }
      } finally {
        await router.push(`/${gameId}`)
      }
    },
    [accountInfo, address, call, refetchAccount, router]
  )

  const forfeit = useCallback(
    async (
      gameId: string,
      address1: string,
      address2: string,
      wager: string
    ) => {
      try {
        setIsForfeitingGame(true)
        const nonce = getNewNonceForAccount(accountInfo)
        const payload = {
          from: address.toLowerCase(),
          op: 'forfeit',
          programId: CHESS_PROGRAM_ADDRESS,
          to: CHESS_PROGRAM_ADDRESS,
          transactionInputs: JSON.stringify({
            gameId,
            address1,
            address2,
            wager,
          }),
          transactionType: {
            call: nonce,
          },
          value: ZERO_VALUE,
        }
        await call(payload)
        toast.success('Transaction sent successfully')
      } catch (e) {
        setIsForfeitingGame(false)
        if (e instanceof Error) {
          toast.error(e.message.replace('Custom error:', ''))
        }
      } finally {
        await router.push(`/`)
      }
    },
    [address, accountInfo, call]
  )

  const submitMove = useCallback(
    async (
      gameId: string,
      move: Move,
      fen: string,
      address1: string,
      wager: string
    ) => {
      try {
        setIsMakingMove(true)
        const nonce = getNewNonceForAccount(accountInfo)
        const payload = {
          from: address.toLowerCase(),
          op: 'makeMove',
          programId: CHESS_PROGRAM_ADDRESS,
          to: CHESS_PROGRAM_ADDRESS,
          transactionInputs: JSON.stringify({
            gameId,
            move,
            fen,
            address1,
            wager,
          }),
          transactionType: {
            call: nonce,
          },
          value: ZERO_VALUE,
        }
        console.log(payload)
        await call(payload)
        toast.success('Transaction sent successfully')
      } catch (e) {
        if (e instanceof Error) {
          toast.error(e.message.replace('Custom error:', ''))
        }
      } finally {
        setIsMakingMove(false)
      }
    },
    [address, accountInfo, call]
  )

  return (
    <ChessAccountContext.Provider
      value={{
        isLoading: isFetchingAccount,
        profile,
        approve,
        createNewGame,
        forfeit,
        acceptGame,
        isAcceptingGame,
        hasAccount,
        signUp,
        isSigningUp,
        isCreatingGame,
        isForfeitingGame,
        isApproved,
        game,
        submitMove,
        isMakingMove,
        getNewGames,
        chessAccount,
        isApproving,
      }}
    >
      {children}
    </ChessAccountContext.Provider>
  )
}

export const useChessAccount = () => {
  const context = useContext(ChessAccountContext)
  if (context === undefined) {
    throw new Error(
      'useChessAccountContext must be used within a ChessAccountProvider'
    )
  }
  return context
}
