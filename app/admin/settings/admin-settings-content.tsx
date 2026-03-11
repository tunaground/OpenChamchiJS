"use client";

import { useState } from "react";
import styled from "styled-components";
import { nanoid } from "nanoid";
import { PageLayout } from "@/components/layout";
import { AdminSidebar } from "@/components/sidebar/AdminSidebar";

interface CustomLink {
  id: string;
  label: string;
  url: string;
}

const Container = styled.div`
  padding: ${(props) => props.theme.containerPadding};
  max-width: ${(props) => props.theme.adminMaxWidth};
  margin: 0 auto;

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    padding: ${(props) => props.theme.containerPadding};
  }
`;

const Header = styled.div`
  margin-bottom: 2.4rem;
`;

const Title = styled.h1`
  font-size: 2.4rem;
  font-weight: 600;
  color: ${(props) => props.theme.textPrimary};
`;

const FormGroup = styled.div`
  margin-bottom: 2.4rem;
`;

const Label = styled.label`
  display: block;
  font-size: 1.4rem;
  font-weight: 500;
  margin-bottom: 0.8rem;
  color: ${(props) => props.theme.textPrimary};
`;

const Input = styled.input`
  width: 100%;
  max-width: 12rem;
  padding: 0.8rem 1.2rem;
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 4px;
  font-size: 1.4rem;
  background: ${(props) => props.theme.background};
  color: ${(props) => props.theme.textPrimary};
  text-transform: uppercase;

  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.textSecondary};
  }
`;

const TitleInput = styled.input`
  width: 100%;
  max-width: 40rem;
  padding: 0.8rem 1.2rem;
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 4px;
  font-size: 1.4rem;
  background: ${(props) => props.theme.background};
  color: ${(props) => props.theme.textPrimary};

  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.textSecondary};
  }
`;

const SaltInput = styled.input`
  width: 100%;
  max-width: 40rem;
  padding: 0.8rem 1.2rem;
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 4px;
  font-size: 1.4rem;
  font-family: monospace;
  background: ${(props) => props.theme.background};
  color: ${(props) => props.theme.textPrimary};

  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.textSecondary};
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 20rem;
  padding: 1.2rem;
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 4px;
  font-size: 1.4rem;
  font-family: inherit;
  background: ${(props) => props.theme.background};
  color: ${(props) => props.theme.textPrimary};
  resize: vertical;

  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.textSecondary};
  }
`;

const Description = styled.p`
  font-size: 1.2rem;
  color: ${(props) => props.theme.textSecondary};
  margin-top: 0.8rem;
`;

const Button = styled.button`
  height: 3.5rem;
  padding: 0 1.6rem;
  background: ${(props) => props.theme.buttonPrimary};
  color: ${(props) => props.theme.buttonPrimaryText};
  border: none;
  border-radius: 4px;
  font-size: 1.4rem;
  cursor: pointer;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SuccessMessage = styled.span`
  display: inline-block;
  margin-left: 1.6rem;
  color: #16a34a;
  font-size: 1.4rem;
`;

const StatusBox = styled.div<{ $available: boolean }>`
  padding: 1.6rem;
  border-radius: 6px;
  margin-bottom: 2.4rem;
  background: ${(props) =>
    props.$available ? "#16a34a15" : "#dc262615"};
  border: 1px solid ${(props) =>
    props.$available ? "#16a34a40" : "#dc262640"};
`;

const StatusTitle = styled.div<{ $available: boolean }>`
  font-size: 1.4rem;
  font-weight: 500;
  color: ${(props) =>
    props.$available ? "#16a34a" : "#dc2626"};
  margin-bottom: 0.4rem;
`;

const StatusDescription = styled.div`
  font-size: 1.2rem;
  color: ${(props) => props.theme.textSecondary};
`;

const SectionTitle = styled.h2`
  font-size: 1.8rem;
  font-weight: 600;
  color: ${(props) => props.theme.textPrimary};
  margin-bottom: 0.8rem;
`;

const SectionDescription = styled.p`
  font-size: 1.3rem;
  color: ${(props) => props.theme.textSecondary};
  margin-bottom: 1.6rem;
`;

const LinkList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin-bottom: 1.6rem;
`;

const LinkItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1.2rem;
  padding: 1rem 1.2rem;
  background: ${(props) => props.theme.surface};
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 4px;
`;

const LinkLabel = styled.span`
  font-size: 1.4rem;
  font-weight: 500;
  color: ${(props) => props.theme.textPrimary};
  min-width: 10rem;
