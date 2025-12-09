"use client";

import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFont,
  faEye,
  faArrowUp,
  faArrowDown,
  faKeyboard,
  faArrowLeft,
  faGear,
  faPersonRunning,
  faClock,
  faChevronLeft,
  faChevronRight,
  faChevronUp,
  faChevronDown,
  faSun,
  faCloud,
  faMoon,
  faList,
  faComments,
  faFingerprint,
  faCommentDots,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { PageLayout } from "@/components/layout";
import { BoardListSidebar } from "@/components/sidebar/BoardListSidebar";

const Container = styled.div`
  padding: 3.2rem;
  max-width: 80rem;
  margin: 0 auto;

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    padding: 1.6rem;
  }
`;

const Header = styled.div`
  margin-bottom: 3.2rem;
`;

const Title = styled.h1`
  font-size: 2.4rem;
  font-weight: 600;
  color: ${(props) => props.theme.textPrimary};
  margin: 0 0 0.8rem 0;
`;

const Description = styled.p`
  font-size: 1.4rem;
  color: ${(props) => props.theme.textSecondary};
  margin: 0;
  line-height: 1.6;
`;

const Section = styled.section`
  background: ${(props) => props.theme.surface};
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 8px;
  padding: 2.4rem;
  margin-bottom: 2.4rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.8rem;
  font-weight: 600;
  color: ${(props) => props.theme.textPrimary};
  margin: 0 0 1.2rem 0;
`;

const SectionDescription = styled.p`
  font-size: 1.4rem;
  color: ${(props) => props.theme.textSecondary};
  margin: 0 0 2rem 0;
  line-height: 1.6;
`;

const ItemList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
`;

const Item = styled.div`
  padding: 1.2rem;
  border-radius: 8px;
  background: ${(props) => props.theme.surfaceHover};
`;

const ItemHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 0.4rem;
`;

const ItemIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  font-size: 1.4rem;
  color: ${(props) => props.theme.textSecondary};
`;

const ItemTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 500;
  color: ${(props) => props.theme.textPrimary};
  margin: 0;
`;

const ItemDescription = styled.p`
  font-size: 1.3rem;
  color: ${(props) => props.theme.textSecondary};
  margin: 0;
  line-height: 1.5;
`;

const Code = styled.code`
  background: ${(props) => props.theme.background};
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  font-family: monospace;
  font-size: 1.2rem;
  color: ${(props) => props.theme.textPrimary};
`;

const TomExample = styled.div`
  margin-top: 0.8rem;
  padding: 0.8rem;
  background: ${(props) => props.theme.background};
  border-radius: 4px;
  font-family: monospace;
  font-size: 1.2rem;
  color: ${(props) => props.theme.textSecondary};
`;

interface BoardData {
  id: string;
  name: string;
}

