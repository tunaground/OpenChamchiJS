"use client";

import Ably from "ably";
import type { RealtimeSubscriber, PresenceMember } from "../../interfaces";

export class AblySubscriber implements RealtimeSubscriber {
  private client: Ably.Realtime | null = null;
  private channels: Map<string, Ably.RealtimeChannel> = new Map();
  private connectionCallback: ((connected: boolean) => void) | null = null;
  private presenceCallbacks: Map<string, (members: PresenceMember[]) => void> = new Map();
  private tokenUrl: string;

  constructor(tokenUrl: string = "/api/realtime/token") {
    this.tokenUrl = tokenUrl;
  }

  async connect(): Promise<void> {
    if (this.client) {
      return;
    }

    this.client = new Ably.Realtime({
      authUrl: this.tokenUrl,
      authMethod: "GET",
    });

    return new Promise((resolve, reject) => {
      this.client!.connection.on("connected", () => {
        this.connectionCallback?.(true);
        resolve();
      });

      this.client!.connection.on("disconnected", () => {
        this.connectionCallback?.(false);
      });

      this.client!.connection.on("suspended", () => {
        this.connectionCallback?.(false);
      });

      this.client!.connection.on("failed", (stateChange) => {
        this.connectionCallback?.(false);
        reject(new Error(stateChange.reason?.message || "Connection failed"));
      });
    });
  }

  disconnect(): void {
    if (this.client) {
      this.channels.forEach((channel) => {
        channel.detach();
      });
      this.channels.clear();
      this.client.close();
      this.client = null;
    }
  }

  subscribe(channel: string, event: string, callback: (data: unknown) => void): void {
    if (!this.client) {
      throw new Error("Not connected. Call connect() first.");
    }

    let channelInstance = this.channels.get(channel);
    if (!channelInstance) {
      channelInstance = this.client.channels.get(channel);
      this.channels.set(channel, channelInstance);
    }

    channelInstance.subscribe(event, (message) => {
      callback(message.data);
    });
  }

  unsubscribe(channel: string): void {
    const channelInstance = this.channels.get(channel);
    if (channelInstance) {
      channelInstance.unsubscribe();
      channelInstance.detach();
      this.channels.delete(channel);
    }
  }

  onConnectionChange(callback: (connected: boolean) => void): void {
    this.connectionCallback = callback;
  }

  isConnected(): boolean {
    return this.client?.connection.state === "connected";
  }

  private getOrCreateChannel(channel: string): Ably.RealtimeChannel {
    if (!this.client) {
      throw new Error("Not connected. Call connect() first.");
    }

    let channelInstance = this.channels.get(channel);
    if (!channelInstance) {
      channelInstance = this.client.channels.get(channel);
      this.channels.set(channel, channelInstance);
    }
    return channelInstance;
  }

  private async fetchPresenceMembers(channel: string): Promise<PresenceMember[]> {
    const channelInstance = this.getOrCreateChannel(channel);
    const members = await channelInstance.presence.get();

    // Deduplicate by clientId (same IP = same clientId = 1 user)
    const uniqueClientIds = new Set<string>();
    for (const m of members) {
      uniqueClientIds.add(m.clientId || m.connectionId || "unknown");
    }

    return Array.from(uniqueClientIds).map((id) => ({
      oderId: id,
    }));
  }

  async enterPresence(channel: string, data?: PresenceMember): Promise<void> {
    const channelInstance = this.getOrCreateChannel(channel);
    await channelInstance.presence.enter(data);
  }

  async leavePresence(channel: string): Promise<void> {
    const channelInstance = this.channels.get(channel);
    if (channelInstance) {
      await channelInstance.presence.leave();
    }
  }

  async getPresenceMembers(channel: string): Promise<PresenceMember[]> {
    return this.fetchPresenceMembers(channel);
  }

  onPresenceChange(channel: string, callback: (members: PresenceMember[]) => void): void {
    const channelInstance = this.getOrCreateChannel(channel);
    this.presenceCallbacks.set(channel, callback);

    const handlePresenceChange = async () => {
      const members = await this.fetchPresenceMembers(channel);
      callback(members);
    };

    channelInstance.presence.subscribe("enter", handlePresenceChange);
    channelInstance.presence.subscribe("leave", handlePresenceChange);
    channelInstance.presence.subscribe("update", handlePresenceChange);
  }

  offPresenceChange(channel: string): void {
    const channelInstance = this.channels.get(channel);
    if (channelInstance) {
      channelInstance.presence.unsubscribe();
    }
    this.presenceCallbacks.delete(channel);
  }
}
