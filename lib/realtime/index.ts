// Interfaces (Ports)
export type {
  RealtimePublisher,
  RealtimeSubscriber,
  RealtimeTokenProvider,
  PresenceMember,
} from "./ports/realtime";
export { CHANNELS, EVENTS } from "./ports/realtime";

// Configuration (client-safe only)
export type { RealtimeProvider } from "./config";
export {
  getClientRealtimeProvider,
  isClientRealtimeEnabled,
} from "./config";

// Errors
export { RealtimeError } from "./errors";
export type { RealtimeErrorCode } from "./errors";

// Client-side subscriber
export { getSubscriber, resetSubscriber } from "./subscriber";
