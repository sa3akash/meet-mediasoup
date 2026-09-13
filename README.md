# Google Meet — Enterprise WebRTC Video Conferencing Platform

A modern, highly scalable, enterprise-grade video conferencing platform inspired by Google Meet. Built as a high-performance monorepo utilizing **Next.js 16 (Turbopack)**, **ElysiaJS (Bun)**, **Mediasoup SFU (WebRTC)**, **PostgreSQL (Drizzle ORM)**, and **Redis (BullMQ)**.

---

## Visual Showcase

### Client Video Conference & Interactive Room
![Google Meet Client Interface](./screenshort/client.PNG)

### High-Throughput SFU & Signaling Backend
![Google Meet Server Architecture & Console](./screenshort/server.PNG)

---

## Core Feature Matrix

### 1. High-Performance Audio / Video SFU
- **Selective Forwarding Unit (SFU)**: Powered by Mediasoup and WebRTC for ultra-low latency, multi-peer video routing.
- **Active Speaker Detection**: Visual border highlight and automatic spotlighting based on audio volume analysis.
- **Device Management**: Dynamic microphone, camera, and speaker selection with live audio level visualizers.
- **Adaptive Quality & Fallbacks**: Automatic resolution adaptation with mute states and ICE candidate reconnection.

### 2. High-Definition Screen Sharing
- **System Audio & Video**: Full desktop, application window, or browser tab sharing with high-fps support.
- **Presenter Control Dock**: Floating presentation bar with pause, stop, and audio toggle actions.
- **Auto Participant Sync**: Remote peers automatically switch to presentation mode with picture-in-picture speaker view.

### 3. Pre-Join Lobby & Smart Join
- **Media Previews**: Camera and microphone check, audio input/output testing, and background blur before entering.
- **No Ghost Participants**: WebSocket connection and participant admission occur strictly upon clicking "Join Meeting", preventing premature lobby ghosts.
- **Passcode & Room Lock**: End-to-end access control with password-protected rooms and waiting room approvals.

### 4. Interactive Chat & Notifications
- **Real-Time Messaging**: Synchronized messaging across all room members with sender avatar and timestamp.
- **Message Reactions**: Interactive emoji reactions with live counters and peer reaction aggregation.
- **Unread Badge & Floating Toasts**: Unread counter badges on the control bar and auto-dismissing toast notifications when the chat panel is closed.
- **Chat Moderation**: Pin important messages, mute disruptive participants, and export chat logs.

### 5. Floating Reactions & Hand Raising
- **Animated Floating Reactions**: Flying emoji animations that stream across the video stage in real time.
- **Hand Raising Queue**: Ordered queue with priority badges for questions and speaker turns.

### 6. Interactive Live Polls
- **Dynamic Polling**: Host-created multiple-choice questions with instant updates.
- **Live Aggregation**: Real-time vote percentage bars and voter tracking.
- **Poll Lifecycle**: Host can close/archive polls or export results.

### 7. Breakout Rooms
- **Dynamic Splitting**: Divide participants into custom breakout rooms with automatic or manual assignment.
- **Host Broadcasts**: Instant banner announcements broadcasted across all breakout rooms.
- **Timed Sessions**: Configurable breakout duration with automatic regrouping back into the main call.

### 8. Collaborative Whiteboard & File Sharing
- **Real-Time Whiteboard**: Multi-user drawing canvas with freehand brushes, shapes, sticky notes, and instant canvas clearing.
- **In-Meeting File Sharing**: Secure asset distribution with upload progress, preview, and download access.

### 9. Cloud & Local Recording / Live Streaming
- **Dual Recording Modes**: High-fidelity browser-side WebM recording + SFU server-side recording.
- **RTMP Live Streaming**: Broadcast meetings directly to YouTube Live, Twitch, or custom RTMP ingest endpoints.

