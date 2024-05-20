import { useEffect, useState } from 'react'
import { fetchAddressDetails } from '@/lib/clientHelpers'
import { toast } from 'react-hot-toast'

export default function useUserAccount(address?: string | undefined) {
  const [account, setAccount] = useState<any>(null)
  const [isFetching, setIsFetching] = useState(false)

  useEffect(() => {
    if (address) {
      fetch()
    }
  }, [address])

  const fetch = async () => {
    if (!address) return
    setIsFetching(true)
    fetchAddressDetails({ address })
      .then((accountData) => {
        setAccount(accountData)
      })
      .finally(() => setIsFetching(false))
  }

  return { account, refetchAccount: fetch, isFetching }
}
