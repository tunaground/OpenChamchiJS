import Ably from "ably";
import type { RealtimePublisher } from "../../interfaces";

let ablyClient: Ably.Rest | null = null;

function getAblyClient(): Ably.Rest {
  if (!ablyClient) {
    const apiKey = process.env.ABLY_API_KEY;
    if (!apiKey) {
      throw new Error("ABLY_API_KEY environment variable is not set");
    }
    ablyClient = new Ably.Rest({ key: apiKey });
  }
  return ablyClient;
}

export class AblyPublisher implements RealtimePublisher {
  async publish(channel: string, event: string, data: unknown): Promise<void> {
    const client = getAblyClient();
    const channelInstance = client.channels.get(channel);
    await channelInstance.publish(event, data);
  }
}
