// src/marketplace.ts
import {BidAccepted, BidCancelled, BidPlaced, BidOutbid, ListingCancelled, ListingCreated, ListingSold} from '../generated/NFTMarketplace/NFTMarketplace'
import {Bid, Listing, NFT, TokenInstance, ListingHistory, BidHistory} from '../generated/schema'
import {BigInt} from '@graphprotocol/graph-ts'
import { createPendingTransfer } from './helpers'

export function handleListingCreated(event: ListingCreated): void {
    let listingId = event.params.listingId.toString()
    let listing = new Listing(listingId)
    
    let instanceId = event.params.tokenAddress.toHexString() + '-' + event.params.tokenId.toString()
    let instance = TokenInstance.load(instanceId)
    if (instance) {
        listing.instance = instanceId
    }
    
    listing.seller = event.params.seller
    listing.tokenAddress = event.params.tokenAddress
    listing.tokenId = event.params.tokenId
    listing.amount = event.params.amount
    listing.price = event.params.price
    listing.currency = event.params.currency
    listing.status = "ACTIVE"
    listing.createdAt = event.block.timestamp
    listing.save()
    
    // Create history record
    let historyId = event.transaction.hash.toHexString() + '-' + event.logIndex.toString()
    let history = new ListingHistory(historyId)
    history.listingId = listingId
    history.action = "CREATED"
    history.instance = instanceId
    history.seller = event.params.seller
    history.tokenAddress = event.params.tokenAddress
    history.tokenId = event.params.tokenId
    history.amount = event.params.amount
    history.price = event.params.price
    history.currency = event.params.currency
    history.timestamp = event.block.timestamp
    history.transactionHash = event.transaction.hash
    history.blockNumber = event.block.number
    history.save()
}

export function handleListingCancelled(event: ListingCancelled): void {
    let listingId = event.params.listingId.toString()
    let listing = Listing.load(listingId)
    if (listing) {
        listing.status = "CANCELLED"
        listing.save()
        
        // Create history record
        let historyId = event.transaction.hash.toHexString() + '-' + event.logIndex.toString()
        let history = new ListingHistory(historyId)
        history.listingId = listingId
        history.action = "CANCELLED"
        history.instance = listing.instance
        history.seller = listing.seller
        history.tokenAddress = listing.tokenAddress
        history.tokenId = listing.tokenId
        history.amount = listing.amount
        history.price = listing.price
        history.currency = listing.currency
        history.timestamp = event.block.timestamp
        history.transactionHash = event.transaction.hash
        history.blockNumber = event.block.number
        history.save()
    }
}

export function handleListingSold(event: ListingSold): void {
    let listingId = event.params.listingId.toString()
    let listing = Listing.load(listingId)
    if (listing) {
        listing.status = "SOLD"
        listing.save()
        
        // Create history record
        let historyId = event.transaction.hash.toHexString() + '-' + event.logIndex.toString()
        let history = new ListingHistory(historyId)
        history.listingId = listingId
        history.action = "SOLD"
        history.instance = listing.instance
        history.seller = listing.seller
        history.tokenAddress = listing.tokenAddress
        history.tokenId = listing.tokenId
        history.amount = listing.amount
        history.price = listing.price
        history.currency = listing.currency
        history.timestamp = event.block.timestamp
        history.transactionHash = event.transaction.hash
        history.blockNumber = event.block.number
        history.save()
        
        // Create pending transfer context for the upcoming NFT transfer
        createPendingTransfer(
            event.transaction.hash,
            event.params.tokenAddress,
            event.params.tokenId,
            "MARKETPLACE_SALE",
            listingId,
            null,
            event.block.timestamp
        )
    }
}

export function handleBidPlaced(event: BidPlaced): void {
    // Generate complete semantic ID: bidder-tokenAddress-tokenId-tokenAmount-currency
    let bidId = event.params.bidder.toHexString() + "-" +
        event.params.tokenAddress.toHexString() + "-" +
        event.params.tokenId.toString() + "-" +
        event.params.tokenAmount.toString() + "-" +
        event.params.currency.toHexString();

    let bid = Bid.load(bidId);

    if (!bid) bid = new Bid(bidId);

    let instanceId = event.params.tokenAddress.toHexString() + '-' + event.params.tokenId.toString()
    let instance = TokenInstance.load(instanceId)
    if (instance) {
        bid.instance = instanceId
    }
    
    bid.bidder = event.params.bidder
    bid.tokenAddress = event.params.tokenAddress
    bid.tokenId = event.params.tokenId
    bid.tokenAmount = event.params.tokenAmount
    bid.amount = event.params.amount
    bid.currency = event.params.currency
    bid.timeout = event.block.timestamp.plus(BigInt.fromI32(event.params.duration.toI32()))
    bid.status = "ACTIVE"
    bid.createdAt = event.block.timestamp
    bid.save()
    
    // Create history record
    let historyId = event.transaction.hash.toHexString() + '-' + event.logIndex.toString()
    let history = new BidHistory(historyId)
    history.bidId = bidId
    history.action = "PLACED"
    history.instance = instanceId
    history.bidder = event.params.bidder
    history.tokenAddress = event.params.tokenAddress
    history.tokenId = event.params.tokenId
    history.tokenAmount = event.params.tokenAmount
    history.amount = event.params.amount
    history.currency = event.params.currency
    history.timeout = event.block.timestamp.plus(BigInt.fromI32(event.params.duration.toI32()))
    history.timestamp = event.block.timestamp
    history.transactionHash = event.transaction.hash
    history.blockNumber = event.block.number
    history.save()
}


