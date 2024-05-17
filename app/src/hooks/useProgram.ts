import { useState, useEffect, useCallback } from 'react'
import { fetchProgramDetails } from '@/lib/clientHelpers'
import { IAccount } from '@versatus/versatus-javascript'
import { toast } from 'react-hot-toast'

function useProgram(programAddress: string | undefined) {
  const [ownerAddress, setOwnerAddressAddress] = useState('')
  const [programAccount, setProgramAccountAccount] = useState<IAccount | null>(
    null
  )
  const [programAccountMetadata, setProgramAccountMetadata] = useState<
    Record<string, string> | undefined
  >()
  const [programAccountData, setProgramAccountData] = useState<
    Record<string, string> | undefined
  >()
  const [balance, setBalance] = useState<string>('')
  const [tokenIds, setTokenIds] = useState<string[]>([])
  const [metadata, setMetadata] = useState<Record<string, string> | null>(null)
  const [data, setData] = useState<Record<string, string>>()
  const [isFetching, setIsFetching] = useState<boolean>(true)
  const [fetchError, setFetchError] = useState('')
  const [programType, setProgramType] = useState<string | undefined>()
  const [programs, setPrograms] = useState<any | undefined>()

  const getProgram = useCallback(async () => {
    try {
      setIsFetching(true)
      setFetchError('')
      if (!programAddress || programAddress === 'undefined') {
        setIsFetching(false)
        return
      }
      return await fetchProgramDetails({ programAddress })
        .then((response: IAccount) => {
          try {
            setProgramAccountAccount(response)
            setOwnerAddressAddress(String(response.ownerAddress))
            setProgramAccountMetadata(response.programAccountMetadata)
            setProgramAccountData(response.programAccountData)
            setProgramType(response.programAccountData?.type)

            const programPrograms = response.programs
            setPrograms(programPrograms)
            const currentProgram = programPrograms[programAddress]
            if (currentProgram) {
              setMetadata(currentProgram.metadata)
              setBalance(currentProgram.balance)
              if (currentProgram?.tokenIds) {
                setTokenIds(currentProgram?.tokenIds)
              }
              setData(currentProgram.data)
            }
          } catch (e) {
            throw e
          }
        })
        .catch((error: any) => {
          setFetchError("couldn't fetch program details...")
          throw error
        })
        .finally(() => {
          setIsFetching(false)
        })
    } catch (e) {
      toast.error('there was an error fetching the program')
    }
  }, [programAddress])

  useEffect(() => {
    if (programAddress) {
      getProgram()
    } else {
      setIsFetching(false)
    }
  }, [getProgram, programAddress])

  return {
    ownerAddress,
    programAccount,
    programAccountMetadata,
    programAccountData,
    programs,
    metadata,
    data,
    balance,
    tokenIds,
    programType,
    isFetching,
    getProgram,
    fetchError,
  }
}

export default useProgram
