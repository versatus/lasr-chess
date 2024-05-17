'use client'
import React, { FC, useEffect, useState } from 'react'
import Navigation from '@/components/Navigation'
import { CHESS_PROGRAM_ADDRESS } from '@/consts/public'
import { useLasrWallet } from '@/providers/LasrWalletProvider'
import LoadingSpinner from '@/components/LoadingSpinner'
import Layout from '@/components/Layout'
import ProgramTitle from '@/components/ProgramTitle'
import { useChessAccount } from '@/hooks/useChessAccount'
import ChessSignUpForm from '@/components/ChessSignUpForm'
import ButtonWithProcessing from '@/components/ButtonWithProcessing'
import { AnimatePresence, motion } from 'framer-motion'
import { useChess } from '@/hooks/useChess'
import Link from 'next/link'
import { IGame } from '@/lib/types'
import { truncateString } from '@/utils'
import { socket } from '@/socket'
import Modal from '@/components/Modal'

const Home: FC = () => {
  const { isConnecting, address } = useLasrWallet()
  const { users, games, isLoadingGames, getUser } = useChess()
  const {
    isLoading,
    chessAccount,
    createNewGame,
    acceptGame,
    isApproved,
    isApproving,
    approve,
  } = useChessAccount()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [wager, setWager] = useState('0')

  const [isConnected, setIsConnected] = useState(false)
  const [transport, setTransport] = useState('N/A')

  useEffect(() => {
    if (socket.connected) {
      onConnect()
    }

    function onConnect() {
      setIsConnected(true)
      setTransport(socket.io.engine.transport.name)

      socket.io.engine.on('upgrade', (transport) => {
        setTransport(transport.name)
      })
    }

    function onDisconnect() {
      setIsConnected(false)
      setTransport('N/A')
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
    }
  }, [])

  useEffect(() => {
    if (chessAccount && address) {
      socket.emit('joinGameCenter', address)

      return () => {
        socket.disconnect()
      }
    }
  }, [chessAccount, address])

  const startNewGame = async () => {
    await createNewGame(wager)
    setShowCreateModal(false)
    socket.emit('createGame', address)
  }

  const joinGame = async (gameId: string, address1: string, wager: string) => {
    await acceptGame(gameId, address1, wager)
    socket.emit('joinGame', gameId, address1)
  }

  const viewGame = (gameId: string) => {
    socket.emit('joinGame', gameId, address)
  }

  return (
    <>
      <Layout>
        <Navigation />
        <Modal
          title={'New Game'}
          showModal={showCreateModal}
          setShowModal={setShowCreateModal}
          wager={wager}
          setWager={setWager}
          startNewGame={startNewGame}
        />
        <ProgramTitle
          title={'LASR CHESS'}
          subtitle={
            <>
              {/* eslint-disable-next-line react/no-unescaped-entities */}
              <span>The Queen's Chambit</span>
            </>
          }
          imgUrl={'/cham-chess.webp'}
        />
        <div className={'bg-gray-800 grow h-[650px] w-[650px] flex flex-col '}>
          {isConnecting || !address || isLoading ? (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 0.8,
                }}
                className={
                  'flex flex-col h-full items-center justify-start gap-4'
                }
              >
                <LoadingSpinner />
              </motion.div>
            </AnimatePresence>
          ) : !chessAccount ? (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 1,
                }}
              >
                <ChessSignUpForm />
              </motion.div>
            </AnimatePresence>
          ) : !isApproved(CHESS_PROGRAM_ADDRESS) && !isLoading ? (
            <ButtonWithProcessing
              isSending={isApproving}
              content={<>APPROVE LASR CHESS TO GET STARTED</>}
              isSendingContent={<>APPROVING...</>}
              onClick={approve}
              className={
                'border-yellow-500 h-[69px] w-full items-center text-center justify-center font-black border  flex flex-row gap-4 hover:opacity-50 px-10 text-white'
              }
            />
          ) : (
            <div className={'flex flex-col gap-4'}>
              <div
                className={
                  'w-full border border-gray-500 rounded-md p-6 grow flex flex-col'
                }
              >
                <div className={'flex flex-row items-center justify-center'}>
                  <div className={'font-black'}>GAME CENTER</div>
                  <div className={'grow'} />
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="border border-blue-500 hover:bg-blue-500 transition-all text-white p-2 rounded"
                  >
                    Start New Game
                  </button>
                </div>
                <div className="mt-4 flex flex-col gap-8">
                  <div className={'flex items-start flex-col'}>
                    <div className={'font-black text-xl'}>Users</div>
                    {users.map(
                      (user: { address: string; username: string }) => {
                        return <div key={user.address}>{user.username}</div>
                      }
                    )}
                  </div>
                  {isLoadingGames ? (
                    <LoadingSpinner />
                  ) : games?.length > 0 ? (
                    <div className={'items-start flex flex-col'}>
                      <div className={'font-black text-xl'}>Games</div>
                      <div className={'flex flex-col w-full items-start gap-6'}>
                        {games?.map((game: IGame) => {
                          const user1 = getUser(game.address1)
                          const user2 = getUser(game.address2)
                          const winner = getUser(game.winnerAddress!)
                          const moves = getFullmoveNumberFromFEN(game?.fen!)
                          // @ts-ignore
                          return (
                            <div
                              key={game.gameId}
                              className="flex w-full border border-gray-600 p-4 rounded-md items-center justify-center flex-row mt-2"
                            >
                              <span className={'flex flex-col text-left gap-1'}>
                                <span>
                                  Game ID:{' '}
                                  <span className={'text-pink-600'}>
                                    {game.gameId}
                                  </span>
                                </span>
                                <div
                                  className={'flex flex-row items-center gap-2'}
                                >
                                  <span
                                    className={
                                      'text-sm flex items-center flex-col gap-1'
                                    }
                                  >
                                    <span className={'font-black text-lg'}>
                                      <span className={'text-3xl '}>
                                        {winner?.address?.toLowerCase() ===
                                        game?.address1?.toLowerCase()! ? (
                                          <>👑</>
                                        ) : (
                                          ''
                                        )}
                                      </span>{' '}
                                      {user1?.username}
                                    </span>
                                    <span className={'text-xs italic'}>
                                      {truncateString(game.address1!, 10)}
                                    </span>
                                  </span>
                                  <span className={'italic'}>vs</span>
                                  <span
                                    className={
                                      'text-sm flex items-center flex-col gap-1'
                                    }
                                  >
                                    <span className={'font-black text-lg'}>
                                      <span
                                        className={'text-3xl text-yellow-500'}
                                      >
                                        {winner?.address?.toLowerCase() ===
                                        game?.address2?.toLowerCase()! ? (
                                          <>👑</>
                                        ) : (
                                          ''
                                        )}
                                      </span>{' '}
                                      {user2?.username ?? '???'}
                                    </span>
                                    <span className={'text-xs italic'}>
                                      {game.address2
                                        ? truncateString(game.address2!, 10)
                                        : '???'}
                                    </span>
                                  </span>
                                </div>
                              </span>
                              <div className={'grow'} />
                              {!winner ? (
                                <div
                                  className={'flex flex-row gap-2 self-start'}
                                >
                                  <button
                                    onClick={() =>
                                      joinGame(
                                        game.gameId,
                                        game.address1!,
                                        game.wager!
                                      )
                                    }
                                    className="bg-green-500 text-white p-2 disabled:opacity-20 rounded mr-2"
                                    disabled={
                                      game.address1 === address ||
                                      !!game.address2
                                    }
                                  >
                                    Join Game
                                  </button>
                                  <Link href={`/${game.gameId}`}>
                                    <button
                                      onClick={() => viewGame(game.gameId)}
                                      className="bg-gray-500 text-white p-2 rounded"
                                    >
                                      View Game
                                    </button>
                                  </Link>
                                </div>
                              ) : (
                                <div
                                  className={
                                    ' flex flex-col items-center justify-center'
                                  }
                                >
                                  <div
                                    className={
                                      'flex flex-row gap-2 self-center'
                                    }
                                  >
                                    <span className={'font-black'}>
                                      GAME OVER
                                    </span>{' '}
                                    <span className={'italic'}>
                                      {moves} Moves
                                    </span>
                                  </div>
                                  <div className={'italic text-xs'}>
                                    {winner?.username} won{' '}
                                    {parseFloat(game.wager!) * 2} ETH
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <div>No games available</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </>
  )
}

function getFullmoveNumberFromFEN(fen: string): number {
  const parts = fen.split(' ')
  if (parts.length !== 6) {
    throw new Error('Invalid FEN string')
  }

  // Fullmove number is the 6th part of the FEN string
  return parseInt(parts[5], 10)
}

export default Home
