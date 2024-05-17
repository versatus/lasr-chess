import React, { useEffect, useState } from 'react'
import useProgram from '@/hooks/useProgram'
import { CHESS_PROGRAM_ADDRESS } from '@/consts/public'
import { useLasrWallet } from '@/providers/LasrWalletProvider'
import axios from 'axios'
import { AnimatePresence, motion } from 'framer-motion'
import { delay } from '@/utils'
import LasrChessTitle from '@/components/ChessTitle'
import { useChessAccount } from '@/hooks/useChessAccount'
import { sign } from '@noble/secp256k1'

const ChessSignUpForm = () => {
  const { signUp, isSigningUp } = useChessAccount()
  const [username, setUsername] = useState('')

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{
          duration: 1,
        }}
        className={''}
      >
        <div className="flex items-center w-full justify-start p-4 text-white text-xl">
          <span
            className={
              'flex flex-col justify-center w-full text-center items-center gap-1'
            }
          >
            <form
              onSubmit={() => signUp(username)}
              className="flex flex-col w-full items-center gap-2 "
            >
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full  text-center focus:outline-none p-2 border border-gray-600 bg-gray-600 text-white rounded-lg"
              />
              <button
                disabled={!username || isSigningUp}
                type="submit"
                className="bg-pink-600  w-full hover:opacity-75 mt-1 text-white font-bold py-2 px-4 rounded disabled:opacity-20"
              >
                {isSigningUp ? 'Signing Up...' : 'Sign Up'}
              </button>
            </form>
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default ChessSignUpForm
