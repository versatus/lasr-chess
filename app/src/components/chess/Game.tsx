'use client'
import React, { FC, useEffect, useState } from 'react'
import Navigation from '@/components/Navigation'
import { useLasrWallet } from '@/providers/LasrWalletProvider'
import { Chess, Move, Square } from 'chess.js'
import { toast } from 'react-hot-toast'
import Layout from '@/components/Layout'
import ProgramTitle from '@/components/ProgramTitle'
import { Chessboard } from 'react-chessboard'
import { useChessAccount } from '@/hooks/useChessAccount'
import useChessGame from '@/hooks/useChessGame'
import clsx from 'clsx'
import { IGame } from '@/lib/types'
import Link from 'next/link'

import { io } from 'socket.io-client'
import LoadingSpinner from '@/components/LoadingSpinner'
import { useChess } from '@/hooks/useChess'
import { Socket } from 'socket.io'
import { DownloadLasrWallet } from '@/components/DownloadLasrWallet'
import { AnimatedCounter } from 'react-animated-counter'
import { calculateChessOdds } from '@/lib/clientHelpers'
import ChessSignUpForm from '@/components/chess/ChessSignUpForm'
import { CHESS_PROGRAM_ADDRESS } from '@/consts/public'
import { router } from 'next/client'

const Game = ({ gameId }: { gameId: string }) => {
  const { getUser } = useChess()
  const { address, isConnecting, hasWallet } = useLasrWallet()
  const { submitMove, hasAccount, forfeit, isForfeitingGame } =
    useChessAccount()
  const { game: foundGame, isLoadingGame, fetchGame } = useChessGame(gameId)
  const [game, setGame] = useState(new Chess())
  const [gameOver, setGameOver] = useState(false)
  // const [socket, setSocket] = useState<any>(null)
  const [isInGame, setIsInGame] = useState(false)
  const [isWhite, setIsWhite] = useState(true)
  const [isCurrentTurn, setIsCurrentTurn] = useState(false)

  const [user1, setUser1] = useState<
    { address: string; username: string } | undefined
  >()
  const [user2, setUser2] = useState<
    { address: string; username: string } | undefined
  >()
  const [addressesHere, setAddressesHere] = useState<string[]>([])

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
  }, [address, foundGame])

  useEffect(() => {
    if (foundGame && !foundGame?.address2) {
      const interval = setInterval(() => fetchGame(), 5000)
      return () => {
        clearInterval(interval)
      }
    }
  }, [foundGame])

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
    if (address && foundGame) {
      if (
        foundGame?.address1?.toLowerCase() === address.toLowerCase() ||
        foundGame?.address2?.toLowerCase() === address.toLowerCase()
      ) {
        setIsInGame(true)
      }
    }
  }, [address, foundGame])

  useEffect(() => {
    if (foundGame) {
      setUser1(getUser(foundGame.address1))
      if (foundGame.address2) {
        setUser2(getUser(foundGame.address2))
      }
    }
  }, [foundGame, getUser])

  useEffect(() => {
    if (isInGame) {
      if (foundGame?.address2?.toLowerCase() === address.toLowerCase()) {
        setIsWhite(false)
      }
    }
  }, [address, foundGame, game, isInGame])

  useEffect(() => {
    if (game.turn() === 'w' && isWhite) {
      setIsCurrentTurn(true)
    } else if (game.turn() === 'b' && !isWhite) {
      setIsCurrentTurn(true)
    } else {
      setIsCurrentTurn(false)
    }
  }, [game, isWhite])

  useEffect(() => {
    if (game.isGameOver() || foundGame?.winnerAddress) {
      setGameOver(true)
    }
  }, [game, foundGame, foundGame?.fen, isCurrentTurn, isInGame])

  useEffect(() => {
    if (address && foundGame && socket) {
      socket.emit('joinGame', gameId, foundGame.address1, address)

      socket.on('updateFen', (fen: string) => {
        const gameCopy = new Chess()
        gameCopy.load(fen)
        setGame(gameCopy)
        if (gameCopy.isGameOver()) {
          setGameOver(true)
        }
      })

      socket.on('gameMembers', (members: any[]) => {
        setAddressesHere(members)
      })

      if (foundGame) {
        console.log(foundGame)
        const gameC = new Chess()
        gameC.load(foundGame.fen!)
        setGame(gameC)
      }

      return () => {
        socket.disconnect()
      }
    }
  }, [address, foundGame, gameId, foundGame?.address1, socket])

  const makeMove = async (move: Move) => {
    try {
      const gameCopy = new Chess()
      const oldGame = game
      gameCopy.loadPgn(game.pgn())
      gameCopy.move(move)
      setIsCurrentTurn(false)
      setGame(gameCopy)
      await submitMove(
        gameId,
        move,
        oldGame.fen(),
        foundGame?.address1,
        foundGame?.wager
      )
      if (socket) {
        socket.emit('refreshGameState', gameId, foundGame?.address1)
      }
    } catch (e) {
      toast.error('illegal move')
      setIsCurrentTurn(true)
    }
  }

  const forfeitGame = async (
    gameId: string,
    address1: string,
    address2: string,
    wager: string
  ) => {
    try {
      await forfeit(gameId, address1, address2, wager)
      if (socket) {
        socket.emit('refreshGameState', gameId, foundGame?.address1)
      }
      await router.push('/')
    } catch (e) {
      toast.error('Error forfeiting game')
    }
  }

  const onDrop = (startSquare: Square, endSquare: Square): boolean => {
    makeMove({
      from: startSquare,
      to: endSquare,
    } as Move)
    return true
  }

  const odds = calculateChessOdds(game.fen())

  return (
    <>
      <Layout>
        <Navigation />
        <ProgramTitle
          title={'LASR CHESS'}
          subtitle={
            <>
              {/* eslint-disable-next-line react/no-unescaped-entities */}
              <span>The Queen's Chambit</span>
            </>
          }
          imgUrl={'/cham-chess.webp'}
          address={CHESS_PROGRAM_ADDRESS}
        />
        <div className={'flex flex-row gap-2'}>
          <Link href={'/'}>
            <button
              className={
                'text-xs text-pink-600 font-black border rounded-md hover:bg-pink-600 hover:text-white border-pink-600 p-2'
              }
            >
              RETURN TO LOBBY
            </button>
          </Link>
          {isInGame && foundGame?.address2 && (
            <button
              disabled={isForfeitingGame}
              onClick={() =>
                forfeitGame(
                  gameId,
                  foundGame?.address1!,
                  foundGame?.address2!,
                  foundGame?.wager!
                )
              }
              className={clsx(
                'text-xs text-red-600 font-black border rounded-md hover:bg-red-600 hover:text-white border-red-600 p-2',
                isForfeitingGame ? 'animate-pulse opacity-30' : ''
              )}
            >
              {isForfeitingGame ? 'FORFEITING GAME' : 'FORFEIT GAME'}
            </button>
          )}
        </div>
        <div
          className={
            'bg-gray-800 mb-20 grow h-[650px] w-[650px] flex flex-col '
          }
        >
          {isConnecting ? (
            <div className={'w-full flex flex-col items-center justify-center'}>
              <LoadingSpinner />
            </div>
          ) : !hasWallet ? (
            <div
              className={
                'flex flex-col items-center justify-center italic gap-4'
              }
            >
              <div>
                You must have the LASR Wallet installed to view the game
              </div>
              <DownloadLasrWallet />
            </div>
          ) : !hasAccount ? (
            <ChessSignUpForm />
          ) : (
            <div
              className={clsx(
                'flex flex-col gap-2 w-full',
                isLoadingGame ? 'animate-pulse' : ''
              )}
            >
              <div>
                <span
                  className={clsx(
                    'text-2xl font-black',
                    game.turn() === 'w' ? 'text-pink-600 animate-pulse' : ''
                  )}
                >
                  <span className={'text-md italic font-thin'}>
                    {foundGame?.address1?.toLowerCase() ===
                    address.toLowerCase()
                      ? '(you)'
                      : ''}{' '}
                  </span>{' '}
                  {user1?.username ?? '--'} (W)
                </span>{' '}
                vs{' '}
                <span
                  className={clsx(
                    'text-2xl font-black',
                    game.turn() === 'b' ? 'text-pink-600 animate-pulse' : ''
                  )}
                >
                  (B) {user2?.username ?? '--'}{' '}
                  <span className={'text-md italic font-thin'}>
                    {foundGame?.address2?.toLowerCase() ===
                    address.toLowerCase()
                      ? '(you)'
                      : ''}
                  </span>
                </span>
              </div>
              <div className={'w-full flex flex-row'}>
                <div>Turn {game?.fen()?.split(' ')[5]}</div>
                <div className={'grow'} />
                <span className={'font-black'}>
                  {parseFloat(foundGame?.wager!) * 2 ?? '--'}{' '}
                  <span className={'text-pink-600'}>VERSE</span> WAGER
                </span>
                <div className={'grow'} />
                <div>
                  {/* eslint-disable-next-line react/no-unescaped-entities */}
                  {foundGame?.fen?.split(' ')[1] === 'w' ? 'White' : 'Black'}'s
                  Turn
                </div>
              </div>
              <Chessboard
                boardOrientation={
                  foundGame?.address2?.toLowerCase() === address.toLowerCase()
                    ? 'black'
                    : 'white'
                }
                arePiecesDraggable={isInGame && !isLoadingGame && isCurrentTurn}
                customDarkSquareStyle={{
                  backgroundColor: 'rgba(219 39 119 / var(--tw-bg-opacity))',
                }}
                customLightSquareStyle={{ backgroundColor: 'white' }}
                position={game.fen()}
                onPieceDrop={onDrop}
              />
              <div className={`relative border flex flex-row p-1 w-full`}>
                <div
                  className={clsx(`bg-white p-4 h-full`)}
                  style={{ width: `${odds.whiteOdds}%` }}
                />
                <div
                  className={clsx(`bg-black p-4 h-full`)}
                  style={{ width: `${odds.blackOdds}%` }}
                />
              </div>
            </div>
          )}
        </div>
        <div
          className={
            'fixed p-3 flex flex-row gap-1 bottom-0 left-0 bg-pink-500'
          }
        >
          {isConnected ? 'Connected' : 'Not Connected'} ({transport}){' '}
        </div>
        <div
          className={
            'fixed p-3 flex flex-row gap-1 bottom-0 right-0 bg-pink-500'
          }
        >
          <AnimatedCounter
            value={addressesHere?.length}
            color="white"
            decimalPrecision={0}
            fontSize="16px"
            includeCommas={true}
          />
          people here
        </div>
      </Layout>
      {foundGame && !foundGame?.address2 && !isConnecting && address && (
        <WaitingForOpponent />
      )}
      {(foundGame?.winnerAddress ||
        gameOver ||
        foundGame?.gameState === 'finished') && (
        <GameOverScreen foundGame={foundGame!} />
      )}
    </>
  )
}

