// src/nft6909-factory.ts
import { NFT6909Created } from '../generated/NFT6909Factory/NFT6909Factory'
import { Factory, NFT } from '../generated/schema'
import { BigInt } from '@graphprotocol/graph-ts'
import { NFT6909 } from '../generated/templates' 

export function handleNFT6909Created(event: NFT6909Created): void {
  let factory = Factory.load(event.address.toHexString())
  if (!factory) {
    factory = new Factory(event.address.toHexString())
    factory.type = "ERC6909"
    factory.nftCount = BigInt.fromI32(0)
    factory.createdAt = event.block.timestamp
  }
  
  factory.nftCount = factory.nftCount.plus(BigInt.fromI32(1))
  factory.save()

  // Create the dynamic data source BEFORE creating the NFT entity
  NFT6909.create(event.params.nftAddress)

  // Create NFT contract entity
  let nft = new NFT(event.params.nftAddress.toHexString())
  nft.factory = factory.id
  nft.creator = event.params.owner
  nft.name = event.params.name
  nft.symbol = event.params.symbol
  nft.tokenAddress = event.params.nftAddress
  nft.tokenType = "ERC6909"
  nft.contractCreatedAt = event.block.timestamp
  nft.save()
}
