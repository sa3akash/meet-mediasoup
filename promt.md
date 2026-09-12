নিচের Prompt টি AI Coding Agent (Claude Code, Cursor, Gemini CLI, Codex, Windsurf, Roo Code, Cline ইত্যাদি) এর জন্য তৈরি করা হয়েছে যাতে এটি **Google Meet / Zoom / Microsoft Teams level production-ready video conferencing application** তৈরি করতে পারে।

Build a production-ready Google Meet style video conferencing platform using:

Frontend:

* Next.js Latest App Router ( Complete app server side rendering )
* React 19
* TypeScript
* TailwindCSS v4
* shadcn/ui
* Zustand
* TanStack Query
* React Hook Form + Zod
* WebSocket - not Socekt.io
* WebRTC

Backend:

* ElysiaJS (Bun Runtime)
* TypeScript
* PostgreSQL
* Drizzle ORM
* Native Websocket
* Mediasoup
* Redis
* BullMQ
* S3/MinIO
* Nodemailer
* OpenTelemetry
* Pino Logger

Architecture:

* Modular Monolith
* Domain Driven Design
* Feature Based Modules
* Clean Architecture
* Dependency Injection
* Event Driven Internal Architecture
* CQRS Ready
* Fully Type Safe End-To-End

The application must be structured as:

apps/
├── client
├── server

packages/
├── shared-types
├── shared-validation
├── shared-utils
├── shared-events
├── shared-config

---

## CORE MODULES

1. Authentication Module

Features:

* Email signup
* Email verification
* Login
* Logout
* Refresh token rotation
* Session management
* Multiple devices
* Remember me
* Forgot password
* Reset password
* Change password
* Account security page
* Device history
* Passkeys (WebAuthn)
* Google Login
* GitHub Login
* Microsoft Login
* Role Based Access Control

Roles:

* USER
* MODERATOR
* ADMIN
* SUPER_ADMIN

---

2. User Module

---

Features:

* User profile
* Avatar upload
* Cover image
* Bio
* Timezone
* Language
* Theme
* Notification preferences
* Presence status

Status:

* Online
* Away
* Busy
* Offline

---

3. Meeting Module

---

Features:

* Instant Meeting
* Scheduled Meeting
* Recurring Meeting
* Personal Meeting Room
* Meeting Templates

Meeting Types:

* Public
* Private
* Invite Only

Meeting Settings:

* Waiting Room
* Auto Recording
* Mute On Join
* Disable Camera On Join
* Disable Screen Share
* Disable Chat
* Disable File Share
* Disable Reactions
* Lock Meeting
* End Meeting For All

---

4. Mediasoup WebRTC Module

---

Create scalable mediasoup architecture.

Requirements:

* Multiple workers
* Multiple routers
* Worker monitoring
* Router balancing
* Producer transport
* Consumer transport
* ICE Restart
* Simulcast
* SVC
* VP8
* VP9
* H264
* AV1 Ready

Audio Features:

* Noise suppression
* Echo cancellation
* Voice activity detection
* Audio level observer
* Active speaker detection

Video Features:

* Multi quality streams
* Adaptive bitrate
* Dynamic layer switching
* Bandwidth estimation

Connection Recovery:

* Reconnection
* ICE restart
* Network change recovery
* Device change recovery

---

5. Meeting Room Module

---

Features:

* Join via link
* Join via code
* Waiting room
* Host approval
* Raise hand
* Polls
* Reactions
* Emojis
* Breakout rooms
* Co-hosts
* Guest users

Host Controls:

* Mute participant
* Remove participant
* Pin participant
* Spotlight participant
* Disable camera
* Disable mic
* Lock room
* Promote participant

---

6. Video Layout Module

---

Layouts:

* Grid View
* Speaker View
* Spotlight View
* Sidebar View
* Presentation View

Features:

* Active speaker auto focus
* Pinned participants
* Responsive layouts
* Virtualized rendering
* Performance optimized

---

7. Screen Sharing Module

---

Features:

* Entire Screen
* Window Share
* Tab Share
* Multiple share sessions
* Share system audio
* Presenter controls
* Remote presentation mode

---

8. Chat Module

---

Meeting Chat Features:

* Real-time messaging
* Message reactions
* Replies
* Mentions
* File sharing
* Image sharing
* Link previews
* Moderation

Storage:

* Persist messages
* Search messages
* Export chat

---

9. Recording Module

---

Recording Types:

* Cloud Recording
* Local Recording

Features:

* Audio only
* Video recording
* Screen recording
* Combined recording

Pipeline:

* Mediasoup recording consumer
* FFmpeg processing
* HLS generation
* MP4 export
* Recording storage in S3

---

10. Live Streaming Module

---

Features:

