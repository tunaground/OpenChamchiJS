"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFont,
  faEye,
  faArrowUp,
  faArrowDown,
  faArrowLeft,
  faKeyboard,
  faHandPointer,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { PageLayout } from "@/components/layout";
import { BoardListSidebar } from "@/components/sidebar/BoardListSidebar";
import {
  useResponseOptionsStore,
  ResponseOptions,
  QuickSubmitKey,
} from "@/lib/store/responseOptions";

const Container = styled.div`
  padding: 3.2rem;
  max-width: 60rem;
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
  margin: 0 0 2rem 0;
`;

const OptionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
`;

const OptionItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1.6rem;
  padding: 1.2rem;
  border-radius: 8px;
  transition: background 0.15s ease;

  &:hover {
    background: ${(props) => props.theme.surfaceHover};
  }
`;

const OptionIcon = styled.div<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4rem;
  height: 4rem;
  border-radius: 8px;
  background: ${(props) =>
    props.$active ? props.theme.buttonPrimary : props.theme.surfaceHover};
  color: ${(props) =>
    props.$active ? props.theme.buttonPrimaryText : props.theme.textSecondary};
  flex-shrink: 0;
`;

const OptionContent = styled.div`
  flex: 1;
`;

const OptionLabel = styled.div`
  font-size: 1.5rem;
  font-weight: 500;
  color: ${(props) => props.theme.textPrimary};
  margin-bottom: 0.4rem;
`;

const OptionDescription = styled.div`
  font-size: 1.3rem;
  color: ${(props) => props.theme.textSecondary};
  line-height: 1.5;
