"use client";

import styled from "styled-components";
import { useThemeStore } from "@/lib/store/theme";

const Container = styled.div`
  min-height: 100vh;
  padding: 40px;
  background: ${(props) => props.theme.background};
  color: ${(props) => props.theme.textPrimary};
  transition: background 0.3s, color 0.3s;
`;

const Title = styled.h1`
  font-size: 2rem;
  margin-bottom: 24px;
`;

const Section = styled.section`
  margin-bottom: 32px;
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  margin-bottom: 16px;
  color: ${(props) => props.theme.textSecondary};
`;

const ThemeToggleButton = styled.button`
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: bold;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  background: ${(props) => props.theme.primary};
  color: white;
  transition: background 0.2s;

  &:hover {
    opacity: 0.9;
  }
`;

const ThemeInfo = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
  margin-top: 16px;
`;

const Badge = styled.span`
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 0.875rem;
  background: ${(props) => props.theme.surface};
  border: 1px solid ${(props) => props.theme.surfaceBorder};
`;

const ColorGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
`;

const ColorCard = styled.div<{ $bg: string; $fg?: string }>`
  padding: 16px;
  border-radius: 8px;
  background: ${(props) => props.$bg};
  color: ${(props) => props.$fg || "#fff"};
  border: 1px solid ${(props) => props.theme.surfaceBorder};
`;

const ColorName = styled.div`
  font-weight: bold;
  margin-bottom: 4px;
`;

const ColorValue = styled.div`
  font-size: 0.75rem;
  font-family: monospace;
  opacity: 0.8;
`;

const Surface = styled.div`
  padding: 24px;
  border-radius: 8px;
  background: ${(props) => props.theme.surface};
  border: 1px solid ${(props) => props.theme.surfaceBorder};
`;

const TextSamples = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const TextPrimary = styled.p`
  color: ${(props) => props.theme.textPrimary};
`;

const TextSecondary = styled.p`
  color: ${(props) => props.theme.textSecondary};
`;

const TextMuted = styled.p`
  color: ${(props) => props.theme.textMuted};
`;

const StatusRow = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const StatusBadge = styled.span<{ $type: "success" | "warning" | "error" | "info" }>`
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 0.875rem;
  color: white;
  background: ${(props) => props.theme[props.$type]};
`;

const Link = styled.a`
  color: ${(props) => props.theme.anchorALinkColor};
  cursor: pointer;
  text-decoration: underline;
`;

function ThemeDemo() {
  const { mode, setMode, toggleMode } = useThemeStore();

  return (
    <Container>
      <Title>Theme Demo</Title>

      <Section>
        <SectionTitle>Theme Control</SectionTitle>
        <ThemeToggleButton onClick={toggleMode}>
          Toggle Theme
        </ThemeToggleButton>
        <ThemeInfo>
          <span>Current:</span>
          <Badge>{mode}</Badge>
          <ThemeToggleButton
            onClick={() => setMode("light")}
            style={{ padding: "8px 16px", fontSize: "0.875rem" }}
          >
            Light
          </ThemeToggleButton>
          <ThemeToggleButton
            onClick={() => setMode("dark")}
            style={{ padding: "8px 16px", fontSize: "0.875rem" }}
          >
            Dark
          </ThemeToggleButton>
        </ThemeInfo>
      </Section>

      <Section>
        <SectionTitle>Colors</SectionTitle>
        <ColorGrid>
          <ColorCard $bg="var(--background)" $fg="var(--foreground)">
            <ColorName>Background</ColorName>
            <ColorValue>theme.background</ColorValue>
          </ColorCard>
          <ColorCard $bg={mode === "light" ? "#0066cc" : "#4da6ff"}>
            <ColorName>Primary</ColorName>
            <ColorValue>theme.primary</ColorValue>
          </ColorCard>
          <ColorCard $bg={mode === "light" ? "#6c757d" : "#adb5bd"}>
            <ColorName>Secondary</ColorName>
            <ColorValue>theme.secondary</ColorValue>
          </ColorCard>
          <ColorCard $bg={mode === "light" ? "#0d6efd" : "#5a9cff"}>
            <ColorName>Accent</ColorName>
            <ColorValue>theme.accent</ColorValue>
          </ColorCard>
        </ColorGrid>
      </Section>

      <Section>
        <SectionTitle>Surface</SectionTitle>
        <Surface>
          <TextSamples>
            <TextPrimary>Primary text - theme.textPrimary</TextPrimary>
            <TextSecondary>Secondary text - theme.textSecondary</TextSecondary>
            <TextMuted>Muted text - theme.textMuted</TextMuted>
            <Link>Anchor link - theme.anchorALinkColor</Link>
          </TextSamples>
        </Surface>
      </Section>

      <Section>
        <SectionTitle>Status Colors</SectionTitle>
        <StatusRow>
          <StatusBadge $type="success">Success</StatusBadge>
          <StatusBadge $type="warning">Warning</StatusBadge>
          <StatusBadge $type="error">Error</StatusBadge>
          <StatusBadge $type="info">Info</StatusBadge>
        </StatusRow>
      </Section>

      <Section>
        <SectionTitle>Persistence Test</SectionTitle>
        <Surface>
          <p>
            현재 테마 ({mode})가 localStorage에 저장됩니다.
            <br />
            페이지를 새로고침해도 테마가 유지되는지 확인하세요.
          </p>
        </Surface>
      </Section>
    </Container>
  );
}

export default function ThemeTestPage() {
  return <ThemeDemo />;
}
