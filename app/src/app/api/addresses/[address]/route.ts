import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import process from 'process'

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: { address: string }
  }
) {
  try {
    const LASR_RPC_URL = process.env['LASR_RPC_URL']
    if (!LASR_RPC_URL) {
      return NextResponse.json(
        { error: 'lasr rpc url missing from ENV' },
        { status: 404 }
      )
    }

    if (!params.address) {
      return NextResponse.json(
        { error: 'address is required' },
        { status: 400 }
      )
    }

    const response = await axios.post(LASR_RPC_URL, {
      jsonrpc: '2.0',
      method: 'lasr_getAccount',
      params: [params.address],
      id: 1,
    })

    if (!response.data.result) {
      return NextResponse.json({ error: 'no result' }, { status: 404 })
    }

    return NextResponse.json(JSON.parse(response.data.result))
  } catch (error) {
    console.error(error)
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    } else {
      return NextResponse.json({ error: 'unknown error' }, { status: 500 })
    }
  }
}