export default Game

const WaitingForOpponent = () => {
  return (
    <>
      <div
        className={
          'absolute w-full h-full flex gap-6 top-0 flex-col items-center justify-center bg-black bg-opacity-80'
        }
      >
        <div className={'text-6xl font-black'}>WAITING FOR OPPONENT</div>
      </div>
    </>
  )
}

const GameOverScreen = ({ foundGame }: { foundGame: IGame }) => {
  const { getUser } = useChess()
  const [winner, setWinner] = useState<
    { address: string; username: string } | undefined
  >()
  const [loser, setLoser] = useState<
    { address: string; username: string } | undefined
  >()
  useEffect(() => {
    if (foundGame) {
      if (foundGame.winnerAddress === foundGame.address1) {
        setWinner(getUser(foundGame.address1))
        setLoser(getUser(foundGame.address2))
      } else {
        setWinner(getUser(foundGame.address2))
        setLoser(getUser(foundGame.address1))
      }
    }
  }, [foundGame, getUser])

  return (
    <>
      <div
        className={
          'absolute w-full h-full flex gap-6 top-0 flex-col items-center justify-center bg-black bg-opacity-80'
        }
      >
        <div className={'text-6xl font-black'}>GAME OVER</div>
        <div className={'flex flex-row gap-2 text-3xl font-black'}>
          <div className={'flex flex-col gap-3 items-center'}>
            <span>WINNER</span>
            <span className={'text-yellow-500'}>{winner?.username}</span>
          </div>
        </div>
        <Link href={'/'}>
          <button
            className={
              'text-2xl text-pink-600 font-black border rounded-md hover:bg-pink-600 hover:text-white border-pink-600 p-6'
            }
          >
            RETURN TO LOBBY
          </button>
        </Link>
      </div>
    </>
  )
}
