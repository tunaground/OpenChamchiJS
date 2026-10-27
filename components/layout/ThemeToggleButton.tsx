"use client";

import { useEffect, useState } from "react";
import styled from "styled-components";
import { useTranslations } from "next-intl";
import { nextThemeMode, useThemeStore } from "@/lib/store/theme";
import { useResolvedThemeMode } from "@/lib/theme";
import { iconButtonCss } from "./iconButton";

const Button = styled.button<{ $active?: boolean }>`
  ${iconButtonCss}
`;

const icons = {
  light:
    "M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z",
  grey: "M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z",
  dark: "M21 13A9 9 0 1111 3a7 7 0 0010 10z",
};

const labelKeys = {
  light: "switchToLight",
  grey: "switchToGrey",
  dark: "switchToDark",
} as const;

/** Steps light → grey → dark; the icon shows the mode it switches to */
export function ThemeToggleButton() {
  const t = useTranslations("theme");
  const resolved = useResolvedThemeMode();
  const toggleMode = useThemeStore((state) => state.toggleMode);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <Button aria-label={t("toggle")} />;
  }

  const next = nextThemeMode(resolved);
  const label = t(labelKeys[next]);

  return (
    <Button onClick={() => toggleMode(resolved)} aria-label={label} title={label}>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d={icons[next]} />
      </svg>
    </Button>
  );
}
