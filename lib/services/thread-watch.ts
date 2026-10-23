import { threadWatchRepository as defaultThreadWatchRepository } from "@/lib/repositories/prisma/thread-watch";
import { threadRepository as defaultThreadRepository } from "@/lib/repositories/prisma/thread";
import {
  ThreadWatchRepository,
  ThreadWatchListItem,
} from "@/lib/repositories/interfaces/thread-watch";
import { ThreadRepository } from "@/lib/repositories/interfaces/thread";
import {
  globalSettingsService as defaultGlobalSettingsService,
  GlobalSettingsService,
} from "@/lib/services/global-settings";
import { ServiceError, ServiceErrorCode } from "@/lib/services/errors";
import { isPushFeatureEnabled } from "@/lib/push/feature";

export class ThreadWatchServiceError extends ServiceError {
  constructor(message: string, code: ServiceErrorCode) {
    super(message, code);
    this.name = "ThreadWatchServiceError";
  }
}

export interface ThreadWatchList {
  items: ThreadWatchListItem[];
  limit: number;
  pushEnabled: boolean;
}

export interface ThreadWatchService {
  list(userId: string): Promise<ThreadWatchList>;
  watch(userId: string, threadId: number): Promise<void>;
  unwatchThread(userId: string, threadId: number): Promise<void>;
  remove(userId: string, watchId: string): Promise<void>;
  setEnabled(userId: string, watchId: string, enabled: boolean): Promise<void>;
  setPushEnabled(userId: string, enabled: boolean): Promise<void>;
  reportViewing(userId: string, threadId: number, viewing: boolean): Promise<void>;
}

interface ThreadWatchServiceDeps {
  threadWatchRepository: ThreadWatchRepository;
  threadRepository: ThreadRepository;
  globalSettingsService: GlobalSettingsService;
}

export function createThreadWatchService(
  deps: ThreadWatchServiceDeps
): ThreadWatchService {
  const { threadWatchRepository, threadRepository, globalSettingsService } = deps;

  async function requireFeature() {
    const settings = await globalSettingsService.get();
    if (!isPushFeatureEnabled(settings)) {
      throw new ThreadWatchServiceError("Web push is disabled", "FEATURE_DISABLED");
    }
    return settings;
  }

  async function getOwnWatch(userId: string, watchId: string) {
    const watch = await threadWatchRepository.findById(watchId);
    if (!watch || watch.userId !== userId) {
      throw new ThreadWatchServiceError("Watch not found", "NOT_FOUND");
    }
    return watch;
  }

  return {
    async list(userId: string): Promise<ThreadWatchList> {
      const settings = await requireFeature();
      const [items, pushEnabled] = await Promise.all([
        threadWatchRepository.findActiveByUser(userId),
        threadWatchRepository.getUserPushEnabled(userId),
      ]);
      return { items, limit: settings.pushWatchLimit, pushEnabled };
    },

    async watch(userId: string, threadId: number): Promise<void> {
      const settings = await requireFeature();

      const thread = await threadRepository.findById(threadId);
      if (!thread || thread.deleted) {
        throw new ThreadWatchServiceError("Thread not found", "NOT_FOUND");
      }

      const result = await threadWatchRepository.createWithinLimit(
        userId,
        threadId,
        settings.pushWatchLimit
      );
      if (result === "limit") {
        throw new ThreadWatchServiceError("Watch limit exceeded", "WATCH_LIMIT_EXCEEDED");
      }
    },

    async unwatchThread(userId: string, threadId: number): Promise<void> {
      await requireFeature();
      await threadWatchRepository.deleteByUserAndThread(userId, threadId);
    },

    async remove(userId: string, watchId: string): Promise<void> {
      await requireFeature();
      await getOwnWatch(userId, watchId);
      await threadWatchRepository.delete(watchId);
    },

    async setEnabled(userId: string, watchId: string, enabled: boolean): Promise<void> {
      await requireFeature();
      await getOwnWatch(userId, watchId);
      await threadWatchRepository.setEnabled(watchId, enabled);
    },

    async setPushEnabled(userId: string, enabled: boolean): Promise<void> {
      await requireFeature();
      await threadWatchRepository.setUserPushEnabled(userId, enabled);
    },

    async reportViewing(userId: string, threadId: number, viewing: boolean): Promise<void> {
      const settings = await globalSettingsService.get();
      if (!isPushFeatureEnabled(settings)) return;
      await threadWatchRepository.setViewing(userId, threadId, viewing ? new Date() : null);
    },
  };
}

export const threadWatchService = createThreadWatchService({
  threadWatchRepository: defaultThreadWatchRepository,
  threadRepository: defaultThreadRepository,
  globalSettingsService: defaultGlobalSettingsService,
});
