# ==========================================
# Stage 1: Build Native Workers & Monorepo
# ==========================================
FROM oven/bun:1 AS builder

WORKDIR /app

# Install native C++ build tools & Python packages required by Mediasoup
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    make \
    g++ \
    build-essential \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy root monorepo manifest files
COPY package.json turbo.json bun.lock* ./

# Copy all workspace packages and apps
COPY packages ./packages
COPY apps/server ./apps/server

# Install all workspace dependencies (with trusted dependencies)
RUN bun install --frozen-lockfile || bun install

# Explicitly ensure Mediasoup native C++ worker is built
RUN cd /app/apps/server/node_modules/mediasoup 2>/dev/null && \
    (python3 -m pip install --break-system-packages invoke meson ninja || true) && \
    (node npm-scripts.mjs worker:build || bun run npm-scripts.mjs worker:build || true) || true

# ==========================================
# Stage 2: Minimal Production Runtime
# ==========================================
FROM oven/bun:1-slim AS runner

WORKDIR /app

# Install FFmpeg for Live Streaming (YouTube/Facebook/RTMP) & Server Recordings,
# plus C++ runtime libraries and certificates
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libstdc++6 \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 1. Copy root package manifest
COPY package.json ./

# 2. Copy root and workspace node_modules (preserves Mediasoup binaries & workspace symlinks)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/server ./apps/server

# 3. Ensure Mediasoup worker binary is present and symlinked for universal discovery
RUN if [ -f /app/apps/server/node_modules/mediasoup/worker/out/Release/mediasoup-worker ]; then \
      mkdir -p /app/node_modules/mediasoup/worker/out/Release && \
      cp /app/apps/server/node_modules/mediasoup/worker/out/Release/mediasoup-worker /app/node_modules/mediasoup/worker/out/Release/mediasoup-worker; \
    fi

# Environment settings
ENV NODE_ENV=production
ENV PORT=4000
ENV MEDIASOUP_WORKER_BIN=/app/apps/server/node_modules/mediasoup/worker/out/Release/mediasoup-worker

# Expose HTTP/WS signaling port
EXPOSE 4000
# Expose Mediasoup WebRTC RTP media port range (UDP and TCP)
EXPOSE 40000-40050/udp
EXPOSE 40000-40050/tcp

WORKDIR /app/apps/server

# Execute directly with Bun native TypeScript runtime
CMD ["bun", "run", "src/index.ts"]