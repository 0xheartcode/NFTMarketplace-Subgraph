import { Transfer } from '../generated/templates/NFT721/NFT721'
import { NFT, TokenInstance, TokenBalance, Transfer as TransferEntity } from '../generated/schema'
import { BigInt, Address } from '@graphprotocol/graph-ts'

export function handleTransfer(event: Transfer): void {
  let nftAddress = event.address.toHexString()
  let tokenId = event.params.tokenId
  let from = event.params.from
  let to = event.params.to
  
  // First, ensure TokenInstance exists
  let instanceId = nftAddress + '-' + tokenId.toString()
  let instance = TokenInstance.load(instanceId)
  
  if (!instance) {
    // This is a mint (first transfer)
    instance = new TokenInstance(instanceId)
    instance.collection = nftAddress
    instance.tokenId = tokenId
    instance.mintedAt = event.block.timestamp
    instance.totalSupply = BigInt.fromI32(1) // ERC721 always has supply of 1
  }
  instance.save()

  let transferId = event.transaction.hash.toHexString() + '-' + event.logIndex.toString()
  let transfer = new TransferEntity(transferId)
  transfer.instance = instanceId
  transfer.from = from
  transfer.to = to
  transfer.amount = BigInt.fromI32(1)
  transfer.timestamp = event.block.timestamp
  transfer.save()
  
  // Handle 'from' balance
  if (from != Address.zero()) {
    let fromBalanceId = instanceId + '-' + from.toHexString()
    let fromBalance = TokenBalance.load(fromBalanceId)
    if (fromBalance) {
      // Update existing balance
      fromBalance.amount = BigInt.fromI32(0)
      fromBalance.lastUpdatedAt = event.block.timestamp
      fromBalance.save()
    }
  }

  // Handle 'to' balance
  let toBalanceId = instanceId + '-' + to.toHexString()
  let toBalance = TokenBalance.load(toBalanceId)
  
  if (!toBalance) {
    // Create new balance
    toBalance = new TokenBalance(toBalanceId)
    toBalance.instance = instanceId
    toBalance.owner = to
    toBalance.createdAt = event.block.timestamp
  }
  
  toBalance.amount = BigInt.fromI32(1)
  toBalance.lastUpdatedAt = event.block.timestamp
  toBalance.save()
}
