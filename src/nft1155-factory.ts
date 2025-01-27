// src/nft1155-factory.ts
import { NFT1155Created } from '../generated/NFT1155Factory/NFT1155Factory'
import { Factory, NFT, TokenInstance, TokenBalance } from '../generated/schema'
import { BigInt, Address } from '@graphprotocol/graph-ts'
import { NFT1155 } from '../generated/templates' 

export function handleNFT1155Created(event: NFT1155Created): void {
  let factory = Factory.load(event.address.toHexString())
  if (!factory) {
    factory = new Factory(event.address.toHexString())
    factory.type = "ERC1155"
    factory.nftCount = BigInt.fromI32(0)
    factory.createdAt = event.block.timestamp
  }
  
  factory.nftCount = factory.nftCount.plus(BigInt.fromI32(1))
  factory.save()

  NFT1155.create(event.params.nftAddress)

  let nft = new NFT(event.params.nftAddress.toHexString())
  nft.factory = factory.id
  nft.creator = event.params.owner
  nft.name = event.params.name
  nft.symbol = event.params.symbol
  nft.tokenAddress = event.params.nftAddress
  nft.tokenType = "ERC1155"
  nft.contractCreatedAt = event.block.timestamp
  nft.save()
}


