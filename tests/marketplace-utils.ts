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
  buyer: Address,
  seller: Address,
  price: BigInt,
  currency: Address
): ListingSold {
  let listingSoldEvent = changetype<ListingSold>(newMockEvent())

  listingSoldEvent.parameters = new Array()

  listingSoldEvent.parameters.push(
    new ethereum.EventParam("listingId", ethereum.Value.fromUnsignedBigInt(listingId))
  )
  listingSoldEvent.parameters.push(
    new ethereum.EventParam("buyer", ethereum.Value.fromAddress(buyer))
  )
  listingSoldEvent.parameters.push(
    new ethereum.EventParam("seller", ethereum.Value.fromAddress(seller))
  )
  listingSoldEvent.parameters.push(
    new ethereum.EventParam("price", ethereum.Value.fromUnsignedBigInt(price))
  )
  listingSoldEvent.parameters.push(
    new ethereum.EventParam("currency", ethereum.Value.fromAddress(currency))
  )

  return listingSoldEvent
}

export function createBidPlacedEvent(
  tokenAddress: Address,
  tokenId: BigInt,
  tokenAmount: BigInt,
  bidder: Address,
  amount: BigInt,
  currency: Address,
  duration: BigInt
): BidPlaced {
  let bidPlacedEvent = changetype<BidPlaced>(newMockEvent())

  bidPlacedEvent.parameters = new Array()

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
    new ethereum.EventParam("bidder", ethereum.Value.fromAddress(bidder))
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
  tokenAddress: Address,
  tokenId: BigInt,
  tokenAmount: BigInt,
  bidder: Address,
  amount: BigInt,
  currency: Address,
  canceller: Address,
  cancellationFee: BigInt
): BidCancelled {
  let bidCancelledEvent = changetype<BidCancelled>(newMockEvent())

  bidCancelledEvent.parameters = new Array()

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
    new ethereum.EventParam("bidder", ethereum.Value.fromAddress(bidder))
  )
  bidCancelledEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )
  bidCancelledEvent.parameters.push(
    new ethereum.EventParam("currency", ethereum.Value.fromAddress(currency))
  )
  bidCancelledEvent.parameters.push(
    new ethereum.EventParam("canceller", ethereum.Value.fromAddress(canceller))
  )
  bidCancelledEvent.parameters.push(
    new ethereum.EventParam("cancellationFee", ethereum.Value.fromUnsignedBigInt(cancellationFee))
  )

  return bidCancelledEvent
}

export function createBidAcceptedEvent(
  tokenAddress: Address,
  tokenId: BigInt,
  tokenAmount: BigInt,
  seller: Address,
  bidder: Address,
  amount: BigInt,
  currency: Address,
  royaltyAmount: BigInt,
  royaltyReceiver: Address
): BidAccepted {
  let bidAcceptedEvent = changetype<BidAccepted>(newMockEvent())

  bidAcceptedEvent.parameters = new Array()

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
    new ethereum.EventParam("seller", ethereum.Value.fromAddress(seller))
  )
  bidAcceptedEvent.parameters.push(
    new ethereum.EventParam("bidder", ethereum.Value.fromAddress(bidder))
  )
  bidAcceptedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )
  bidAcceptedEvent.parameters.push(
    new ethereum.EventParam("currency", ethereum.Value.fromAddress(currency))
  )
  bidAcceptedEvent.parameters.push(
    new ethereum.EventParam("royaltyAmount", ethereum.Value.fromUnsignedBigInt(royaltyAmount))
  )
  bidAcceptedEvent.parameters.push(
    new ethereum.EventParam("royaltyReceiver", ethereum.Value.fromAddress(royaltyReceiver))
  )

  return bidAcceptedEvent
}