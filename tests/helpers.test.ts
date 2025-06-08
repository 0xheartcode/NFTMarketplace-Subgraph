import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll,
} from "matchstick-as/assembly/index"
import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
import { 
  validateAddress,
  createEventID,
  createPendingTransfer,
  getPendingTransfer,
  deletePendingTransfer
} from "../src/helpers"

describe("Helper Functions", () => {
  beforeAll(() => {
    // Setup any initial state if needed
  })

  afterAll(() => {
    clearStore()
  })

  describe("validateAddress", () => {
    test("Should return true for valid non-zero address", () => {
      let validAddress = Address.fromString("0x1234567890123456789012345678901234567890")
      let result = validateAddress(validAddress)
      assert.assertTrue(result)
    })

    test("Should return false for zero address", () => {
      let zeroAddress = Address.zero()
      let result = validateAddress(zeroAddress)
      assert.assertTrue(!result) // Should be false
    })
  })

  describe("createEventID", () => {
    test("Should create properly formatted event ID", () => {
      let eventName = "TestEvent"
      let timestamp = BigInt.fromI32(1234567890)
      let transactionHash = "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
      
      let eventId = createEventID(eventName, timestamp, transactionHash)
      let expectedId = "TestEvent-1234567890-0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
      
      assert.stringEquals(eventId, expectedId)
    })

    test("Should handle different event names", () => {
      let eventName = "ListingCreated"
      let timestamp = BigInt.fromI32(987654321)
      let transactionHash = "0x1111111111111111111111111111111111111111111111111111111111111111"
      
      let eventId = createEventID(eventName, timestamp, transactionHash)
      let expectedId = "ListingCreated-987654321-0x1111111111111111111111111111111111111111111111111111111111111111"
      
      assert.stringEquals(eventId, expectedId)
    })
  })

  describe("PendingTransfer Management", () => {
    test("Should create and retrieve pending transfer", () => {
      let transactionHash = Bytes.fromHexString("0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890")
      let tokenAddress = Bytes.fromHexString("0x1234567890123456789012345678901234567890")
      let tokenId = BigInt.fromI32(123)
      let transferType = "MARKETPLACE_SALE"
      let listingId = "456"
      let createdAt = BigInt.fromI32(1234567890)

      createPendingTransfer(
        transactionHash,
        tokenAddress,
        tokenId,
        transferType,
        createdAt,
        listingId,
        null
      )

      // Verify the entity was created
      assert.entityCount("PendingTransfer", 1)
      
      let expectedId = transactionHash.toHexString() + "-" + tokenAddress.toHexString() + "-" + tokenId.toString()
      assert.fieldEquals("PendingTransfer", expectedId, "transferType", transferType)
      assert.fieldEquals("PendingTransfer", expectedId, "listingId", listingId)

      // Test retrieval
      let retrieved = getPendingTransfer(transactionHash, tokenAddress, tokenId)
      assert.assertTrue(retrieved !== null)
      
      if (retrieved) {
        assert.stringEquals(retrieved.transferType, transferType)
        assert.stringEquals(retrieved.listingId!, listingId)
        assert.assertTrue(retrieved.bidId === null)
      }
    })

    test("Should create pending transfer with bid ID", () => {
      let transactionHash = Bytes.fromHexString("0x1111111111111111111111111111111111111111111111111111111111111111")
      let tokenAddress = Bytes.fromHexString("0x2222222222222222222222222222222222222222")
      let tokenId = BigInt.fromI32(789)
      let transferType = "BID_ACCEPTANCE"
      let bidId = "bid-123"
      let createdAt = BigInt.fromI32(1234567890)

      createPendingTransfer(
        transactionHash,
        tokenAddress,
        tokenId,
        transferType,
        createdAt,
        null,
        bidId
      )

      let expectedId = transactionHash.toHexString() + "-" + tokenAddress.toHexString() + "-" + tokenId.toString()
      assert.fieldEquals("PendingTransfer", expectedId, "transferType", transferType)
      assert.fieldEquals("PendingTransfer", expectedId, "bidId", bidId)
      
      // listingId should be null (empty string in GraphQL)
      let retrieved = getPendingTransfer(transactionHash, tokenAddress, tokenId)
      if (retrieved) {
        assert.assertTrue(retrieved.listingId === null)
        assert.stringEquals(retrieved.bidId!, bidId)
      }
    })

    test("Should delete pending transfer", () => {
      let transactionHash = Bytes.fromHexString("0x3333333333333333333333333333333333333333333333333333333333333333")
      let tokenAddress = Bytes.fromHexString("0x4444444444444444444444444444444444444444")
      let tokenId = BigInt.fromI32(999)
      let transferType = "DIRECT"
      let createdAt = BigInt.fromI32(1234567890)

      // Create
      createPendingTransfer(
        transactionHash,
        tokenAddress,
        tokenId,
        transferType,
        createdAt,
        null,
        null
      )

      // Verify it exists
      let retrieved = getPendingTransfer(transactionHash, tokenAddress, tokenId)
      assert.assertTrue(retrieved !== null)

      // Delete
      deletePendingTransfer(transactionHash, tokenAddress, tokenId)

      // Verify it's gone
      let retrievedAfterDelete = getPendingTransfer(transactionHash, tokenAddress, tokenId)
      assert.assertTrue(retrievedAfterDelete === null)
    })

    test("Should return null for non-existent pending transfer", () => {
      let transactionHash = Bytes.fromHexString("0x9999999999999999999999999999999999999999999999999999999999999999")
      let tokenAddress = Bytes.fromHexString("0x8888888888888888888888888888888888888888")
      let tokenId = BigInt.fromI32(404)

      let retrieved = getPendingTransfer(transactionHash, tokenAddress, tokenId)
      assert.assertTrue(retrieved === null)
    })
  })
})