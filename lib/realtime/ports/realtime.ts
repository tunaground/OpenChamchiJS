/**
 * Realtime service interfaces (Hexagonal Architecture - Ports)
 *
 * These interfaces define the contract for realtime messaging.
 * Implementations (adapters) can be swapped without changing the core logic.
 */

/**
 * Server-side message publisher
 * Used to broadcast messages to subscribed clients
 */
export interface RealtimePublisher {
  /**
   * Publish a message to a channel
   * @param channel - Channel name (e.g., "thread:123")
   * @param event - Event name (e.g., "new-response")
   * @param data - Data to publish
   */
  publish(channel: string, event: string, data: unknown): Promise<void>;
}

/**
 * Presence member data
 * Represents a user present in a channel
 */
export interface PresenceMember {
  oderId: string; // Unique ID per browser session
}

/**
 * Client-side message subscriber
 * Used to receive real-time messages from the server
 */
export interface RealtimeSubscriber {
  /**
   * Subscribe to a channel and event
   * @param channel - Channel name to subscribe to
   * @param event - Event name to listen for
   * @param callback - Function to call when a message is received
   */
  subscribe(channel: string, event: string, callback: (data: unknown) => void): void;

  /**
   * Unsubscribe from a channel
   * @param channel - Channel name to unsubscribe from
   */
  unsubscribe(channel: string): void;

  /**
   * Connect to the realtime service
   */
  connect(): Promise<void>;

  /**
   * Disconnect from the realtime service
   */
  disconnect(): void;

  /**
   * Register a callback for connection state changes
   * @param callback - Function to call when connection state changes
   */
  onConnectionChange(callback: (connected: boolean) => void): void;

  /**
   * Check if currently connected
   */
  isConnected(): boolean;

  /**
   * Enter presence on a channel
   * @param channel - Channel name to enter presence on
   * @param data - Optional presence data
   */
  enterPresence(channel: string, data?: PresenceMember): Promise<void>;

  /**
   * Leave presence on a channel
   * @param channel - Channel name to leave presence from
   */
  leavePresence(channel: string): Promise<void>;

  /**
   * Get current presence members on a channel
   * @param channel - Channel name to get members from
   */
  getPresenceMembers(channel: string): Promise<PresenceMember[]>;

  /**
   * Subscribe to presence changes on a channel
   * @param channel - Channel name to subscribe to
   * @param callback - Function to call when presence changes (receives updated member list)
   */
  onPresenceChange(channel: string, callback: (members: PresenceMember[]) => void): void;

  /**
   * Unsubscribe from presence changes on a channel
   * @param channel - Channel name to unsubscribe from
   */
  offPresenceChange(channel: string): void;
}

/**
 * Token provider for client authentication
 * Some realtime services require token-based auth for clients
 */
export interface RealtimeTokenProvider {
  /**
   * Get an authentication token for the realtime service
   */
  getToken(): Promise<string>;
}

/**
 * Channel naming conventions
 */
export const CHANNELS = {
  thread: (threadId: number) => `thread:${threadId}`,
  board: (boardId: string) => `board:${boardId}`,
} as const;

/**
 * Event naming conventions
 */
export const EVENTS = {
  NEW_RESPONSE: "new-response",
} as const;
