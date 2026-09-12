export interface StreamingDestination {
  id: string;
  platform: "YOUTUBE" | "FACEBOOK" | "CUSTOM_RTMP";
  rtmpUrl: string;
  streamKey: string;
  name?: string;
}

// In-Memory store for configured streaming destinations: meetingId -> Map<destId, StreamingDestination>
const configuredDestinations = new Map<string, Map<string, StreamingDestination>>();

export class StreamingDestinationManager {
  public getDestinations(meetingId: string): StreamingDestination[] {
    const map = configuredDestinations.get(meetingId);
    if (!map) return [];
    return Array.from(map.values());
  }

  public addDestination(
    meetingId: string,
    dest: Omit<StreamingDestination, "id">
  ): StreamingDestination {
    let map = configuredDestinations.get(meetingId);
    if (!map) {
      map = new Map();
      configuredDestinations.set(meetingId, map);
    }
    const id = crypto.randomUUID();
    const newDest: StreamingDestination = { id, ...dest };
    map.set(id, newDest);
    return newDest;
  }

  public removeDestination(meetingId: string, destinationId: string): boolean {
    const map = configuredDestinations.get(meetingId);
    if (!map) return false;
    return map.delete(destinationId);
  }
}

export const destinationManager = new StreamingDestinationManager();
