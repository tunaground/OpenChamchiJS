"use client";

import { useState } from "react";
import styled from "styled-components";
import { PageLayout } from "@/components/layout";
import { AdminSidebar } from "@/components/sidebar/AdminSidebar";

const Container = styled.div`
  padding: 3.2rem;
  max-width: 120rem;
  margin: 0 auto;

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    padding: 1.6rem;
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
}

interface Labels {
  title: string;
  countryCode: string;
  countryCodePlaceholder: string;
  countryCodeDescription: string;
  save: string;
  saved: string;
  geoIpStatus: string;
  geoIpAvailable: string;
  geoIpUnavailable: string;
  geoIpUnavailableDescription: string;
}

interface AdminSettingsContentProps {
  initialSettings: {
    countryCode: string;
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
  const [countryCode, setCountryCode] = useState(initialSettings.countryCode);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!canUpdate) return;
    setLoading(true);
    setSaved(false);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ countryCode: countryCode.toUpperCase() }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setLoading(false);
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
    >
      <Container>
        <Header>
          <Title>{labels.title}</Title>
        </Header>

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

        {canUpdate && (
          <div>
            <Button onClick={handleSave} disabled={loading || countryCode.length !== 2}>
              {labels.save}
            </Button>
            {saved && <SuccessMessage>{labels.saved}</SuccessMessage>}
          </div>
        )}
      </Container>
    </PageLayout>
  );
}
