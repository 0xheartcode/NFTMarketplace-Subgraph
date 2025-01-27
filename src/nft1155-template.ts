import { TransferSingle, TransferBatch } from '../generated/templates/NFT1155/NFT1155'
import { NFT, TokenInstance, TokenBalance, Transfer as TransferEntity } from '../generated/schema'
import { BigInt, Address } from '@graphprotocol/graph-ts'

export function handleTransferSingle(event: TransferSingle): void {
  let nftAddress = event.address.toHexString()
  let tokenId = event.params.id
  let from = event.params.from
  let to = event.params.to
  let amount = event.params.value
  
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

export function handleTransferBatch(event: TransferBatch): void {
  let ids = event.params.ids
  let amounts = event.params.values
  let from = event.params.from
  let to = event.params.to
  let nftAddress = event.address.toHexString()
  
  // Process each transfer in the batch
  for (let i = 0; i < ids.length; i++) {
    let tokenId = ids[i]
    let amount = amounts[i]
    
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
        instance.totalSupply = instance.totalSupply.plus(amount)
      } else if (to == Address.zero()) {
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
    transfer.save()
  
    // Handle from balance
    if (from != Address.zero()) {
      let fromBalanceId = instanceId + '-' + from.toHexString()
      let fromBalance = TokenBalance.load(fromBalanceId)
      if (fromBalance) {
        fromBalance.amount = fromBalance.amount.minus(amount)
        fromBalance.lastUpdatedAt = event.block.timestamp
        fromBalance.save()
      }
    }

    // Handle to balance
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
}
