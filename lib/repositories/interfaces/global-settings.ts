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
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateGlobalSettingsInput {
  countryCode?: string;
  homepageContent?: string | null;
  customLinks?: CustomLink[];
}

export interface GlobalSettingsRepository {
  get(): Promise<GlobalSettingsData>;
  update(data: UpdateGlobalSettingsInput): Promise<GlobalSettingsData>;
}
