'use client'
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import {
  IAccount,
  IInitTransaction,
  Program,
  ETH_PROGRAM_ADDRESS,
  formatVerse,
} from '@versatus/versatus-javascript'
import { VERSE_PROGRAM_ADDRESS } from '@/consts/public'
import { toast } from 'react-hot-toast'

interface LasrWalletContextType {
  address: string
  isConnecting: boolean
  isRequestingAccount: boolean
  isSigning: boolean
  isSending: boolean
  isCalling: boolean
  isDecrypting: boolean
  isEncrypting: boolean
  hasWallet: boolean
  accountInfo: any
  programs: any
  verseBalance: string
  ethBalance: string
  provider: any
  requestAccount: () => Promise<any>
  connect: () => Promise<void>
  disconnect: () => void
  decryptMessage: (message: string) => Promise<any>
  encryptMessage: (message: string, encryptionPublicKey: string) => Promise<any>
  signMessage: (message: string) => Promise<any>
  call: (initTx: IInitTransaction) => Promise<any>
  send: (initTx: IInitTransaction) => Promise<any>
}

const LasrWalletContext = createContext<LasrWalletContextType | undefined>({
  address: '',
  isConnecting: false,
  isRequestingAccount: false,
  isSigning: false,
  isSending: false,
  isCalling: false,
  isDecrypting: false,
  isEncrypting: false,
  hasWallet: false,
  accountInfo: undefined,
  programs: [],
  verseBalance: '',
  ethBalance: '',
  provider: null,
  requestAccount: async () => {},
  connect: async () => {},
  disconnect: () => {},
  decryptMessage: async (message: string) => {},
  encryptMessage: async (message: string, encryptionPublicKey: string) => {},
  signMessage: async () => {},
  call: async () => {},
  send: async () => {},
})

export const useLasrWallet = () => {
  const context = useContext(LasrWalletContext)
  if (context === undefined) {
    throw new Error('useBRC20Context must be used within a LasrWalletProvider')
  }
  return context
}