`;

const LinkUrl = styled.span`
  font-size: 1.3rem;
  color: ${(props) => props.theme.textSecondary};
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const DeleteButton = styled.button`
  padding: 0.4rem 0.8rem;
  background: transparent;
  color: ${(props) => props.theme.textSecondary};
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 4px;
  font-size: 1.2rem;
  cursor: pointer;

  &:hover {
    background: ${(props) => props.theme.surfaceHover};
    color: #dc2626;
    border-color: #dc2626;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const AddLinkForm = styled.div`
  display: flex;
  gap: 1rem;
  align-items: flex-end;
  flex-wrap: wrap;

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

const InputLabel = styled.label`
  font-size: 1.2rem;
  color: ${(props) => props.theme.textSecondary};
`;

const LinkInput = styled.input`
  padding: 0.8rem 1.2rem;
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 4px;
  font-size: 1.4rem;
  background: ${(props) => props.theme.background};
  color: ${(props) => props.theme.textPrimary};

  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.textSecondary};
  }
`;

const AddButton = styled.button`
  height: 3.5rem;
  padding: 0 1.6rem;
  background: ${(props) => props.theme.surface};
  color: ${(props) => props.theme.textPrimary};
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 4px;
  font-size: 1.4rem;
  cursor: pointer;

  &:hover {
    background: ${(props) => props.theme.surfaceHover};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  padding: 2rem;
  text-align: center;
  color: ${(props) => props.theme.textSecondary};
  font-size: 1.4rem;
  background: ${(props) => props.theme.surface};
  border: 1px dashed ${(props) => props.theme.surfaceBorder};
  border-radius: 4px;
  margin-bottom: 1.6rem;
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid ${(props) => props.theme.surfaceBorder};
  margin: 3.2rem 0;
`;

interface AuthLabels {
  login: string;
  logout: string;
}

interface SidebarLabels {
  admin: string;
  backToHome: string;
  boards: string;
  users: string;
  roles?: string;
  settings?: string;
  globalNotices?: string;
}

interface Labels {
  title: string;
  siteTitle: string;
  siteTitlePlaceholder: string;
  siteTitleDescription: string;
  siteDescription: string;
  siteDescriptionPlaceholder: string;
  siteDescriptionDescription: string;
  countryCode: string;
  countryCodePlaceholder: string;
  countryCodeDescription: string;
  homepageContent: string;
  homepageContentPlaceholder: string;
  homepageContentDescription: string;
  tripcodeSalt: string;
  tripcodeSaltPlaceholder: string;
  tripcodeSaltDescription: string;
  save: string;
  saved: string;
  geoIpStatus: string;
  geoIpAvailable: string;
  geoIpUnavailable: string;
  geoIpUnavailableDescription: string;
  customLinks: string;
  customLinksDescription: string;
  addLink: string;
  linkLabel: string;
  linkLabelPlaceholder: string;
  linkUrl: string;
  linkUrlPlaceholder: string;
  noLinks: string;
  deleteLink: string;
  indexCustomHtml: string;
  indexCustomHtmlPlaceholder: string;
  indexCustomHtmlDescription: string;
  threadCustomHtml: string;
  threadCustomHtmlPlaceholder: string;
  threadCustomHtmlDescription: string;
  gaTrackingId: string;
  gaTrackingIdPlaceholder: string;
  gaTrackingIdDescription: string;
  cacheManagement: string;
  cacheManagementDescription: string;
  invalidateAll: string;
  invalidating: string;
  invalidated: string;
}

