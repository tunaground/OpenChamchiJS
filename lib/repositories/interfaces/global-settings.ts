export interface CustomLink {
  id: string;
  label: string;
  url: string;
}

export interface GlobalSettingsData {
  id: string;
  countryCode: string;
  homepageContent: string | null;
  customLinks: CustomLink[];
  tripcodeSalt: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateGlobalSettingsInput {
  countryCode?: string;
  homepageContent?: string | null;
  customLinks?: CustomLink[];
  tripcodeSalt?: string | null;
}

export interface GlobalSettingsRepository {
  get(): Promise<GlobalSettingsData>;
  update(data: UpdateGlobalSettingsInput): Promise<GlobalSettingsData>;
}
