// Verification test for chat messages & media state change
const ws1 = new WebSocket("ws://localhost:4000/ws");
const ws2 = new WebSocket("ws://localhost:4000/ws");

function waitForOpen(ws) {
  return new Promise((resolve) => ws.onopen = resolve);
}

function sendRpc(ws, method, data) {
  return new Promise((resolve) => {
    const id = Math.random().toString();
    const handler = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === id) {
        ws.removeEventListener("message", handler);
        resolve(msg.data);
      }
    };
    ws.addEventListener("message", handler);
    ws.send(JSON.stringify({ id, method, data }));
  });
}

async function run() {
  console.log("Connecting ws1 and ws2...");
  await Promise.all([waitForOpen(ws1), waitForOpen(ws2)]);
  console.log("Connected!");

  const room = "test-verification-room-" + Date.now();

  const user1 = await sendRpc(ws1, "meeting:join", {
    meetingId: room,
    displayName: "Alice",
    role: "HOST",
  });
  console.log("User 1 joined:", user1.participantId);

  // Set up listeners for User 2
  const receivedMessages = [];
  const receivedMediaChanges = [];

  ws2.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.event === "chat:message") {
      receivedMessages.push(msg.data);
    }
    if (msg.event === "participant:mediaStateChanged") {
      receivedMediaChanges.push(msg.data);
    }
  };

  const user2 = await sendRpc(ws2, "meeting:join", {
    meetingId: room,
    displayName: "Bob",
    role: "PARTICIPANT",
  });
  console.log("User 2 joined:", user2.participantId);

  // User 1 sends a chat message
  console.log("User 1 sending chat message...");
  const chatRes = await sendRpc(ws1, "chat:send", {
    content: "Hello Bob! How are you?",
  });
  console.log("Chat sent response:", chatRes);

  // User 1 turns off camera
  console.log("User 1 turning off camera...");
  await sendRpc(ws1, "participant:updateMediaState", {
    isVideoMuted: true,
  });

  // User 1 raises hand
  console.log("User 1 raising hand...");
  await sendRpc(ws1, "participant:updateMediaState", {
    isHandRaised: true,
  });

  // Wait 1 second for network propagation
  await new Promise((r) => setTimeout(r, 1000));

  console.log("=== RESULTS ===");
  console.log("User 2 received chat messages:", receivedMessages);
  console.log("User 2 received media changes:", receivedMediaChanges);

  const passed =
    receivedMessages.length === 1 &&
    receivedMessages[0].content === "Hello Bob! How are you?" &&
    receivedMessages[0].senderName === "Alice" &&
    receivedMediaChanges.length === 2 &&
    receivedMediaChanges[0].isVideoMuted === true &&
    receivedMediaChanges[1].isHandRaised === true;

  if (passed) {
    console.log("SUCCESS: All in-call messaging, camera off, and hand raise features verified!");
  } else {
    console.error("FAILURE: Messages or media changes were missing!");
  }

  ws1.close();
  ws2.close();
  process.exit(passed ? 0 : 1);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
