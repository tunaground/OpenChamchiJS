"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { getSubscriber, CHANNELS, EVENTS } from "@/lib/realtime";
import type { RealtimeSubscriber } from "@/lib/realtime";

interface ResponseData {
  id: string;
  threadId: number;
  seq: number;
  username: string;
  authorId: string;
  userId: string | null;
  content: string;
  attachment: string | null;
  visible: boolean;
  deleted: boolean;
  createdAt: string;
}

interface UseChatModeResult {
  isConnected: boolean;
  error: Error | null;
}

const RECONNECT_DELAY = 30000; // 30 seconds

/**
 * Hook for managing chat mode (realtime response subscription)
 *
 * @param enabled - Whether chat mode is enabled
 * @param boardId - Board ID for catch-up API
 * @param threadId - Thread ID to subscribe to
 * @param lastSeq - Last known sequence number for catch-up
 * @param onNewResponse - Callback when a new response is received
 */
export function useChatMode(
  enabled: boolean,
  boardId: string,
  threadId: number,
  lastSeq: number,
  onNewResponse: (response: ResponseData) => void
): UseChatModeResult {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const subscriberRef = useRef<RealtimeSubscriber | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSeqRef = useRef(lastSeq);
  const onNewResponseRef = useRef(onNewResponse);

  // Keep refs updated
  useEffect(() => {
    lastSeqRef.current = lastSeq;
  }, [lastSeq]);

  useEffect(() => {
    onNewResponseRef.current = onNewResponse;
  }, [onNewResponse]);

  // Catch-up: fetch missed responses since lastSeq
  const catchUp = useCallback(async () => {
    if (lastSeqRef.current <= 0) return;

    try {
      const response = await fetch(
        `/api/boards/${boardId}/threads/${threadId}/responses?startSeq=${lastSeqRef.current + 1}&endSeq=999999`
      );
      if (response.ok) {
        const responses: ResponseData[] = await response.json();
        responses.forEach((resp) => {
          if (resp.seq > lastSeqRef.current) {
            onNewResponseRef.current(resp);
          }
        });
      }
    } catch (err) {
      console.error("Failed to catch up responses:", err);
    }
  }, [boardId, threadId]);

  // Connect to realtime service
  const connect = useCallback(async () => {
    try {
      setError(null);
      const subscriber = getSubscriber();
      subscriberRef.current = subscriber;

      subscriber.onConnectionChange((connected) => {
        setIsConnected(connected);
        if (!connected && enabled) {
          // Schedule reconnection
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, RECONNECT_DELAY);
        }
      });

      await subscriber.connect();

      // Catch up missed responses
      await catchUp();

      // Subscribe to new responses
      const channel = CHANNELS.thread(threadId);
      subscriber.subscribe(channel, EVENTS.NEW_RESPONSE, (data) => {
        const response = data as ResponseData;
        if (response.seq > lastSeqRef.current) {
          onNewResponseRef.current(response);
        }
      });

      setIsConnected(true);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setIsConnected(false);

      // Schedule reconnection
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, RECONNECT_DELAY);
    }
  }, [threadId, catchUp, enabled]);

  // Disconnect from realtime service
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (subscriberRef.current) {
      const channel = CHANNELS.thread(threadId);
      subscriberRef.current.unsubscribe(channel);
      subscriberRef.current.disconnect();
      subscriberRef.current = null;
    }

    setIsConnected(false);
    setError(null);
  }, [threadId]);

  // Main effect: connect/disconnect based on enabled state
  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    isConnected,
    error,
  };
}
