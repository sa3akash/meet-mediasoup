# Client Architecture Modularization & Responsive SEO Plan

## Overview
This plan transforms the `apps/client` frontend into a modular, production-grade architecture adhering to:
1. **Strict Line Count Constraint**: No file exceeding 150–200 lines (target ≤ 140 lines for maximum maintainability).
2. **Dedicated Domain Hooks & Context Providers**: Centralized meeting context, responsive viewport detection, media device selection, chat panel logic, whiteboard tools, and decomposed Mediasoup sub-hooks.
3. **Atomic Reusable UI Components**: Responsive drawer modals, semantic page headers, KPI stat cards, empty states, and status badges.
4. **Fluid Mobile & Tablet Responsiveness**: Bottom sheet drawers for mobile, adaptive grid layouts, touch targets, and responsive drawer sidebars.
5. **Server-Rendered & SEO-Optimized Pages**: Server Components with `Metadata` and dynamic `generateMetadata`, OpenGraph tags, and semantic HTML structure (`<main>`, `<header>`, `<h1>`).

---

## User Review Required

> [!IMPORTANT]
> - **Zero Regression in WebRTC & Signaling**: The decomposition of [use-mediasoup.ts](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/hooks/use-mediasoup.ts) and [meeting-room-client.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/features/meeting/meeting-room-client.tsx) retains 100% of existing event handlers, WebRTC peer connection pipelines, and state stores.
> - **Backward-Compatible Public Interfaces**: The exported function signatures and props of all feature components remain identical so callers and routes require no breaking changes.
> - **Strict 150-200 Line Constraint**: In addition to the primary targets, auxiliary components over 200 lines (such as `pre-join-lobby.tsx`, `files-panel.tsx`, `host-controls-modal.tsx`, `live-streaming-modal.tsx`, `recording-modal.tsx`, `breakout-rooms-modal.tsx`, and `meetings/page.tsx`) will be split into concise sub-components.

---

## Proposed Changes

### Phase 1: Reusable Common Components & Utility Hooks

#### [NEW] [use-responsive.ts](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/hooks/use-responsive.ts)
- Custom hook listening to media queries to return `{ isMobile, isTablet, isDesktop, hasTouch, orientation }` (≤ 75 lines).

#### [NEW] [use-media-devices.ts](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/hooks/use-media-devices.ts)
- Custom hook enumerating audio input, audio output, and video input devices, monitoring device plug/unplug events, and exposing device change handlers (≤ 110 lines).

#### [NEW] [page-header.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/components/common/page-header.tsx)
- Reusable semantic `<header>` component rendering `<h1>`, subtitle, optional status pills, navigation links, and action buttons (≤ 80 lines).

#### [NEW] [stat-card.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/components/common/stat-card.tsx)
- Reusable KPI card with icon, metric value, trend indicator (positive/negative percentage), and contextual badge (≤ 75 lines).

#### [NEW] [empty-state.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/components/common/empty-state.tsx)
- Reusable empty state view with illustration icon, title, description, and primary/secondary CTA buttons (≤ 70 lines).

#### [NEW] [responsive-drawer-modal.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/components/common/responsive-drawer-modal.tsx)
- Responsive dialog that displays as a sliding bottom sheet drawer on mobile viewports (< 768px) and a centered glassmorphism dialog on tablet/desktop viewports (≤ 90 lines).

#### [NEW] [status-pill.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/components/common/status-pill.tsx)
- Semantic color-coded pill badge for meeting states, user roles (Host, Co-Host, Participant), stream health, and recording indicators (≤ 60 lines).

#### [NEW] [session.ts](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/lib/session.ts)
- Shared server-side `getSessionUser()` helper to deduplicate auth fetching across all page routes and server actions (≤ 45 lines).

---

### Phase 2: Domain Contexts & Specialized Domain Hooks

#### [NEW] [meeting-context.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/providers/meeting-context.tsx)
- React Context providing meeting slug, room state, active sidebar panel (`chat`, `participants`, `polls`, `whiteboard`, `files`), permissions, and viewport responsiveness (≤ 120 lines).

#### [NEW] [use-chat-panel.ts](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/hooks/use-chat-panel.ts)
- Custom hook managing chat draft state, reply threads, mention detection, file uploads, and reactions (≤ 120 lines).

#### [NEW] [use-whiteboard-tools.ts](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/hooks/use-whiteboard-tools.ts)
- Custom hook managing drawing tool selection, color picker, stroke widths, undo/redo history, and shape coordinate calculations (≤ 125 lines).

