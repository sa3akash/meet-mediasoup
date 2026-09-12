# Production Dockerfile for Enterprise Meet Client (Next.js App Router)
FROM oven/bun:1-debian AS builder

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Copy monorepo workspace files
COPY package.json turbo.json bun.lock* ./
COPY packages ./packages
COPY apps/client ./apps/client

# Install monorepo dependencies
RUN bun install

WORKDIR /app/apps/client

# Build Next.js application
RUN bun run build

# Production Runner Stage
FROM oven/bun:1-debian AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app /app

WORKDIR /app/apps/client

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=3s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

CMD ["bun", "run", "start"]
