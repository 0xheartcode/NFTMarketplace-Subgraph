import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import { NFT721Created } from "../generated/NFT721Factory/NFT721Factory"

export function createNFT721CreatedEvent(
  factoryAddress: Address,
  nftAddress: Address,
  owner: Address,
  name: string,
  symbol: string
): NFT721Created {
  let nft721CreatedEvent = changetype<NFT721Created>(newMockEvent())

  // Set the event address to the factory address
  nft721CreatedEvent.address = factoryAddress

  nft721CreatedEvent.parameters = new Array()

  nft721CreatedEvent.parameters.push(
    new ethereum.EventParam("nftAddress", ethereum.Value.fromAddress(nftAddress))
  )
  nft721CreatedEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )
  nft721CreatedEvent.parameters.push(
    new ethereum.EventParam("name", ethereum.Value.fromString(name))
  )
  nft721CreatedEvent.parameters.push(
    new ethereum.EventParam("symbol", ethereum.Value.fromString(symbol))
  )

  return nft721CreatedEvent
}