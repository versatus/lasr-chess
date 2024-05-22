import React, { ReactNode } from 'react'
import WalletAddressPill from '@/components/WalletAddressPill'

const ProgramTitle = ({
  title,
  subtitle,
  imgUrl,
  address,
}: {
  title: string
  subtitle: ReactNode
  imgUrl?: string
  address?: string
}) => {
  return (
    <>
      <div className="flex flex-col gap-2 items-center justify-start p-4 text-white text-xl">
        {imgUrl && (
          <img
            src={imgUrl}
            alt="Logo"
            className="h-24 w-24 rounded-full mr-2"
          />
        )}
        <span
          className={
            'flex flex-col justify-center text-center items-center gap-1'
          }
        >
          <span className={'text-pink-600 text-4xl font-black'}>{title}</span>
          <span className={' italic text-center text-sm font-thin'}>
            {subtitle}
          </span>
        </span>
        {address && <WalletAddressPill address={address} />}
      </div>
    </>
  )
}

export default ProgramTitle
