"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { parse, prerender, type AnchorInfo, type PrerenderedRoot } from "@/lib/tom";
import type { AnchorStackItem, AnchorResponseData, UseAnchorStackReturn } from "./types";
import { closeAnchor, toggleAnchor } from "./anchorStackOps";

export function useAnchorStack(): UseAnchorStackReturn {
  const [anchorStack, setAnchorStack] = useState<AnchorStackItem[]>([]);

  // Same anchor again closes, another anchor in the same response replaces,
  // anything else opens. Only the touched preview and what is nested in it
  // change; previews opened from other responses stay open.
  const handleAnchorClick = useCallback((info: AnchorInfo) => {
    setAnchorStack((prev) =>
      toggleAnchor(prev, info, (next, previous) => ({
        info: next,
        // Keep the old responses while loading so the box doesn't flash empty
        responses: previous?.responses ?? [],
        loading: true,
      }))
    );
  }, []);

  // Close one preview and the previews nested inside it
  const closeAnchorPreview = useCallback((sourceResponseId: string) => {
    setAnchorStack((prev) => closeAnchor(prev, sourceResponseId));
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
