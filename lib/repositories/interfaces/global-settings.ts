export interface CustomLink {
  id: string;
  label: string;
  url: string;
}

export interface GlobalSettingsData {
  id: string;
  siteTitle: string;
  siteDescription: string;
  countryCode: string;
  homepageContent: string | null;
  customLinks: CustomLink[];
  tripcodeSalt: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateGlobalSettingsInput {
  siteTitle?: string;
  siteDescription?: string | null;
  countryCode?: string;
  homepageContent?: string | null;
  customLinks?: CustomLink[];
  tripcodeSalt?: string | null;
}

export interface GlobalSettingsRepository {
  get(): Promise<GlobalSettingsData>;
  update(data: UpdateGlobalSettingsInput): Promise<GlobalSettingsData>;
}
