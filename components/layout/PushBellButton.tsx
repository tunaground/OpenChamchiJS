"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import styled from "styled-components";
import { useLocale, useTranslations } from "next-intl";
import { usePushWatchStore } from "@/lib/store/pushWatch";
import {
  DeviceStatus,
  ensureDeviceSubscribed,
  getDeviceStatus,
  prepareServiceWorker,
  syncDeviceSubscription,
} from "@/lib/push/client";
import { usePushFeatureEnabled } from "@/lib/hooks/usePushFeatureEnabled";
import { PushSwitch } from "@/components/push/PushSwitch";

const Wrapper = styled.div`
  position: relative;
`;

const Button = styled.button<{ $active?: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4rem;
  height: 4rem;
  border: none;
  border-radius: 0.8rem;
  cursor: pointer;
  color: ${(props) => props.theme.topBarText};
  opacity: ${(props) => (props.$active ? 1 : 0.8)};
  background: ${(props) => (props.$active ? props.theme.topBarHover : "transparent")};
  transition: background 0.15s, opacity 0.15s;

  &:hover {
    background: ${(props) => props.theme.topBarHover};
    opacity: 1;
  }

  svg {
    width: 2rem;
    height: 2rem;
  }
`;

const Badge = styled.span`
  position: absolute;
  top: 0.2rem;
  right: 0.2rem;
  min-width: 1.6rem;
  height: 1.6rem;
  padding: 0 0.4rem;
  border-radius: 0.8rem;
  background: ${(props) => props.theme.accent};
  color: #fff;
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.6rem;
  text-align: center;
`;

const Panel = styled.div`
  position: absolute;
  top: calc(100% + 0.6rem);
  right: 0;
  width: 32rem;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  background: ${(props) => props.theme.surface};
  color: ${(props) => props.theme.textPrimary};
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 0.8rem;
  box-shadow: 0 0.4rem 1.6rem rgba(0, 0, 0, 0.18);
  overflow: hidden;
  z-index: 200;

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    position: fixed;
    top: 6.2rem;
    left: 0.8rem;
    right: 0.8rem;
    width: auto;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 1.2rem;
  font-size: 1.4rem;
  font-weight: 600;
  border-bottom: 1px solid ${(props) => props.theme.surfaceBorder};
`;

const HeaderTitle = styled.span`
  flex: 1;
`;

const HeaderToggleLabel = styled.span`
  font-size: 1.2rem;
  font-weight: 400;
  color: ${(props) => props.theme.textSecondary};
`;

const Hint = styled.div`
  padding: 0.8rem 1.2rem;
  font-size: 1.2rem;
  color: ${(props) => props.theme.textSecondary};
`;

const List = styled.ul<{ $dimmed: boolean }>`
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  opacity: ${(props) => (props.$dimmed ? 0.45 : 1)};
`;

const Row = styled.li`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.2rem;
  font-size: 1.4rem;
  border-bottom: 1px solid ${(props) => props.theme.surfaceBorder};
`;

const RowTitle = styled.div`
  flex: 1;
  min-width: 0;

  a,
  span {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: inherit;
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }
`;

const RowBoard = styled.small`
  display: block;
  font-size: 1.1rem;
  color: ${(props) => props.theme.textMuted};
`;

const RemoveButton = styled.button`
  flex: none;
  border: none;
  background: transparent;
  color: ${(props) => props.theme.error};
  cursor: pointer;
  font-size: 1.6rem;
  padding: 0.2rem;
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  padding: 1rem 1.2rem;
  font-size: 1.2rem;
  color: ${(props) => props.theme.textSecondary};
`;

const FooterButton = styled.button`
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 0.6rem;
  background: ${(props) => props.theme.buttonPrimary};
  color: ${(props) => props.theme.buttonPrimaryText};
  padding: 0.6rem 1rem;
  font-size: 1.2rem;
  cursor: pointer;
`;

export function PushBellButton() {
  const t = useTranslations("push");
  const locale = useLocale();
  const enabled = usePushFeatureEnabled();
  const { loaded, items, limit, pushEnabled, load, ensureLoaded, remove, setEnabled, setPushEnabled } =
    usePushWatchStore();
  const [open, setOpen] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;
    ensureLoaded();
    prepareServiceWorker();
    syncDeviceSubscription(locale).then(() => getDeviceStatus().then(setDeviceStatus));
  }, [enabled, ensureLoaded, locale]);

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!enabled) return null;

  const handleSubscribeDevice = async () => {
    try {
      const result = await ensureDeviceSubscribed(locale);
      setDeviceStatus(result === "subscribed" ? "subscribed" : result);
    } catch (error) {
      console.error("Failed to subscribe this device:", error);
      setDeviceStatus(await getDeviceStatus());
    }
  };

  const deviceMessage =
    deviceStatus === "subscribed"
      ? t("deviceSubscribed")
      : deviceStatus === "denied"
        ? t("deviceDenied")
        : deviceStatus === "unsupported"
          ? t("deviceUnsupported")
          : deviceStatus === "failed"
            ? t("deviceSubscribeFailed")
            : null;

  return (
    <Wrapper ref={wrapperRef}>
      <Button
        type="button"
        aria-label={t("bellLabel")}
        aria-expanded={open}
        $active={open}
        onClick={() => {
          if (!open) load();
          setOpen(!open);
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {loaded && items.length > 0 && <Badge>{items.length}</Badge>}
      </Button>

      {open && (
        <Panel role="dialog" aria-label={t("bellLabel")}>
          <Header>
            <HeaderTitle>
              {t("bellLabel")} {items.length}/{limit}
            </HeaderTitle>
            <HeaderToggleLabel>{t("masterToggle")}</HeaderToggleLabel>
            <PushSwitch
              checked={pushEnabled}
              label={t("masterToggle")}
              onChange={(next) => setPushEnabled(next)}
            />
          </Header>

          {!pushEnabled && <Hint>{t("masterOffHint")}</Hint>}

          {items.length === 0 ? (
            <Hint>{t("empty")}</Hint>
          ) : (
            <List $dimmed={!pushEnabled}>
              {items.map((item) => (
                <Row key={item.id}>
                  <PushSwitch
                    checked={item.enabled}
                    label={item.title}
                    onChange={(next) => setEnabled(item.id, next)}
                  />
                  <RowTitle>
                    {item.threadDeleted ? (
                      <span>{t("deletedThread")}</span>
                    ) : (
                      <Link
                        prefetch={false}
                        href={`/trace/${item.boardId}/${item.threadId}/recent`}
                        onClick={() => setOpen(false)}
                      >
                        {item.title}
                      </Link>
                    )}
                    <RowBoard>{item.boardId}</RowBoard>
                  </RowTitle>
                  <RemoveButton
                    type="button"
                    aria-label={t("remove")}
                    title={t("remove")}
                    onClick={() => remove(item.id)}
                  >
                    🗑
                  </RemoveButton>
                </Row>
              ))}
            </List>
          )}

          <Footer>
            <span>{deviceMessage}</span>
            {(deviceStatus === "unsubscribed" || deviceStatus === "failed") && (
              <FooterButton type="button" onClick={handleSubscribeDevice}>
                {t("deviceSubscribe")}
              </FooterButton>
            )}
          </Footer>
        </Panel>
      )}
    </Wrapper>
  );
}
