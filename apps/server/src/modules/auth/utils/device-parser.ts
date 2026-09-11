export function parseDeviceInfo(userAgent?: string | null) {
  if (!userAgent) return { deviceName: "Unknown Device", deviceType: "Desktop" };
  const ua = userAgent.toLowerCase();
  let deviceType = "Desktop";
  let deviceName = "Web Browser";

  if (/mobile|android|iphone|ipad|phone/i.test(ua)) {
    deviceType = /tablet|ipad/i.test(ua) ? "Tablet" : "Mobile";
  }

  if (ua.includes("windows")) deviceName = "Windows PC";
  else if (ua.includes("macintosh") || ua.includes("mac os")) deviceName = "Mac";
  else if (ua.includes("linux")) deviceName = "Linux PC";
  else if (ua.includes("iphone")) deviceName = "iPhone";
  else if (ua.includes("ipad")) deviceName = "iPad";
  else if (ua.includes("android")) deviceName = "Android Device";

  return { deviceName, deviceType };
}
