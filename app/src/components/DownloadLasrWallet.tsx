import Link from 'next/link'
import { FaDownload } from 'react-icons/fa6'
import React from 'react'

export function DownloadLasrWallet({ className }: { className?: string }) {
  return (
    <Link
      target={'_blank'}
      href={'https://itero.plasmo.com/ext/gomhiapcdkejjcgcmlafcgpacemkhgdn'}
      className={className}
    >
      <button className="border-pink-500 font-black border text-pink-500 hover:opacity-50 rounded-md flex flex-row gap-2 px-10 p-4 disabled:opacity-50">
        <FaDownload className="text-xl" />
        DOWNLOAD <span>LASR</span> BETA WALLET
      </button>
    </Link>
  )
}
