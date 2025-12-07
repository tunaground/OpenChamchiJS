"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { getSubscriber } from "@/lib/realtime";
import type { RealtimeSubscriber, PresenceMember } from "@/lib/realtime";

interface UsePresenceResult {
  memberCount: number;
  isConnected: boolean;
  error: Error | null;
}

/**
 * Hook for managing presence on a realtime channel
 *
 * @param channel - Channel name to join presence on
 * @param enabled - Whether presence tracking is enabled
 */
export function usePresence(channel: string, enabled: boolean): UsePresenceResult {
  const [memberCount, setMemberCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const subscriberRef = useRef<RealtimeSubscriber | null>(null);

  const handlePresenceChange = useCallback((members: PresenceMember[]) => {
    setMemberCount(members.length);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setMemberCount(0);
      setIsConnected(false);
      return;
    }

    let mounted = true;

    const connect = async () => {
      try {
        setError(null);
        const subscriber = getSubscriber();
        subscriberRef.current = subscriber;

        subscriber.onConnectionChange((connected) => {
          if (mounted) {
            setIsConnected(connected);
          }
        });

        await subscriber.connect();

        // Subscribe to presence changes first (to catch our own enter)
        subscriber.onPresenceChange(channel, (members) => {
          if (mounted) {
            handlePresenceChange(members);
          }
        });

        // Enter presence on the channel
        await subscriber.enterPresence(channel);

        // Get initial member count (after enter to ensure we're included)
        // Small delay to ensure Ably has processed our enter
        await new Promise((resolve) => setTimeout(resolve, 100));
        const members = await subscriber.getPresenceMembers(channel);
        if (mounted) {
          setMemberCount(members.length);
        }

        if (mounted) {
          setIsConnected(true);
        }
      } catch (err) {
        console.error("Presence connection error:", err);
        if (mounted) {
          const error = err instanceof Error ? err : new Error(String(err));
          setError(error);
          setIsConnected(false);
        }
      }
    };

    connect();

    return () => {
      mounted = false;
      if (subscriberRef.current) {
        subscriberRef.current.offPresenceChange(channel);
        subscriberRef.current.leavePresence(channel).catch(() => {
          // Ignore errors on cleanup
        });
      }
    };
  }, [channel, enabled, handlePresenceChange]);

  return {
    memberCount,
    isConnected,
    error,
  };
}

/**
 * Hook for managing presence on multiple channels
 * Useful for tracking both thread and board presence
 */
export function useMultiPresence(
  channels: { channel: string; enabled: boolean }[]
): Map<string, UsePresenceResult> {
  const [results, setResults] = useState<Map<string, UsePresenceResult>>(new Map());
  const subscriberRef = useRef<RealtimeSubscriber | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const enabledChannels = channels.filter((c) => c.enabled);

    if (enabledChannels.length === 0) {
      setResults(new Map());
      return;
    }

    const connect = async () => {
      try {
        const subscriber = getSubscriber();
        subscriberRef.current = subscriber;

        await subscriber.connect();

        const newResults = new Map<string, UsePresenceResult>();

        for (const { channel } of enabledChannels) {
          try {
            await subscriber.enterPresence(channel);
            const members = await subscriber.getPresenceMembers(channel);

            newResults.set(channel, {
              memberCount: members.length,
              isConnected: true,
              error: null,
            });

            subscriber.onPresenceChange(channel, (members) => {
              if (mountedRef.current) {
                setResults((prev) => {
                  const updated = new Map(prev);
                  const current = updated.get(channel);
                  if (current) {
                    updated.set(channel, {
                      ...current,
                      memberCount: members.length,
                    });
                  }
                  return updated;
                });
              }
            });
          } catch (err) {
            newResults.set(channel, {
              memberCount: 0,
              isConnected: false,
              error: err instanceof Error ? err : new Error(String(err)),
            });
          }
        }

        if (mountedRef.current) {
          setResults(newResults);
        }
      } catch (err) {
        // Connection failed for all channels
        const errorResult: UsePresenceResult = {
          memberCount: 0,
          isConnected: false,
          error: err instanceof Error ? err : new Error(String(err)),
        };
        const newResults = new Map<string, UsePresenceResult>();
        enabledChannels.forEach(({ channel }) => {
          newResults.set(channel, errorResult);
        });
        if (mountedRef.current) {
          setResults(newResults);
        }
      }
    };

    connect();

    return () => {
      mountedRef.current = false;
      if (subscriberRef.current) {
        enabledChannels.forEach(({ channel }) => {
          subscriberRef.current!.offPresenceChange(channel);
          subscriberRef.current!.leavePresence(channel).catch(() => {});
        });
      }
    };
  }, [JSON.stringify(channels)]);

  return results;
}
