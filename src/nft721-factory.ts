// src/nft721-factory.ts
import { NFT721Created } from '../generated/NFT721Factory/NFT721Factory'
import { Factory, NFT, TokenInstance, TokenBalance } from '../generated/schema'
import { BigInt, Address } from '@graphprotocol/graph-ts'
import { NFT721 } from '../generated/templates' 

export function handleNFT721Created(event: NFT721Created): void {
  let factory = Factory.load(event.address.toHexString())
  if (!factory) {
    factory = new Factory(event.address.toHexString())
    factory.type = "ERC721"
    factory.nftCount = BigInt.fromI32(0)
    factory.createdAt = event.block.timestamp
  }
  
  factory.nftCount = factory.nftCount.plus(BigInt.fromI32(1))
  factory.save()

  // Create the dynamic data source BEFORE creating the NFT entity
  NFT721.create(event.params.nftAddress)

  // Create NFT contract entity
  let nft = new NFT(event.params.nftAddress.toHexString())
  nft.factory = factory.id
  nft.creator = event.params.owner
  nft.name = event.params.name
  nft.symbol = event.params.symbol
  nft.tokenAddress = event.params.nftAddress
  nft.tokenType = "ERC721"
  nft.contractCreatedAt = event.block.timestamp
  nft.save()
}


