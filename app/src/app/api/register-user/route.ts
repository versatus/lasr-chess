import { NextRequest, NextResponse } from 'next/server'
import { broadcast, ZERO_VALUE } from '@versatus/versatus-javascript'
import { formatAmountToHex } from '@versatus/versatus-javascript'
import { CHESS_PROGRAM_ADDRESS } from '@/consts/public'

export async function POST(req: NextRequest) {
  const { address, username } = await req.json()

  if (!address) {
    return NextResponse.json({ error: 'address is required' }, { status: 400 })
  }

  if (!username) {
    return NextResponse.json({ error: 'username is required' }, { status: 400 })
  }

  try {
    const txResponse = await sendChessRegisterUserCall(address, username)

    await approveUser(address)

    return NextResponse.json(txResponse)
  } catch (e) {
    console.log(e)
    return NextResponse.json('There was an error..', { status: 401 })
  }
}

const sendChessRegisterUserCall = async (address: string, username: string) => {
  if (!CHESS_PROGRAM_ADDRESS) {
    throw { error: 'chess address not found' }
  }

  const CHESS_OWNER_ADDRESS = process.env['NEXT_PUBLIC_CHESS_OWNER_ADDRESS']
  if (!CHESS_OWNER_ADDRESS) {
    throw { error: 'chess owner private key not found' }
  }

  const CHESS_OWNER_PRIVATE_KEY = process.env['CHESS_OWNER_PRIVATE_KEY']
  if (!CHESS_OWNER_PRIVATE_KEY) {
    throw { error: 'chess owner private key not found' }
  }

  try {
    return await broadcast(
      {
        from: CHESS_OWNER_ADDRESS,
        op: 'registerUser',
        programId: CHESS_PROGRAM_ADDRESS,
        to: String(CHESS_PROGRAM_ADDRESS),
        transactionInputs: JSON.stringify({
          address,
          username,
        }),
        value: ZERO_VALUE,
      },
      CHESS_OWNER_PRIVATE_KEY
    )
  } catch (e) {
    throw e
  }
}

const approveUser = async (userAddress: string) => {
  if (!CHESS_PROGRAM_ADDRESS) {
    throw { error: 'chess address not found' }
  }

  const CHESS_OWNER_PRIVATE_KEY = process.env['CHESS_OWNER_PRIVATE_KEY']
  if (!CHESS_OWNER_PRIVATE_KEY) {
    throw { error: 'chess owner private key not found' }
  }

  const CHESS_OWNER_ADDRESS = process.env['NEXT_PUBLIC_CHESS_OWNER_ADDRESS']
  if (!CHESS_OWNER_ADDRESS) {
    throw { error: 'chess owner private key not found' }
  }

  try {
    return await broadcast(
      {
        from: CHESS_OWNER_ADDRESS,
        op: 'approve',
        programId: CHESS_PROGRAM_ADDRESS,
        to: String(CHESS_PROGRAM_ADDRESS),
        transactionInputs: `[["${userAddress}",["0x0000000000000000000000000000000000000000000000000000000000000000"]]]`,
        value: formatAmountToHex('0'),
      },
      CHESS_OWNER_PRIVATE_KEY
    )
  } catch (e) {
    throw e
  }
}
