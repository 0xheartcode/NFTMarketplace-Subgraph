FROM node:20-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    make \
    && rm -rf /var/lib/apt/lists/*


# Set up PNPM with proper environment and permissions
ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="${PNPM_HOME}:${PATH}"
RUN mkdir -p /root/.local/share/pnpm && \
    chmod -R 777 /root/.local/share/pnpm
    
# Install pnpm using npm first
RUN npm install -g pnpm

# Install Foundry (for anvil)
RUN curl -L https://foundry.paradigm.xyz | bash
RUN $HOME/.foundry/bin/foundryup

# Install graph-cli
RUN pnpm add -g @graphprotocol/graph-cli

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Copy the rest of the application
COPY . .

# Install dependencies
RUN pnpm install

# Create necessary directories
RUN mkdir -p data/ipfs data/postgres

# Set environment variables
ENV NODE_ENV=production

# Default command
CMD ["make", "prodtestnet"]
