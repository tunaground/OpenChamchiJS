import { globalSettingsRepository as defaultRepository } from "@/lib/repositories/prisma/global-settings";
import {
  GlobalSettingsRepository,
  GlobalSettingsData,
  UpdateGlobalSettingsInput,
} from "@/lib/repositories/interfaces/global-settings";
import { cached, invalidateCache, CACHE_TAGS } from "@/lib/cache";

export interface GlobalSettingsService {
  get(): Promise<GlobalSettingsData>;
  update(data: UpdateGlobalSettingsInput): Promise<GlobalSettingsData>;
  getCountryCode(): Promise<string>;
}

interface GlobalSettingsServiceDeps {
  globalSettingsRepository: GlobalSettingsRepository;
}

export function createGlobalSettingsService(
  deps: GlobalSettingsServiceDeps
): GlobalSettingsService {
  const { globalSettingsRepository } = deps;

  return {
    async get(): Promise<GlobalSettingsData> {
      return cached(
        () => globalSettingsRepository.get(),
        ["settings"],
        [CACHE_TAGS.settings]
      );
    },

    async update(data: UpdateGlobalSettingsInput): Promise<GlobalSettingsData> {
      const result = await globalSettingsRepository.update(data);

      // Invalidate cache
      invalidateCache(CACHE_TAGS.settings);

      return result;
    },

    async getCountryCode(): Promise<string> {
      const settings = await cached(
        () => globalSettingsRepository.get(),
        ["settings"],
        [CACHE_TAGS.settings]
      );
      return settings.countryCode;
    },
  };
}

export const globalSettingsService = createGlobalSettingsService({
  globalSettingsRepository: defaultRepository,
});
