export interface CustomLink {
  id: string;
  label: string;
  url: string;
}

export interface ArchiveBoard {
  id: string;
  name: string;
}

export interface GlobalSettingsData {
  id: string;
  siteTitle: string;
  siteDescription: string;
  countryCode: string;
  homepageContent: string | null;
  customLinks: CustomLink[];
  indexCustomHtml: string | null;
  threadCustomHtml: string | null;
  robotsTxt: string | null;
  tripcodeSalt: string | null;
  gaTrackingId: string | null;
  realtimeProvider: string | null;
  realtimeApiKey: string | null;
  realtimeWsUrl: string | null;
  realtimeWsApiUrl: string | null;
  realtimeWsApiKey: string | null;
  realtimeWsTokenSecret: string | null;
  storageProvider: string | null;
  storageUrl: string | null;
  storageSecret: string | null;
  storageBucket: string | null;
  s3Region: string | null;
  s3Endpoint: string | null;
  s3AccessKeyId: string | null;
  s3SecretAccessKey: string | null;
  s3Bucket: string | null;
  s3PublicUrl: string | null;
  archiveBaseUrl: string | null;
  archiveBoards: ArchiveBoard[];
  archiveRedirect: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateGlobalSettingsInput {
  siteTitle?: string;
  siteDescription?: string | null;
  countryCode?: string;
  homepageContent?: string | null;
  customLinks?: CustomLink[];
  indexCustomHtml?: string | null;
  threadCustomHtml?: string | null;
  robotsTxt?: string | null;
  tripcodeSalt?: string | null;
  gaTrackingId?: string | null;
  realtimeProvider?: string | null;
  realtimeApiKey?: string | null;
  realtimeWsUrl?: string | null;
  realtimeWsApiUrl?: string | null;
  realtimeWsApiKey?: string | null;
  realtimeWsTokenSecret?: string | null;
  storageProvider?: string | null;
  storageUrl?: string | null;
  storageSecret?: string | null;
  storageBucket?: string | null;
  s3Region?: string | null;
  s3Endpoint?: string | null;
  s3AccessKeyId?: string | null;
  s3SecretAccessKey?: string | null;
  s3Bucket?: string | null;
  s3PublicUrl?: string | null;
  archiveBaseUrl?: string | null;
  archiveBoards?: ArchiveBoard[] | null;
  archiveRedirect?: boolean;
}

export interface GlobalSettingsRepository {
  get(): Promise<GlobalSettingsData>;
  update(data: UpdateGlobalSettingsInput): Promise<GlobalSettingsData>;
}
