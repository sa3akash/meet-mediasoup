FROM oven/bun:1.2-debian AS builder

WORKDIR /app

COPY package.json turbo.json bun.lock* ./
COPY apps/client/package.json ./apps/client/
COPY packages/ ./packages/

RUN bun install --frozen-lockfile

COPY apps/client ./apps/client

WORKDIR /app/apps/client
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

FROM oven/bun:1.2-debian AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/apps/client/.next ./apps/client/.next
COPY --from=builder /app/apps/client/public ./apps/client/public
COPY --from=builder /app/apps/client/package.json ./apps/client/package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages

WORKDIR /app/apps/client
EXPOSE 3000

CMD ["bun", "run", "start"]