`;

const Toggle = styled.button<{ $active: boolean }>`
  position: relative;
  width: 4.8rem;
  height: 2.4rem;
  border-radius: 1.2rem;
  border: none;
  cursor: pointer;
  background: ${(props) =>
    props.$active ? props.theme.buttonPrimary : props.theme.surfaceBorder};
  transition: background 0.2s ease;
  flex-shrink: 0;

  &::after {
    content: "";
    position: absolute;
    top: 0.2rem;
    left: ${(props) => (props.$active ? "2.4rem" : "0.2rem")};
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    background: white;
    transition: left 0.2s ease;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1.2rem;
  flex-wrap: wrap;
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  height: 3.5rem;
  padding: 0 1.6rem;
  border-radius: 4px;
  font-size: 1.4rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
`;

const BackButton = styled(Button)`
  background: transparent;
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  color: ${(props) => props.theme.textPrimary};

  &:hover {
    background: ${(props) => props.theme.surfaceHover};
  }
`;

const ResetButton = styled(Button)`
  background: ${(props) => props.theme.error};
  border: none;
  color: white;

  &:hover {
    opacity: 0.9;
  }
`;

const DangerSection = styled(Section)`
  border-color: ${(props) => props.theme.error};
  margin-top: 2.4rem;
`;

const DangerSectionTitle = styled(SectionTitle)`
  color: ${(props) => props.theme.error};
`;

const DangerDescription = styled.p`
  font-size: 1.4rem;
  color: ${(props) => props.theme.textSecondary};
  margin: 0 0 1.6rem 0;
  line-height: 1.5;
`;

const DeleteAccountButton = styled(Button)`
  background: transparent;
  border: 1px solid ${(props) => props.theme.error};
  color: ${(props) => props.theme.error};

  &:hover {
    background: ${(props) => props.theme.error};
    color: white;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1.6rem;
`;

const ModalContent = styled.div`
  background: ${(props) => props.theme.surface};
  border-radius: 8px;
  padding: 2.4rem;
  max-width: 40rem;
  width: 100%;
`;

const ModalTitle = styled.h3`
  font-size: 1.8rem;
  font-weight: 600;
  color: ${(props) => props.theme.error};
  margin: 0 0 1.6rem 0;
`;

const ModalDescription = styled.p`
  font-size: 1.4rem;
  color: ${(props) => props.theme.textSecondary};
  margin: 0 0 2.4rem 0;
  line-height: 1.5;
`;

const ModalButtons = styled.div`
  display: flex;
  gap: 1.2rem;
  justify-content: flex-end;
`;

const CancelButton = styled(Button)`
  background: transparent;
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  color: ${(props) => props.theme.textPrimary};

  &:hover {
    background: ${(props) => props.theme.surfaceHover};
  }
`;

const ConfirmDeleteButton = styled(Button)`
  background: ${(props) => props.theme.error};
  border: none;
  color: white;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const QuickSubmitOptions = styled.div`
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap;
`;

const QuickSubmitOption = styled.button<{ $active: boolean }>`
  padding: 0.8rem 1.6rem;
  border-radius: 4px;
  font-size: 1.3rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px solid
    ${(props) =>
      props.$active ? props.theme.buttonPrimary : props.theme.surfaceBorder};
  background: ${(props) =>
    props.$active ? props.theme.buttonPrimary : "transparent"};
  color: ${(props) =>
    props.$active ? props.theme.buttonPrimaryText : props.theme.textPrimary};

  &:hover {
    background: ${(props) =>
      props.$active ? props.theme.buttonPrimary : props.theme.surfaceHover};
  }
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

interface SettingsContentProps {
  labels: Labels;
  boards: BoardData[];
  boardsTitle: string;
  isLoggedIn: boolean;
  canAccessAdmin: boolean;
  authLabels: { login: string; logout: string };
  manualLabel: string;
}

export function SettingsContent({
  labels,
  boards,
  boardsTitle,
  isLoggedIn,
  canAccessAdmin,
  authLabels,
  manualLabel,
}: SettingsContentProps) {
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
        await signOut({ callbackUrl: "/" });
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

  const sidebar = <BoardListSidebar boards={boards} title={boardsTitle} manualLabel={manualLabel} />;

  return (
    <PageLayout
      title={labels.title}
      sidebar={sidebar}
      isLoggedIn={isLoggedIn}
      canAccessAdmin={canAccessAdmin}
      authLabels={authLabels}
      hideSettings
    >
      <Container>
        <Header>
          <Title>{labels.title}</Title>
          <Description>{labels.description}</Description>
        </Header>

        <Section>
          <SectionTitle>{labels.responseOptions}</SectionTitle>
          <OptionList>
            {optionConfigs.map((config) => (
              <OptionItem key={config.key}>
                <OptionIcon $active={options[config.key]}>
                  <FontAwesomeIcon icon={config.icon} />
                </OptionIcon>
                <OptionContent>
                  <OptionLabel>{config.label}</OptionLabel>
                  <OptionDescription>{config.description}</OptionDescription>
                </OptionContent>
                <Toggle
                  $active={options[config.key]}
                  onClick={() => toggleOption(config.key)}
                  aria-label={`Toggle ${config.label}`}
                />
              </OptionItem>
            ))}
            <OptionItem>
              <OptionIcon $active={quickSubmitKey !== "none"}>
                <FontAwesomeIcon icon={faKeyboard} />
              </OptionIcon>
              <OptionContent>
                <OptionLabel>{labels.quickSubmit}</OptionLabel>
                <OptionDescription>{labels.quickSubmitDescription}</OptionDescription>
                <QuickSubmitOptions style={{ marginTop: "1rem" }}>
                  {quickSubmitOptions.map((option) => (
                    <QuickSubmitOption
                      key={option.key}
                      $active={quickSubmitKey === option.key}
                      onClick={() => setOption("quickSubmitKey", option.key)}
                    >
                      {option.label}
                    </QuickSubmitOption>
                  ))}
                </QuickSubmitOptions>
              </OptionContent>
            </OptionItem>
            <OptionItem>
              <OptionIcon $active={sidebarSwipe}>
                <FontAwesomeIcon icon={faHandPointer} />
              </OptionIcon>
              <OptionContent>
                <OptionLabel>{labels.sidebarSwipe}</OptionLabel>
                <OptionDescription>{labels.sidebarSwipeDescription}</OptionDescription>
              </OptionContent>
              <Toggle
                $active={sidebarSwipe}
                onClick={() => toggleOption("sidebarSwipe")}
                aria-label={`Toggle ${labels.sidebarSwipe}`}
              />
            </OptionItem>
          </OptionList>
        </Section>

        <ButtonGroup>
          <BackButton onClick={() => router.back()}>
            <FontAwesomeIcon icon={faArrowLeft} />
            {labels.back}
          </BackButton>
          <ResetButton onClick={resetOptions}>{labels.reset}</ResetButton>
        </ButtonGroup>

        {isLoggedIn && (
          <DangerSection>
            <DangerSectionTitle>{labels.deleteAccount}</DangerSectionTitle>
            <DangerDescription>{labels.deleteAccountDescription}</DangerDescription>
            <DeleteAccountButton onClick={() => setShowDeleteModal(true)}>
              <FontAwesomeIcon icon={faTrash} />
              {labels.deleteAccountButton}
            </DeleteAccountButton>
          </DangerSection>
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
