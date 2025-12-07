"use client";

import { useMemo, useCallback } from "react";
import {
  ResponseOptions,
  useResponseOptionsStore,
} from "@/lib/store/responseOptions";
import { useThreadResponseOptionsStore } from "@/lib/store/threadResponseOptions";

interface UseResponseOptionsResult {
  // Merged options (thread-specific overrides global)
  options: ResponseOptions;
  // Toggle option for this thread (sets thread-specific value)
  toggleOption: (key: keyof ResponseOptions) => void;
  // Check if option is active in global settings
  isGlobalActive: (key: keyof ResponseOptions) => boolean;
  // Check if option has a thread-specific override
  hasThreadOverride: (key: keyof ResponseOptions) => boolean;
  // Clear thread-specific option (fall back to global)
  clearThreadOption: (key: keyof ResponseOptions) => void;
  // Clear all thread-specific options
  resetAllThreadOptions: () => void;
}

export function useResponseOptions(
  boardId: string,
  threadId: number
): UseResponseOptionsResult {
  // Select individual values to avoid creating new object references
  const globalChatMode = useResponseOptionsStore((state) => state.chatMode);
  const globalAaMode = useResponseOptionsStore((state) => state.aaMode);
  const globalPreviewMode = useResponseOptionsStore((state) => state.previewMode);
  const globalNoupMode = useResponseOptionsStore((state) => state.noupMode);
  const globalAlwaysBottom = useResponseOptionsStore((state) => state.alwaysBottom);
  const globalQuickSubmitKey = useResponseOptionsStore((state) => state.quickSubmitKey);

  const threadOptionsMap = useThreadResponseOptionsStore((state) => state.options);
  const threadKey = `${boardId}:${threadId}`;
  const threadOptions = threadOptionsMap[threadKey] || {};

  const toggleThreadOption = useThreadResponseOptionsStore(
    (state) => state.toggleThreadOption
  );
  const clearThreadOptionFn = useThreadResponseOptionsStore(
    (state) => state.clearThreadOption
  );

  const globalSidebarSwipe = useResponseOptionsStore((state) => state.sidebarSwipe);

  const options = useMemo<ResponseOptions>(() => {
    return {
      chatMode: threadOptions.chatMode ?? globalChatMode,
      aaMode: threadOptions.aaMode ?? globalAaMode,
      previewMode: threadOptions.previewMode ?? globalPreviewMode,
      noupMode: threadOptions.noupMode ?? globalNoupMode,
      alwaysBottom: threadOptions.alwaysBottom ?? globalAlwaysBottom,
      quickSubmitKey: globalQuickSubmitKey, // quickSubmitKey is global only
      sidebarSwipe: globalSidebarSwipe, // sidebarSwipe is global only
    };
  }, [
    globalChatMode,
    globalAaMode,
    globalPreviewMode,
    globalNoupMode,
    globalAlwaysBottom,
    globalQuickSubmitKey,
    globalSidebarSwipe,
    threadOptions,
  ]);

  const toggleOption = useCallback(
    (key: keyof ResponseOptions) => {
      toggleThreadOption(boardId, threadId, key);
    },
    [boardId, threadId, toggleThreadOption]
  );

  const globalOptions = useMemo<ResponseOptions>(() => ({
    chatMode: globalChatMode,
    aaMode: globalAaMode,
    previewMode: globalPreviewMode,
    noupMode: globalNoupMode,
    alwaysBottom: globalAlwaysBottom,
    quickSubmitKey: globalQuickSubmitKey,
    sidebarSwipe: globalSidebarSwipe,
  }), [globalChatMode, globalAaMode, globalPreviewMode, globalNoupMode, globalAlwaysBottom, globalQuickSubmitKey, globalSidebarSwipe]);

  const isGlobalActive = useCallback(
    (key: keyof ResponseOptions): boolean => {
      return globalOptions[key] === true;
    },
    [globalOptions]
  );

  const hasThreadOverride = useCallback(
    (key: keyof ResponseOptions): boolean => {
      return threadOptions[key] !== undefined;
    },
    [threadOptions]
  );

  const clearThreadOption = useCallback(
    (key: keyof ResponseOptions) => {
      clearThreadOptionFn(boardId, threadId, key);
    },
    [boardId, threadId, clearThreadOptionFn]
  );

  const clearAllThreadOptionsFn = useThreadResponseOptionsStore(
    (state) => state.clearThreadOptions
  );

  const resetAllThreadOptions = useCallback(() => {
    clearAllThreadOptionsFn(boardId, threadId);
  }, [boardId, threadId, clearAllThreadOptionsFn]);

  return {
    options,
    toggleOption,
    isGlobalActive,
    hasThreadOverride,
    clearThreadOption,
    resetAllThreadOptions,
  };
}
