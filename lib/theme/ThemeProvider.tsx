"use client";

import { useEffect, useState, ReactNode } from "react";
import { ThemeProvider as StyledThemeProvider, createGlobalStyle } from "styled-components";
import { useThemeStore } from "@/lib/store/theme";
import { themes } from "./themes";

const GlobalStyle = createGlobalStyle`
  @font-face {
    font-family: "Saitamaar";
    src: url("https://da1eth.github.io/AA/HeadKasen.woff2") format("woff2");
    font-display: swap;
  }

  @font-face {
    font-family: "Saitamaar";
    font-style: normal;
    font-weight: 400;
    src: url(//cdn.jsdelivr.net/font-nanum/1.0/nanumgothiccoding/v2/NanumGothicCoding-Regular.eot);
    src: url(//cdn.jsdelivr.net/font-nanum/1.0/nanumgothiccoding/v2/NanumGothicCoding-Regular.eot?#iefix) format('embedded-opentype'), url(//cdn.jsdelivr.net/font-nanum/1.0/nanumgothiccoding/v2/NanumGothicCoding-Regular.woff) format('woff'), url(//cdn.jsdelivr.net/font-nanum/1.0/nanumgothiccoding/v2/NanumGothicCoding-Regular.ttf) format('truetype');
    unicode-range: U+AC00-D7A3, U+3130-318F;
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

  html, body {
    max-width: 100vw;
    overflow-x: hidden;
  }

  body {
    font-size: 1.6rem;
    background: ${(props) => props.theme.background};
    color: ${(props) => props.theme.foreground};
    font-family: Arial, Helvetica, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    transition: background 0.2s, color 0.2s;

    @media (max-width: ${(props) => props.theme.breakpoint}) {
      font-size: 1.4rem;
      -webkit-text-size-adjust: 100%;
      text-size-adjust: 100%;
    }
  }

  a {
    color: inherit;
    text-decoration: none;
  }
`;

interface Props {
  children: ReactNode;
}

export function ThemeProvider({ children }: Props) {
  const mode = useThemeStore((state) => state.mode);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by using default theme on server
  const theme = mounted ? themes[mode] : themes.light;

  return (
    <StyledThemeProvider theme={theme}>
      <GlobalStyle />
      {children}
    </StyledThemeProvider>
  );
}
