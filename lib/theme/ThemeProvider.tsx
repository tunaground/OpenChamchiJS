"use client";

import { useEffect, useState, ReactNode } from "react";
import { ThemeProvider as StyledThemeProvider, createGlobalStyle } from "styled-components";
import { useThemeStore } from "@/lib/store/theme";
import { themes } from "./themes";

const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
    padding: 0;
    margin: 0;
  }

  html {
    color-scheme: ${(props) => props.theme.mode};
  }

  html, body {
    max-width: 100vw;
    overflow-x: hidden;
  }

  body {
    background: ${(props) => props.theme.background};
    color: ${(props) => props.theme.foreground};
    font-family: Arial, Helvetica, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    transition: background 0.2s, color 0.2s;
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
