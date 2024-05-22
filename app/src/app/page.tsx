'use client'
import { LasrWalletProvider } from '@/providers/LasrWalletProvider'
import { Toaster } from 'react-hot-toast'
import { ChessAccountProvider } from '@/hooks/useChessAccount'
import Home from '@/components/chess/Home'
import { ChessProvider } from '@/hooks/useChess'

export default function ChessPage() {
  return (
    <LasrWalletProvider>
      <ChessProvider>
        <ChessAccountProvider>
          <div className={'bg-gray-800 min-h-screen'}>
            <Home />
            <Toaster
              position={'bottom-right'}
              toastOptions={{
                className: 'bg-pink-600 text-white font-bold',
                style: {
                  backgroundColor: '#374151',
                  padding: '16px',
                  color: 'white',
                  wordBreak: 'break-word',
                },
              }}
            />
          </div>
        </ChessAccountProvider>
      </ChessProvider>
    </LasrWalletProvider>
  )
}
