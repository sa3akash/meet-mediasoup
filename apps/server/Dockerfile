# ==========================================
# Stage 1: Build & Compile Native Workers
# ==========================================
FROM oven/bun:1 AS builder

WORKDIR /app

# Install native build toolchain required by Mediasoup
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy package definitions and lockfile first
COPY package.json bun.lock* turbo.json ./
COPY packages ./packages
COPY apps/server ./apps/server

# Install dependencies and build Mediasoup C++ binaries
RUN bun install --frozen-lockfile

WORKDIR /app/apps/server

# Build production bundle into apps/server/dist/index.js
RUN bun build \
    --target=bun \
    --minify \
    --outdir=./dist \
    ./src/index.ts

# ==========================================
# Stage 2: Production Runtime
# ==========================================
FROM oven/bun:1-slim AS runner

WORKDIR /app

# Copy built bundle directory directly to /app/dist
COPY --from=builder /app/apps/server/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/server/node_modules ./apps/server/node_modules
COPY --from=builder /app/apps/server/package.json ./apps/server/package.json

ENV NODE_ENV=production
ENV MEDIASOUP_WORKER_BIN=/app/node_modules/mediasoup/worker/out/Release/mediasoup-worker

EXPOSE 4000
EXPOSE 10000-10100/udp
EXPOSE 10000-10100/tcp

# Run index.js while preloading reflect-metadata at runtime
CMD ["bun", "run", "--preload", "reflect-metadata", "apps/server/dist/index.js"]