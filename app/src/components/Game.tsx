'use client'
import React, { FC, useEffect, useState } from 'react'
import Navigation from '@/components/Navigation'
import { useLasrWallet } from '@/providers/LasrWalletProvider'
import { Chess, Move, Square } from 'chess.js'
import { socket } from '@/socket'
import { toast } from 'react-hot-toast'
import Layout from '@/components/Layout'
import ProgramTitle from '@/components/ProgramTitle'
import { Chessboard } from 'react-chessboard'
import { useChessAccount } from '@/hooks/useChessAccount'
import useChessGame from '@/hooks/useChessGame'
import clsx from 'clsx'
import { IGame } from '@/lib/types'
import Link from 'next/link'

const Game = ({ gameId }: { gameId: string }) => {
  const { address } = useLasrWallet()
  const { submitMove } = useChessAccount()
  const { game: foundGame, isLoadingGame } = useChessGame(gameId)
  const [game, setGame] = useState(new Chess())
  const [gameOver, setGameOver] = useState(false)
  // const [socket, setSocket] = useState<any>(null)
  const [isInGame, setIsInGame] = useState(false)
  const [isWhite, setIsWhite] = useState(true)
  const [isCurrentTurn, setIsCurrentTurn] = useState(false)
  const [isConnected, setIsConnected] = useState(socket.connected)
  const [transport, setTransport] = useState('N/A')

  useEffect(() => {
    if (socket.connected) {
      console.log('on connect')
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
    if (socket.connected) {
      console.log('on connect')
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
    if (game.isGameOver()) {
      setGameOver(true)
    }
  }, [game])

  useEffect(() => {
    if (address && foundGame && socket) {
      socket.emit('joinGame', gameId, foundGame.address1, address)

      socket.on('updateFen', (fen: string) => {
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
          <div
            className={clsx(
              'flex flex-col gap-2 w-full',
              isLoadingGame ? 'animate-pulse' : ''
            )}
          >
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
          </div>
        </div>
      </Layout>
      {!foundGame?.address2 && <WaitingForOpponent />}
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
  return (
    <>
      <div
        className={
          'absolute w-full h-full flex gap-6 top-0 flex-col items-center justify-center bg-black bg-opacity-80'
        }
      >
        <div className={'text-6xl font-black'}>GAME OVER</div>
        <div>
          <span>WINNER:</span> <span>{foundGame.winnerAddress}</span>
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
