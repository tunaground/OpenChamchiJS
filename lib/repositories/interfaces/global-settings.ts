export interface GlobalSettingsData {
  id: string;
  countryCode: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateGlobalSettingsInput {
  countryCode?: string;
}

export interface GlobalSettingsRepository {
  get(): Promise<GlobalSettingsData>;
  update(data: UpdateGlobalSettingsInput): Promise<GlobalSettingsData>;
}
