# Environment variables
SHELL := /bin/bash

# Check for .env file
ifneq (,$(wildcard .env))
    include .env
    export
endif

IN_DOCKER := $(shell test -f /.dockerenv && echo 1 || echo 0)

# Environment variables with defaults
NETWORK ?= $(if $(ENV_NETWORK),$(ENV_NETWORK),localhost)
START_BLOCK ?= $(if $(ENV_START_BLOCK),$(ENV_START_BLOCK),10596748)
RPC_URL ?= $(if $(ENV_RPC_URL),$(ENV_RPC_URL),https://eth-mainnet.g.alchemy.com/v2/your-api-key)

# Validation target
check-env:
	@echo "🔍 Checking environment configuration..."
	@echo "  Network:     $(NETWORK)"
	@echo "  Start Block: $(START_BLOCK)"
	@echo "  RPC URL:     $(RPC_URL)"
	@if [ ! -f .env ]; then \
		echo "⚠️  Warning: .env file not found, using localhost default values"; \
	else \
		echo "✓ Using values from .env file"; \
	fi

check-testnet-env:
	@if [ ! -f .env.testnet ]; then \
		echo "❌ Error: .env.testnet file is missing. Please create it with appropriate testnet configuration."; \
		exit 1; \
	fi
	@echo "✓ Found .env.testnet file"
	@cp .env.testnet .env
	@echo "✓ Moved .env.testnet to .env"

check-localhost-env:
	@if [ ! -f .env.localhost ]; then \
		echo "❌ Error: .env.localhost file is missing. Please create it with appropriate localhost configuration."; \
		exit 1; \
	fi
	@echo "✓ Found .env.localhost file"
	@cp .env.localhost .env
	@echo "✓ Moved .env.localhost to .env"


# Directory structure
DATA_DIR = data
IPFS_DIR = $(DATA_DIR)/ipfs
POSTGRES_DIR = $(DATA_DIR)/postgres

# Docker configuration
DOCKER_COMPOSE = docker compose
GRAPH_NODE_URL = http://localhost:8020/
IPFS_URL = http://localhost:5001
SUBGRAPH_NAME = nft-marketplace

GRAPH_NODE_HOST := $(if $(filter 1,$(IN_DOCKER)),graph-node,localhost)
IPFS_HOST := $(if $(filter 1,$(IN_DOCKER)),ipfs,localhost)
GRAPH_NODE_URL = http://$(GRAPH_NODE_HOST):8020/
IPFS_URL = http://$(IPFS_HOST):5001
	
# Dependency checks
PNPM_EXISTS := $(shell command -v pnpm 2> /dev/null)
DOCKER_EXISTS := $(shell command -v docker 2> /dev/null)
GRAPH_EXISTS := $(shell command -v graph 2> /dev/null)
ANVIL_EXISTS := $(shell command -v anvil 2> /dev/null)


# Add the health check definition here
define HEALTH_CHECK
#!/bin/bash

check_service() {
    local url="$$1"
    local name="$$2"
    local max_attempts="$$30"
    local attempt=1

    echo "Checking $$name..."
    while [ $$attempt -le $$max_attempts ]; do
        if curl -s "$$url" | grep -q "OK"; then
            echo "✓ $$name is ready"
            return 0
        fi
        echo "⏳ Waiting for $$name ($$attempt/$$max_attempts)..."
        sleep 5
        attempt=$$((attempt + 1))
    done
    echo "❌ $$name failed to become ready"
    return 1
}

# Check Graph Node
if ! check_service "http://$(GRAPH_NODE_HOST):8030" "Graph Node" 30; then
    exit 1
fi

echo "✨ Graph Node is ready"
endef

.PHONY: all check-deps install setup clean start-anvil start-graph-node prepare deploy monitor help

# Default target
all: check-localhost-env check-env check-deps install setup prepare deploy


# Default target
prodtestnet: check-testnet-env check-env install setup prepare deploy


# Check dependencies
check-deps:
	@echo "Checking dependencies..."
	@if [ -z "$(PNPM_EXISTS)" ]; then \
		echo "❌ pnpm is not installed. Please install pnpm first."; \
		exit 1; \
	else \
		echo "✓ pnpm found"; \
	fi
	@if [ "$(IN_DOCKER)" = "0" ]; then \
		if [ -z "$(DOCKER_EXISTS)" ]; then \
			echo "❌ docker is not installed. Please install docker first."; \
			exit 1; \
		else \
			echo "✓ docker found"; \
		fi; \
	fi
	@if [ -z "$(GRAPH_EXISTS)" ]; then \
		echo "❌ graph-cli is not installed. Please install @graphprotocol/graph-cli first."; \
		exit 1; \
	else \
		echo "✓ graph-cli found"; \
	fi
	@if [ -z "$(ANVIL_EXISTS)" ]; then \
		echo "❌ anvil is not installed. Please install foundry first."; \
		exit 1; \
	else \
		echo "✓ anvil found"; \
	fi
	@echo "✨ All dependencies are satisfied"

# Install dependencies
install:
	@echo "Installing dependencies..."
	pnpm install
	
# Setup data directories
setup:
	@echo "Setting up data directories..."
	mkdir -p $(IPFS_DIR)
	mkdir -p $(POSTGRES_DIR)
	@echo "Data directories created successfully"

# Clean up
clean:
	@echo "Cleaning up..."
	@if [ "$(NETWORK)" = "localhost" ]; then \
		echo "Cleaning localhost environment..."; \
		$(DOCKER_COMPOSE) -f dockerfiles/core/localhost.docker-compose.yml down -v || true; \
		$(DOCKER_COMPOSE) -f dockerfiles/ci_cd/localhost.docker-compose.yml down -v || true; \
	else \
		echo "Cleaning $(NETWORK) environment..."; \
		$(DOCKER_COMPOSE) -f dockerfiles/core/testnet.docker-compose.yml down -v || true; \
		$(DOCKER_COMPOSE) -f dockerfiles/ci_cd/testnet.docker-compose.yml down -v || true; \
	fi
	rm -rf $(DATA_DIR)
	rm -rf generated/
	rm -rf build/

# Start Anvil node
start-anvil:
	@echo "Starting Anvil node..."
	@if [ "$$(uname)" = "Linux" ]; then \
		gnome-terminal -- bash -c "anvil --fork-url $(RPC_URL) --host 0.0.0.0 --fork-block-number $(START_BLOCK) --block-time 1 --chain-id 1337; exec bash"; \
	elif [ "$$(uname)" = "Darwin" ]; then \
		osascript -e 'tell app "Terminal" to do script "anvil --fork-url $(RPC_URL) --host 0.0.0.0 --fork-block-number $(START_BLOCK) --block-time 1 --chain-id 1337"'; \
	else \
		echo "Unsupported OS: Please run anvil manually in a new terminal window"; \
		exit 1; \
	fi
	@echo "Waiting for Anvil to start..."
	@sleep 5

# Start Graph Node
start-graph-node:
	@echo "Starting Graph Node..."
	@if [ "$(IN_DOCKER)" = "0" ]; then \
		if [ "$(NETWORK)" = "localhost" ]; then \
			echo "Starting local Graph Node..."; \
			$(DOCKER_COMPOSE) -f dockerfiles/core/localhost.docker-compose.yml up -d; \
		else \
			echo "Starting $(NETWORK) Graph Node..."; \
			$(DOCKER_COMPOSE) -f dockerfiles/core/testnet.docker-compose.yml up -d; \
		fi; \
	fi
	@echo "Waiting for services to initialize..."
	@echo "$$HEALTH_CHECK" | bash

# Prepare subgraph
prepare:
	@echo "Preparing subgraph..."
	pnpm run prepare
	graph codegen
	@echo "Subgraph preparation completed"

# Deploy subgraph
deploy: start-graph-node
	@echo "Creating and deploying subgraph..."
	-graph create --node $(GRAPH_NODE_URL) $(SUBGRAPH_NAME)
	graph deploy --node $(GRAPH_NODE_URL) --ipfs $(IPFS_URL) $(SUBGRAPH_NAME) --version-label v0.0.1

# Monitor logs
monitor:
	@echo "Monitoring Graph Node logs..."
	@if [ "$(NETWORK)" = "localhost" ]; then \
		$(DOCKER_COMPOSE) -f dockerfiles/core/localhost.docker-compose.yml logs -f; \
	else \
		$(DOCKER_COMPOSE) -f dockerfiles/core/testnet.docker-compose.yml logs -f; \
	fi

# Help
help:
	@echo "Available targets:"
	@echo "  all          - Run complete setup and deployment (default)"
	@echo "  check-env    - Check required env file"
	@echo "  check-deps   - Check required dependencies"
	@echo "  install      - Install project dependencies"
	@echo "  setup        - Create required directories"
	@echo "  clean        - Clean up directories and containers"
	@echo "  start-anvil  - Start Anvil node"
	@echo "  start-graph-node - Start Graph Node services"
	@echo "  prepare      - Prepare subgraph files"
	@echo "  deploy       - Deploy subgraph to local Graph Node"
	@echo "  monitor      - Monitor Graph Node logs"
	@echo "  help         - Show this help message"

# Master command (development workflow)
.PHONY: dev
dev: clean check-localhost-env check-env check-deps install setup start-anvil prepare deploy monitor

.PHONY: deploy-prodtestnet

# Production deployment command that handles cleanup and container startup
deploy-prodtestnet:
	@echo "Starting production deployment..."
	$(MAKE) clean
	$(MAKE) check-testnet-env
	@if [ "$(NETWORK)" = "localhost" ]; then \
		echo "Starting Anvil for localhost deployment..."; \
		$(MAKE) start-anvil; \
		docker compose -f dockerfiles/ci_cd/localhost.docker-compose.yml up --build; \
	else \
		echo "Deploying to $(NETWORK)..."; \
		docker compose -f dockerfiles/ci_cd/testnet.docker-compose.yml up --build; \
	fi