---

### Phase 3: Mediasoup Hook Modularization (≤ 140 lines per file)

Decompose [src/hooks/use-mediasoup.ts](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/hooks/use-mediasoup.ts) (1,288 lines) into dedicated sub-hooks:

- #### [NEW] [mediasoup-types.ts](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/hooks/mediasoup/mediasoup-types.ts)
  - Common interfaces (`MediaForcedEvent`, `ScreenShareOptions`, `BreakoutRoomInfo`, `BreakoutStateEvent`, `PollData`, `UseMediasoupCallbacks`, `RTC_CONFIG`, `WS_URL`) (≤ 130 lines).
- #### [NEW] [use-mediasoup-device.ts](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/hooks/mediasoup/use-mediasoup-device.ts)
  - Device initialization, loading RTP capabilities, local media stream acquisition, and permission handling (≤ 130 lines).
- #### [NEW] [use-mediasoup-transports.ts](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/hooks/mediasoup/use-mediasoup-transports.ts)
  - WebRTC peer connection creation, ICE candidate handling, send/receive transport connection lifecycle (≤ 140 lines).
- #### [NEW] [use-mediasoup-producers.ts](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/hooks/mediasoup/use-mediasoup-producers.ts)
  - Audio, video, and screen share producer controls (mute/unmute, pause/resume, replaceTrack, screen audio) (≤ 140 lines).
- #### [NEW] [use-mediasoup-consumers.ts](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/hooks/mediasoup/use-mediasoup-consumers.ts)
  - Remote media consumer tracking, stream binding, and audio/video track association (≤ 130 lines).
- #### [NEW] [use-mediasoup-actions.ts](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/hooks/mediasoup/use-mediasoup-actions.ts)
  - Domain RPC actions: moderation (kick, mute all, spotlight), polls, breakout rooms, chat, recordings, live stream, whiteboard, files, notifications (≤ 150 lines).
- #### [MODIFY] [use-mediasoup.ts](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/hooks/use-mediasoup.ts)
  - Clean coordinator hook orchestrating the sub-hooks, socket message router, and returning the exact same public API (≤ 140 lines).

---

### Phase 4: Feature Components Decomposition (≤ 140 lines per file)

#### Admin Console Decomposition (903 lines -> 8 modular files)
- #### [NEW] [admin-types.ts](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/features/admin/admin-types.ts)
- #### [NEW] [admin-nav-tabs.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/features/admin/components/admin-nav-tabs.tsx)
- #### [NEW] [admin-overview-tab.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/features/admin/components/admin-overview-tab.tsx)
- #### [NEW] [admin-users-tab.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/features/admin/components/admin-users-tab.tsx)
- #### [NEW] [admin-meetings-tab.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/features/admin/components/admin-meetings-tab.tsx)
- #### [NEW] [admin-recordings-tab.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/features/admin/components/admin-recordings-tab.tsx)
- #### [NEW] [admin-storage-tab.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/features/admin/components/admin-storage-tab.tsx)
- #### [NEW] [admin-moderation-tab.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/features/admin/components/admin-moderation-tab.tsx)
- #### [NEW] [admin-audit-tab.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/features/admin/components/admin-audit-tab.tsx)
- #### [MODIFY] [admin-console.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/features/admin/admin-console.tsx) (≤ 115 lines)

#### Meeting Room Client Decomposition (945 lines -> 4 modular files)
- #### [NEW] [meeting-modals.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/features/meeting/components/meeting-modals.tsx) (modal dialogs container ≤ 130 lines)
- #### [NEW] [meeting-overlays.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/features/meeting/components/meeting-overlays.tsx) (broadcast toasts, media force prompts, meeting ended modal ≤ 110 lines)
- #### [NEW] [meeting-sidebars.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/features/meeting/components/meeting-sidebars.tsx) (responsive sidebar drawer container ≤ 110 lines)
- #### [MODIFY] [meeting-room-client.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/features/meeting/meeting-room-client.tsx) (coordinator shell ≤ 140 lines)

#### Chat Panel Decomposition (784 lines -> 4 modular files)
- #### [NEW] [chat-types.ts](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/features/chat/chat-types.ts)
- #### [NEW] [chat-header.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/features/chat/components/chat-header.tsx) (≤ 80 lines)
- #### [NEW] [chat-message-item.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/features/chat/components/chat-message-item.tsx) (≤ 135 lines)
- #### [NEW] [chat-input-bar.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/features/chat/components/chat-input-bar.tsx) (≤ 135 lines)
- #### [MODIFY] [chat-panel.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/features/chat/chat-panel.tsx) (panel coordinator ≤ 115 lines)

