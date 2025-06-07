import { Transfer, OwnershipTransferred } from '../generated/templates/NFT721/NFT721'
import { NFT, TokenInstance, TokenBalance, Transfer as TransferEntity, ContractOwnership } from '../generated/schema'
import { BigInt, Address } from '@graphprotocol/graph-ts'
import { getPendingTransfer, deletePendingTransfer } from './helpers'

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
  transfer.transactionHash = event.transaction.hash
  
  // Check for pending transfer context from marketplace events
  let pendingTransfer = getPendingTransfer(event.transaction.hash, event.address, tokenId)
  
  if (pendingTransfer) {
    // This transfer is from a marketplace transaction
    transfer.transferType = pendingTransfer.transferType
    transfer.relatedListing = pendingTransfer.listingId
    transfer.relatedBid = pendingTransfer.bidId
    
    // Clean up the pending transfer record
    deletePendingTransfer(event.transaction.hash, event.address, tokenId)
  } else {
    // This is a direct transfer
    if (from == Address.zero()) {
      transfer.transferType = "MINT"
    } else if (to == Address.zero()) {
      transfer.transferType = "BURN"
    } else {
      transfer.transferType = "DIRECT"
    }
  }
  
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

export function handleOwnershipTransferred(event: OwnershipTransferred): void {
  let contractAddress = event.address.toHexString()
  let previousOwner = event.params.previousOwner
  let newOwner = event.params.newOwner
  
  // Load the NFT contract entity to ensure it exists
  let nft = NFT.load(contractAddress)
  if (!nft) {
    // Contract ownership transfer for a contract not yet tracked
    return
  }
  
  // Create or update contract ownership record
  let ownership = ContractOwnership.load(contractAddress)
  if (!ownership) {
    ownership = new ContractOwnership(contractAddress)
  }
  
  ownership.contract = contractAddress
  ownership.previousOwner = previousOwner
  ownership.owner = newOwner
  ownership.transferredAt = event.block.timestamp
  ownership.transactionHash = event.transaction.hash
  ownership.save()
}
