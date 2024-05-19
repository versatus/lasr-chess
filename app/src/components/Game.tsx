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

const Game = ({ gameId }: { gameId: string }) => {
  const { getUser } = useChess()
  const { address, isConnecting, hasWallet } = useLasrWallet()
  const { submitMove } = useChessAccount()
  const { game: foundGame, isLoadingGame } = useChessGame(gameId)
  const [game, setGame] = useState(new Chess())
  const [gameOver, setGameOver] = useState(false)
  // const [socket, setSocket] = useState<any>(null)
  const [isInGame, setIsInGame] = useState(false)
  const [isWhite, setIsWhite] = useState(true)
  const [isCurrentTurn, setIsCurrentTurn] = useState(false)

  const [socket, setSocket] = useState<Socket | undefined>()

  const [user1, setUser1] = useState<
    { address: string; username: string } | undefined
  >()
  const [user2, setUser2] = useState<
    { address: string; username: string } | undefined
  >()

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
    if (foundGame) {
      setUser1(getUser(foundGame.address1))
      if (foundGame.address2) {
        setUser2(getUser(foundGame.address2))
      }
    }
  }, [foundGame, getUser])

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
    if ((foundGame && game.isGameOver()) || foundGame?.winnerAddress) {
      setGameOver(true)
    }
  }, [game, foundGame, foundGame?.fen, isCurrentTurn, isInGame])

  useEffect(() => {
    if (address && foundGame && socket) {
      socket.emit('joinGame', gameId, foundGame.address1, address)

      console.log({ gameId })

      socket.on('updateFen', (fen: string) => {
        console.log('UPDATE FEN!')
        const gameCopy = new Chess()
        gameCopy.load(fen)
        setGame(gameCopy)
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
        console.log('EMITING REFRESH', gameId)
        socket.emit('refreshGameState', gameId, foundGame?.address1)
      }
    } catch (e) {
      toast.error('illegal move')
      setIsCurrentTurn(true)
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

  console.log(odds)

  const blackOdds = 100 - odds.whiteOdds

  return (
    <>
      <Layout>
        <Navigation />
        <ProgramTitle
          title={'LASR CHESS'}
          subtitle={
            <>
              <span>Play the timeless game on </span>
              <span className={'text-pink-600 font-black'}>LASR</span>
            </>
          }
          imgUrl={'/cham-chess.webp'}
        />
        <div className={'bg-gray-800 grow h-[650px] w-[650px] flex flex-col '}>
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
      </Layout>
      {foundGame && !foundGame?.address2 && !isConnecting && address && (
        <WaitingForOpponent />
      )}
      {foundGame?.winnerAddress && <GameOverScreen foundGame={foundGame!} />}
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

interface ChessOdds {
  whiteOdds: number
  blackOdds: number
}

const pieceValues: Record<string, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
  P: 1,
  N: 3,
  B: 3,
  R: 5,
  Q: 9,
  K: 0,
}

const calculateMaterialValue = (
  fen: string
): { white: number; black: number } => {
  const pieces = fen.split(' ')[0] // Get the pieces part of the FEN
  let whiteValue = 0
  let blackValue = 0

  for (const char of pieces) {
    if (char in pieceValues) {
      if (char === char.toUpperCase()) {
        whiteValue += pieceValues[char]
      } else {
        blackValue += pieceValues[char]
      }
    }
  }

  return { white: whiteValue, black: blackValue }
}

const calculateChessOdds = (fen: string): ChessOdds => {
  const { white, black } = calculateMaterialValue(fen)

  // Simplistic approach: odds based on material balance
  const totalMaterial = white + black
  const whiteOdds = (white / totalMaterial) * 100
  const blackOdds = (black / totalMaterial) * 100

  return {
    whiteOdds: parseInt(whiteOdds.toFixed(2)),
    blackOdds: parseInt(blackOdds.toFixed(2)),
  }
}
