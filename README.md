# NFT Marketplace Subgraph

A comprehensive subgraph implementation for tracking NFT marketplace activities, supporting ERC721, ERC1155, and ERC6909 tokens. This subgraph indexes contract events to provide real-time insights into NFT creations, listings, bids, and sales.

## Features

- Multi-token standard support (ERC721, ERC1155 & ERC6909)
- Factory contract tracking for NFT deployments
- Comprehensive marketplace activity monitoring:
  - Listing creation and management
  - Bidding system with timeouts
  - Sales tracking with multiple currencies
  - Token ownership and transfer history
  - Balance tracking for ERC1155 tokens

## Prerequisites

The following tools are required to run this subgraph:

- Node.js >= 14
- PNPM package manager
- Docker and Docker Compose
- Graph CLI (`@graphprotocol/graph-cli`)
- Foundry's Anvil (for local chain)

## Project Structure

```
├── schema.graphql              # GraphQL schema definition
├── subgraph.template.yaml     # Subgraph manifest template
├── Makefile                   # Build and deployment automation
├── src/
│   ├── abis/                  # Contract ABIs
│   ├── helpers.ts             # Utility functions
│   ├── marketplace.ts         # Marketplace event handlers
│   ├── nft1155-factory.ts     # ERC1155 factory handlers
│   └── nft721-factory.ts      # ERC721 factory handlers
└── tests/                     # Test files
```

## Environment Setup

1. Create a `.env` file in the project root with the following variables:

```env
NETWORK=localhost
NFT721_FACTORY_ADDRESS=
NFT1155_FACTORY_ADDRESS=
NFT6909_FACTORY_ADDRESS=
NFT_MARKETPLACE_ADDRESS=
START_BLOCK=
RPC_URL=
```

## Development Workflow

This project uses a Makefile to automate common development tasks. Here are the key commands:

### Basic Commands

```bash
# Check environment and dependencies
make check-env

# Install project dependencies
make install

# Clean up directories and containers
make clean

# View all available commands
make help
```

### Development Setup

```bash
# Complete development setup (recommended)
make dev

# This command runs:
# - Cleans previous build
# - Checks environment
# - Installs dependencies
# - Sets up directories
# - Starts Anvil node
# - Prepares subgraph
# - Deploys subgraph
# - Monitors logs
```

### Individual Components

```bash
# Start Anvil node for local development
make start-anvil

# Start Graph Node and required services
make start-graph-node

# Prepare subgraph files
make prepare

# Deploy subgraph to local Graph Node
make deploy

# Monitor Graph Node logs
make monitor
```

## Monitoring and Debugging

- GraphQL Endpoint: `http://localhost:8000/subgraphs/name/nft-marketplace`
- GraphiQL Interface: `http://localhost:8000/subgraphs/name/nft-marketplace/graphql`

### Example GraphQL Query

```graphql
{
  # Query NFT contract deployments
  factories {
    id
    type
    nftCount
  }
  
  # Query active marketplace listings
  listings(where: { status: "ACTIVE" }) {
    id
    seller
    tokenAddress
    tokenId
    amount
    price
    currency
  }
  
  # Query token balances
  tokenBalances(first: 5) {
    owner
    amount
    instance {
      tokenId
      collection {
        name
        symbol
      }
    }
  }
}
```

## CI/CD and Deployment

The project supports both local development and production deployment workflows through different Make commands and Docker configurations.

### Development Workflow

For local development, use:
```bash
# Start local development environment
make dev     # Runs full development setup with local Graph Node
# OR
make all     # Similar to dev but without continuous monitoring
```

This will:
- Clean existing environment
- Install dependencies
- Start local Anvil node
- Deploy and run local Graph Node services
- Deploy subgraph

### Production/Testnet Deployment

For production or testnet deployment:
```bash
# Set your environment first
cp .env.example .env
# Edit .env to set:
# NETWORK=testnet    # For testnet deployment
# NETWORK=localhost     # For local deployment
# START_BLOCK=<your-start-block>
# RPC_URL=<your-rpc-url>

# Deploy to selected environment
make deploy-prodtestnet
```

This command:
- Cleans up existing deployment
- Builds and deploys using environment-specific Docker configurations
- Automatically starts Anvil if using localhost network
- Uses appropriate Graph Node configuration for the target network

### Directory Structure

```
dockerfiles/
├── core/                          # Core service configurations
│   ├── localhost.docker-compose.yml    # Local development services
│   └── testnet.docker-compose.yml      # Testnet services
└── ci_cd/                        # Deployment configurations
    ├── localhost.docker-compose.yml    # Local deployment
    └── testnet.docker-compose.yml      # Testnet deployment
```

### Useful Commands

```bash
# Monitor logs
make monitor   # Shows logs based on NETWORK setting

# Clean environment
make clean     # Removes containers, volumes, and build artifacts

# Check configuration
make check-env # Validates environment settings
```

### Environment Variables

Key environment variables for deployment:
- `NETWORK`: Target network (`localhost` or `testnet`)
- `START_BLOCK`: Starting block number for indexing
- `RPC_URL`: RPC endpoint for the network

### Health Checks

The deployment process includes built-in health checks that:
- Verify Graph Node availability
- Ensure IPFS is accessible
- Confirm database connectivity

Health check endpoints:
- Graph Node: `http://localhost:8030` (local) or `http://graph-node:8030` (container)
- IPFS: `http://localhost:5001` (local) or `http://ipfs:5001` (container)
```
