# ==========================================
# Stage 1: Build & Compile Native Workers
# ==========================================
FROM oven/bun:1-debian AS builder

WORKDIR /app

# Install minimal native build tools for Mediasoup C++ worker compilation
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy workspace dependencies configuration
COPY package.json turbo.json bun.lock* ./
COPY packages ./packages
COPY apps/server ./apps/server

# Install dependencies and compile native C++ binaries
RUN bun install --frozen-lockfile

WORKDIR /app/apps/server

# Build production bundle using --outdir flag
RUN bun build \
    --minify-whitespace \
    --minify-syntax \
    --target=bun \
    --outdir=./dist \
    src/index.ts

# ==========================================
# Stage 2: Minimal Production Runtime
# ==========================================
FROM oven/bun:1-distroless AS runner

WORKDIR /app

# Copy transpiled code
COPY --from=builder /app/apps/server/dist ./dist

# Copy Mediasoup native worker binaries and node_modules
COPY --from=builder /app/apps/server/node_modules ./apps/server/node_modules
COPY --from=builder /app/node_modules ./node_modules

ENV NODE_ENV=production

EXPOSE 4000
EXPOSE 10000-10100/udp
EXPOSE 10000-10100/tcp

CMD ["bun", "run", "dist/index.js"]