* Stream meeting to YouTube
* Stream meeting to Facebook
* Stream meeting to RTMP endpoints
* Multi destination streaming

---

11. Whiteboard Module

---

Features:

* Draw
* Shapes
* Sticky notes
* Text
* Collaborative editing
* Real-time synchronization

---

12. File Sharing Module

---

Features:

* Upload documents
* Upload images
* Upload videos
* Drag and drop
* S3 uploads
* Virus scan queue
* File previews

---

13. Notification Module

---

Channels:

* Email
* In App
* Push Notification

Events:

* Meeting reminder
* Invite accepted
* Invite declined
* Recording ready
* New message

---

14. Calendar Module

---

Features:

* Schedule meetings
* Recurring meetings
* Timezone support
* Google Calendar sync
* Outlook Calendar sync
* ICS export

---

15. Analytics Module

---

Track:

* Meeting duration
* Participant count
* Device types
* Browser types
* Quality metrics
* Network metrics
* Recording statistics

---

16. Moderation Module

---

Features:

* User reports
* Meeting reports
* Abuse detection
* Spam detection
* Participant removal
* Ban users

---

17. Admin Module

---

Dashboard:

* Users
* Meetings
* Recordings
* Storage
* Analytics
* Moderation
* Audit logs

---

## DATABASE DESIGN

Create Drizzle schemas for:

users
sessions
accounts
passkeys
meetings
meeting_settings
meeting_participants
meeting_invites
meeting_waiting_room
meeting_chat_messages
meeting_chat_reactions
meeting_recordings
meeting_streams
meeting_polls
poll_votes
breakout_rooms
breakout_participants
whiteboards
whiteboard_elements
notifications
notification_preferences
file_uploads
analytics_events
audit_logs
reports
user_presence

Use:

* UUIDv7
* CreatedAt
* UpdatedAt
* Soft Delete
* Composite Indexes
* Partial Indexes
* Full Text Search

---

## SOCKET MODULE

Socket Events:

meeting
meeting

participant
participant

producer
producer

consumer
consumer

chat
chat

reaction

poll
poll

screen
screen

recording
recording

presence

---

## REDIS MODULE

Use Redis for:

* Presence
* Rate limiting
* Session cache
* WebRTC state
* Socket scaling
* Temporary room state

Never use Map or Set for production state.

---

## SECURITY

Implement:

* CSRF Protection
* XSS Protection
* Helmet
* Rate Limiting
* Device Tracking
* Session Revocation
* Secure Cookies
* IP Logging
* Audit Logging
* Encryption At Rest
* Encryption In Transit

---

## OBSERVABILITY

Implement:

* OpenTelemetry
* Prometheus Metrics
* Grafana Dashboards
* Pino Logs
* Request Tracing
* Error Tracking
* Health Checks
* Readiness Checks
* Liveness Checks

---

## NEXTJS CLIENT REQUIREMENTS

Use:

* Server Components First
* Server Actions
* Streaming SSR
* Partial Prerendering
* SEO Friendly
* Accessibility First
* Responsive Design

Create reusable modules:

features/
components/
hooks/
stores/
services/
providers/
types/

Avoid large files.

Maximum:

* Component < 300 lines
* Hook < 200 lines
* Service < 300 lines

Split aggressively.

---

## PERFORMANCE

Support:

* 100,000+ registered users
* Thousands of concurrent meetings
* Hundreds of participants per meeting
* Adaptive quality
* Horizontal scaling

---

## DELIVERABLES

Generate:

1. Folder structure
2. Database schema
3. Drizzle schema files
4. API design
5. Socket architecture
6. Mediasoup architecture
7. Redis architecture
8. Module boundaries
9. Event architecture
10. Frontend architecture
11. Backend architecture
12. Deployment architecture
13. Docker setup
14. Docker Compose
15. CI/CD pipeline
16. Production environment variables
17. Security checklist
18. Complete implementation roadmap

Everything must be production-ready, scalable, maintainable, reusable, fully typed, and enterprise-grade.

এই Prompt টি Google Meet clone-এর জন্য খুবই advanced, কিন্তু আরও enterprise level করতে চাইলে TURN/STUN cluster, SFU federation, E2EE (Insertable Streams), AI Meeting Assistant, Live Captions, Translation, Meeting Notes, Webinar Mode (10k+ viewers), SIP/PSTN Calling, Contact Directory, Organization/Workspace Module, Team Spaces, Meeting Transcription, AI Summary, Recording Editor, Virtual Background, Background Blur, Noise Removal AI, Waiting Room AI Moderation, Attendance Tracking, LMS Integration, SCIM, SSO (SAML/OIDC), Multi-Tenant SaaS Architecture-ও যোগ করা উচিত।
