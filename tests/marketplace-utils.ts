import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import {
  ListingCreated,
  ListingCancelled,
  ListingSold,
  BidPlaced,
  BidCancelled,
  BidAccepted,
  BidOutbid
} from "../generated/NFTMarketplace/NFTMarketplace"

export function createListingCreatedEvent(
  listingId: BigInt,
  seller: Address,
  tokenAddress: Address,
  tokenId: BigInt,
  amount: BigInt,
  price: BigInt,
  currency: Address
): ListingCreated {
  let listingCreatedEvent = changetype<ListingCreated>(newMockEvent())

  listingCreatedEvent.parameters = new Array()

  listingCreatedEvent.parameters.push(
    new ethereum.EventParam("listingId", ethereum.Value.fromUnsignedBigInt(listingId))
  )
  listingCreatedEvent.parameters.push(
    new ethereum.EventParam("seller", ethereum.Value.fromAddress(seller))
  )
  listingCreatedEvent.parameters.push(
    new ethereum.EventParam("tokenAddress", ethereum.Value.fromAddress(tokenAddress))
  )
  listingCreatedEvent.parameters.push(
    new ethereum.EventParam("tokenId", ethereum.Value.fromUnsignedBigInt(tokenId))
  )
  listingCreatedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )
  listingCreatedEvent.parameters.push(
    new ethereum.EventParam("price", ethereum.Value.fromUnsignedBigInt(price))
  )
  listingCreatedEvent.parameters.push(
    new ethereum.EventParam("currency", ethereum.Value.fromAddress(currency))
  )

  return listingCreatedEvent
}

export function createListingCancelledEvent(listingId: BigInt): ListingCancelled {
  let listingCancelledEvent = changetype<ListingCancelled>(newMockEvent())

  listingCancelledEvent.parameters = new Array()

  listingCancelledEvent.parameters.push(
    new ethereum.EventParam("listingId", ethereum.Value.fromUnsignedBigInt(listingId))
  )

  return listingCancelledEvent
}

export function createListingSoldEvent(
  listingId: BigInt,
  tokenAddress: Address,
  tokenId: BigInt
): ListingSold {
  let listingSoldEvent = changetype<ListingSold>(newMockEvent())

  listingSoldEvent.parameters = new Array()

  listingSoldEvent.parameters.push(
    new ethereum.EventParam("listingId", ethereum.Value.fromUnsignedBigInt(listingId))
  )
  listingSoldEvent.parameters.push(
    new ethereum.EventParam("tokenAddress", ethereum.Value.fromAddress(tokenAddress))
  )
  listingSoldEvent.parameters.push(
    new ethereum.EventParam("tokenId", ethereum.Value.fromUnsignedBigInt(tokenId))
  )

  return listingSoldEvent
}

export function createBidPlacedEvent(
  bidder: Address,
  tokenAddress: Address,
  tokenId: BigInt,
  tokenAmount: BigInt,
  amount: BigInt,
  currency: Address,
  duration: BigInt
): BidPlaced {
  let bidPlacedEvent = changetype<BidPlaced>(newMockEvent())

  bidPlacedEvent.parameters = new Array()

  bidPlacedEvent.parameters.push(
    new ethereum.EventParam("bidder", ethereum.Value.fromAddress(bidder))
  )
  bidPlacedEvent.parameters.push(
    new ethereum.EventParam("tokenAddress", ethereum.Value.fromAddress(tokenAddress))
  )
  bidPlacedEvent.parameters.push(
    new ethereum.EventParam("tokenId", ethereum.Value.fromUnsignedBigInt(tokenId))
  )
  bidPlacedEvent.parameters.push(
    new ethereum.EventParam("tokenAmount", ethereum.Value.fromUnsignedBigInt(tokenAmount))
  )
  bidPlacedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )
  bidPlacedEvent.parameters.push(
    new ethereum.EventParam("currency", ethereum.Value.fromAddress(currency))
  )
  bidPlacedEvent.parameters.push(
    new ethereum.EventParam("duration", ethereum.Value.fromUnsignedBigInt(duration))
  )

  return bidPlacedEvent
}

export function createBidCancelledEvent(
  bidder: Address,
  tokenAddress: Address,
  tokenId: BigInt,
  tokenAmount: BigInt,
  currency: Address
): BidCancelled {
  let bidCancelledEvent = changetype<BidCancelled>(newMockEvent())

  bidCancelledEvent.parameters = new Array()

  bidCancelledEvent.parameters.push(
    new ethereum.EventParam("bidder", ethereum.Value.fromAddress(bidder))
  )
  bidCancelledEvent.parameters.push(
    new ethereum.EventParam("tokenAddress", ethereum.Value.fromAddress(tokenAddress))
  )
  bidCancelledEvent.parameters.push(
    new ethereum.EventParam("tokenId", ethereum.Value.fromUnsignedBigInt(tokenId))
  )
  bidCancelledEvent.parameters.push(
    new ethereum.EventParam("tokenAmount", ethereum.Value.fromUnsignedBigInt(tokenAmount))
  )
  bidCancelledEvent.parameters.push(
    new ethereum.EventParam("currency", ethereum.Value.fromAddress(currency))
  )

  return bidCancelledEvent
}

export function createBidAcceptedEvent(
  bidder: Address,
  tokenAddress: Address,
  tokenId: BigInt,
  tokenAmount: BigInt,
  currency: Address
): BidAccepted {
  let bidAcceptedEvent = changetype<BidAccepted>(newMockEvent())

  bidAcceptedEvent.parameters = new Array()

  bidAcceptedEvent.parameters.push(
    new ethereum.EventParam("bidder", ethereum.Value.fromAddress(bidder))
  )
  bidAcceptedEvent.parameters.push(
    new ethereum.EventParam("tokenAddress", ethereum.Value.fromAddress(tokenAddress))
  )
  bidAcceptedEvent.parameters.push(
    new ethereum.EventParam("tokenId", ethereum.Value.fromUnsignedBigInt(tokenId))
  )
  bidAcceptedEvent.parameters.push(
    new ethereum.EventParam("tokenAmount", ethereum.Value.fromUnsignedBigInt(tokenAmount))
  )
  bidAcceptedEvent.parameters.push(
    new ethereum.EventParam("currency", ethereum.Value.fromAddress(currency))
  )

  return bidAcceptedEvent
}