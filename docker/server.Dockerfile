FROM oven/bun:1.2-debian AS builder

# Install build dependencies required for compiling mediasoup-worker C++ binary
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    build-essential \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy root workspace and package manifests
COPY package.json turbo.json bun.lock* ./
COPY apps/server/package.json ./apps/server/
COPY packages/ ./packages/

# Install dependencies and build shared packages
RUN bun install --frozen-lockfile

# Copy server source
COPY apps/server ./apps/server

WORKDIR /app/apps/server
EXPOSE 4000
EXPOSE 40000-49999/udp
EXPOSE 40000-49999/tcp

CMD ["bun", "run", "src/index.ts"]