interface Labels {
  title: string;
  description: string;
  basics: {
    title: string;
    threadTitle: string;
    threadDescription: string;
    responseTitle: string;
    responseDescription: string;
    authorIdTitle: string;
    authorIdDescription: string;
  };
  threadSettings: {
    title: string;
    description: string;
    endedTitle: string;
    endedDescription: string;
    passwordTitle: string;
    passwordDescription: string;
  };
  settings: {
    title: string;
    description: string;
    quickSubmitTitle: string;
    quickSubmitDescription: string;
    chatModeTitle: string;
    chatModeDescription: string;
    aaModeTitle: string;
    aaModeDescription: string;
    previewModeTitle: string;
    previewModeDescription: string;
    noupModeTitle: string;
    noupModeDescription: string;
    alwaysBottomTitle: string;
    alwaysBottomDescription: string;
  };
  tom: {
    title: string;
    description: string;
    boldTitle: string;
    boldExample: string;
    italicTitle: string;
    italicExample: string;
    colorTitle: string;
    colorExample: string;
    colorGlowTitle: string;
    colorGlowExample: string;
    spoilerTitle: string;
    spoilerExample: string;
    subTitle: string;
    subExample: string;
    rubyTitle: string;
    rubyExample: string;
    aaTitle: string;
    aaExample: string;
    diceTitle: string;
    diceExample: string;
    calcTitle: string;
    calcExample: string;
    anchorTitle: string;
    anchorExample: string;
    youtubeTitle: string;
    youtubeExample: string;
    hrTitle: string;
    hrExample: string;
  };
  theme: {
    title: string;
    description: string;
    lightTitle: string;
    lightDescription: string;
    greyTitle: string;
    greyDescription: string;
    darkTitle: string;
    darkDescription: string;
  };
  userCounter?: {
    title: string;
    description: string;
    indexTitle: string;
    indexDescription: string;
    traceTitle: string;
    traceDescription: string;
    deduplicationTitle: string;
    deduplicationDescription: string;
  };
  sidebar: {
    title: string;
    description: string;
    backTitle: string;
    backDescription: string;
    manageTitle: string;
    manageDescription: string;
    viewAllTitle: string;
    viewAllDescription: string;
    viewRecentTitle: string;
    viewRecentDescription: string;
    prevTitle: string;
    prevDescription: string;
    nextTitle: string;
    nextDescription: string;
    scrollUpTitle: string;
    scrollUpDescription: string;
    scrollDownTitle: string;
    scrollDownDescription: string;
  };
}

interface ManualContentProps {
  boards: BoardData[];
  isLoggedIn: boolean;
  canAccessAdmin: boolean;
  authLabels: { login: string; logout: string };
  boardsTitle: string;
  manualLabel: string;
  labels: Labels;
}

interface SettingItemProps {
  icon?: IconDefinition;
  title: string;
  description: string;
}

function SettingItem({ icon, title, description }: SettingItemProps) {
  return (
    <Item>
      <ItemHeader>
        {icon && (
          <ItemIcon>
            <FontAwesomeIcon icon={icon} />
          </ItemIcon>
        )}
        <ItemTitle>{title}</ItemTitle>
      </ItemHeader>
      <ItemDescription>{description}</ItemDescription>
    </Item>
  );
}

