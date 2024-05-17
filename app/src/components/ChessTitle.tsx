import React from 'react'

const LasrChessTitle = ({}) => {
  return (
    <>
      <div className="flex items-center justify-center p-4 flex-row gap-4 text-white text-xl">
        <img
          src="/cham-chess.webp"
          alt="Logo"
          className="h-36 w-36 rounded-full mr-2"
        />
        <span
          className={
            'flex flex-col justify-start pr-12 text-left items-start gap-1'
          }
        >
          <span className={'text-pink-600 text-6xl font-black'}>
            LASR Chess
          </span>
        </span>
      </div>
    </>
  )
}

export default LasrChessTitle
