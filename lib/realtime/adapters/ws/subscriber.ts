"use client";

import type { RealtimeSubscriber, PresenceMember } from "../../ports/realtime";

interface PendingPresenceGet {
  resolve: (members: PresenceMember[]) => void;
  reject: (error: Error) => void;
}

export class WsSubscriber implements RealtimeSubscriber {
  private ws: WebSocket | null = null;
  private connectionCallback: ((connected: boolean) => void) | null = null;
  private subscriptions: Map<string, Map<string, (data: unknown) => void>> = new Map();
  private presenceCallbacks: Map<string, (members: PresenceMember[]) => void> = new Map();
  private pendingPresenceGets: Map<string, PendingPresenceGet[]> = new Map();
  private subscribedChannels: Set<string> = new Set();
  private presenceChannels: Set<string> = new Set();
  private wsUrl: string;
  private tokenUrl: string;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private _connected = false;
  private shouldReconnect = false;

  constructor(wsUrl: string, tokenUrl: string = "/api/realtime/token") {
    this.wsUrl = wsUrl;
    this.tokenUrl = tokenUrl;
  }

  async connect(): Promise<void> {
    if (this.ws) return;

    this.shouldReconnect = true;

    // Fetch token
    const res = await fetch(this.tokenUrl);
    if (!res.ok) {
      throw new Error(`Failed to get WS token: ${res.status}`);
    }
    const { token } = await res.json();

    return new Promise<void>((resolve, reject) => {
      const url = `${this.wsUrl}?token=${token}`;
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this._connected = true;
        this.connectionCallback?.(true);
        this.replayState();
        resolve();
      };

      this.ws.onclose = () => {
        this._connected = false;
        this.ws = null;
        this.connectionCallback?.(false);
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        if (!this._connected) {
          reject(new Error("WebSocket connection failed"));
        }
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };
    });
  }

  disconnect(): void {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this._connected = false;
    this.subscriptions.clear();
    this.presenceCallbacks.clear();
    this.subscribedChannels.clear();
    this.presenceChannels.clear();
  }

  subscribe(channel: string, event: string, callback: (data: unknown) => void): void {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Map());
    }
    this.subscriptions.get(channel)!.set(event, callback);
    this.subscribedChannels.add(channel);
    this.send({ type: "subscribe", channel });
  }

  unsubscribe(channel: string): void {
    this.subscriptions.delete(channel);
    this.subscribedChannels.delete(channel);
    this.send({ type: "unsubscribe", channel });
  }

  onConnectionChange(callback: (connected: boolean) => void): void {
    this.connectionCallback = callback;
  }

  isConnected(): boolean {
    return this._connected;
  }

  async enterPresence(channel: string): Promise<void> {
    this.presenceChannels.add(channel);
    this.send({ type: "presence:enter", channel });
  }

  async leavePresence(channel: string): Promise<void> {
    this.presenceChannels.delete(channel);
    this.send({ type: "presence:leave", channel });
  }

  async getPresenceMembers(channel: string): Promise<PresenceMember[]> {
    return new Promise((resolve, reject) => {
      if (!this.pendingPresenceGets.has(channel)) {
        this.pendingPresenceGets.set(channel, []);
      }
      this.pendingPresenceGets.get(channel)!.push({ resolve, reject });
      this.send({ type: "presence:get", channel });

      // Timeout after 5 seconds
      setTimeout(() => {
        const pending = this.pendingPresenceGets.get(channel);
        if (pending) {
          const idx = pending.findIndex((p) => p.resolve === resolve);
          if (idx !== -1) {
            pending.splice(idx, 1);
            reject(new Error("Presence get timeout"));
          }
        }
      }, 5000);
    });
  }

  onPresenceChange(channel: string, callback: (members: PresenceMember[]) => void): void {
    this.presenceCallbacks.set(channel, callback);
  }

  offPresenceChange(channel: string): void {
    this.presenceCallbacks.delete(channel);
  }

  private send(msg: Record<string, unknown>): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  private handleMessage(raw: string): void {
    let msg: {
      type: string;
      channel?: string;
      event?: string;
      data?: unknown;
      members?: PresenceMember[];
    };
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    switch (msg.type) {
      case "message": {
        const channelSubs = this.subscriptions.get(msg.channel!);
        if (channelSubs && msg.event) {
          const callback = channelSubs.get(msg.event);
          callback?.(msg.data);
        }
        break;
      }

      case "presence:update": {
        const cb = this.presenceCallbacks.get(msg.channel!);
        cb?.(msg.members || []);
        break;
      }

      case "presence:members": {
        const pending = this.pendingPresenceGets.get(msg.channel!);
        if (pending && pending.length > 0) {
          const { resolve } = pending.shift()!;
          resolve(msg.members || []);
          if (pending.length === 0) {
            this.pendingPresenceGets.delete(msg.channel!);
          }
        }
        break;
      }
    }
  }

  /**
   * Replay subscriptions and presence after reconnect
   */
  private replayState(): void {
    for (const channel of this.subscribedChannels) {
      this.send({ type: "subscribe", channel });
    }
    for (const channel of this.presenceChannels) {
      this.send({ type: "presence:enter", channel });
    }
  }

  private scheduleReconnect(): void {
    if (!this.shouldReconnect) return;
    if (this.reconnectTimer) return;

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      if (!this.shouldReconnect) return;
      try {
        await this.connect();
      } catch {
        // Will retry on next close
      }
    }, 3000);
  }
}
