import { Transfer, OperatorSet, OwnershipTransferred } from '../generated/templates/NFT6909/NFT6909'
import { NFT, TokenInstance, TokenBalance, Transfer as TransferEntity, ContractOwnership } from '../generated/schema'
import { BigInt, Address } from '@graphprotocol/graph-ts'
import { getPendingTransfer, deletePendingTransfer } from './helpers'

export function handleTransfer(event: Transfer): void {
  let nftAddress = event.address.toHexString()
  let tokenId = event.params.id
  let from = event.params.sender
  let to = event.params.receiver
  let amount = event.params.amount
  
  let instanceId = nftAddress + '-' + tokenId.toString()
  let instance = TokenInstance.load(instanceId)
  
  if (!instance) {
    instance = new TokenInstance(instanceId)
    instance.collection = nftAddress
    instance.tokenId = tokenId
    instance.mintedAt = event.block.timestamp
    instance.totalSupply = amount
  } else {
    // Update total supply
    if (from == Address.zero()) {
      // Minting
      instance.totalSupply = instance.totalSupply.plus(amount)
    } else if (to == Address.zero()) {
      // Burning
      instance.totalSupply = instance.totalSupply.minus(amount)
    }
  }
  instance.save()

  let transferId = event.transaction.hash.toHexString() + '-' + event.logIndex.toString()
  let transfer = new TransferEntity(transferId)
  transfer.instance = instanceId
  transfer.from = from
  transfer.to = to
  transfer.amount = amount
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
  
  // Handle balances...
  if (from != Address.zero()) {
    let fromBalanceId = instanceId + '-' + from.toHexString()
    let fromBalance = TokenBalance.load(fromBalanceId)
    if (fromBalance) {
      fromBalance.amount = fromBalance.amount.minus(amount)
      fromBalance.lastUpdatedAt = event.block.timestamp
      fromBalance.save()
    }
  }

  let toBalanceId = instanceId + '-' + to.toHexString()
  let toBalance = TokenBalance.load(toBalanceId)
  
  if (!toBalance && to != Address.zero()) {
    toBalance = new TokenBalance(toBalanceId)
    toBalance.instance = instanceId
    toBalance.owner = to
    toBalance.amount = BigInt.fromI32(0)
    toBalance.createdAt = event.block.timestamp
  }
  
  if (toBalance) {
    toBalance.amount = toBalance.amount.plus(amount)
    toBalance.lastUpdatedAt = event.block.timestamp
    toBalance.save()
  }
}

export function handleOperatorSet(event: OperatorSet): void {
  // ERC6909 uses operator approvals instead of ApprovalForAll
  // This event tracks when someone sets an operator for their tokens
  // For now, we'll just log it for tracking purposes
  // Future enhancement: could track operator relationships in schema
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
