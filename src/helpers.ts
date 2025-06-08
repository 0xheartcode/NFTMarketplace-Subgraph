// src/helpers.ts
import { log, BigInt, Address, Bytes, store } from '@graphprotocol/graph-ts'
import { PendingTransfer } from '../generated/schema'

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

export function createPendingTransfer(
  transactionHash: Bytes,
  tokenAddress: Bytes,
  tokenId: BigInt,
  transferType: string,
  createdAt: BigInt,
  listingId: string | null = null,
  bidId: string | null = null
): void {
  let id = transactionHash.toHexString() + '-' + tokenAddress.toHexString() + '-' + tokenId.toString()
  
  let pendingTransfer = new PendingTransfer(id)
  pendingTransfer.transactionHash = transactionHash
  pendingTransfer.tokenAddress = tokenAddress
  pendingTransfer.tokenId = tokenId
  pendingTransfer.transferType = transferType
  pendingTransfer.listingId = listingId
  pendingTransfer.bidId = bidId
  pendingTransfer.createdAt = createdAt
  pendingTransfer.save()
}

export function getPendingTransfer(
  transactionHash: Bytes,
  tokenAddress: Bytes,
  tokenId: BigInt
): PendingTransfer | null {
  let id = transactionHash.toHexString() + '-' + tokenAddress.toHexString() + '-' + tokenId.toString()
  return PendingTransfer.load(id)
}

export function deletePendingTransfer(
  transactionHash: Bytes,
  tokenAddress: Bytes,
  tokenId: BigInt
): void {
  let id = transactionHash.toHexString() + '-' + tokenAddress.toHexString() + '-' + tokenId.toString()
  store.remove('PendingTransfer', id)
}