#### Meeting Grid Decomposition (703 lines -> 3 modular files)
- #### [NEW] [presentation-stage.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/features/meeting/components/presentation-stage.tsx) (≤ 140 lines)
- #### [NEW] [grid-pagination.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/features/meeting/components/grid-pagination.tsx) (≤ 80 lines)
- #### [MODIFY] [meeting-grid.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/features/meeting/meeting-grid.tsx) (grid layout calculator & tile coordinator ≤ 130 lines)

#### Whiteboard Modal Decomposition (597 lines -> 3 modular files)
- #### [NEW] [whiteboard-types.ts](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/features/whiteboard/whiteboard-types.ts)
- #### [NEW] [whiteboard-toolbar.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/features/whiteboard/components/whiteboard-toolbar.tsx) (≤ 120 lines)
- #### [NEW] [whiteboard-canvas.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/features/whiteboard/components/whiteboard-canvas.tsx) (≤ 140 lines)
- #### [MODIFY] [whiteboard-modal.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/features/whiteboard/whiteboard-modal.tsx) (≤ 95 lines)

#### Polls Panel Decomposition (559 lines -> 4 modular files)
- #### [NEW] [poll-card.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/features/meeting/components/poll-card.tsx) (≤ 125 lines)
- #### [NEW] [create-poll-form.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/features/meeting/components/create-poll-form.tsx) (≤ 120 lines)
- #### [NEW] [breakout-activity-tab.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/features/meeting/components/breakout-activity-tab.tsx) (≤ 110 lines)
- #### [MODIFY] [polls-panel.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/features/meeting/polls-panel.tsx) (≤ 100 lines)

#### Analytics Dashboard Decomposition (451 lines -> 5 modular files)
- #### [NEW] [analytics-kpis.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/features/analytics/components/analytics-kpis.tsx) (≤ 110 lines)
- #### [NEW] [analytics-devices-chart.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/features/analytics/components/analytics-devices-chart.tsx) (≤ 110 lines)
- #### [NEW] [analytics-network-card.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/features/analytics/components/analytics-network-card.tsx) (≤ 105 lines)
- #### [NEW] [analytics-meetings-table.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/features/analytics/components/analytics-meetings-table.tsx) (≤ 115 lines)
- #### [MODIFY] [analytics-dashboard.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/features/analytics/analytics-dashboard.tsx) (≤ 95 lines)

#### Calendar View Decomposition (447 lines -> 4 modular files)
- #### [NEW] [calendar-types.ts](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/features/calendar/calendar-types.ts)
- #### [NEW] [calendar-nav-bar.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/features/calendar/components/calendar-nav-bar.tsx) (≤ 100 lines)
- #### [NEW] [calendar-month-grid.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/features/calendar/components/calendar-month-grid.tsx) (≤ 135 lines)
- #### [NEW] [calendar-event-dialog.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/features/calendar/components/calendar-event-dialog.tsx) (≤ 125 lines)
- #### [MODIFY] [calendar-view.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/features/calendar/calendar-view.tsx) (≤ 95 lines)

#### Schedule Meeting Form Decomposition (391 lines -> 4 modular files)
- #### [NEW] [meeting-basic-info.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/features/meetings/components/meeting-basic-info.tsx) (≤ 110 lines)
- #### [NEW] [meeting-recurrence-picker.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/features/meetings/components/meeting-recurrence-picker.tsx) (≤ 105 lines)
- #### [NEW] [meeting-security-toggles.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/features/meetings/components/meeting-security-toggles.tsx) (≤ 110 lines)
- #### [NEW] [meeting-success-banner.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/features/meetings/components/meeting-success-banner.tsx) (≤ 90 lines)
- #### [MODIFY] [schedule-meeting-form.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/features/meetings/schedule-meeting-form.tsx) (≤ 110 lines)

#### Participants Panel Decomposition (350 lines -> 3 modular files)
- #### [NEW] [participant-list-item.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/features/meeting/components/participant-list-item.tsx) (≤ 120 lines)
- #### [NEW] [waiting-room-section.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/features/meeting/components/waiting-room-section.tsx) (≤ 105 lines)
- #### [MODIFY] [participants-panel.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/features/meeting/participants-panel.tsx) (≤ 110 lines)

