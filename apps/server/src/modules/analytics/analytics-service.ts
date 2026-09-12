import {
  analyticsTelemetryService,
  type TelemetryPayload,
} from "./services/analytics-telemetry-service";
import { analyticsOverviewService } from "./services/analytics-overview-service";

export type { TelemetryPayload };

export class AnalyticsService {
  public trackTelemetry(meetingId: string, userId?: string, payload: Partial<TelemetryPayload> = {}) {
    return analyticsTelemetryService.trackTelemetry(meetingId, userId, payload);
  }

  public getMeetingSummary(meetingId: string) {
    return analyticsTelemetryService.getMeetingSummary(meetingId);
  }

  public getRecordingStatistics(hostId?: string) {
    return analyticsOverviewService.getRecordingStatistics(hostId);
  }

  public getGlobalOverview(hostId?: string) {
    return analyticsOverviewService.getGlobalOverview(hostId);
  }
}

export const analyticsService = new AnalyticsService();
