import type { RealtimePublisher } from "../../ports/realtime";
import { getWsApiUrl, getWsApiKey } from "../../config.server";

export class WsPublisher implements RealtimePublisher {
  async publish(channel: string, event: string, data: unknown): Promise<void> {
    const apiUrl = await getWsApiUrl();
    const apiKey = await getWsApiKey();

    if (!apiUrl || !apiKey) {
      throw new Error("WS server URL or API key is not configured");
    }

    const response = await fetch(`${apiUrl}/publish`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ channel, event, data }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`WS publish failed (${response.status}): ${body}`);
    }
  }
}