export function LasrWalletProvider({ children }: { children: ReactNode }) {
  const [provider, setProvider] = useState<any>(null)
  const [address, setAddress] = useState<string>('')
  const [hasConnected, setHasConnected] = useLocalStorage('hasConnected', false)
  const [isConnecting, setIsConnecting] = useState<boolean>(true)
  const [isRequestingAccount, setIsRequestingAccount] = useState(false)
  const [isSigning, setIsSigning] = useState<boolean>(false)
  const [isSending, setIsSending] = useState<boolean>(false)
  const [isCalling, setIsCalling] = useState<boolean>(false)
  const [isEncrypting, setIsEncrypting] = useState<boolean>(false)
  const [isDecrypting, setIsDecrypting] = useState<boolean>(false)
  const [accountInfo, setAccountInfo] = useState<IAccount | null>(null)
  const [programs, setPrograms] = useState<Program[]>([])
  const [verseBalance, setVerseBalance] = useState('')
  const [ethBalance, setEthBalance] = useState('')
  const [hasWallet, setHasWallet] = useState(true)

  const requestAccount = useCallback(async () => {
    setIsRequestingAccount(true)
    if (!provider) {
      toast.error('Please install LASR Chrome Extension')
    }
    try {
      const accountResponse = await provider?.requestAccount()
      setAccountInfo(accountResponse)
      setPrograms(accountResponse?.data?.programs)

      const verseBal =
        accountResponse?.data?.programs?.[VERSE_PROGRAM_ADDRESS]?.balance

      if (verseBal) {
        setVerseBalance(parseFloat(formatVerse(verseBal)).toFixed(2))
      }

      const ethBal =
        accountResponse?.data?.programs?.[ETH_PROGRAM_ADDRESS]?.balance

      if (ethBal) {
        setEthBalance(parseFloat(formatVerse(ethBal)).toFixed(2))
      }

      return accountResponse
    } catch (e) {
      throw e
    } finally {
      setIsRequestingAccount(false)
    }
  }, [provider])

  const connect = useCallback(async () => {
    setIsConnecting(true)
    if (provider) {
      try {
        const response = await requestAccount()
        setAddress(response?.address)
        setHasConnected(true)
      } catch (e) {
        console.error(e)
        setAddress('')
        setIsConnecting(false)
      } finally {
        setIsConnecting(false)
      }
    } else {
      setIsConnecting(false)
      alert('Please install LASR Chrome Extension')
    }
  }, [provider])

  useEffect(() => {
    // @ts-ignore
    if (window?.lasr) {
      setTimeout(async () => {
        // @ts-ignore
        setProvider(window?.lasr)
      }, 500)
    } else {
      setHasWallet(false)
      setIsConnecting(false)
    }
  }, [])

  useEffect(() => {
    //@ts-ignore
    if (provider && hasConnected) {
      setTimeout(async () => {
        await connect()
      }, 1000)
    }
  }, [provider, hasConnected, connect])

  const call = async (initTx: IInitTransaction) => {
    if (provider) {
      try {
        setIsCalling(true)
        const response = await provider.call(initTx)
        await delay(1500)
        setIsCalling(false)
        await requestAccount()

        return response
      } catch (e) {
        console.error(e)
        setIsCalling(false)
        // @ts-ignore
        throw new Error(e.message)
      }
    } else {
      alert('Please install LASR Chrome Extension')
    }
  }

  const signMessage = async (message: string) => {
    if (provider) {
      try {
        setIsSigning(true)
        const response = await provider.signMessage(message)
        setIsSigning(false)
        return response
      } catch (e) {
        console.error(e)
        setIsSigning(false)
      }
    } else {
      alert('Please install LASR Chrome Extension')
    }
  }

  const send = async (initTx: IInitTransaction) => {
    if (provider) {
      try {
        setIsSending(true)
        const response = await provider.send(initTx)
        await delay(1500)
        setIsSending(false)
        await requestAccount()

        return response
      } catch (e) {
        console.error(e)
        setIsSending(false)
        // @ts-ignore
        throw new Error(e.message)
      }
    } else {
      alert('Please install LASR Chrome Extension')
    }
  }

  const decryptMessage = async (message: string) => {
    if (provider) {
      try {
        setIsDecrypting(true)
        const response = await provider.decryptMessage(message)
        setIsDecrypting(false)
        return response
      } catch (e) {
        console.error(e)
        setIsDecrypting(false)
        // @ts-ignore
        throw new Error(e.message)
      }
    } else {
      alert('Please install LASR Chrome Extension')
    }
  }

  const encryptMessage = async (
    message: string,
    encryptionPublicKey: string
  ) => {
    if (provider) {
      try {
        setIsEncrypting(true)
        const response = await provider.encryptMessage(
          message,
          encryptionPublicKey
        )
        setIsEncrypting(false)
        return response
      } catch (e) {
        console.error(e)
        setIsEncrypting(false)
        // @ts-ignore
        throw new Error(e.message)
      }
    } else {
      alert('Please install LASR Chrome Extension')
    }
  }

  const disconnect = () => {
    setAddress('')
    setHasConnected(false)
  }

  return (
    <LasrWalletContext.Provider
      value={{
        address,
        isConnecting,
        isRequestingAccount,
        isSigning,
        isSending,
        isCalling,
        isDecrypting,
        isEncrypting,
        accountInfo,
        programs,
        verseBalance,
        hasWallet,
        ethBalance,
        provider,
        requestAccount,
        connect,
        disconnect,
        decryptMessage,
        encryptMessage,
        signMessage,
        call,
        send,
      }}
    >
      {children}
    </LasrWalletContext.Provider>
  )
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function useLocalStorage(key: string, initialValue: boolean) {
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(error)
      return initialValue
    }
  })

  const setValue = (value: (arg0: any) => any) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.error(error)
    }
  }

  return [storedValue, setValue]
}
