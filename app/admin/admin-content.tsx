"use client";

import styled from "styled-components";

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
`;

const Card = styled.div`
  background: ${(props) => props.theme.surface};
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 8px;
  padding: 2rem;
  width: 100%;
  max-width: 600px;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  text-align: center;
  color: ${(props) => props.theme.textPrimary};
`;

const Stats = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const Stat = styled.div`
  flex: 1;
  background: ${(props) => props.theme.surfaceHover};
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
`;

const StatValue = styled.span`
  display: block;
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  color: ${(props) => props.theme.textPrimary};
`;

const StatLabel = styled.span`
  font-size: 0.75rem;
  color: ${(props) => props.theme.textSecondary};
`;

const Section = styled.div`
  border-top: 1px solid ${(props) => props.theme.surfaceBorder};
  padding-top: 1.5rem;
`;

const SectionTitle = styled.h2`
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 1rem;
  color: ${(props) => props.theme.textPrimary};
`;

const Permissions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const Permission = styled.span`
  background: ${(props) => props.theme.surfaceHover};
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.875rem;
  font-family: monospace;
  color: ${(props) => props.theme.textPrimary};
`;

interface AdminContentProps {
  title: string;
  userCount: number;
  roleCount: number;
  permissionCount: number;
  usersLabel: string;
  rolesLabel: string;
  permissionsLabel: string;
  myPermissionsLabel: string;
  permissions: string[];
}

export function AdminContent({
  title,
  userCount,
  roleCount,
  permissionCount,
  usersLabel,
  rolesLabel,
  permissionsLabel,
  myPermissionsLabel,
  permissions,
}: AdminContentProps) {
  return (
    <Container>
      <Card>
        <Title>{title}</Title>

        <Stats>
          <Stat>
            <StatValue>{userCount}</StatValue>
            <StatLabel>{usersLabel}</StatLabel>
          </Stat>
          <Stat>
            <StatValue>{roleCount}</StatValue>
            <StatLabel>{rolesLabel}</StatLabel>
          </Stat>
          <Stat>
            <StatValue>{permissionCount}</StatValue>
            <StatLabel>{permissionsLabel}</StatLabel>
          </Stat>
        </Stats>

        <Section>
          <SectionTitle>{myPermissionsLabel}</SectionTitle>
          <Permissions>
            {permissions.map((permission) => (
              <Permission key={permission}>{permission}</Permission>
            ))}
          </Permissions>
        </Section>
      </Card>
    </Container>
  );
}
