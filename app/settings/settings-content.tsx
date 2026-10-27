"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOutWithPush } from "@/lib/push/client";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFont,
  faEye,
  faArrowUp,
  faArrowDown,
  faArrowLeft,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { useTranslations } from "next-intl";
import { useThemeStore, type ThemePreference } from "@/lib/store/theme";
import { PageLayout } from "@/components/layout";
import { BoardListSidebar } from "@/components/sidebar/BoardListSidebar";
import {
  useResponseOptionsStore,
  ResponseOptions,
  QuickSubmitKey,
} from "@/lib/store/responseOptions";

const Container = styled.div`
  width: 100%;
  max-width: 80rem;
  padding: 1.6rem 2.8rem 3.2rem;

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    padding: 1.2rem 1.4rem 2.4rem;
  }
`;

const Description = styled.p`
  font-size: 1.4rem;
  color: ${(props) => props.theme.textSecondary};
  padding: 0 0.4rem;
`;

const Section = styled.section`
  margin-top: 2.2rem;
`;

const SectionTitle = styled.h2<{ $danger?: boolean }>`
  font-size: 1.3rem;
  font-weight: 500;
  color: ${(props) => (props.$danger ? props.theme.error : props.theme.textMuted)};
  margin: 0 0.4rem 0.8rem;
`;

const OptionList = styled.div<{ $danger?: boolean }>`
  border: 1px solid
    ${(props) =>
      props.$danger
        ? `color-mix(in srgb, ${props.theme.error} 35%, transparent)`
        : props.theme.line};
  border-radius: ${(props) => props.theme.radiusControl};
  background: ${(props) => props.theme.paneSunken};
`;

const OptionItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1.6rem;
  padding: 1.2rem 1.4rem;

  & + & {
    border-top: 1px solid ${(props) => props.theme.line};
  }

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    flex-wrap: wrap;
    gap: 0.8rem;
  }
`;

const OptionContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const OptionLabel = styled.div`
  font-size: 1.5rem;
  font-weight: 500;
  color: ${(props) => props.theme.textPrimary};
`;

const OptionDescription = styled.div`
  font-size: 1.3rem;
  color: ${(props) => props.theme.textMuted};
  line-height: 1.5;
