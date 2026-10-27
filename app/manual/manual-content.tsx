"use client";

import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFont,
  faEye,
  faEyeSlash,
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
  faMoon,
  faCloud,
  faList,
  faComments,
  faFingerprint,
  faCommentDots,
  faCopy,
  faFilter,
  faXmark,
  faArrowsRotate,
  faBell,
  faToggleOn,
  faHourglassHalf,
  faMobileScreen,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { PageLayout } from "@/components/layout";
import { BoardListSidebar } from "@/components/sidebar/BoardListSidebar";

const Container = styled.div`
  width: 100%;
  max-width: ${(props) => props.theme.contentMaxWidth};
  margin: 0 auto;
  padding: 1.6rem 2.4rem 3.2rem;

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    padding: 1.2rem 1.4rem 2.4rem;
  }
`;

const Description = styled.p`
  font-size: 1.4rem;
  line-height: 1.6;
  color: ${(props) => props.theme.textSecondary};
  margin: 0;
  padding: 0 0.4rem;
`;

const Section = styled.section`
  margin-top: 2.8rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.3rem;
  font-weight: 500;
  color: ${(props) => props.theme.textMuted};
  margin: 0 0.4rem 0.6rem;
`;

const SectionDescription = styled.p`
  font-size: 1.4rem;
  line-height: 1.6;
  color: ${(props) => props.theme.textSecondary};
  margin: 0 0.4rem 1rem;
`;

const ItemList = styled.div`
  border: 1px solid ${(props) => props.theme.line};
  border-radius: ${(props) => props.theme.radiusControl};
  background: ${(props) => props.theme.paneSunken};
`;

const Item = styled.div`
  padding: 1.2rem 1.4rem;

  & + & {
    border-top: 1px solid ${(props) => props.theme.line};
  }
`;

const ItemHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 0.2rem;
`;

const ItemIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  font-size: 1.4rem;
  color: ${(props) => props.theme.textMuted};
`;

const ItemTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 500;
  color: ${(props) => props.theme.textPrimary};
  margin: 0;
`;

const ItemDescription = styled.p`
  font-size: 1.3rem;
  line-height: 1.5;
  color: ${(props) => props.theme.textSecondary};
  margin: 0;
`;

const Code = styled.code`
  font-family: ${(props) => props.theme.fontMono};
  font-size: 1.3rem;
  color: ${(props) => props.theme.textPrimary};
  white-space: pre-wrap;
  word-break: break-word;
`;

const TomExample = styled.div`
  margin-top: 0.6rem;
  padding: 0.6rem 1rem;
  border: 1px solid ${(props) => props.theme.line};
  border-radius: ${(props) => props.theme.radiusChip};
  background: ${(props) => props.theme.pane};
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
  responseInteraction: {
    title: string;
    description: string;
    seqCopyTitle: string;
    seqCopyDescription: string;
    filterTitle: string;
    filterDescription: string;
    filterToggleTitle: string;
    filterToggleDescription: string;
    filterRemoveTitle: string;
    filterRemoveDescription: string;
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
    refreshTitle: string;
    refreshDescription: string;
  };
  push?: {
    title: string;
    description: string;
    watchTitle: string;
    watchDescription: string;
    bellTitle: string;
    bellDescription: string;
    toggleTitle: string;
    toggleDescription: string;
    rulesTitle: string;
    rulesDescription: string;
    iosTitle: string;
    iosDescription: string;
    sidebarWatchTitle: string;
    sidebarWatchDescription: string;
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
    imgTitle: string;
    imgExample: string;
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

interface CustomLink {
  id: string;
  label: string;
  url: string;
}

interface ManualContentProps {
  boards: BoardData[];
  customLinks?: CustomLink[];
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
  customLinks,
  isLoggedIn,
  canAccessAdmin,
  authLabels,
  boardsTitle,
  manualLabel,
  labels,
}: ManualContentProps) {
  const sidebar = <BoardListSidebar boards={boards} customLinks={customLinks} title={boardsTitle} manualLabel={manualLabel} />;

  return (
    <PageLayout
      title={labels.title}
      sidebar={sidebar}
      isLoggedIn={isLoggedIn}
      canAccessAdmin={canAccessAdmin}
      authLabels={authLabels}
    >
      <Container>
        <Description>{labels.description}</Description>

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

        {/* Response Interaction */}
        <Section>
          <SectionTitle>{labels.responseInteraction.title}</SectionTitle>
          <SectionDescription>{labels.responseInteraction.description}</SectionDescription>
          <ItemList>
            <SettingItem
              icon={faCopy}
              title={labels.responseInteraction.seqCopyTitle}
              description={labels.responseInteraction.seqCopyDescription}
            />
            <SettingItem
              icon={faFilter}
              title={labels.responseInteraction.filterTitle}
              description={labels.responseInteraction.filterDescription}
            />
            <SettingItem
              icon={faEyeSlash}
              title={labels.responseInteraction.filterToggleTitle}
              description={labels.responseInteraction.filterToggleDescription}
            />
            <SettingItem
              icon={faXmark}
              title={labels.responseInteraction.filterRemoveTitle}
              description={labels.responseInteraction.filterRemoveDescription}
            />
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
            <SettingItem
              icon={faArrowsRotate}
              title={labels.settings.refreshTitle}
              description={labels.settings.refreshDescription}
            />
          </ItemList>
        </Section>

        {/* Notifications (web push) */}
        {labels.push && (
          <Section>
            <SectionTitle>{labels.push.title}</SectionTitle>
            <SectionDescription>{labels.push.description}</SectionDescription>
            <ItemList>
              <SettingItem
                icon={faBell}
                title={labels.push.watchTitle}
                description={labels.push.watchDescription}
              />
              <SettingItem
                icon={faList}
                title={labels.push.bellTitle}
                description={labels.push.bellDescription}
              />
              <SettingItem
                icon={faToggleOn}
                title={labels.push.toggleTitle}
                description={labels.push.toggleDescription}
              />
              <SettingItem
                icon={faHourglassHalf}
                title={labels.push.rulesTitle}
                description={labels.push.rulesDescription}
              />
              <SettingItem
                icon={faMobileScreen}
                title={labels.push.iosTitle}
                description={labels.push.iosDescription}
              />
            </ItemList>
          </Section>
        )}

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
                <ItemTitle>{labels.tom.imgTitle}</ItemTitle>
              </ItemHeader>
              <TomExample><Code>{labels.tom.imgExample}</Code></TomExample>
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
            {labels.push && (
              <SettingItem
                icon={faBell}
                title={labels.push.sidebarWatchTitle}
                description={labels.push.sidebarWatchDescription}
              />
            )}
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
