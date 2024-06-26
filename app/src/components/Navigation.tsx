import { useLasrWallet } from '@/providers/LasrWalletProvider'
import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { AnimatedCounter } from 'react-animated-counter'
import { truncateString } from '@/utils'
import Link from 'next/link'
import { DownloadLasrWallet } from '@/components/DownloadLasrWallet'

const Navigation = () => {
  const {
    address,
    connect,
    disconnect,
    isConnecting,
    verseBalance,
    hasWallet,
    ethBalance,
  } = useLasrWallet()

  const [verseBalanceNumber, setVerseBalanceNumber] = useState<number>(0)
  const [ethBalanceNumber, setEthBalanceNumber] = useState<number>(0)

  useEffect(() => {
    if (ethBalance) {
      setEthBalanceNumber(parseFloat(ethBalance))
    }
    if (verseBalance) {
      setVerseBalanceNumber(parseFloat(verseBalance))
    }
  }, [ethBalance, verseBalance])

  return (
    <>
      <div className="absolute top-4 left-4 p-4 gap-4 height-[69px] flex flex-row justify-center items-center text-white disabled:opacity-50 ">
        <span
          className={
            'text-white flex flex-row gap-1 min-w-[35px] text-md font-black items-center'
          }
        >
          <Link href={'/'}>
            <Image
              width={128}
              height={28}
              className={'cursor-pointer'}
              alt={'versatus logo'}
              src={'/logo.webp'}
            />
          </Link>
        </span>
      </div>
      {address ? (
        <div
          className={
            'absolute top-4 items-center justify-center right-4 flex flex-row gap-2'
          }
        >
          <div
            className={
              'flex flex-col gap-0 p-2 px-4 pb-1 border border-gray-700 rounded-md'
            }
          >
            <AnimatedCounter
              value={verseBalanceNumber}
              color="white"
              fontSize="16px"
              includeCommas={true}
            />
            <div className={'font-black text-pink-600'}>VERSE</div>
          </div>
          <div
            className={
              'flex flex-col gap-0 p-2 px-4 pb-1 border border-gray-700 rounded-md'
            }
          >
            <AnimatedCounter
              value={ethBalanceNumber}
              color="white"
              fontSize="16px"
              includeCommas={true}
            />
            <div className={'font-black text-blue-700'}>ETH</div>
          </div>
          <button
            onClick={disconnect}
            className=" min-w-[220px] hover:bg-pink-900 border border-pink-600 rounded-full p-4 gap-4 height-[69px] flex flex-row justify-center items-center text-pink-600 disabled:opacity-50 "
          >
            <span className={'text-pink-600 min-w-[35px] text-2xl font-black'}>
              L
            </span>
            {truncateString(address, 16)}
          </button>
        </div>
      ) : !isConnecting && !address && hasWallet ? (
        <button
          onClick={connect}
          className="absolute hover:bg-pink-900 top-4 right-4 border border-pink-600 rounded-full p-4 gap-4 height-[69px] flex flex-row justify-center items-center text-pink-600 disabled:opacity-50 "
        >
          Connect Wallet
        </button>
      ) : isConnecting ? (
        <button className="absolute top-4 right-4 border border-pink-600 rounded-full p-4 gap-4 height-[69px] flex flex-row justify-center items-center text-pink-600 disabled:opacity-50 ">
          Connecting...
        </button>
      ) : !hasWallet ? (
        <DownloadLasrWallet className={'absolute top-4 right-4'} />
      ) : null}
    </>
  )
}

export default Navigation
