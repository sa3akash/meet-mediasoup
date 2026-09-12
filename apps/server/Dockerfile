# ==========================================
# Stage 1: Build Native Workers & Bundle
# ==========================================
FROM oven/bun:1 AS builder

WORKDIR /app

# Install native C++ build tools required by Mediasoup
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy root monorepo manifest files
COPY package.json bun.lock* turbo.json ./

# Copy all workspace packages and apps
COPY packages ./packages
COPY apps/server ./apps/server

# Install all workspace dependencies & compile Mediasoup native binaries
RUN bun install --frozen-lockfile

# Move into the server app workspace
WORKDIR /app/apps/server

# Bundle server into a single file with external package resolution
RUN bun build \
    --target=bun \
    --minify \
    --outdir=./dist \
    ./src/index.ts

# ==========================================
# Stage 2: Minimal Production Runtime
# ==========================================
FROM oven/bun:1-slim AS runner

WORKDIR /app

# 1. Copy root package manifest
COPY package.json ./

# 2. Copy compiled application output from builder stage
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/apps/server/package.json ./apps/server/package.json

# 3. Copy root and workspace node_modules (preserves Mediasoup binaries & workspace symlinks)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/server/node_modules ./apps/server/node_modules

# Environment settings
ENV NODE_ENV=production
# Force Mediasoup to find its worker C++ executable in root node_modules
ENV MEDIASOUP_WORKER_BIN=/app/node_modules/mediasoup/worker/out/Release/mediasoup-worker

EXPOSE 4000
EXPOSE 10000-10100/udp
EXPOSE 10000-10100/tcp

# Execute from app root with reflect-metadata preloaded
CMD ["bun", "run", "apps/server/dist/index.js"]