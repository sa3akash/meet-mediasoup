# Production Dockerfile for Enterprise Meet Server (Bun + Native Mediasoup)
FROM oven/bun:1-debian AS builder

WORKDIR /app

# Install native dependencies required for Mediasoup C++ worker compilation
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    make \
    g++ \
    clang \
    pkg-config \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy monorepo configurations and workspace files
COPY package.json turbo.json bun.lock* ./
COPY packages ./packages
COPY apps/server ./apps/server

# Install dependencies (compiling Mediasoup native workers for Linux)
RUN bun install

WORKDIR /app/apps/server

# Build production bundle
RUN bun run build

# Production Runtime Stage
FROM oven/bun:1-debian AS runner

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=4000

COPY --from=builder /app /app

WORKDIR /app/apps/server

EXPOSE 4000

# Health check probe for container runtime
HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
  CMD curl -f http://localhost:4000/health/live || exit 1

CMD ["bun", "run", "dist/index.js"]