#### Remaining Feature Cleanups (>150 lines)
- #### [MODIFY] [pre-join-lobby.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/features/lobby/pre-join-lobby.tsx) -> Extract `lobby-media-preview.tsx` and `lobby-device-settings.tsx`
- #### [MODIFY] [files-panel.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/features/files/files-panel.tsx) -> Extract `file-item.tsx` and `file-upload-dropzone.tsx`
- #### [MODIFY] [host-controls-modal.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/features/meetings/host-controls-modal.tsx) -> Extract `host-permissions-tab.tsx` and `host-security-tab.tsx`
- #### [MODIFY] [live-streaming-modal.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/features/streaming/live-streaming-modal.tsx) -> Extract `stream-destination-form.tsx` and `stream-status-card.tsx`
- #### [MODIFY] [recording-modal.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/features/recording/recording-modal.tsx) -> Extract `recording-options-card.tsx`
- #### [MODIFY] [breakout-rooms-modal.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/features/meeting/breakout-rooms-modal.tsx) -> Extract `breakout-room-row.tsx`
- #### [MODIFY] [control-bar.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/features/meeting/control-bar.tsx) -> Extract `more-actions-menu.tsx`
- #### [MODIFY] [meetings-list.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/features/meetings/meetings-list.tsx) -> Extract `meeting-list-card.tsx`

---

### Phase 5: SEO, Semantic HTML & Server Page Enhancements

- #### [NEW] [dashboard-nav.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/components/common/dashboard-nav.tsx)
  - Reusable, responsive dashboard navigation header component (< 75 lines).
- #### [MODIFY] [src/app/(dashboard)/admin/page.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/app/(dashboard)/admin/page.tsx)
  - Add `export const metadata: Metadata = { title: "Admin Console | Meet", ... }`, use `<main>` and `PageHeader` (≤ 70 lines).
- #### [MODIFY] [src/app/(dashboard)/analytics/page.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/app/(dashboard)/analytics/page.tsx)
  - Add `export const metadata: Metadata = { title: "Analytics & Telemetry | Meet", ... }`, use `<main>` and `PageHeader` (≤ 70 lines).
- #### [MODIFY] [src/app/(dashboard)/calendar/page.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/app/(dashboard)/calendar/page.tsx)
  - Add `export const metadata: Metadata = { title: "Calendar & Schedule | Meet", ... }`, use `<main>` and `PageHeader` (≤ 70 lines).
- #### [MODIFY] [src/app/(dashboard)/meetings/page.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/app/(dashboard)/meetings/page.tsx)
  - Refactor from 224 lines to ≤ 80 lines using `PageHeader`, `DashboardNav`, and extracted `meeting-templates-section.tsx`.
- #### [MODIFY] [src/app/meeting/[slug]/page.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/app/meeting/[slug]/page.tsx)
  - Enhanced OpenGraph and semantic HTML tags.
- #### [MODIFY] [src/app/page.tsx](file:///c:/Users/SHAKIL/Desktop/code/meet/apps/client/src/app/page.tsx)
  - Refactor landing page from 177 lines to ≤ 95 lines using extracted `home-nav.tsx`, `home-hero.tsx`, and `home-footer.tsx`.

---

## Verification Plan

### Automated Verification
1. **Full Typecheck**:
   ```powershell
   bun run typecheck
   ```
   Must pass with 0 errors across the entire codebase.
2. **Line Count Enforcement Check**:
   Run an automated PowerShell script scanning all `.ts` and `.tsx` application files in `src/` (excluding third-party shadcn `src/components/ui/*` primitives):
   ```powershell
   Get-ChildItem -Recurse -Include *.ts,*.tsx -Path src -Exclude ui | ForEach-Object {
     $lines = (Get-Content $_.FullName | Measure-Object -Line).Lines
     if ($lines -gt 150) {
       [PSCustomObject]@{ File = $_.Name; Lines = $lines; Path = $_.FullName }
     }
   }
   ```
   Must report 0 files over 150-180 lines!
3. **Next.js Production Build**:
   ```powershell
   bun run build
   ```
   Must compile cleanly without SSR hydration or bundle errors.

### Manual / Browser Verification
- Load pages (`/`, `/meetings`, `/calendar`, `/analytics`, `/admin`, `/meeting/test-room`) to verify:
  - Page title, meta descriptions, and semantic headings (`<h1>`) are active.
  - Responsive layouts dynamically adapt: drawers on mobile (<768px), modals on desktop.
  - Video grid, chat, polls, whiteboard, and admin tabs operate smoothly without regressions.