`;

const Toggle = styled.button<{ $active: boolean }>`
  position: relative;
  width: 3.8rem;
  height: 2.2rem;
  border-radius: 1.1rem;
  border: none;
  cursor: pointer;
  background: ${(props) => (props.$active ? props.theme.accent : props.theme.lineStrong)};
  transition: background 0.15s ease;
  flex-shrink: 0;

  &::after {
    content: "";
    position: absolute;
    top: 0.2rem;
    left: ${(props) => (props.$active ? "1.8rem" : "0.2rem")};
    width: 1.8rem;
    height: 1.8rem;
    border-radius: 50%;
    background: white;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
    transition: left 0.15s ease;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.8rem;
  margin-top: 1.2rem;
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  height: 3.4rem;
  padding: 0 1.4rem;
  border-radius: ${(props) => props.theme.radiusControl};
  font-size: 1.4rem;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.15s ease;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const BackButton = styled(Button)`
  background: transparent;
  border: 1px solid ${(props) => props.theme.lineStrong};
  color: ${(props) => props.theme.textPrimary};

  &:hover {
    background: ${(props) => props.theme.hover};
  }
`;

const ResetButton = styled(BackButton)``;

const DeleteAccountButton = styled(Button)`
  background: transparent;
  border: 1px solid color-mix(in srgb, ${(props) => props.theme.error} 45%, transparent);
  color: ${(props) => props.theme.error};

  &:hover {
    background: color-mix(in srgb, ${(props) => props.theme.error} 10%, transparent);
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: ${(props) => props.theme.scrim};
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1.6rem;
`;

const ModalContent = styled.div`
  background: ${(props) => props.theme.paneRaised};
  border: 1px solid ${(props) => props.theme.lineStrong};
  border-radius: ${(props) => props.theme.radiusPane};
  box-shadow: ${(props) => props.theme.paneShadow};
  padding: 2.4rem;
  max-width: 40rem;
  width: 100%;
`;

const ModalTitle = styled.h3`
  font-size: 1.8rem;
  font-weight: 600;
  color: ${(props) => props.theme.textPrimary};
  margin: 0 0 1.2rem 0;
`;

const ModalDescription = styled.p`
  font-size: 1.4rem;
  color: ${(props) => props.theme.textSecondary};
  margin: 0 0 2.4rem 0;
  line-height: 1.5;
`;

const ModalButtons = styled.div`
  display: flex;
  gap: 0.8rem;
  justify-content: flex-end;
`;

const CancelButton = styled(BackButton)``;

const ConfirmDeleteButton = styled(Button)`
  background: ${(props) => props.theme.error};
  border: none;
  color: white;

  &:hover {
    filter: brightness(1.06);
  }
`;

const Segmented = styled.div`
  display: inline-flex;
  flex-wrap: wrap;
  padding: 0.2rem;
  border-radius: 7px;
  background: ${(props) => props.theme.paneSunken};
  border: 1px solid ${(props) => props.theme.line};
`;

const SegmentOption = styled.button<{ $active: boolean }>`
  padding: 0.4rem 1rem;
  border: none;
  border-radius: 5px;
  font-size: 1.3rem;
  white-space: nowrap;
  cursor: pointer;
  background: ${(props) => (props.$active ? props.theme.paneRaised : "transparent")};
  color: ${(props) => (props.$active ? props.theme.textPrimary : props.theme.textSecondary)};
  font-weight: ${(props) => (props.$active ? 500 : 400)};
  box-shadow: ${(props) => (props.$active ? "0 1px 2px rgba(0, 0, 0, 0.08)" : "none")};
`;

// Options available in global settings (excludes chatMode which is thread-specific, quickSubmitKey and sidebarSwipe which have separate UI)
type GlobalOptionKey = Exclude<keyof ResponseOptions, "chatMode" | "quickSubmitKey" | "sidebarSwipe">;

interface OptionConfig {
  key: GlobalOptionKey;
  icon: typeof faFont;
  label: string;
  description: string;
}

interface Labels {
  title: string;
  description: string;
  responseOptions: string;
  chatMode: string;
  chatModeDescription: string;
  aaMode: string;
  aaModeDescription: string;
  previewMode: string;
  previewModeDescription: string;
  noupMode: string;
  noupModeDescription: string;
  alwaysBottom: string;
  alwaysBottomDescription: string;
  quickSubmit: string;
  quickSubmitDescription: string;
  quickSubmitCtrl: string;
  quickSubmitShift: string;
  quickSubmitNone: string;
  sidebarSwipe: string;
  sidebarSwipeDescription: string;
  siteSettings: string;
  language: string;
  languageDescription: string;
  languageAuto: string;
  reset: string;
  back: string;
  deleteAccount: string;
  deleteAccountDescription: string;
  deleteAccountConfirm: string;
  deleteAccountButton: string;
  cancel: string;
}

interface BoardData {
  id: string;
  name: string;
}

interface CustomLink {
  id: string;
  label: string;
  url: string;
}

interface SettingsContentProps {
  labels: Labels;
  boards: BoardData[];
  boardsTitle: string;
  isLoggedIn: boolean;
  canAccessAdmin: boolean;
  authLabels: { login: string; logout: string };
  manualLabel: string;
  customLinks?: CustomLink[];
}

export function SettingsContent({
  labels,
  boards,
  boardsTitle,
  isLoggedIn,
  canAccessAdmin,
  authLabels,
  manualLabel,
  customLinks,
}: SettingsContentProps) {
  const router = useRouter();
  const t = useTranslations("settings");
  const themePreference = useThemeStore((state) => state.mode);
  const setThemePreference = useThemeStore((state) => state.setMode);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentLocale, setCurrentLocale] = useState<string | null>(null);

  // Read NEXT_LOCALE cookie on mount
  useEffect(() => {
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split("=");
      if (name === "NEXT_LOCALE") {
        setCurrentLocale(value);
        return;
      }
    }
    setCurrentLocale(null); // No cookie = auto
  }, []);

  const handleLanguageChange = (locale: string | null) => {
    if (locale === null) {
      // Delete cookie for auto mode
      document.cookie = "NEXT_LOCALE=; path=/; max-age=0";
    } else {
      // Set cookie with 1 year expiry
      document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000`;
    }
    // Refresh to apply new locale
    window.location.reload();
  };

  // Select individual values to avoid creating new object references
  const aaMode = useResponseOptionsStore((state) => state.aaMode);
  const previewMode = useResponseOptionsStore((state) => state.previewMode);
  const noupMode = useResponseOptionsStore((state) => state.noupMode);
  const alwaysBottom = useResponseOptionsStore((state) => state.alwaysBottom);
  const quickSubmitKey = useResponseOptionsStore((state) => state.quickSubmitKey);
  const sidebarSwipe = useResponseOptionsStore((state) => state.sidebarSwipe);
  const toggleOption = useResponseOptionsStore((state) => state.toggleOption);
  const setOption = useResponseOptionsStore((state) => state.setOption);
  const resetOptions = useResponseOptionsStore((state) => state.resetOptions);

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "DELETE",
      });

      if (res.ok) {
        await signOutWithPush({ callbackUrl: "/" });
      } else {
        setIsDeleting(false);
        setShowDeleteModal(false);
      }
    } catch {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // chatMode and quickSubmitKey are excluded from toggle options
  const options: Omit<ResponseOptions, "chatMode" | "quickSubmitKey" | "sidebarSwipe"> = {
    aaMode,
    previewMode,
    noupMode,
    alwaysBottom,
  };

  const quickSubmitOptions: { key: QuickSubmitKey; label: string }[] = [
    { key: "ctrl", label: labels.quickSubmitCtrl },
    { key: "shift", label: labels.quickSubmitShift },
    { key: "none", label: labels.quickSubmitNone },
  ];

  const languageOptions: { key: string | null; label: string }[] = [
    { key: null, label: labels.languageAuto },
    { key: "ko", label: "한국어" },
    { key: "en", label: "English" },
    { key: "ja", label: "日本語" },
  ];

  // chatMode is excluded - it's thread-specific only
  const optionConfigs: OptionConfig[] = [
    {
      key: "aaMode",
      icon: faFont,
      label: labels.aaMode,
      description: labels.aaModeDescription,
    },
    {
      key: "previewMode",
      icon: faEye,
      label: labels.previewMode,
      description: labels.previewModeDescription,
    },
    {
      key: "noupMode",
      icon: faArrowUp,
      label: labels.noupMode,
      description: labels.noupModeDescription,
    },
    {
      key: "alwaysBottom",
      icon: faArrowDown,
      label: labels.alwaysBottom,
      description: labels.alwaysBottomDescription,
    },
  ];

  const sidebar = <BoardListSidebar boards={boards} customLinks={customLinks} title={boardsTitle} manualLabel={manualLabel} />;

  const segmented = <T extends string | null>(
    items: { key: T; label: string }[],
    current: T,
    onSelect: (key: T) => void
  ) => (
    <Segmented role="radiogroup">
      {items.map((item) => (
        <SegmentOption
          key={item.key ?? "auto"}
          role="radio"
          aria-checked={current === item.key}
          $active={current === item.key}
          onClick={() => onSelect(item.key)}
        >
          {item.label}
        </SegmentOption>
      ))}
    </Segmented>
  );

  return (
    <PageLayout
      title={labels.title}
      sidebar={sidebar}
      isLoggedIn={isLoggedIn}
      canAccessAdmin={canAccessAdmin}
      authLabels={authLabels}
      isSettingsPage
    >
      <Container>
        <Description>{labels.description}</Description>

        <Section>
          <SectionTitle>{labels.siteSettings}</SectionTitle>
          <OptionList>
            <OptionItem>
              <OptionContent>
                <OptionLabel>{t("theme")}</OptionLabel>
                <OptionDescription>{t("themeDescription")}</OptionDescription>
              </OptionContent>
              {segmented(
                [
                  { key: "system" as ThemePreference, label: t("themeSystem") },
                  { key: "light" as ThemePreference, label: t("themeLight") },
                  { key: "grey" as ThemePreference, label: t("themeGrey") },
                  { key: "dark" as ThemePreference, label: t("themeDark") },
                ],
                mounted ? themePreference : "light",
                setThemePreference
              )}
            </OptionItem>
            <OptionItem>
              <OptionContent>
                <OptionLabel>{labels.language}</OptionLabel>
                <OptionDescription>{labels.languageDescription}</OptionDescription>
              </OptionContent>
              {segmented(languageOptions, currentLocale, handleLanguageChange)}
            </OptionItem>
            <OptionItem>
              <OptionContent>
                <OptionLabel>{labels.sidebarSwipe}</OptionLabel>
                <OptionDescription>{labels.sidebarSwipeDescription}</OptionDescription>
              </OptionContent>
              <Toggle
                role="switch"
                aria-checked={sidebarSwipe}
                $active={sidebarSwipe}
                onClick={() => toggleOption("sidebarSwipe")}
                aria-label={labels.sidebarSwipe}
              />
            </OptionItem>
          </OptionList>
        </Section>

        <Section>
          <SectionTitle>{labels.responseOptions}</SectionTitle>
          <OptionList>
            <OptionItem>
              <OptionContent>
                <OptionLabel>{labels.quickSubmit}</OptionLabel>
                <OptionDescription>{labels.quickSubmitDescription}</OptionDescription>
              </OptionContent>
              {segmented(quickSubmitOptions, quickSubmitKey, (key) => setOption("quickSubmitKey", key))}
            </OptionItem>
            {optionConfigs.map((config) => (
              <OptionItem key={config.key}>
                <OptionContent>
                  <OptionLabel>{config.label}</OptionLabel>
                  <OptionDescription>{config.description}</OptionDescription>
                </OptionContent>
                <Toggle
                  role="switch"
                  aria-checked={options[config.key]}
                  $active={options[config.key]}
                  onClick={() => toggleOption(config.key)}
                  aria-label={config.label}
                />
              </OptionItem>
            ))}
          </OptionList>
          <ButtonGroup>
            <BackButton onClick={() => router.back()}>
              <FontAwesomeIcon icon={faArrowLeft} />
              {labels.back}
            </BackButton>
            <ResetButton onClick={resetOptions}>{labels.reset}</ResetButton>
          </ButtonGroup>
        </Section>

        {isLoggedIn && (
          <Section>
            <SectionTitle $danger>{labels.deleteAccount}</SectionTitle>
            <OptionList $danger>
              <OptionItem>
                <OptionContent>
                  <OptionDescription>{labels.deleteAccountDescription}</OptionDescription>
                </OptionContent>
                <DeleteAccountButton onClick={() => setShowDeleteModal(true)}>
                  <FontAwesomeIcon icon={faTrash} />
                  {labels.deleteAccountButton}
                </DeleteAccountButton>
              </OptionItem>
            </OptionList>
          </Section>
        )}
      </Container>

      {showDeleteModal && (
        <ModalOverlay onClick={() => setShowDeleteModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>{labels.deleteAccount}</ModalTitle>
            <ModalDescription>{labels.deleteAccountConfirm}</ModalDescription>
            <ModalButtons>
              <CancelButton onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>
                {labels.cancel}
              </CancelButton>
              <ConfirmDeleteButton onClick={handleDeleteAccount} disabled={isDeleting}>
                <FontAwesomeIcon icon={faTrash} />
                {labels.deleteAccountButton}
              </ConfirmDeleteButton>
            </ModalButtons>
          </ModalContent>
        </ModalOverlay>
      )}
    </PageLayout>
  );
}
