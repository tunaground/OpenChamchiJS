import type { RealtimePublisher } from "../../ports/realtime";
import { getAblyRestClient } from "./client";

export class AblyPublisher implements RealtimePublisher {
  async publish(channel: string, event: string, data: unknown): Promise<void> {
    const client = getAblyRestClient();
    const channelInstance = client.channels.get(channel);
    await channelInstance.publish(event, data);
  }
}