export function handleBidOutbid(event: BidOutbid): void {
    // Generate ID for previous bid - need to reconstruct from event params
    // Note: We need to use the previous bid's currency and amount to match the original ID
    let previousBidId = event.params.previousBidder.toHexString() + "-" +
        event.params.tokenAddress.toHexString() + "-" +
        event.params.tokenId.toString() + "-" +
        event.params.tokenAmount.toString() + "-" +
        event.params.currency.toHexString(); // Using current currency - this might need adjustment based on event structure

    let previousBid = Bid.load(previousBidId);
    if (previousBid) {
        previousBid.status = "OUTBID"
        previousBid.save()
        
        // Create history record
        let historyId = event.transaction.hash.toHexString() + '-' + event.logIndex.toString()
        let history = new BidHistory(historyId)
        history.bidId = previousBidId
        history.action = "OUTBID"
        history.instance = previousBid.instance
        history.bidder = previousBid.bidder
        history.tokenAddress = previousBid.tokenAddress
        history.tokenId = previousBid.tokenId
        history.tokenAmount = previousBid.tokenAmount
        history.amount = previousBid.amount
        history.currency = previousBid.currency
        history.timeout = previousBid.timeout
        history.timestamp = event.block.timestamp
        history.transactionHash = event.transaction.hash
        history.blockNumber = event.block.number
        history.save()
    }
}

export function handleBidCancelled(event: BidCancelled): void {
    let bidId = event.params.bidder.toHexString() + "-" +
        event.params.tokenAddress.toHexString() + "-" +
        event.params.tokenId.toString() + "-" +
        event.params.tokenAmount.toString() + "-" +
        event.params.currency.toHexString();

    let bid = Bid.load(bidId);

    if (bid) {
        bid.status = "CANCELLED"
        bid.save()
        
        // Create history record
        let historyId = event.transaction.hash.toHexString() + '-' + event.logIndex.toString()
        let history = new BidHistory(historyId)
        history.bidId = bidId
        history.action = "CANCELLED"
        history.instance = bid.instance
        history.bidder = bid.bidder
        history.tokenAddress = bid.tokenAddress
        history.tokenId = bid.tokenId
        history.tokenAmount = bid.tokenAmount
        history.amount = bid.amount
        history.currency = bid.currency
        history.timeout = bid.timeout
        history.timestamp = event.block.timestamp
        history.transactionHash = event.transaction.hash
        history.blockNumber = event.block.number
        history.save()
    }
}

export function handleBidAccepted(event: BidAccepted): void {
    let bidId = event.params.bidder.toHexString() + "-" +
        event.params.tokenAddress.toHexString() + "-" +
        event.params.tokenId.toString() + "-" +
        event.params.tokenAmount.toString() + "-" +
        event.params.currency.toHexString();

    let bid = Bid.load(bidId);
    if (bid) {
        bid.status = "ACCEPTED"
        bid.save()
        
        // Create history record
        let historyId = event.transaction.hash.toHexString() + '-' + event.logIndex.toString()
        let history = new BidHistory(historyId)
        history.bidId = bidId
        history.action = "ACCEPTED"
        history.instance = bid.instance
        history.bidder = bid.bidder
        history.tokenAddress = bid.tokenAddress
        history.tokenId = bid.tokenId
        history.tokenAmount = bid.tokenAmount
        history.amount = bid.amount
        history.currency = bid.currency
        history.timeout = bid.timeout
        history.timestamp = event.block.timestamp
        history.transactionHash = event.transaction.hash
        history.blockNumber = event.block.number
        history.save()
        
        // Create pending transfer context for the upcoming NFT transfer
        createPendingTransfer(
            event.transaction.hash,
            event.params.tokenAddress,
            event.params.tokenId,
            "BID_ACCEPTANCE",
            null,
            bidId,
            event.block.timestamp
        )
    }
}
