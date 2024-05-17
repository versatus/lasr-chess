'use client'

import { IAccount } from '@versatus/versatus-javascript'

export function truncateString(str: string, maxLength: number): string {
  if (str?.length <= maxLength) {
    return str
  } else {
    const leftHalf = str?.slice(0, Math.ceil((maxLength - 3) / 2))
    const rightHalf = str?.slice(-Math.floor((maxLength - 3) / 2))
    return leftHalf + '...' + rightHalf
  }
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function parseNumberToHex66(numberString: string) {
  const numberBigInt = BigInt(numberString)
  let hexString = numberBigInt.toString(16)
  hexString = hexString.padStart(64, '0')
  const hexStringWithPrefix = '0x' + hexString
  if (hexStringWithPrefix.length !== 66) {
    throw new Error('The resulting hex string is not 66 characters long.')
  }

  return hexStringWithPrefix
}

export const getNewNonceForAccount = (accountInfo: IAccount) =>
  parseNumberToHex66(
    //@ts-ignore
    BigInt(BigInt(accountInfo.data.nonce) + BigInt(1)).toString()
  )
