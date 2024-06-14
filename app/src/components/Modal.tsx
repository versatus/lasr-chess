import { useState } from 'react'
import { useChessAccount } from '@/hooks/useChessAccount'
import { useLasrWallet } from '@/providers/LasrWalletProvider'
import clsx from 'clsx'

export default function Modal({
  title,
  wager,
  setWager,
  showModal,
  setShowModal,
  startNewGame,
}: {
  title: string
  wager: string
  setWager: (wager: string) => void
  showModal: boolean
  setShowModal: (showModal: boolean) => void
  startNewGame: (gameType: string, opponentAddress?: string) => void
}) {
  const { verseBalance } = useLasrWallet()
  const { isCreatingGame } = useChessAccount()
  const [selectedGameType, setSelectedGameType] = useState<string>('Open Game')
  const [opponentAddress, setOpponentAddress] = useState<string>('')
  const insufficientBalance = Number(verseBalance) < Number(wager)
  const isClosedGame = selectedGameType === 'Closed Game'
  const isBotGame = selectedGameType === 'Bot Game'
  return (
    <>
      {showModal ? (
        <>
          <div className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
            <div className="relative w-auto my-6 mx-auto max-w-3xl">
              <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-gray-700 outline-none focus:outline-none">
                <div className="flex items-start justify-between p-5 border-b border-solid border-gray-900 rounded-t">
                  <h3 className="text-3xl font-semibold">{title}</h3>
                  <button
                    className="p-1 ml-auto bg-transparent border-0 text-black opacity-5 float-right text-3xl leading-none font-semibold outline-none focus:outline-none"
                    onClick={() => setShowModal(false)}
                  >
                    <span className="bg-transparent text-black opacity-5 h-6 w-6 text-2xl block outline-none focus:outline-none">
                      ×
                    </span>
                  </button>
                </div>
                <div className="relative p-6 flex-auto flex flex-col gap-2 min-w-[400px]">
                  <div className={'flex flex-col md:flex-row gap-2'}>
                    {['Open Game', 'Closed Game', 'Bot Game'].map(
                      (gameType) => (
                        <button
                          key={gameType}
                          className={clsx(
                            'bg-gray-600 text-white border border-transparent font-bold uppercase text-sm px-6 py-3 rounded shadow outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150',
                            gameType === selectedGameType
                              ? 'bg-emerald-500 border-yellow-500'
                              : 'hover:shadow-lg active:bg-emerald-600 hover:opacity-50'
                          )}
                          onClick={() => setSelectedGameType(gameType)}
                        >
                          {gameType}
                        </button>
                      )
                    )}
                  </div>
                  {isClosedGame && (
                    <div className={'flex flex-row'}>
                      <input
                        value={opponentAddress}
                        onChange={(e) => setOpponentAddress(e.target.value)}
                        placeholder={"Opponent's address"}
                        className={clsx(
                          insufficientBalance && 'border-red-500',
                          'w-full bg-gray-600 p-4 text-center rounded-md focus:outline-none'
                        )}
                      />
                    </div>
                  )}
                  {!isBotGame && (
                    <div>
                      <p>Select the wager amount (VERSE)</p>
                      <input
                        value={wager}
                        onChange={(e) => setWager(e.target.value)}
                        className={clsx(
                          insufficientBalance && 'border-red-500',
                          'w-full bg-gray-600 p-4 text-center rounded-md focus:outline-none'
                        )}
                      />
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-end p-6 border-t border-solid border-gray-900 rounded-b">
                  <button
                    className="text-red-500 background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                    type="button"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className={clsx(
                      'bg-emerald-500  text-white  font-bold uppercase text-sm px-6 py-3 rounded shadow  outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150',
                      isCreatingGame
                        ? 'animate-pulse opacity-30 cursor-not-allowed'
                        : '',
                      insufficientBalance
                        ? 'cursor-not-allowed bg-red-500'
                        : 'hover:shadow-lg active:bg-emerald-600 hover:opacity-50'
                    )}
                    type="button"
                    disabled={isCreatingGame || insufficientBalance}
                    onClick={() =>
                      startNewGame(selectedGameType, opponentAddress)
                    }
                  >
                    {insufficientBalance
                      ? 'Insufficient Balance..'
                      : isCreatingGame
                        ? 'Creating Game...'
                        : 'Create Game'}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="opacity-25 fixed inset-0 z-40 bg-black"></div>
        </>
      ) : null}
    </>
  )
}
