"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import styled, { css, keyframes } from "styled-components";
import { UserCounter } from "./UserCounter";
import { SidebarToggleButton } from "./SidebarToggleButton";
import { onPageScroll } from "@/lib/utils/page-scroll";

const stuckShadow = "0 6px 16px -10px rgba(0, 0, 0, 0.35)";

/* Rides on the top edge of the content pane (sharing its rounded corners) until
   it reaches the top of the window, then sticks there with square corners */
const Bar = styled.header<{ $stuck: boolean }>`
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  min-height: ${(props) => props.theme.toolbarHeight};
  padding: 0.8rem 1.6rem 0.8rem 1.2rem;
  flex-shrink: 0;
  /* See-through while it rides on the pane (so the pane's lit rim shows),
     solid once content scrolls under it */
  background: ${(props) => (props.$stuck ? props.theme.pane : "transparent")};
  /* Accent rule (with the accent title) marks where you are and where the bar ends */
  border-bottom: 2px solid ${(props) => props.theme.accent};
  border-radius: ${(props) => (props.$stuck ? "0" : `${props.theme.radiusPane} ${props.theme.radiusPane} 0 0`)};
  /* Stuck, it covers the pane's side edges, so it draws them itself */
  box-shadow: ${(props) =>
    props.$stuck ? `${props.theme.paneGlassSides}, ${stuckShadow}` : "none"};
  transition: border-radius 0.15s, box-shadow 0.15s, background 0.15s;

  /* On mobile the pane fills the screen, so the bar starts at its corner */
  @media (max-width: ${(props) => props.theme.breakpoint}) {
    padding: 0.6rem 1.2rem 0.6rem 0.8rem;
    border-radius: 0;
    box-shadow: ${(props) => (props.$stuck ? stuckShadow : "none")};
    backdrop-filter: saturate(160%) blur(24px);
    -webkit-backdrop-filter: saturate(160%) blur(24px);
  }
`;

/* While the desktop sidebar is open its own head holds the toggle, on this spot */
const MenuButton = styled(SidebarToggleButton)<{ $sidebarOpen: boolean }>`
  @media (min-width: ${(props) => props.theme.breakpoint}) {
    display: ${(props) => (props.$sidebarOpen ? "none" : "flex")};
  }
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
  color: ${(props) => props.theme.accent};
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
  sidebarOpen: boolean;
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
  sidebarOpen,
}: ToolbarProps) {
  const barRef = useRef<HTMLElement>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const update = () => {
      const bar = barRef.current;
      setStuck(!!bar && window.scrollY > 0 && bar.getBoundingClientRect().top <= 0);
    };
    update();
    return onPageScroll(update);
  }, []);

  return (
    <Bar ref={barRef} $stuck={stuck}>
      <MenuButton onClick={onMenuClick} label={menuLabel} $sidebarOpen={sidebarOpen} />
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
