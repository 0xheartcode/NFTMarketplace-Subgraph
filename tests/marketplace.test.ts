import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll,
  createMockedFunction,
} from "matchstick-as/assembly/index"
import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
import { 
  handleListingCreated,
  handleListingCancelled, 
  handleListingSold,
  handleBidPlaced,
  handleBidCancelled,
  handleBidAccepted
} from "../src/marketplace"
import { 
  createListingCreatedEvent,
  createListingCancelledEvent,
  createListingSoldEvent,
  createBidPlacedEvent,
  createBidCancelledEvent,
  createBidAcceptedEvent
} from "./marketplace-utils"

describe("Marketplace Event Handlers", () => {
  beforeAll(() => {
    // Create a mock TokenInstance that will be referenced by listings/bids
    let tokenAddress = Address.fromString("0x1234567890123456789012345678901234567890")
    let tokenId = BigInt.fromI32(1)
    let instanceId = tokenAddress.toHexString() + "-" + tokenId.toString()
    
    // Note: In a real scenario, TokenInstance would be created by NFT contract events
    // For testing, we'll just assume it exists or handle the null case
  })

  afterAll(() => {
    clearStore()
  })

  describe("Listing Events", () => {
    test("Should create a new listing when ListingCreated event is handled", () => {
      let listingId = BigInt.fromI32(1)
      let seller = Address.fromString("0x1111111111111111111111111111111111111111")
      let tokenAddress = Address.fromString("0x1234567890123456789012345678901234567890")
      let tokenId = BigInt.fromI32(1)
      let amount = BigInt.fromI32(1)
      let price = BigInt.fromI32(1000)
      let currency = Address.fromString("0x2222222222222222222222222222222222222222")

      let event = createListingCreatedEvent(
        listingId,
        seller,
        tokenAddress,
        tokenId,
        amount,
        price,
        currency
      )

      handleListingCreated(event)

      assert.entityCount("Listing", 1)
      assert.entityCount("ListingHistory", 1)

      assert.fieldEquals("Listing", "1", "seller", seller.toHexString())
      assert.fieldEquals("Listing", "1", "tokenAddress", tokenAddress.toHexString())
      assert.fieldEquals("Listing", "1", "tokenId", tokenId.toString())
      assert.fieldEquals("Listing", "1", "amount", amount.toString())
      assert.fieldEquals("Listing", "1", "price", price.toString())
      assert.fieldEquals("Listing", "1", "currency", currency.toHexString())
      assert.fieldEquals("Listing", "1", "status", "ACTIVE")

      // Check history record
      let historyId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
      assert.fieldEquals("ListingHistory", historyId, "action", "CREATED")
      assert.fieldEquals("ListingHistory", historyId, "listingId", "1")
    })

    test("Should cancel a listing when ListingCancelled event is handled", () => {
      let listingId = BigInt.fromI32(1)
      let event = createListingCancelledEvent(listingId)

      handleListingCancelled(event)

      assert.fieldEquals("Listing", "1", "status", "CANCELLED")
      
      // Check history record
      let historyId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
      assert.fieldEquals("ListingHistory", historyId, "action", "CANCELLED")
    })

    test("Should mark listing as sold when ListingSold event is handled", () => {
      // First create a listing
      let listingId = BigInt.fromI32(2)
      let seller = Address.fromString("0x1111111111111111111111111111111111111111")
      let tokenAddress = Address.fromString("0x1234567890123456789012345678901234567890")
      let tokenId = BigInt.fromI32(2)
      let amount = BigInt.fromI32(1)
      let price = BigInt.fromI32(2000)
      let currency = Address.fromString("0x2222222222222222222222222222222222222222")

      let createEvent = createListingCreatedEvent(
        listingId,
        seller,
        tokenAddress,
        tokenId,
        amount,
        price,
        currency
      )
      handleListingCreated(createEvent)

      // Then mark as sold
      let soldEvent = createListingSoldEvent(listingId, tokenAddress, tokenId)
      handleListingSold(soldEvent)

      assert.fieldEquals("Listing", "2", "status", "SOLD")
      
      // Check pending transfer was created
      assert.entityCount("PendingTransfer", 1)
    })
  })

  describe("Bid Events", () => {
    test("Should create a new bid when BidPlaced event is handled", () => {
      let bidder = Address.fromString("0x3333333333333333333333333333333333333333")
      let tokenAddress = Address.fromString("0x1234567890123456789012345678901234567890")
      let tokenId = BigInt.fromI32(3)
      let tokenAmount = BigInt.fromI32(1)
      let amount = BigInt.fromI32(500)
      let currency = Address.fromString("0x2222222222222222222222222222222222222222")
      let duration = BigInt.fromI32(86400) // 1 day

      let event = createBidPlacedEvent(
        bidder,
        tokenAddress,
        tokenId,
        tokenAmount,
        amount,
        currency,
        duration
      )

      handleBidPlaced(event)

      assert.entityCount("Bid", 1)
      assert.entityCount("BidHistory", 1)

      let bidId = bidder.toHexString() + "-" + 
        tokenAddress.toHexString() + "-" + 
        tokenId.toString() + "-" + 
        tokenAmount.toString() + "-" + 
        currency.toHexString()

      assert.fieldEquals("Bid", bidId, "bidder", bidder.toHexString())
      assert.fieldEquals("Bid", bidId, "tokenAddress", tokenAddress.toHexString())
      assert.fieldEquals("Bid", bidId, "tokenId", tokenId.toString())
      assert.fieldEquals("Bid", bidId, "tokenAmount", tokenAmount.toString())
      assert.fieldEquals("Bid", bidId, "amount", amount.toString())
      assert.fieldEquals("Bid", bidId, "currency", currency.toHexString())
      assert.fieldEquals("Bid", bidId, "status", "ACTIVE")
    })

    test("Should cancel a bid when BidCancelled event is handled", () => {
      let bidder = Address.fromString("0x3333333333333333333333333333333333333333")
      let tokenAddress = Address.fromString("0x1234567890123456789012345678901234567890")
      let tokenId = BigInt.fromI32(3)
      let tokenAmount = BigInt.fromI32(1)
      let currency = Address.fromString("0x2222222222222222222222222222222222222222")

      let event = createBidCancelledEvent(
        bidder,
        tokenAddress,
        tokenId,
        tokenAmount,
        currency
      )

      handleBidCancelled(event)

      let bidId = bidder.toHexString() + "-" + 
        tokenAddress.toHexString() + "-" + 
        tokenId.toString() + "-" + 
        tokenAmount.toString() + "-" + 
        currency.toHexString()

      assert.fieldEquals("Bid", bidId, "status", "CANCELLED")
    })

    test("Should accept a bid when BidAccepted event is handled", () => {
      // First create a bid
      let bidder = Address.fromString("0x4444444444444444444444444444444444444444")
      let tokenAddress = Address.fromString("0x1234567890123456789012345678901234567890")
      let tokenId = BigInt.fromI32(4)
      let tokenAmount = BigInt.fromI32(1)
      let amount = BigInt.fromI32(750)
      let currency = Address.fromString("0x2222222222222222222222222222222222222222")
      let duration = BigInt.fromI32(86400)

      let placedEvent = createBidPlacedEvent(
        bidder,
        tokenAddress,
        tokenId,
        tokenAmount,
        amount,
        currency,
        duration
      )
      handleBidPlaced(placedEvent)

      // Then accept the bid
      let acceptedEvent = createBidAcceptedEvent(
        bidder,
        tokenAddress,
        tokenId,
        tokenAmount,
        currency
      )
      handleBidAccepted(acceptedEvent)

      let bidId = bidder.toHexString() + "-" + 
        tokenAddress.toHexString() + "-" + 
        tokenId.toString() + "-" + 
        tokenAmount.toString() + "-" + 
        currency.toHexString()

      assert.fieldEquals("Bid", bidId, "status", "ACCEPTED")
      
      // Check pending transfer was created
      assert.entityCount("PendingTransfer", 2) // One from listing sold test, one from this
    })
  })
})