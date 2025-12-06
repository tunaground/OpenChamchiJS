import { prisma } from "@/lib/prisma";
import {
  GlobalSettingsRepository,
  GlobalSettingsData,
  UpdateGlobalSettingsInput,
} from "@/lib/repositories/interfaces/global-settings";

const DEFAULT_ID = "default";

export const globalSettingsRepository: GlobalSettingsRepository = {
  async get(): Promise<GlobalSettingsData> {
    const settings = await prisma.globalSettings.findUnique({
      where: { id: DEFAULT_ID },
    });

    if (!settings) {
      // Create default settings if not exists
      return prisma.globalSettings.create({
        data: { id: DEFAULT_ID, countryCode: "KR" },
      });
    }

    return settings;
  },

  async update(data: UpdateGlobalSettingsInput): Promise<GlobalSettingsData> {
    return prisma.globalSettings.upsert({
      where: { id: DEFAULT_ID },
      update: data,
      create: { id: DEFAULT_ID, ...data },
    });
  },
};
