import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ResponseOptions } from "./responseOptions";

// Thread-specific options use Partial because they can override specific options only
export type ThreadResponseOptions = Partial<ResponseOptions>;

interface ThreadResponseOptionsState {
  // key: "boardId:threadId"
  options: Record<string, ThreadResponseOptions>;
  getThreadOptions: (boardId: string, threadId: number) => ThreadResponseOptions;
  setThreadOption: <K extends keyof ResponseOptions>(
    boardId: string,
    threadId: number,
    key: K,
    value: ResponseOptions[K]
  ) => void;
  toggleThreadOption: (
    boardId: string,
    threadId: number,
    key: keyof ResponseOptions
  ) => void;
  clearThreadOption: (
    boardId: string,
    threadId: number,
    key: keyof ResponseOptions
  ) => void;
  clearThreadOptions: (boardId: string, threadId: number) => void;
}

function getKey(boardId: string, threadId: number): string {
  return `${boardId}:${threadId}`;
}

export const useThreadResponseOptionsStore = create<ThreadResponseOptionsState>()(
  persist(
    (set, get) => ({
      options: {},
      getThreadOptions: (boardId, threadId) => {
        const key = getKey(boardId, threadId);
        return get().options[key] || {};
      },
      setThreadOption: (boardId, threadId, key, value) => {
        const storeKey = getKey(boardId, threadId);
        set((state) => ({
          options: {
            ...state.options,
            [storeKey]: {
              ...state.options[storeKey],
              [key]: value,
            },
          },
        }));
      },
      toggleThreadOption: (boardId, threadId, key) => {
        const storeKey = getKey(boardId, threadId);
        const currentOptions = get().options[storeKey] || {};
        const currentValue = currentOptions[key];
        // If undefined, toggle from false to true
        const newValue = currentValue === undefined ? true : !currentValue;
        set((state) => ({
          options: {
            ...state.options,
            [storeKey]: {
              ...state.options[storeKey],
              [key]: newValue,
            },
          },
        }));
      },
      clearThreadOption: (boardId, threadId, key) => {
        const storeKey = getKey(boardId, threadId);
        set((state) => {
          const currentOptions = { ...state.options[storeKey] };
          delete currentOptions[key];
          return {
            options: {
              ...state.options,
              [storeKey]: currentOptions,
            },
          };
        });
      },
      clearThreadOptions: (boardId, threadId) => {
        const storeKey = getKey(boardId, threadId);
        set((state) => {
          const newOptions = { ...state.options };
          delete newOptions[storeKey];
          return { options: newOptions };
        });
      },
    }),
    {
      name: "thread-response-options",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
