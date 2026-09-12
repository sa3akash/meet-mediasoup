# ============================================
# Stage 1: Build Stage
# ============================================
FROM oven/bun:1 AS builder

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Copy monorepo configuration and workspace packages
COPY package.json turbo.json bun.lock* ./
COPY packages ./packages
COPY apps/client ./apps/client

# Install dependencies across the monorepo workspace
RUN bun install --frozen-lockfile

# Build Next.js application inside client app directory
WORKDIR /app/apps/client
RUN bun run build

# ============================================
# Stage 2: Production Runner
# ============================================
FROM oven/bun:1 AS runner

WORKDIR /app

# Install curl for the HEALTHCHECK mechanism
RUN apt-get update && apt-get install -y curl && rm -rf /lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# Copy static assets and standalone build output from the builder stage
COPY --from=builder --chown=bun:bun /app/apps/client/public ./public
COPY --from=builder --chown=bun:bun /app/apps/client/.next/standalone ./
COPY --from=builder --chown=bun:bun /app/apps/client/.next/static ./.next/static

# Set correct permissions for Next.js cache directory
RUN mkdir -p .next && chown bun:bun .next

USER bun

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=3s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

CMD ["bun", "server.js"]