### 10. Responsive Mobile Experience
- **Touch-Optimized Control Bar**: Compact mobile bottom dock with safe-area support (`h-[100dvh]`).
- **Sliding Action Sheet**: Expandable bottom sheet for participants, polls, whiteboard, settings, and host controls.
- **Full-Screen Overlays**: Mobile-tailored chat, participant list, and breakout panels.

---

## Monorepo Architecture

```
meet/
├── apps/
│   ├── client/                  # Next.js 16 (App Router, Turbopack, Tailwind CSS, Zustand)
│   │   ├── src/
│   │   │   ├── actions/         # Next.js Server Actions (Auth, Meetings, Admin)
│   │   │   ├── app/             # Application routes (meeting/[slug], admin, analytics, calendar)
│   │   │   ├── components/      # UI component library (shadcn/ui-inspired)
│   │   │   ├── features/        # Feature modules (meeting, chat, lobby, whiteboard, polls)
│   │   │   ├── hooks/           # Mediasoup WebRTC hooks, RPC signaling, audio detection
│   │   │   └── stores/          # Zustand state stores (meeting-store, media-store)
│   │   └── package.json
│   │
│   └── server/                  # Bun + ElysiaJS + Mediasoup Backend
│       ├── src/
│       │   ├── controllers/     # REST & Auth controllers
│       │   ├── db/              # Drizzle ORM schema, migrations, and PostgreSQL client
│       │   ├── mediasoup/       # Mediasoup SFU workers, routers, transports, producers/consumers
│       │   ├── websocket/       # WebSocket JSON-RPC signaling handler
│       │   └── server.ts        # Server entry point
│       └── package.json
│
├── packages/                    # Shared workspace packages
│   ├── shared-config/           # Shared ESLint, Prettier, and TypeScript configs
│   ├── shared-events/           # WebSocket signaling event constants
│   ├── shared-types/            # Shared TypeScript contracts & DTOs
│   ├── shared-utils/            # Cryptographic & formatting helper utilities
│   └── shared-validation/       # Zod validation schemas
│
├── screenshort/                 # Application screenshots
│   ├── client.PNG
│   └── server.PNG
│
├── docker-compose.yml           # Local dev services (PostgreSQL, Redis, MinIO)
├── turbo.json                   # Turborepo build pipeline
└── package.json                 # Monorepo root configuration
```

---

## Getting Started

### Prerequisites
- **[Bun](https://bun.sh/)** v1.2+ (or Node.js v20+)
- **Docker & Docker Compose** (for PostgreSQL, Redis, and MinIO)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/sa3akash/meet-mediasoup.git
cd meet
bun install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure the following variables are configured:
```env
# Database & Redis
DATABASE_URL="postgres://postgres:postgres@localhost:5432/meet"
REDIS_URL="redis://localhost:6379"

# WebRTC & Mediasoup
MEDIASOUP_LISTEN_IP="0.0.0.0"
MEDIASOUP_ANNOUNCED_IP="127.0.0.1"
MEDIASOUP_MIN_PORT=20000
MEDIASOUP_MAX_PORT=20100

# Client & API
NEXT_PUBLIC_API_URL="http://localhost:4000"
NEXT_PUBLIC_WS_URL="ws://localhost:4000/ws"
```

### 3. Start Infrastructure Services
```bash
docker-compose up -d
```

### 4. Run Database Migrations
```bash
bun run db:migrate
```

### 5. Launch Development Servers
Run both the client and server concurrently using Turborepo:
```bash
bun run dev
```
- **Web Client**: `http://localhost:3000`
- **Signaling & REST Server**: `http://localhost:4000`
- **API Documentation (Swagger)**: `http://localhost:4000/swagger`

---

## Production Build & Verification

To verify TypeScript types and build optimized production bundles:
```bash
# Typecheck entire workspace
bun run typecheck

# Build client and server bundles
bun run build
```

---

## License
MIT License. Built with high-performance standards by Akash & contributors.
