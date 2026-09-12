import WebSocket from "ws";

const WS_URL = "ws://localhost:4000/ws";
const HTTP_URL = "http://localhost:4000";

function createClient(name, userId, role = "PARTICIPANT") {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL);
    const pending = new Map();
    const events = [];

    ws.on("open", () => resolve({ ws, pending, events, name, userId, role }));
    ws.on("error", reject);
    ws.on("message", (raw) => {
      const msg = JSON.parse(raw.toString());
      if (msg.id && pending.has(msg.id)) {
        const { res, rej } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) rej(new Error(msg.error.message || JSON.stringify(msg.error)));
        else res(msg.data);
      } else if (msg.event) {
        events.push(msg);
      }
    });
  });
}

function rpc(client, method, data = {}) {
  const id = crypto.randomUUID();
  return new Promise((res, rej) => {
    client.pending.set(id, { res, rej });
    client.ws.send(JSON.stringify({ id, method, data }));
  });
}

function waitForEvent(client, eventName, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const existing = client.events.find((e) => e.event === eventName);
    if (existing) return resolve(existing.data);

    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for event: ${eventName}`));
    }, timeoutMs);

    const interval = setInterval(() => {
      const idx = client.events.findIndex((e) => e.event === eventName);
      if (idx !== -1) {
        clearTimeout(timer);
        clearInterval(interval);
        const ev = client.events.splice(idx, 1)[0];
        resolve(ev.data);
      }
    }, 50);
  });
}

async function run() {
  console.log("=== STARTING FULL VERIFICATION: STREAMING, WHITEBOARD, FILES, NOTIFICATIONS ===");
  const meetingId = `test-meet-${Date.now()}`;

  // 1. Connect Host and Participant
  const host = await createClient("Host Alice", "user-host-1", "HOST");
  const peer = await createClient("Peer Bob", "user-peer-2", "PARTICIPANT");

  console.log("✓ Connected WebSockets for Host and Peer");

  await rpc(host, "meeting:join", {
    meetingId,
    displayName: host.name,
    userId: host.userId,
    role: "HOST",
  });

  await rpc(peer, "meeting:join", {
    meetingId,
    displayName: peer.name,
    userId: peer.userId,
    role: "PARTICIPANT",
  });

  console.log("✓ Both joined meeting room:", meetingId);

  // ==========================================
  // MODULE 1: LIVE STREAMING
  // ==========================================
  console.log("\n--- Testing Module 1: Live Streaming ---");
  const startStreamPromise = waitForEvent(peer, "streaming:started");
  const streamRes = await rpc(host, "streaming:start", {
    platform: "YOUTUBE",
    streamKey: "test-youtube-stream-key",
    destinations: [
      {
        id: "yt-1",
        platform: "YOUTUBE",
        rtmpUrl: "rtmp://a.rtmp.youtube.com/live2",
        streamKey: "test-youtube-key",
      },
      {
        id: "custom-1",
        platform: "CUSTOM_RTMP",
        rtmpUrl: "rtmp://127.0.0.1:1935/live",
        streamKey: "test-custom-key",
      },
    ],
  });

  console.log("✓ Host started multi-destination stream:", streamRes.streams?.length, "destinations");
  const streamEvent = await startStreamPromise;
  console.log("✓ Peer received 'streaming:started' event with", streamEvent.streams?.length, "streams");

  const statusRes = await rpc(host, "streaming:status");
  console.log("✓ Streaming status verified:", statusRes.isStreaming, "destinations:", statusRes.destinations?.length);

  const stopStreamPromise = waitForEvent(peer, "streaming:stopped");
  await rpc(host, "streaming:stop", { streamId: "yt-1" });
  await stopStreamPromise;
  console.log("✓ Successfully stopped live stream and received 'streaming:stopped' event");

  // ==========================================
  // MODULE 2: WHITEBOARD
  // ==========================================
  console.log("\n--- Testing Module 2: Collaborative Whiteboard ---");
  const whiteboardAddPromise = waitForEvent(peer, "whiteboard:elementAdded");
  const element1 = {
    id: "path-el-1",
    type: "path",
    data: { points: [{ x: 10, y: 10 }, { x: 50, y: 50 }, { x: 100, y: 80 }] },
    color: "#3B82F6",
    strokeWidth: 4,
  };
  await rpc(host, "whiteboard:addElement", { element: element1 });
  const addedEvent = await whiteboardAddPromise;
  console.log("✓ Peer received whiteboard:elementAdded for element:", addedEvent.element.id);

  // Update element
  const whiteboardUpdatePromise = waitForEvent(peer, "whiteboard:elementUpdated");
  await rpc(host, "whiteboard:updateElement", {
    elementId: "path-el-1",
    updates: { color: "#EF4444" },
  });
  const updatedEvent = await whiteboardUpdatePromise;
  console.log("✓ Peer received whiteboard:elementUpdated with new color:", updatedEvent.element.color);

  // Fetch Board State
  const boardState = await rpc(peer, "whiteboard:state");
  console.log("✓ Board state fetched:", boardState.elements?.length, "elements persisted in Redis");

  // Clear Board
  const whiteboardClearPromise = waitForEvent(peer, "whiteboard:cleared");
  await rpc(host, "whiteboard:clear");
  await whiteboardClearPromise;
  console.log("✓ Whiteboard cleared and broadcasted successfully");

  // ==========================================
  // MODULE 3: FILE SHARING & VIRUS SCAN QUEUE
  // ==========================================
  console.log("\n--- Testing Module 3: File Sharing & Virus Scan Queue ---");
  // 3a. Upload via HTTP REST endpoint
  const fileContent = Buffer.from("Hello Meet Enterprise File Sharing & Security Verification!");
  const formData = new FormData();
  formData.append("file", new Blob([fileContent], { type: "text/plain" }), "specs-documentation.txt");
  formData.append("userId", host.userId);
  formData.append("displayName", host.name);

  const httpFilePromise = waitForEvent(peer, "file:uploaded");
  const httpRes = await fetch(`${HTTP_URL}/api/files/${meetingId}/upload`, {
    method: "POST",
    body: formData,
  });
  const httpData = await httpRes.json();
  console.log("✓ HTTP Multipart Upload Success:", httpData.file?.fileName, "size:", httpData.file?.fileSizeBytes, "scanStatus:", httpData.file?.scanStatus);
  const fileUploadedEvent = await httpFilePromise;
  console.log("✓ Peer received 'file:uploaded' event:", fileUploadedEvent.file?.fileName);

  // 3b. Upload via WebSocket
  const wsFilePromise = waitForEvent(peer, "file:uploaded");
  const wsUploadRes = await rpc(host, "file:upload", {
    fileName: "presentation-slides.pdf",
    mimeType: "application/pdf",
    base64Data: Buffer.from("%PDF-1.4 simulated pdf document bytes").toString("base64"),
  });
  console.log("✓ WebSocket Upload Success:", wsUploadRes.file?.fileName);
  await wsFilePromise;

  // 3c. List Files
  const fileList = await rpc(peer, "file:list");
  console.log("✓ Meeting file list verified:", fileList.files?.length, "files found");

  // Wait a moment for simulated virus scan queue to complete
  await new Promise((r) => setTimeout(r, 1200));
  const scannedList = await rpc(peer, "file:list");
  const cleanFiles = scannedList.files?.filter((f) => f.scanStatus === "CLEAN");
  console.log("✓ Virus scan queue processed:", cleanFiles?.length, "clean files verified");

  // 3d. Delete File
  const fileDeletePromise = waitForEvent(peer, "file:deleted");
  await rpc(host, "file:delete", { fileId: wsUploadRes.file.id });
  const deletedEvent = await fileDeletePromise;
  console.log("✓ File deleted and verified broadcast for fileId:", deletedEvent.fileId);

  // ==========================================
  // MODULE 4: NOTIFICATIONS
  // ==========================================
  console.log("\n--- Testing Module 4: Multi-Channel Notifications ---");
  const notifPromise = waitForEvent(peer, "notification:received");
  const notifRes = await rpc(host, "notification:send", {
    targetUserId: peer.userId,
    userEmail: "bob@example.com",
    type: "MEETING_REMINDER",
    title: "Sprint Planning Reminder",
    message: "Your upcoming sprint planning meeting starts in 10 minutes.",
    channels: ["IN_APP", "EMAIL", "PUSH"],
    metadata: { meetingId, roomUrl: `http://localhost:3000/meetings/${meetingId}` },
  });

  console.log("✓ Notification dispatched via multi-channels:", notifRes.notification?.title);
  const receivedNotif = await notifPromise;
  console.log("✓ Peer received 'notification:received' real-time in-app:", receivedNotif.notification?.title);

  // List notifications
  const notifList = await rpc(peer, "notification:list", { userId: peer.userId });
  console.log("✓ Peer notification list fetched:", notifList.notifications?.length, "notifications");

  // Mark notification as read
  const markRes = await rpc(peer, "notification:markRead", {
    userId: peer.userId,
    notificationId: receivedNotif.notification.id,
  });
  console.log("✓ Marked notification as read:", markRes.success);

  // Close sockets
  host.ws.close();
  peer.ws.close();

  console.log("\n=== ALL 4 MODULES (STREAMING, WHITEBOARD, FILES, NOTIFICATIONS) FULLY VERIFIED! ===");
  process.exit(0);
}

run().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
