// src/helpers.ts
import { log, BigInt, Address } from '@graphprotocol/graph-ts'

export function handleError(error: string, id: string): void {
  log.error('Error processing entity {}: {}', [id, error])
}

export function validateAddress(address: Address): boolean {
  return address.notEqual(Address.zero())
}

export function createEventID(
  eventName: string,
  timestamp: BigInt,
  transactionHash: string
): string {
  return eventName
    .concat('-')
    .concat(timestamp.toString())
    .concat('-')
    .concat(transactionHash)
}
