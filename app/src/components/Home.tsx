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
import Modal from '@/components/Modal'
import { io } from 'socket.io-client'
import { Socket } from 'socket.io'
import { FaDownload } from 'react-icons/fa6'
import { DownloadLasrWallet } from '@/components/DownloadLasrWallet'

const Home: FC = () => {
  const { isConnecting, address, hasWallet } = useLasrWallet()
  const { games, isLoadingGames, getUser, leaderBoard } = useChess()
  const {
    isLoading,
    chessAccount,
    createNewGame,
    isAcceptingGame,
    acceptGame,
    isApproved,

    isApproving,
    approve,
  } = useChessAccount()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [wager, setWager] = useState('0')

  const [socket, setSocket] = useState<Socket | undefined>()

  const [isConnected, setIsConnected] = useState(false)
  const [transport, setTransport] = useState('N/A')

  useEffect(() => {
    if (address) {
      const temp = io({
        reconnection: true,
      })
      // @ts-ignore
      setSocket(temp)
    }
  }, [address])

  useEffect(() => {
    function onConnect() {
      setIsConnected(true)
      if (socket) {
        // @ts-ignore
        setTransport(socket?.io.engine.transport.name)
        // @ts-ignore
        socket?.io?.engine.on('upgrade', (transport) => {
          setTransport(transport.name)
        })
      }
    }

    function onDisconnect() {
      setIsConnected(false)
      setTransport('N/A')
    }
    if (socket) {
      if (socket.connected) {
        console.log('on connect')
        onConnect()
      }

      socket.on('connect', onConnect)
      socket.on('disconnect', onDisconnect)

      return () => {
        socket.off('connect', onConnect)
        socket.off('disconnect', onDisconnect)
      }
    }
  }, [socket])

  useEffect(() => {
    if (chessAccount && address && socket) {
      socket.emit('joinGameCenter', address)

      return () => {
        socket.disconnect()
      }
    }
  }, [chessAccount, address])

  const startNewGame = async () => {
    await createNewGame(wager)
    setShowCreateModal(false)
    socket?.emit('createGame', address)
  }

  const joinGame = async (gameId: string, address1: string, wager: string) => {
    await acceptGame(gameId, address1, wager)
    socket?.emit('joinGame', gameId, address1)
  }

  const viewGame = (gameId: string) => {
    socket?.emit('joinGame', gameId, address)
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
        <div
          className={
            'bg-gray-800 grow h-[650px] w-[650px] items-center flex flex-col '
          }
        >
          {!hasWallet ? (
            <DownloadLasrWallet />
          ) : isConnecting || !address || isLoading ? (
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
            <div className={'flex flex-col gap-4 w-full'}>
              <div
                className={
                  'w-full border border-gray-500 rounded-md p-6 grow flex flex-col'
                }
              >
                <div className={'flex items-start flex-col'}>
                  <div className={'font-black text-xl'}>Leaderboard</div>
                  {leaderBoard?.map(
                    (user: {
                      address: string
                      username: string
                      wins: string
                      losses: string
                      games: string
                      amountWon: string
                      amountLost: string
                    }) => {
                      return (
                        <div key={user.address}>
                          {user.username}{' '}
                          <span className={'text-xs text-gray-400 italic'}>
                            ({truncateString(user.address, 8)})
                          </span>{' '}
                          - {user.wins} wins{' '}
                          <span className={'text-xs text-green-600'}>
                            (+{user.amountWon} VERSE)
                          </span>
                          , {user.losses} losses{' '}
                          <span className={'text-xs text-red-600'}>
                            (-{user.amountLost} VERSE)
                          </span>
                        </div>
                      )
                    }
                  )}
                </div>
              </div>
              <div
                className={
                  'w-full border border-gray-500 rounded-md p-6 grow flex flex-col'
                }
              >
                <div className={'flex flex-row items-center justify-center'}>
                  <div className={'font-black'}>GAMES</div>
                  <div className={'grow'} />
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="border border-blue-500 hover:bg-blue-500 transition-all text-white p-2 rounded"
                  >
                    Start New Game
                  </button>
                </div>
                <div className="mt-4 flex flex-col gap-8">
                  {isLoadingGames ? (
                    <LoadingSpinner />
                  ) : games?.filter(
                      (a: IGame) =>
                        a.gameState === 'initialized' ||
                        a.gameState === 'inProgress'
                    )?.length > 0 ? (
                    <div className={'items-start flex flex-col'}>
                      <div className={'flex flex-col w-full items-start gap-6'}>
                        {games
                          ?.filter(
                            (a: IGame) =>
                              a.gameState === 'initialized' ||
                              a.gameState === 'inProgress'
                          )
                          .map((game: IGame) => {
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
                                <span
                                  className={'flex flex-col text-left gap-1'}
                                >
                                  <span>
                                    Game ID:{' '}
                                    <span className={'text-pink-600'}>
                                      {game.gameId}
                                    </span>{' '}
                                    - <span>{game.wager} VERSE</span>
                                  </span>
                                  <div
                                    className={
                                      'flex flex-row items-center gap-2'
                                    }
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
                                            game?.address2?.toLowerCase()! &&
                                          user2?.username ? (
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
                                    {!game.address2 && (
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
                                          game.address1?.toLowerCase() ===
                                            address.toLowerCase() ||
                                          !!game.address2 ||
                                          isAcceptingGame
                                        }
                                      >
                                        {isAcceptingGame
                                          ? 'Joining...'
                                          : 'Join Game'}
                                      </button>
                                    )}
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
                                      {parseFloat(game.wager!) * 2} VERSE
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                      </div>
                    </div>
                  ) : (
                    <div className={'text-gray-500 italic'}>
                      No active games...
                    </div>
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
