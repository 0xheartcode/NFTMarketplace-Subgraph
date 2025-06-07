# ================================================================================
# NFT Marketplace Subgraph - Build and Deployment Automation
# ================================================================================

MAKEFLAGS += --no-print-directory

# ================================================================================
# Environment Configuration
# ================================================================================
SHELL := /bin/bash

# Check for .env file and include if exists
ifneq (,$(wildcard .env))
    include .env
    export
endif

# Runtime detection
IN_DOCKER := $(shell test -f /.dockerenv && echo 1 || echo 0)

# Environment variables with defaults
NETWORK ?= $(if $(ENV_NETWORK),$(ENV_NETWORK),localhost)
START_BLOCK ?= $(if $(ENV_START_BLOCK),$(ENV_START_BLOCK),10596748)
RPC_URL ?= $(if $(ENV_RPC_URL),$(ENV_RPC_URL),https://eth-mainnet.g.alchemy.com/v2/your-api-key)

# Directory structure
DATA_DIR = data
IPFS_DIR = $(DATA_DIR)/ipfs
POSTGRES_DIR = $(DATA_DIR)/postgres

# Docker configuration
DOCKER_COMPOSE = docker compose
SUBGRAPH_NAME = nft-marketplace

# Dynamic host configuration based on environment
GRAPH_NODE_HOST := $(if $(filter 1,$(IN_DOCKER)),graph-node,localhost)
IPFS_HOST := $(if $(filter 1,$(IN_DOCKER)),ipfs,localhost)
GRAPH_NODE_URL = http://$(GRAPH_NODE_HOST):8020/
IPFS_URL = http://$(IPFS_HOST):5001

# Dependency checks
PNPM_EXISTS := $(shell command -v pnpm 2> /dev/null)
DOCKER_EXISTS := $(shell command -v docker 2> /dev/null)
GRAPH_EXISTS := $(shell command -v graph 2> /dev/null)
ANVIL_EXISTS := $(shell command -v anvil 2> /dev/null)

# Health check script for service readiness
define HEALTH_CHECK
#!/bin/bash

check_service() {
    local url="$$1"
    local name="$$2"
    local max_attempts="$$3"
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

# Check Graph Node readiness
if ! check_service "http://$(GRAPH_NODE_HOST):8030" "Graph Node" 30; then
    exit 1
fi

echo "✨ Graph Node is ready"
endef

# ================================================================================
##@ Default Targets
# ================================================================================

.PHONY: all
all: check-localhost-env check-env check-deps install setup prepare deploy ## Run complete setup and deployment for localhost (default target)

.PHONY: prodtestnet  
prodtestnet: check-testnet-env check-env install setup prepare deploy ## Run complete setup and deployment for testnet

# ================================================================================
##@ Environment Management
# ================================================================================

.PHONY: check-env
check-env: ## Validate current environment configuration and display settings
	@echo "🔍 Checking environment configuration..."
	@echo "  Network:     $(NETWORK)"
	@echo "  Start Block: $(START_BLOCK)"
	@echo "  RPC URL:     $(RPC_URL)"
	@if [ ! -f .env ]; then \
		echo "⚠️  Warning: .env file not found, using localhost default values"; \
	else \
		echo "✓ Using values from .env file"; \
	fi

.PHONY: check-testnet-env
check-testnet-env: ## Set up testnet environment by copying .env.testnet to .env
	@if [ ! -f .env.testnet ]; then \
		echo "❌ Error: .env.testnet file is missing. Please create it with appropriate testnet configuration."; \
		exit 1; \
	fi
	@echo "✓ Found .env.testnet file"
	@cp .env.testnet .env
	@echo "✓ Copied .env.testnet to .env"

.PHONY: check-localhost-env
check-localhost-env: ## Set up localhost environment by copying .env.localhost to .env
	@if [ ! -f .env.localhost ]; then \
		echo "❌ Error: .env.localhost file is missing. Please create it with appropriate localhost configuration."; \
		exit 1; \
	fi
	@echo "✓ Found .env.localhost file"
	@cp .env.localhost .env
	@echo "✓ Copied .env.localhost to .env"

# ================================================================================
##@ Dependencies & Installation
# ================================================================================

.PHONY: check-deps
check-deps: ## Verify all required system dependencies are installed
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

.PHONY: install
install: ## Install project dependencies using pnpm
	@echo "Installing dependencies..."
	pnpm install

# ================================================================================
##@ Directory & Data Management
# ================================================================================

.PHONY: setup
setup: ## Create required data directories for IPFS and PostgreSQL
	@echo "Setting up data directories..."
	mkdir -p $(IPFS_DIR)
	mkdir -p $(POSTGRES_DIR)
	@echo "Data directories created successfully"

.PHONY: clean
clean: ## Clean up generated files, data directories and Docker containers
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

# ================================================================================
##@ Service Management
# ================================================================================

.PHONY: start-anvil
start-anvil: ## Start Anvil node for local blockchain development with network forking
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

.PHONY: start-graph-node
start-graph-node: ## Start Graph Node and supporting services using Docker Compose
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

.PHONY: monitor
monitor: ## Monitor Graph Node service logs in real-time
	@echo "Monitoring Graph Node logs..."
	@if [ "$(NETWORK)" = "localhost" ]; then \
		$(DOCKER_COMPOSE) -f dockerfiles/core/localhost.docker-compose.yml logs -f; \
	else \
		$(DOCKER_COMPOSE) -f dockerfiles/core/testnet.docker-compose.yml logs -f; \
	fi

# ================================================================================
##@ Subgraph Development
# ================================================================================

.PHONY: prepare
prepare: ## Prepare subgraph configuration and generate TypeScript code from GraphQL schema
	@echo "Preparing subgraph..."
	pnpm run prepare
	graph codegen
	@echo "Subgraph preparation completed"

.PHONY: deploy
deploy: start-graph-node ## Deploy subgraph to local Graph Node instance
	@echo "Creating and deploying subgraph..."
	-graph create --node $(GRAPH_NODE_URL) $(SUBGRAPH_NAME)
	graph deploy --node $(GRAPH_NODE_URL) --ipfs $(IPFS_URL) $(SUBGRAPH_NAME) --version-label v0.0.1

# ================================================================================
##@ Development Workflows
# ================================================================================

.PHONY: dev
dev: clean check-localhost-env check-env check-deps install setup start-anvil prepare deploy monitor ## Complete local development workflow with monitoring

.PHONY: deploy-prodtestnet
deploy-prodtestnet: ## Production deployment workflow for testnet with container orchestration
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

# ================================================================================
##@ Help & Information
# ================================================================================

.PHONY: help
help: ## Display this help message with available targets and descriptions
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_0-9-]+:.*?##/ { printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

# Make help the default target when no target is specified
.DEFAULT_GOAL := help
