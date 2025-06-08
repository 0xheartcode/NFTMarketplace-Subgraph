import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll,
} from "matchstick-as/assembly/index"
import { Address, BigInt } from "@graphprotocol/graph-ts"
import { handleNFT721Created } from "../src/nft721-factory"
import { createNFT721CreatedEvent } from "./nft721-factory-utils"

describe("NFT721 Factory Event Handlers", () => {
  beforeAll(() => {
    // Setup any initial state if needed
  })

  afterAll(() => {
    clearStore()
  })

  describe("NFT721Created Event", () => {
    test("Should create factory and NFT entities when NFT721Created event is handled", () => {
      let factoryAddress = Address.fromString("0x1111111111111111111111111111111111111111")
      let nftAddress = Address.fromString("0x2222222222222222222222222222222222222222")
      let owner = Address.fromString("0x3333333333333333333333333333333333333333")
      let name = "Test NFT Collection"
      let symbol = "TNC"

      let event = createNFT721CreatedEvent(
        factoryAddress,
        nftAddress,
        owner,
        name,
        symbol
      )

      handleNFT721Created(event)

      // Check Factory entity was created/updated
      assert.entityCount("Factory", 1)
      assert.fieldEquals("Factory", factoryAddress.toHexString(), "type", "ERC721")
      assert.fieldEquals("Factory", factoryAddress.toHexString(), "nftCount", "1")

      // Check NFT entity was created
      assert.entityCount("NFT", 1)
      assert.fieldEquals("NFT", nftAddress.toHexString(), "factory", factoryAddress.toHexString())
      assert.fieldEquals("NFT", nftAddress.toHexString(), "creator", owner.toHexString())
      assert.fieldEquals("NFT", nftAddress.toHexString(), "name", name)
      assert.fieldEquals("NFT", nftAddress.toHexString(), "symbol", symbol)
      assert.fieldEquals("NFT", nftAddress.toHexString(), "tokenAddress", nftAddress.toHexString())
      assert.fieldEquals("NFT", nftAddress.toHexString(), "tokenType", "ERC721")
    })

    test("Should increment nftCount when multiple NFTs are created by same factory", () => {
      let factoryAddress = Address.fromString("0x1111111111111111111111111111111111111111")
      let nftAddress2 = Address.fromString("0x4444444444444444444444444444444444444444")
      let owner = Address.fromString("0x3333333333333333333333333333333333333333")
      let name = "Test NFT Collection 2"
      let symbol = "TNC2"

      let event2 = createNFT721CreatedEvent(
        factoryAddress,
        nftAddress2,
        owner,
        name,
        symbol
      )

      handleNFT721Created(event2)

      // Factory count should be incremented
      assert.fieldEquals("Factory", factoryAddress.toHexString(), "nftCount", "2")
      
      // Should have 2 NFT entities total
      assert.entityCount("NFT", 2)
      assert.fieldEquals("NFT", nftAddress2.toHexString(), "name", name)
      assert.fieldEquals("NFT", nftAddress2.toHexString(), "symbol", symbol)
    })

    test("Should create separate factory for different factory addresses", () => {
      let factoryAddress2 = Address.fromString("0x5555555555555555555555555555555555555555")
      let nftAddress3 = Address.fromString("0x6666666666666666666666666666666666666666")
      let owner = Address.fromString("0x7777777777777777777777777777777777777777")
      let name = "Different Factory NFT"
      let symbol = "DFN"

      let event3 = createNFT721CreatedEvent(
        factoryAddress2,
        nftAddress3,
        owner,
        name,
        symbol
      )

      handleNFT721Created(event3)

      // Should have 2 factories now
      assert.entityCount("Factory", 2)
      assert.fieldEquals("Factory", factoryAddress2.toHexString(), "type", "ERC721")
      assert.fieldEquals("Factory", factoryAddress2.toHexString(), "nftCount", "1")
      
      // Should have 3 NFT entities total
      assert.entityCount("NFT", 3)
      assert.fieldEquals("NFT", nftAddress3.toHexString(), "factory", factoryAddress2.toHexString())
    })
  })
})