import { globalSettingsRepository as defaultRepository } from "@/lib/repositories/prisma/global-settings";
import {
  GlobalSettingsRepository,
  GlobalSettingsData,
  UpdateGlobalSettingsInput,
} from "@/lib/repositories/interfaces/global-settings";

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
      return globalSettingsRepository.get();
    },

    async update(data: UpdateGlobalSettingsInput): Promise<GlobalSettingsData> {
      return globalSettingsRepository.update(data);
    },

    async getCountryCode(): Promise<string> {
      const settings = await globalSettingsRepository.get();
      return settings.countryCode;
    },
  };
}

export const globalSettingsService = createGlobalSettingsService({
  globalSettingsRepository: defaultRepository,
});
