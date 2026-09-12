import { abuseDetectionService } from "./apps/server/src/modules/moderation/abuse-detection-service";

async function runModerationAdminTests() {
  console.log("=== Testing Moderation & Admin Modules ===");

  // 1. Test Admin Overview
  console.log("\n1. Fetching Admin Overview: GET /api/admin/overview");
  const overviewRes = await fetch("http://localhost:4000/api/admin/overview");
  console.log("Overview status:", overviewRes.status);
  const overviewData = await overviewRes.json();
  console.log("Overview stats:", overviewData.stats);
  if (!overviewData.success) throw new Error("Failed to get overview");

  // 2. Test Admin Users
  console.log("\n2. Fetching Admin Users: GET /api/admin/users");
  const usersRes = await fetch("http://localhost:4000/api/admin/users");
  const usersData = await usersRes.json();
  console.log("Found users count:", usersData.total, "Returned:", usersData.users?.length);
  const sampleUser = usersData.users?.[0];
  console.log("Sample user:", sampleUser?.name, sampleUser?.email, sampleUser?.role);

  // 3. Test Admin Meetings
  console.log("\n3. Fetching Admin Meetings: GET /api/admin/meetings");
  const meetingsRes = await fetch("http://localhost:4000/api/admin/meetings");
  const meetingsData = await meetingsRes.json();
  console.log("Found meetings count:", meetingsData.total);

  // 4. Test Admin Storage
  console.log("\n4. Fetching Admin Storage: GET /api/admin/storage");
  const storageRes = await fetch("http://localhost:4000/api/admin/storage");
  const storageData = await storageRes.json();
  console.log("Storage footprint totalBytes:", storageData.storage?.totalBytes);
  console.log("Storage buckets:", storageData.storage?.buckets);

  // 5. Test Moderation Report Submission
  console.log("\n5. Submitting Moderation Report: POST /api/moderation/reports");
  const reportPayload = {
    reporterId: sampleUser?.id || "01a095a3-1ac8-7a8b-898e-d0a85276ac3a",
    category: "SPAM",
    reason: "Automated test: excessive advertising and phishing in chat room",
  };
  const reportRes = await fetch("http://localhost:4000/api/moderation/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(reportPayload),
  });
  console.log("Report submit status:", reportRes.status);
  const reportData = await reportRes.json();
  console.log("Created report:", reportData.report?.id, reportData.report?.category);
  if (!reportData.success) throw new Error("Failed to create report: " + JSON.stringify(reportData));

  // 6. Test Fetching Moderation Queue
  console.log("\n6. Fetching Moderation Queue: GET /api/moderation/reports");
  const reportsListRes = await fetch("http://localhost:4000/api/moderation/reports");
  const reportsListData = await reportsListRes.json();
  console.log("Reports queue count:", reportsListData.count);

  // 7. Test Updating Report Status
  console.log("\n7. Updating Report Status: PATCH /api/moderation/reports/:id");
  const updateRes = await fetch(`http://localhost:4000/api/moderation/reports/${reportData.report.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status: "RESOLVED",
      moderatorId: sampleUser?.id,
    }),
  });
  const updateData = await updateRes.json();
  console.log("Updated report status:", updateData.report?.status, "resolvedAt:", updateData.report?.resolvedAt);

  // 8. Test Admin Audit Logs
  console.log("\n8. Fetching Admin Audit Logs: GET /api/admin/audit-logs");
  const auditRes = await fetch("http://localhost:4000/api/admin/audit-logs");
  const auditData = await auditRes.json();
  console.log("Audit logs count:", auditData.count);
  console.log("Latest audit log:", auditData.logs?.[0]?.action, "Target:", auditData.logs?.[0]?.targetType);

  // 9. Test Abuse & Spam Detection Engine
  console.log("\n9. Testing Abuse & Spam Detection Engine (In-memory & Service)");
  const pId = "tester-" + Math.random().toString(36).substring(2, 6);

  // Normal message
  const m1 = abuseDetectionService.checkChatMessage(pId, "Hello everyone! Great meeting.");
  console.log("Normal message check:", m1);

  // Toxic pattern
  const mToxic = abuseDetectionService.checkChatMessage(pId, "Please visit https://free-crypto.phishing.io for rewards");
  console.log("Toxic/Phishing message check:", mToxic);
  if (mToxic.allowed) throw new Error("Toxic message was not blocked!");

  // Repetitive spam
  abuseDetectionService.checkChatMessage(pId, "SPAM FLOOD");
  abuseDetectionService.checkChatMessage(pId, "SPAM FLOOD");
  const mRepeat = abuseDetectionService.checkChatMessage(pId, "SPAM FLOOD");
  console.log("Repetitive flood check:", mRepeat);
  if (mRepeat.allowed) throw new Error("Repetitive flood was not blocked!");

  // Abuse stats endpoint
  const statsRes = await fetch("http://localhost:4000/api/moderation/abuse-stats");
  const statsData = await statsRes.json();
  console.log("Abuse stats from API:", statsData.stats);

  console.log("\n>>> ALL MODERATION & ADMIN TESTS PASSED SUCCESSFULLY! <<<");
}

runModerationAdminTests().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
