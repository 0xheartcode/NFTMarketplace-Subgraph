// src/marketplace.ts
import {BidAccepted, BidCancelled, BidPlaced, BidOutbid, ListingCancelled, ListingCreated, ListingSold} from '../generated/NFTMarketplace/NFTMarketplace'
import {Bid, Listing, NFT, TokenInstance} from '../generated/schema'
import {BigInt} from '@graphprotocol/graph-ts'
import { createPendingTransfer } from './helpers'

export function handleListingCreated(event: ListingCreated): void {
    let listing = new Listing(event.params.listingId.toString())
    
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
}

export function handleListingCancelled(event: ListingCancelled): void {
    let listing = Listing.load(event.params.listingId.toString())
    if (listing) {
        listing.status = "CANCELLED"
        listing.save()
    }
}

export function handleListingSold(event: ListingSold): void {
    let listing = Listing.load(event.params.listingId.toString())
    if (listing) {
        listing.status = "SOLD"
        listing.save()
        
        // Create pending transfer context for the upcoming NFT transfer
        createPendingTransfer(
            event.transaction.hash,
            event.params.tokenAddress,
            event.params.tokenId,
            "MARKETPLACE_SALE",
            event.params.listingId.toString(),
            null,
            event.block.timestamp
        )
    }
}

export function handleBidPlaced(event: BidPlaced): void {
    // Generate initial ID
    let id = event.params.bidder.toHexString() + "-" +
        event.params.tokenAddress.toHexString() + "-" +
        event.params.tokenId.toString() + "-" +
        event.params.tokenAmount.toString() + "-" +
        event.params.amount.toString();

    let bid = Bid.load(id);

    if (!bid) bid = new Bid(id);

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
}


export function handleBidOutbid(event: BidOutbid): void {
    // Generate ID for previous bid
    let id = event.params.previousBidder.toHexString() + "-" +
        event.params.tokenAddress.toHexString() + "-" +
        event.params.tokenId.toString() + "-" +
        event.params.tokenAmount.toString() + "-" +
        event.params.previousAmount.toString();

    let previousBid = Bid.load(id);
    if (previousBid) {
        previousBid.status = "OUTBID"
        previousBid.save()
    }
}

export function handleBidCancelled(event: BidCancelled): void {
    let id = event.params.bidder.toHexString() + "-" +
        event.params.tokenAddress.toHexString() + "-" +
        event.params.tokenId.toString() + "-" +
        event.params.tokenAmount.toString() + "-" +
        event.params.amount.toString();

    let bid = Bid.load(id);

    if (bid) {
        bid.status = "CANCELLED"
        bid.save()
    }
}

export function handleBidAccepted(event: BidAccepted): void {
    let id = event.params.bidder.toHexString() + "-" +
        event.params.tokenAddress.toHexString() + "-" +
        event.params.tokenId.toString() + "-" +
        event.params.tokenAmount.toString() + "-" +
        event.params.amount.toString();

    let bid = Bid.load(id);
    if (bid) {
        bid.status = "ACCEPTED"
        bid.save()
        
        // Create pending transfer context for the upcoming NFT transfer
        createPendingTransfer(
            event.transaction.hash,
            event.params.tokenAddress,
            event.params.tokenId,
            "BID_ACCEPTANCE",
            null,
            id,
            event.block.timestamp
        )
    }
    //
    // let nft = NFT.load(event.params.tokenAddress.toHexString());
    //
    //
    // // In case of ERC721: all ACTIVE bids related to this token should be set to AUTOMATICALLY_CANCELLED_AFTER_BID_ACCEPTED
    // if(nft.tokenType === "ERC721"){
    //     let tokenBids = Bid.getAll();
    //     if (tokenBids) {
    //         for (let i = 0; i < tokenBids.length; i++) {
    //             let otherBid = tokenBids[i];
    //             if (otherBid.id.contains(nft.tokenAddress.toHexString()) && otherBid.id !== id && otherBid.status == "ACTIVE" && ) {
    //                 otherBid.status = "AUTOMATICALLY_CANCELLED_AFTER_BID_ACCEPTED";
    //                 otherBid.save();
    //             }
    //         }
    //     }
    // }
}

