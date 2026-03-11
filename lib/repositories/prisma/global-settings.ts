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
  siteTitle: string;
  siteDescription: string;
  countryCode: string;
  homepageContent: string | null;
  customLinks: string | null;
  indexCustomHtml: string | null;
  threadCustomHtml: string | null;
  tripcodeSalt: string | null;
  gaTrackingId: string | null;
  realtimeProvider: string | null;
  realtimeApiKey: string | null;
  storageProvider: string | null;
  storageUrl: string | null;
  storageSecret: string | null;
  storageBucket: string | null;
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
        data: {
          id: DEFAULT_ID,
          siteTitle: "OpenChamchiJS",
          siteDescription: "OpenChamchiJS - Open Source Forum",
          countryCode: "KR",
          homepageContent: null,
          customLinks: null,
        },
      });
      return toGlobalSettingsData(created);
    }

    return toGlobalSettingsData(settings);
  },

  async update(data: UpdateGlobalSettingsInput): Promise<GlobalSettingsData> {
    const updateData: {
      siteTitle?: string;
      siteDescription?: string;
      countryCode?: string;
      homepageContent?: string | null;
      customLinks?: string | null;
      indexCustomHtml?: string | null;
      threadCustomHtml?: string | null;
      tripcodeSalt?: string | null;
      gaTrackingId?: string | null;
      realtimeProvider?: string | null;
      realtimeApiKey?: string | null;
      storageProvider?: string | null;
      storageUrl?: string | null;
      storageSecret?: string | null;
      storageBucket?: string | null;
    } = {};

    if (data.siteTitle !== undefined) {
      updateData.siteTitle = data.siteTitle;
    }
    if (data.siteDescription !== undefined) {
      updateData.siteDescription = data.siteDescription ?? "";
    }
    if (data.countryCode !== undefined) {
      updateData.countryCode = data.countryCode;
    }
    if (data.homepageContent !== undefined) {
      updateData.homepageContent = data.homepageContent;
    }
    if (data.customLinks !== undefined) {
      updateData.customLinks = JSON.stringify(data.customLinks);
    }
    if (data.indexCustomHtml !== undefined) {
      updateData.indexCustomHtml = data.indexCustomHtml;
    }
    if (data.threadCustomHtml !== undefined) {
      updateData.threadCustomHtml = data.threadCustomHtml;
    }
    if (data.tripcodeSalt !== undefined) {
      updateData.tripcodeSalt = data.tripcodeSalt;
    }
    if (data.gaTrackingId !== undefined) {
      updateData.gaTrackingId = data.gaTrackingId;
    }
    if (data.realtimeProvider !== undefined) {
      updateData.realtimeProvider = data.realtimeProvider;
    }
    if (data.realtimeApiKey !== undefined) {
      updateData.realtimeApiKey = data.realtimeApiKey;
    }
    if (data.storageProvider !== undefined) {
      updateData.storageProvider = data.storageProvider;
    }
    if (data.storageUrl !== undefined) {
      updateData.storageUrl = data.storageUrl;
    }
    if (data.storageSecret !== undefined) {
      updateData.storageSecret = data.storageSecret;
    }
    if (data.storageBucket !== undefined) {
      updateData.storageBucket = data.storageBucket;
    }

    const updated = await prisma.globalSettings.upsert({
      where: { id: DEFAULT_ID },
      update: updateData,
      create: { id: DEFAULT_ID, ...updateData },
    });

    return toGlobalSettingsData(updated);
  },
};
