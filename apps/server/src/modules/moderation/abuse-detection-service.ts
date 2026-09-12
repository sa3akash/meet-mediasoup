export interface MessageCheckResult {
  allowed: boolean;
  reason?: string;
  isSpam?: boolean;
  isAbuse?: boolean;
}

export class AbuseDetectionService {
  // Sliding window timestamp tracker for participants: Map<participantId, number[]>
  private messageTimestamps = new Map<string, number[]>();
  // Last message cache to detect identical repetitive flood
  private lastMessages = new Map<string, { text: string; count: number }>();

  // Thresholds
  private readonly MAX_MESSAGES_IN_WINDOW = 5; // max 5 messages in 3 seconds
  private readonly WINDOW_MS = 3000;
  private readonly REPEATED_THRESHOLD = 3; // 3 identical messages in a row

  // Toxic / abusive keywords (extensible)
  private readonly BLOCKED_PATTERNS = [
    /\b(kill\s+yourself|hate\s+speech|ddos|attack\s+room)\b/i,
    /\b(https?:\/\/(?:[a-zA-Z0-9-]+\.)*(?:phishing|free-crypto|airdrop-scam|grabify)\.[a-z]{2,})\b/i,
  ];

  /**
   * Evaluates an outgoing chat message or signaling event for spam and abusive content.
   */
  public checkChatMessage(
    participantId: string,
    content: string,
    userId?: string
  ): MessageCheckResult {
    const now = Date.now();

    // 1. Abuse / Toxic keyword scan
    for (const pattern of this.BLOCKED_PATTERNS) {
      if (pattern.test(content)) {
        return {
          allowed: false,
          isAbuse: true,
          reason: "Message flagged for harmful or prohibited content.",
        };
      }
    }

    // 2. Repetitive message spam detection
    const last = this.lastMessages.get(participantId);
    const trimmed = content.trim().toLowerCase();
    if (last && last.text === trimmed) {
      last.count++;
      if (last.count >= this.REPEATED_THRESHOLD) {
        return {
          allowed: false,
          isSpam: true,
          reason: "Please avoid sending identical messages repeatedly.",
        };
      }
    } else {
      this.lastMessages.set(participantId, { text: trimmed, count: 1 });
    }

    // 3. Rate limiting / Flood detection
    let timestamps = this.messageTimestamps.get(participantId) || [];
    timestamps = timestamps.filter((t) => now - t < this.WINDOW_MS);
    timestamps.push(now);
    this.messageTimestamps.set(participantId, timestamps);

    if (timestamps.length > this.MAX_MESSAGES_IN_WINDOW) {
      return {
        allowed: false,
        isSpam: true,
        reason: "You are sending messages too quickly. Please slow down.",
      };
    }

    return { allowed: true };
  }

  /**
   * Cleans up tracking caches when participant leaves
   */
  public clearParticipant(participantId: string): void {
    this.messageTimestamps.delete(participantId);
    this.lastMessages.delete(participantId);
  }

  /**
   * Retrieves summary telemetry of detected abuse
   */
  public getAbuseStats() {
    return {
      activeMonitoredParticipants: this.messageTimestamps.size,
      cachedRepeatedSenders: this.lastMessages.size,
      heuristics: {
        windowMs: this.WINDOW_MS,
        maxMessagesPerWindow: this.MAX_MESSAGES_IN_WINDOW,
        repeatThreshold: this.REPEATED_THRESHOLD,
      },
    };
  }
}

export const abuseDetectionService = new AbuseDetectionService();