const Select = styled.select`
  width: 100%;
  max-width: 20rem;
  padding: 0.8rem 1.2rem;
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 4px;
  font-size: 1.4rem;
  background: ${(props) => props.theme.background};
  color: ${(props) => props.theme.textPrimary};

  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.textSecondary};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

interface AdminSettingsContentProps {
  initialSettings: {
    siteTitle: string;
    siteDescription: string;
    countryCode: string;
    homepageContent: string | null;
    customLinks: CustomLink[];
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
  };
  geoIpAvailable: boolean;
  authLabels: AuthLabels;
  sidebarLabels: SidebarLabels;
  labels: Labels;
  canUpdate: boolean;
}

export function AdminSettingsContent({
  initialSettings,
  geoIpAvailable,
  authLabels,
  sidebarLabels,
  labels,
  canUpdate,
}: AdminSettingsContentProps) {
  const [siteTitle, setSiteTitle] = useState(initialSettings.siteTitle);
  const [siteDescription, setSiteDescription] = useState(initialSettings.siteDescription);
  const [countryCode, setCountryCode] = useState(initialSettings.countryCode);
  const [homepageContent, setHomepageContent] = useState(initialSettings.homepageContent ?? "");
  const [indexCustomHtml, setIndexCustomHtml] = useState(initialSettings.indexCustomHtml ?? "");
  const [threadCustomHtml, setThreadCustomHtml] = useState(initialSettings.threadCustomHtml ?? "");
  const [tripcodeSalt, setTripcodeSalt] = useState(initialSettings.tripcodeSalt ?? "");
  const [gaTrackingId, setGaTrackingId] = useState(initialSettings.gaTrackingId ?? "");
  const [realtimeProvider, setRealtimeProvider] = useState(initialSettings.realtimeProvider ?? "");
  const [realtimeApiKey, setRealtimeApiKey] = useState(initialSettings.realtimeApiKey ?? "");
  const [storageProvider, setStorageProvider] = useState(initialSettings.storageProvider ?? "");
  const [storageUrl, setStorageUrl] = useState(initialSettings.storageUrl ?? "");
  const [storageSecret, setStorageSecret] = useState(initialSettings.storageSecret ?? "");
  const [storageBucket, setStorageBucket] = useState(initialSettings.storageBucket ?? "");
  const [customLinks, setCustomLinks] = useState<CustomLink[]>(initialSettings.customLinks);
  const [newLinkLabel, setNewLinkLabel] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [cacheInvalidating, setCacheInvalidating] = useState(false);
  const [cacheInvalidated, setCacheInvalidated] = useState(false);

  const handleAddLink = () => {
    if (!newLinkLabel.trim() || !newLinkUrl.trim()) return;
    const newLink: CustomLink = {
      id: nanoid(10),
      label: newLinkLabel.trim(),
      url: newLinkUrl.trim(),
    };
    setCustomLinks([...customLinks, newLink]);
    setNewLinkLabel("");
    setNewLinkUrl("");
  };

  const handleDeleteLink = (id: string) => {
    setCustomLinks(customLinks.filter((link) => link.id !== id));
  };

  const handleSave = async () => {
    if (!canUpdate) return;
    setLoading(true);
    setSaved(false);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteTitle,
          siteDescription: siteDescription || null,
          countryCode: countryCode.toUpperCase(),
          homepageContent: homepageContent || null,
          indexCustomHtml: indexCustomHtml || null,
          threadCustomHtml: threadCustomHtml || null,
          tripcodeSalt: tripcodeSalt || null,
          gaTrackingId: gaTrackingId || null,
          realtimeProvider: realtimeProvider || null,
          realtimeApiKey: realtimeApiKey || null,
          storageProvider: storageProvider || null,
          storageUrl: storageUrl || null,
          storageSecret: storageSecret || null,
          storageBucket: storageBucket || null,
          customLinks,
        }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInvalidateCache = async () => {
    if (!canUpdate) return;
    setCacheInvalidating(true);
    setCacheInvalidated(false);
    try {
      const res = await fetch("/api/admin/cache", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });

      if (res.ok) {
        setCacheInvalidated(true);
        setTimeout(() => setCacheInvalidated(false), 3000);
      }
    } finally {
      setCacheInvalidating(false);
    }
  };

  const sidebar = <AdminSidebar labels={sidebarLabels} />;

  return (
    <PageLayout
      title={labels.title}
      sidebar={sidebar}
      isLoggedIn={true}
      canAccessAdmin={true}
      authLabels={authLabels}
      isAdminPage
    >
      <Container>
        <Header>
          <Title>{labels.title}</Title>
        </Header>

        <FormGroup>
          <Label htmlFor="siteTitle">{labels.siteTitle}</Label>
          <TitleInput
            id="siteTitle"
            type="text"
            value={siteTitle}
            onChange={(e) => setSiteTitle(e.target.value)}
            placeholder={labels.siteTitlePlaceholder}
            maxLength={100}
            disabled={!canUpdate}
          />
          <Description>{labels.siteTitleDescription}</Description>
        </FormGroup>

        <FormGroup>
          <Label htmlFor="siteDescription">{labels.siteDescription}</Label>
          <TitleInput
            id="siteDescription"
            type="text"
            value={siteDescription}
            onChange={(e) => setSiteDescription(e.target.value)}
            placeholder={labels.siteDescriptionPlaceholder}
            maxLength={500}
            disabled={!canUpdate}
          />
          <Description>{labels.siteDescriptionDescription}</Description>
        </FormGroup>

        <Divider />

        <StatusBox $available={geoIpAvailable}>
          <StatusTitle $available={geoIpAvailable}>
            {labels.geoIpStatus}: {geoIpAvailable ? labels.geoIpAvailable : labels.geoIpUnavailable}
          </StatusTitle>
          {!geoIpAvailable && (
            <StatusDescription>{labels.geoIpUnavailableDescription}</StatusDescription>
          )}
        </StatusBox>

        <FormGroup>
          <Label htmlFor="countryCode">{labels.countryCode}</Label>
          <Input
            id="countryCode"
            type="text"
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value.slice(0, 2))}
            placeholder={labels.countryCodePlaceholder}
            maxLength={2}
            disabled={!canUpdate}
          />
          <Description>{labels.countryCodeDescription}</Description>
        </FormGroup>

        <FormGroup>
          <Label htmlFor="homepageContent">{labels.homepageContent}</Label>
          <TextArea
            id="homepageContent"
            value={homepageContent}
            onChange={(e) => setHomepageContent(e.target.value)}
            placeholder={labels.homepageContentPlaceholder}
            disabled={!canUpdate}
          />
          <Description>{labels.homepageContentDescription}</Description>
        </FormGroup>

        <FormGroup>
          <Label htmlFor="indexCustomHtml">{labels.indexCustomHtml}</Label>
          <TextArea
            id="indexCustomHtml"
            value={indexCustomHtml}
            onChange={(e) => setIndexCustomHtml(e.target.value)}
            placeholder={labels.indexCustomHtmlPlaceholder}
            disabled={!canUpdate}
          />
          <Description>{labels.indexCustomHtmlDescription}</Description>
        </FormGroup>

        <FormGroup>
          <Label htmlFor="threadCustomHtml">{labels.threadCustomHtml}</Label>
          <TextArea
            id="threadCustomHtml"
            value={threadCustomHtml}
            onChange={(e) => setThreadCustomHtml(e.target.value)}
            placeholder={labels.threadCustomHtmlPlaceholder}
            disabled={!canUpdate}
          />
          <Description>{labels.threadCustomHtmlDescription}</Description>
        </FormGroup>

        <FormGroup>
          <Label htmlFor="gaTrackingId">{labels.gaTrackingId}</Label>
          <TitleInput
            id="gaTrackingId"
            type="text"
            value={gaTrackingId}
            onChange={(e) => setGaTrackingId(e.target.value)}
            placeholder={labels.gaTrackingIdPlaceholder}
            maxLength={50}
            disabled={!canUpdate}
          />
          <Description>{labels.gaTrackingIdDescription}</Description>
        </FormGroup>

        <FormGroup>
          <Label htmlFor="tripcodeSalt">{labels.tripcodeSalt}</Label>
          <SaltInput
            id="tripcodeSalt"
            type="text"
            value={tripcodeSalt}
            onChange={(e) => setTripcodeSalt(e.target.value)}
            placeholder={labels.tripcodeSaltPlaceholder}
            maxLength={100}
            disabled={!canUpdate}
          />
          <Description>{labels.tripcodeSaltDescription}</Description>
        </FormGroup>

        <Divider />

        <FormGroup>
          <SectionTitle>Realtime</SectionTitle>
          <SectionDescription>Configure realtime messaging provider for chat mode.</SectionDescription>

          <Label htmlFor="realtimeProvider">Provider</Label>
          <Select
            id="realtimeProvider"
            value={realtimeProvider}
            onChange={(e) => setRealtimeProvider(e.target.value)}
            disabled={!canUpdate}
          >
            <option value="">None</option>
            <option value="ably">Ably</option>
          </Select>
          <Description>Select a realtime provider to enable chat mode.</Description>
        </FormGroup>

        {realtimeProvider && (
          <FormGroup>
            <Label htmlFor="realtimeApiKey">API Key</Label>
            <TitleInput
              id="realtimeApiKey"
              type="password"
              value={realtimeApiKey}
              onChange={(e) => setRealtimeApiKey(e.target.value)}
              placeholder="Enter API key"
              maxLength={200}
              disabled={!canUpdate}
            />
            <Description>Server-side API key for the realtime provider.</Description>
          </FormGroup>
        )}

        <Divider />

        <FormGroup>
          <SectionTitle>Storage</SectionTitle>
          <SectionDescription>Configure storage provider for file uploads.</SectionDescription>

          <Label htmlFor="storageProvider">Provider</Label>
          <Select
            id="storageProvider"
            value={storageProvider}
            onChange={(e) => setStorageProvider(e.target.value)}
            disabled={!canUpdate}
          >
            <option value="">None</option>
            <option value="supabase">Supabase</option>
          </Select>
          <Description>Select a storage provider to enable file uploads.</Description>
        </FormGroup>

        {storageProvider && (
          <>
            <FormGroup>
              <Label htmlFor="storageUrl">URL</Label>
              <TitleInput
                id="storageUrl"
                type="text"
                value={storageUrl}
                onChange={(e) => setStorageUrl(e.target.value)}
                placeholder="https://your-project.supabase.co"
                maxLength={200}
                disabled={!canUpdate}
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="storageSecret">Service Key</Label>
              <TitleInput
                id="storageSecret"
                type="password"
                value={storageSecret}
                onChange={(e) => setStorageSecret(e.target.value)}
                placeholder="Enter service key"
                maxLength={500}
                disabled={!canUpdate}
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="storageBucket">Bucket Name</Label>
              <TitleInput
                id="storageBucket"
                type="text"
                value={storageBucket}
                onChange={(e) => setStorageBucket(e.target.value)}
                placeholder="attachments"
                maxLength={100}
                disabled={!canUpdate}
              />
            </FormGroup>
          </>
        )}

        <Divider />

        <FormGroup>
          <SectionTitle>{labels.customLinks}</SectionTitle>
          <SectionDescription>{labels.customLinksDescription}</SectionDescription>

          {customLinks.length === 0 ? (
            <EmptyState>{labels.noLinks}</EmptyState>
          ) : (
            <LinkList>
              {customLinks.map((link) => (
                <LinkItem key={link.id}>
                  <LinkLabel>{link.label}</LinkLabel>
                  <LinkUrl>{link.url}</LinkUrl>
                  {canUpdate && (
                    <DeleteButton onClick={() => handleDeleteLink(link.id)}>
                      {labels.deleteLink}
                    </DeleteButton>
                  )}
                </LinkItem>
              ))}
            </LinkList>
          )}

          {canUpdate && (
            <AddLinkForm>
              <InputGroup>
                <InputLabel>{labels.linkLabel}</InputLabel>
                <LinkInput
                  type="text"
                  value={newLinkLabel}
                  onChange={(e) => setNewLinkLabel(e.target.value)}
                  placeholder={labels.linkLabelPlaceholder}
                />
              </InputGroup>
              <InputGroup>
                <InputLabel>{labels.linkUrl}</InputLabel>
                <LinkInput
                  type="url"
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  placeholder={labels.linkUrlPlaceholder}
                  style={{ minWidth: "25rem" }}
                />
              </InputGroup>
              <AddButton
                onClick={handleAddLink}
                disabled={!newLinkLabel.trim() || !newLinkUrl.trim()}
              >
                {labels.addLink}
              </AddButton>
            </AddLinkForm>
          )}
        </FormGroup>

        <Divider />

        {canUpdate && (
          <FormGroup>
            <SectionTitle>{labels.cacheManagement}</SectionTitle>
            <SectionDescription>{labels.cacheManagementDescription}</SectionDescription>
            <div>
              <Button onClick={handleInvalidateCache} disabled={cacheInvalidating}>
                {cacheInvalidating ? labels.invalidating : labels.invalidateAll}
              </Button>
              {cacheInvalidated && <SuccessMessage>{labels.invalidated}</SuccessMessage>}
            </div>
          </FormGroup>
        )}

        <Divider />

        {canUpdate && (
          <div>
            <Button onClick={handleSave} disabled={loading || countryCode.length !== 2 || !siteTitle.trim()}>
              {labels.save}
            </Button>
            {saved && <SuccessMessage>{labels.saved}</SuccessMessage>}
          </div>
        )}
      </Container>
    </PageLayout>
  );
}
