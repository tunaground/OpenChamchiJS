import { prisma } from "@/lib/prisma";
import {
  GlobalSettingsRepository,
  GlobalSettingsData,
  UpdateGlobalSettingsInput,
  CustomLink,
} from "@/lib/repositories/interfaces/global-settings";

const DEFAULT_ID = "default";

function parseCustomLinks(json: string | null): CustomLink[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function toGlobalSettingsData(settings: {
  id: string;
  countryCode: string;
  homepageContent: string | null;
  customLinks: string | null;
  createdAt: Date;
  updatedAt: Date;
}): GlobalSettingsData {
  return {
    ...settings,
    customLinks: parseCustomLinks(settings.customLinks),
  };
}

export const globalSettingsRepository: GlobalSettingsRepository = {
  async get(): Promise<GlobalSettingsData> {
    const settings = await prisma.globalSettings.findUnique({
      where: { id: DEFAULT_ID },
    });

    if (!settings) {
      // Create default settings if not exists
      const created = await prisma.globalSettings.create({
        data: { id: DEFAULT_ID, countryCode: "KR", homepageContent: null, customLinks: null },
      });
      return toGlobalSettingsData(created);
    }

    return toGlobalSettingsData(settings);
  },

  async update(data: UpdateGlobalSettingsInput): Promise<GlobalSettingsData> {
    const updateData: {
      countryCode?: string;
      homepageContent?: string | null;
      customLinks?: string | null;
    } = {};

    if (data.countryCode !== undefined) {
      updateData.countryCode = data.countryCode;
    }
    if (data.homepageContent !== undefined) {
      updateData.homepageContent = data.homepageContent;
    }
    if (data.customLinks !== undefined) {
      updateData.customLinks = JSON.stringify(data.customLinks);
    }

    const updated = await prisma.globalSettings.upsert({
      where: { id: DEFAULT_ID },
      update: updateData,
      create: { id: DEFAULT_ID, ...updateData },
    });

    return toGlobalSettingsData(updated);
  },
};