export function ManualContent({
  boards,
  isLoggedIn,
  canAccessAdmin,
  authLabels,
  boardsTitle,
  manualLabel,
  labels,
}: ManualContentProps) {
  const sidebar = <BoardListSidebar boards={boards} title={boardsTitle} manualLabel={manualLabel} />;

  return (
    <PageLayout
      title={labels.title}
      sidebar={sidebar}
      isLoggedIn={isLoggedIn}
      canAccessAdmin={canAccessAdmin}
      authLabels={authLabels}
    >
      <Container>
        <Header>
          <Title>{labels.title}</Title>
          <Description>{labels.description}</Description>
        </Header>

        {/* Basics */}
        <Section>
          <SectionTitle>{labels.basics.title}</SectionTitle>
          <ItemList>
            <Item>
              <ItemHeader>
                <ItemTitle>{labels.basics.threadTitle}</ItemTitle>
              </ItemHeader>
              <ItemDescription>{labels.basics.threadDescription}</ItemDescription>
            </Item>
            <Item>
              <ItemHeader>
                <ItemTitle>{labels.basics.responseTitle}</ItemTitle>
              </ItemHeader>
              <ItemDescription>{labels.basics.responseDescription}</ItemDescription>
            </Item>
            <Item>
              <ItemHeader>
                <ItemTitle>{labels.basics.authorIdTitle}</ItemTitle>
              </ItemHeader>
              <ItemDescription>{labels.basics.authorIdDescription}</ItemDescription>
            </Item>
          </ItemList>
        </Section>

        {/* Thread Settings */}
        <Section>
          <SectionTitle>{labels.threadSettings.title}</SectionTitle>
          <SectionDescription>{labels.threadSettings.description}</SectionDescription>
          <ItemList>
            <Item>
              <ItemHeader>
                <ItemTitle>{labels.threadSettings.endedTitle}</ItemTitle>
              </ItemHeader>
              <ItemDescription>{labels.threadSettings.endedDescription}</ItemDescription>
            </Item>
            <Item>
              <ItemHeader>
                <ItemTitle>{labels.threadSettings.passwordTitle}</ItemTitle>
              </ItemHeader>
              <ItemDescription>{labels.threadSettings.passwordDescription}</ItemDescription>
            </Item>
          </ItemList>
        </Section>

        {/* Settings */}
        <Section>
          <SectionTitle>{labels.settings.title}</SectionTitle>
          <SectionDescription>{labels.settings.description}</SectionDescription>
          <ItemList>
            <SettingItem
              icon={faKeyboard}
              title={labels.settings.quickSubmitTitle}
              description={labels.settings.quickSubmitDescription}
            />
            <SettingItem
              icon={faCommentDots}
              title={labels.settings.chatModeTitle}
              description={labels.settings.chatModeDescription}
            />
            <SettingItem
              icon={faFont}
              title={labels.settings.aaModeTitle}
              description={labels.settings.aaModeDescription}
            />
            <SettingItem
              icon={faEye}
              title={labels.settings.previewModeTitle}
              description={labels.settings.previewModeDescription}
            />
            <SettingItem
              icon={faArrowUp}
              title={labels.settings.noupModeTitle}
              description={labels.settings.noupModeDescription}
            />
            <SettingItem
              icon={faArrowDown}
              title={labels.settings.alwaysBottomTitle}
              description={labels.settings.alwaysBottomDescription}
            />
          </ItemList>
        </Section>

        {/* Theme */}
        <Section>
          <SectionTitle>{labels.theme.title}</SectionTitle>
          <SectionDescription>{labels.theme.description}</SectionDescription>
          <ItemList>
            <SettingItem
              icon={faSun}
              title={labels.theme.lightTitle}
              description={labels.theme.lightDescription}
            />
            <SettingItem
              icon={faCloud}
              title={labels.theme.greyTitle}
              description={labels.theme.greyDescription}
            />
            <SettingItem
              icon={faMoon}
              title={labels.theme.darkTitle}
              description={labels.theme.darkDescription}
            />
          </ItemList>
        </Section>

        {/* User Counter */}
        {labels.userCounter && (
          <Section>
            <SectionTitle>{labels.userCounter.title}</SectionTitle>
            <SectionDescription>{labels.userCounter.description}</SectionDescription>
            <ItemList>
              <SettingItem
                icon={faList}
                title={labels.userCounter.indexTitle}
                description={labels.userCounter.indexDescription}
              />
              <SettingItem
                icon={faComments}
                title={labels.userCounter.traceTitle}
                description={labels.userCounter.traceDescription}
              />
              <SettingItem
                icon={faFingerprint}
                title={labels.userCounter.deduplicationTitle}
                description={labels.userCounter.deduplicationDescription}
              />
            </ItemList>
          </Section>
        )}

        {/* TOM Markup */}
        <Section>
          <SectionTitle>{labels.tom.title}</SectionTitle>
          <SectionDescription>{labels.tom.description}</SectionDescription>
          <ItemList>
            <Item>
              <ItemHeader>
                <ItemTitle>{labels.tom.boldTitle}</ItemTitle>
              </ItemHeader>
              <TomExample><Code>{labels.tom.boldExample}</Code></TomExample>
            </Item>
            <Item>
              <ItemHeader>
                <ItemTitle>{labels.tom.italicTitle}</ItemTitle>
              </ItemHeader>
              <TomExample><Code>{labels.tom.italicExample}</Code></TomExample>
            </Item>
            <Item>
              <ItemHeader>
                <ItemTitle>{labels.tom.colorTitle}</ItemTitle>
              </ItemHeader>
              <TomExample><Code>{labels.tom.colorExample}</Code></TomExample>
            </Item>
            <Item>
              <ItemHeader>
                <ItemTitle>{labels.tom.colorGlowTitle}</ItemTitle>
              </ItemHeader>
              <TomExample><Code>{labels.tom.colorGlowExample}</Code></TomExample>
            </Item>
            <Item>
              <ItemHeader>
                <ItemTitle>{labels.tom.spoilerTitle}</ItemTitle>
              </ItemHeader>
              <TomExample><Code>{labels.tom.spoilerExample}</Code></TomExample>
            </Item>
            <Item>
              <ItemHeader>
                <ItemTitle>{labels.tom.subTitle}</ItemTitle>
              </ItemHeader>
              <TomExample><Code>{labels.tom.subExample}</Code></TomExample>
            </Item>
            <Item>
              <ItemHeader>
                <ItemTitle>{labels.tom.rubyTitle}</ItemTitle>
              </ItemHeader>
              <TomExample><Code>{labels.tom.rubyExample}</Code></TomExample>
            </Item>
            <Item>
              <ItemHeader>
                <ItemTitle>{labels.tom.aaTitle}</ItemTitle>
              </ItemHeader>
              <TomExample><Code>{labels.tom.aaExample}</Code></TomExample>
            </Item>
            <Item>
              <ItemHeader>
                <ItemTitle>{labels.tom.diceTitle}</ItemTitle>
              </ItemHeader>
              <TomExample><Code>{labels.tom.diceExample}</Code></TomExample>
            </Item>
            <Item>
              <ItemHeader>
                <ItemTitle>{labels.tom.calcTitle}</ItemTitle>
              </ItemHeader>
              <TomExample><Code>{labels.tom.calcExample}</Code></TomExample>
            </Item>
            <Item>
              <ItemHeader>
                <ItemTitle>{labels.tom.anchorTitle}</ItemTitle>
              </ItemHeader>
              <TomExample><Code>{labels.tom.anchorExample}</Code></TomExample>
            </Item>
            <Item>
              <ItemHeader>
                <ItemTitle>{labels.tom.youtubeTitle}</ItemTitle>
              </ItemHeader>
              <TomExample><Code>{labels.tom.youtubeExample}</Code></TomExample>
            </Item>
            <Item>
              <ItemHeader>
                <ItemTitle>{labels.tom.hrTitle}</ItemTitle>
              </ItemHeader>
              <TomExample><Code>{labels.tom.hrExample}</Code></TomExample>
            </Item>
          </ItemList>
        </Section>

        {/* Thread Page Menu */}
        <Section>
          <SectionTitle>{labels.sidebar.title}</SectionTitle>
          <SectionDescription>{labels.sidebar.description}</SectionDescription>
          <ItemList>
            <SettingItem
              icon={faArrowLeft}
              title={labels.sidebar.backTitle}
              description={labels.sidebar.backDescription}
            />
            <SettingItem
              icon={faGear}
              title={labels.sidebar.manageTitle}
              description={labels.sidebar.manageDescription}
            />
            <SettingItem
              icon={faPersonRunning}
              title={labels.sidebar.viewAllTitle}
              description={labels.sidebar.viewAllDescription}
            />
            <SettingItem
              icon={faClock}
              title={labels.sidebar.viewRecentTitle}
              description={labels.sidebar.viewRecentDescription}
            />
            <SettingItem
              icon={faChevronLeft}
              title={labels.sidebar.prevTitle}
              description={labels.sidebar.prevDescription}
            />
            <SettingItem
              icon={faChevronRight}
              title={labels.sidebar.nextTitle}
              description={labels.sidebar.nextDescription}
            />
            <SettingItem
              icon={faChevronUp}
              title={labels.sidebar.scrollUpTitle}
              description={labels.sidebar.scrollUpDescription}
            />
            <SettingItem
              icon={faChevronDown}
              title={labels.sidebar.scrollDownTitle}
              description={labels.sidebar.scrollDownDescription}
            />
          </ItemList>
        </Section>
      </Container>
    </PageLayout>
  );
}
