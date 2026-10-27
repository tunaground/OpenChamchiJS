"use client";

import { useEffect, useState, ReactNode, useSyncExternalStore } from "react";
import { ThemeProvider as StyledThemeProvider, createGlobalStyle } from "styled-components";
import { useThemeStore } from "@/lib/store/theme";
import { themes, ThemeMode } from "./themes";

const GlobalStyle = createGlobalStyle`
  @font-face {
    font-family: "AAFont";
    src: url("https://da1eth.github.io/HeadKasen/fonts/web/HeadKasen-Web.woff2") format("woff2");
    font-display: swap;
  }

  @font-face {
    font-family: "AAFont";
    font-style: normal;
    font-weight: 400;
    src: url(//cdn.jsdelivr.net/font-nanum/1.0/nanumgothiccoding/v2/NanumGothicCoding-Regular.eot);
    src: url(//cdn.jsdelivr.net/font-nanum/1.0/nanumgothiccoding/v2/NanumGothicCoding-Regular.eot?#iefix) format('embedded-opentype'), url(//cdn.jsdelivr.net/font-nanum/1.0/nanumgothiccoding/v2/NanumGothicCoding-Regular.woff) format('woff'), url(//cdn.jsdelivr.net/font-nanum/1.0/nanumgothiccoding/v2/NanumGothicCoding-Regular.ttf) format('truetype');
    unicode-range: U+AC00-D7A3, U+3130-318F;
  }

  /* Surface palette. data-mode is set before paint (see app/layout.tsx) */
  :root {
    --c-canvas: #e9ecef;
    --c-pane: #fbfbfa;
    --c-raised: #ffffff;
    --c-sunken: rgba(27, 31, 36, 0.035);
    --c-field: #f3f4f5;
    --c-hover: rgba(27, 31, 36, 0.05);
    --c-hover-solid: #f1f2f3;
    --c-line: rgba(27, 31, 36, 0.1);
    --c-line-strong: rgba(27, 31, 36, 0.18);
    --c-accent-soft: rgba(10, 108, 176, 0.1);
    --c-edge: rgba(255, 255, 255, 0.9);
    --c-shadow: 0 1px 2px rgba(27, 31, 36, 0.06), 0 8px 24px -12px rgba(27, 31, 36, 0.18);
    --c-scrim: rgba(0, 0, 0, 0.25);
    --c-toast: rgba(27, 31, 36, 0.92);
  }

  :root[data-mode="dark"] {
    --c-canvas: #141518;
    --c-pane: #1e2024;
    --c-raised: #26292e;
    --c-sunken: rgba(0, 0, 0, 0.18);
    --c-field: #17191c;
    --c-hover: rgba(255, 255, 255, 0.05);
    --c-hover-solid: #25282c;
    --c-line: rgba(255, 255, 255, 0.08);
    --c-line-strong: rgba(255, 255, 255, 0.14);
    --c-accent-soft: rgba(90, 169, 240, 0.14);
    --c-edge: rgba(255, 255, 255, 0.05);
    --c-shadow: 0 1px 2px rgba(0, 0, 0, 0.3), 0 10px 28px -12px rgba(0, 0, 0, 0.6);
    --c-scrim: rgba(0, 0, 0, 0.45);
    --c-toast: rgba(38, 41, 46, 0.96);
  }

  * {
    box-sizing: border-box;
    padding: 0;
    margin: 0;
  }

  html {
    font-size: 62.5%;
    color-scheme: ${(props) => props.theme.mode};
  }

  /* clip, not hidden: hidden would make body a scroll container and break
     the sticky toolbar and composer dock */
  html, body {
    max-width: 100vw;
    overflow-x: clip;
  }

  body {
    font-size: 1.5rem;
    line-height: 1.6;
    background: var(--c-canvas);
    color: ${(props) => props.theme.foreground};
    font-family: ${(props) => props.theme.fontSans};
    font-variant-numeric: tabular-nums;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;

    @media (max-width: ${(props) => props.theme.breakpoint}) {
      font-size: 1.4rem;
      -webkit-text-size-adjust: 100%;
      text-size-adjust: 100%;
    }
  }

  button, input, textarea, select {
    font-family: inherit;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  :focus-visible {
    outline: 2px solid ${(props) => props.theme.accent};
    outline-offset: 2px;
  }
`;

function subscribeSystemScheme(onChange: () => void) {
  const query = window.matchMedia("(prefers-color-scheme: dark)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

const systemIsDark = () => window.matchMedia("(prefers-color-scheme: dark)").matches;

/** The mode actually shown, with "system" resolved against the OS */
export function useResolvedThemeMode(): ThemeMode {
  const preference = useThemeStore((state) => state.mode);
  const dark = useSyncExternalStore(subscribeSystemScheme, systemIsDark, () => false);
  if (preference === "system") return dark ? "dark" : "light";
  return preference;
}

interface Props {
  children: ReactNode;
}

export function ThemeProvider({ children }: Props) {
  const resolved = useResolvedThemeMode();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by using default theme on server
  const theme = mounted ? themes[resolved] : themes.light;

  // Surface variables follow data-mode; keep it in sync after mount
  useEffect(() => {
    if (mounted) document.documentElement.dataset.mode = resolved;
  }, [mounted, resolved]);

  return (
    <StyledThemeProvider theme={theme}>
      <GlobalStyle />
      {children}
    </StyledThemeProvider>
  );
}
