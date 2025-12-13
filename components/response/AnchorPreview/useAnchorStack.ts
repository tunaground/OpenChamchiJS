"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { parse, prerender, type AnchorInfo, type PrerenderedRoot } from "@/lib/tom";
import type { AnchorStackItem, AnchorResponseData, UseAnchorStackReturn } from "./types";

export function useAnchorStack(): UseAnchorStackReturn {
  const [anchorStack, setAnchorStack] = useState<AnchorStackItem[]>([]);

  // Handle anchor click - toggle or replace existing, or push new
  const handleAnchorClick = useCallback((info: AnchorInfo) => {
    setAnchorStack((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.info.sourceResponseId === info.sourceResponseId
      );

      if (existingIndex !== -1) {
        const existing = prev[existingIndex];
        // 같은 앵커면 토글 (닫기)
        if (
          existing.info.boardId === info.boardId &&
          existing.info.threadId === info.threadId &&
          existing.info.start === info.start &&
          existing.info.end === info.end
        ) {
          return prev.slice(0, existingIndex);
        }
        // 다른 앵커면 교체
        const newStack = [...prev.slice(0, existingIndex + 1)];
        newStack[existingIndex] = { info, responses: [], loading: true };
        return newStack;
      }

      // 새 아이템 추가
      return [...prev, { info, responses: [], loading: true }];
    });
  }, []);

  // Close specific anchor preview (and all nested ones after it)
  const closeAnchorPreview = useCallback((sourceResponseId: string) => {
    setAnchorStack((prev) => {
      const index = prev.findIndex((item) => item.info.sourceResponseId === sourceResponseId);
      if (index !== -1) {
        return prev.slice(0, index);
      }
      return prev;
    });
  }, []);

  // Fetch anchor responses when a loading item exists
  useEffect(() => {
    const loadingItem = anchorStack.find((item) => item.loading);
    if (!loadingItem) return;

    const fetchAnchorResponses = async () => {
      try {
        const { boardId, threadId, start, end } = loadingItem.info;
        const endSeq = end ?? start;
        const res = await fetch(
          `/api/boards/${boardId}/threads/${threadId}/responses?startSeq=${start}&endSeq=${endSeq}`
        );
        const data: AnchorResponseData[] = res.ok ? await res.json() : [];
        setAnchorStack((prev) => {
          const newStack = [...prev];
          const idx = newStack.findIndex(
            (item) => item.info.sourceResponseId === loadingItem.info.sourceResponseId
          );
          if (idx !== -1) {
            newStack[idx] = { ...newStack[idx], responses: data, loading: false };
          }
          return newStack;
        });
      } catch {
        console.error("Failed to fetch anchor responses");
        setAnchorStack((prev) => {
          const newStack = [...prev];
          const idx = newStack.findIndex(
            (item) => item.info.sourceResponseId === loadingItem.info.sourceResponseId
          );
          if (idx !== -1) {
            newStack[idx] = { ...newStack[idx], loading: false };
          }
          return newStack;
        });
      }
    };

    fetchAnchorResponses();
  }, [anchorStack]);

  // Prerender TOM content for all anchor stack responses
  const anchorPrerenderedContents = useMemo(() => {
    const map = new Map<string, PrerenderedRoot>();
    for (const stackItem of anchorStack) {
      for (const response of stackItem.responses) {
        if (!map.has(response.id)) {
          const parsed = parse(response.content);
          const prerendered = prerender(parsed);
          map.set(response.id, prerendered);
        }
      }
    }
    return map;
  }, [anchorStack]);

  return {
    anchorStack,
    handleAnchorClick,
    closeAnchorPreview,
    anchorPrerenderedContents,
  };
}
