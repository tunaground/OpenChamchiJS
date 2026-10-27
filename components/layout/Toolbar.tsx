"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import styled, { css, keyframes } from "styled-components";
import { UserCounter } from "./UserCounter";
import { iconButtonCss } from "./iconButton";

const Bar = styled.header`
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  min-height: ${(props) => props.theme.toolbarHeight};
  padding: 0.8rem 1rem 0.8rem 0.6rem;
  flex-shrink: 0;
  background: ${(props) => props.theme.pane};
  border-bottom: 1px solid ${(props) => props.theme.line};

  /* Mobile scrolls the window, so the bar sticks over the content */
  @media (max-width: ${(props) => props.theme.breakpoint}) {
    padding: 0.6rem 0.8rem 0.6rem 0.4rem;
    backdrop-filter: saturate(160%) blur(24px);
    -webkit-backdrop-filter: saturate(160%) blur(24px);
  }
`;

const MenuButton = styled.button<{ $active?: boolean }>`
  ${iconButtonCss}
`;

const Crumb = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  flex: 1;
  min-width: 0;
`;

const Parent = styled(Link)`
  flex-shrink: 0;
  max-width: 16rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 1.4rem;
  color: ${(props) => props.theme.textMuted};

  &:hover {
    color: ${(props) => props.theme.textPrimary};
  }

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    display: none;
  }
`;

const Sep = styled.span`
  color: ${(props) => props.theme.textMuted};

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    display: none;
  }
`;

const Subtitle = styled.span`
  flex-shrink: 0;
  font-size: 1.4rem;
  color: ${(props) => props.theme.textMuted};
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.2rem;
`;

const TitleWrapper = styled.div`
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;
`;

const scrollLeft = keyframes`
  0% {
    transform: translateX(0);
  }
  80% {
    transform: translateX(var(--scroll-amount));
  }
  100% {
    transform: translateX(var(--scroll-amount));
  }
`;

const reset = keyframes`
  0% {
    transform: translateX(var(--scroll-amount));
  }
  100% {
    transform: translateX(0);
  }
`;

const TitleText = styled.div<{ $animate: boolean }>`
  display: inline-block;
  font-size: 1.7rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: ${(props) => props.theme.textPrimary};
  white-space: nowrap;
  will-change: transform;

  ${({ $animate }) =>
    $animate &&
    css`
      animation:
        ${scrollLeft} 4s linear 0s 1 forwards,
        ${reset} 0.5s ease 4.5s 1 forwards;
    `}
`;


export function MarqueeTitle({ title }: { title: string }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const content = contentRef.current;
    if (!wrapper || !content) return;

    let timeout: NodeJS.Timeout;

    const evaluateOverflow = () => {
      const scrollDistance = content.scrollWidth - wrapper.clientWidth;

      if (scrollDistance > 0) {
        content.style.setProperty("--scroll-amount", `-${scrollDistance}px`);
        if (!animate) {
          startAnimationLoop();
        }
      } else {
        stopAnimation();
      }
    };

    const startAnimationLoop = () => {
      setAnimate(true);
      timeout = setTimeout(() => {
        setAnimate(false);
        timeout = setTimeout(() => {
          evaluateOverflow();
        }, 2000);
      }, 5000);
    };

    const stopAnimation = () => {
      clearTimeout(timeout);
      setAnimate(false);
    };

    evaluateOverflow();

    const observer = new ResizeObserver(() => {
      evaluateOverflow();
    });

    observer.observe(wrapper);
    observer.observe(content);

    return () => {
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, [title]);

  return (
    <TitleWrapper ref={wrapperRef}>
      <TitleText ref={contentRef} $animate={animate}>
        {title}
      </TitleText>
    </TitleWrapper>
  );
}


interface ToolbarProps {
  title?: string;
  parent?: { label: string; href: string };
  subtitle?: React.ReactNode;
  userCount?: number;
  userCountTitle?: string;
  actions?: React.ReactNode;
  onMenuClick: () => void;
  menuLabel?: string;
}

/** Top of the content pane: sidebar toggle, where you are, and page actions */
export function Toolbar({
  title,
  parent,
  subtitle,
  userCount,
  userCountTitle,
  actions,
  onMenuClick,
  menuLabel = "Toggle menu",
}: ToolbarProps) {
  return (
    <Bar>
      <MenuButton onClick={onMenuClick} aria-label={menuLabel} title={menuLabel}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
          <path strokeLinecap="round" d="M9.5 4.5v15" />
        </svg>
      </MenuButton>
      <Crumb>
        {parent && (
          <>
            <Parent prefetch={false} href={parent.href}>
              {parent.label}
            </Parent>
            <Sep>/</Sep>
          </>
        )}
        {title && <MarqueeTitle title={title} />}
        {subtitle !== undefined && <Subtitle>{subtitle}</Subtitle>}
      </Crumb>
      {userCount !== undefined && <UserCounter count={userCount} title={userCountTitle} />}
      {actions && <Actions>{actions}</Actions>}
    </Bar>
  );
}
