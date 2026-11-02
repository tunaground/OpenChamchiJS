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

  /* Surface palette per mode. data-mode is set before paint (see app/layout.tsx) */
  :root {
    /* The sidebar sits right on the canvas (no pane of its own); light mode's
       canvas is dark enough for its light text */
    --c-canvas: #18426d;
    --c-pane: #f5f8fb;
    /* The content pane's edge reads as glass: a lit rim (brightest at the top
       left), a faint tint inside the edge and a soft shadow. The face is flat.
       --c-glass-sides repeats the side edges for the stuck toolbar, which
       covers the pane's own */
    --c-glass-rim: linear-gradient(150deg, #ffffff 0%, rgba(205, 228, 250, 0.7) 28%, transparent 55%, rgba(140, 185, 230, 0.55) 100%);
    --c-glass-shadow: inset 0 1px 0 #ffffff, inset 0 0 0 1px rgba(255, 255, 255, 0.5),
      inset 0 0 16px rgba(60, 120, 190, 0.09), 0 1px 1px rgba(0, 0, 0, 0.1),
      0 8px 18px -8px rgba(0, 0, 0, 0.3), 0 32px 64px -24px rgba(0, 0, 0, 0.5);
    --c-glass-sides: inset 1px 0 0 rgba(255, 255, 255, 0.5), inset -1px 0 0 rgba(255, 255, 255, 0.5),
      inset 12px 0 16px -12px rgba(60, 120, 190, 0.09), inset -12px 0 16px -12px rgba(60, 120, 190, 0.09);
    --c-raised: #fcfdfe;
    --c-sunken: rgba(20, 50, 90, 0.04);
    --c-field: #e8eef5;
    --c-hover: rgba(20, 60, 110, 0.06);
    --c-hover-solid: #eaf0f6;
    --c-line: rgba(20, 50, 90, 0.11);
    --c-line-strong: rgba(20, 50, 90, 0.2);
    --c-accent-soft: rgba(10, 108, 176, 0.12);
    --c-edge: rgba(255, 255, 255, 0.85);
    --c-shadow: 0 1px 2px rgba(20, 50, 90, 0.08), 0 8px 24px -12px rgba(20, 50, 90, 0.25);
    --c-scrim: rgba(0, 0, 0, 0.25);
    --c-toast: rgba(23, 33, 48, 0.92);
  }

  /* Light mode only: the sidebar sits on the deep sea blue canvas, so controls
     inside it use the dark set (text colors come from sidebarThemes.light, see
     components/layout/Sidebar) */
  :root:not([data-mode="grey"]):not([data-mode="dark"]) [data-pane="sidebar"] {
    --c-pane: #173a5e;
    --c-raised: #1f4670;
    --c-sunken: rgba(0, 0, 0, 0.15);
    --c-field: #12304f;
    --c-hover: rgba(255, 255, 255, 0.07);
    --c-hover-solid: #1e4368;
    --c-line: rgba(255, 255, 255, 0.1);
    --c-line-strong: rgba(255, 255, 255, 0.18);
    --c-accent-soft: rgba(120, 185, 245, 0.2);
    --c-edge: rgba(255, 255, 255, 0.08);
    --c-shadow: 0 1px 2px rgba(10, 30, 60, 0.15), 0 8px 24px -12px rgba(10, 30, 60, 0.45);
    color-scheme: dark;
  }

  :root[data-mode="grey"] {
    --c-canvas: #989ca1;
    --c-pane: #c3c7cb;
    --c-glass-rim: linear-gradient(150deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.25) 28%, transparent 55%, rgba(255, 255, 255, 0.2) 100%);
    --c-glass-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.55), inset 0 0 0 1px rgba(255, 255, 255, 0.18),
      inset 0 0 16px rgba(255, 255, 255, 0.18), 0 1px 1px rgba(0, 0, 0, 0.1),
      0 8px 18px -8px rgba(0, 0, 0, 0.25), 0 32px 64px -24px rgba(0, 0, 0, 0.35);
    --c-glass-sides: inset 1px 0 0 rgba(255, 255, 255, 0.18), inset -1px 0 0 rgba(255, 255, 255, 0.18),
      inset 12px 0 16px -12px rgba(255, 255, 255, 0.18), inset -12px 0 16px -12px rgba(255, 255, 255, 0.18);
    --c-raised: #d0d3d6;
    --c-sunken: rgba(29, 33, 38, 0.06);
    --c-field: #b9bdc2;
    --c-hover: rgba(29, 33, 38, 0.07);
    --c-hover-solid: #b9bdc1;
    --c-line: rgba(29, 33, 38, 0.15);
    --c-line-strong: rgba(29, 33, 38, 0.26);
    --c-accent-soft: rgba(9, 76, 128, 0.14);
    --c-edge: rgba(255, 255, 255, 0.3);
    --c-shadow: 0 1px 2px rgba(29, 33, 38, 0.1), 0 8px 24px -12px rgba(29, 33, 38, 0.3);
    --c-scrim: rgba(0, 0, 0, 0.3);
    --c-toast: rgba(40, 45, 51, 0.94);
  }

  :root[data-mode="dark"] {
    --c-canvas: #141518;
    --c-pane: #1e2024;
    --c-glass-rim: linear-gradient(150deg, rgba(255, 255, 255, 0.24) 0%, rgba(255, 255, 255, 0.07) 28%, transparent 55%, rgba(130, 170, 230, 0.16) 100%);
    --c-glass-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 0 0 1px rgba(255, 255, 255, 0.03),
      inset 0 0 16px rgba(140, 180, 240, 0.05), 0 1px 1px rgba(0, 0, 0, 0.3),
      0 8px 18px -8px rgba(0, 0, 0, 0.5), 0 32px 64px -24px rgba(0, 0, 0, 0.7);
    --c-glass-sides: inset 1px 0 0 rgba(255, 255, 255, 0.03), inset -1px 0 0 rgba(255, 255, 255, 0.03),
      inset 12px 0 16px -12px rgba(140, 180, 240, 0.05), inset -12px 0 16px -12px rgba(140, 180, 240, 0.05);
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
    color-scheme: ${(props) => (props.theme.mode === "dark" ? "dark" : "light")};
  }

  /* clip, not hidden: hidden would make body a scroll container and break
     the sticky toolbar */
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
