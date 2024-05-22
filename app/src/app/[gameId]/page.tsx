'use client'
import { LasrWalletProvider } from '@/providers/LasrWalletProvider'
import { Toaster } from 'react-hot-toast'
import { ChessAccountProvider } from '@/hooks/useChessAccount'
import { ChessProvider } from '@/hooks/useChess'
import Game from '@/components/chess/Game'

export default function ChessGamePage({
  params,
}: {
  params: { gameId: string }
}) {
  return (
    <LasrWalletProvider>
      <ChessProvider>
        <ChessAccountProvider>
          <div className={'bg-gray-800 min-h-screen'}>
            <Game gameId={params.gameId} />
            <Toaster
              position={'bottom-right'}
              toastOptions={{
                className: 'bg-pink-600 text-white font-bold',
                style: {
                  backgroundColor: '#374151',
                  padding: '16px',
                  color: 'white',
                  wordBreak: 'break-all',
                },
              }}
            />
          </div>
        </ChessAccountProvider>
      </ChessProvider>
    </LasrWalletProvider>
  )
}
