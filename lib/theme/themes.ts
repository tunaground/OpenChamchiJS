// Theme definitions for light and dark modes

export const lightTheme = {
  mode: "light" as const,

  // Colors
  background: "#ffffff",
  foreground: "#171717",
  primary: "#0066cc",
  secondary: "#6c757d",
  accent: "#0d6efd",

  // Surface colors
  surface: "#ffffff",
  surfaceHover: "#f5f5f5",
  surfaceBorder: "#e0e0e0",

  // Text colors
  textPrimary: "#171717",
  textSecondary: "#666666",
  textMuted: "#999999",

  // Status colors
  success: "#28a745",
  warning: "#ffc107",
  error: "#dc3545",
  info: "#17a2b8",

  // TOM specific
  calcExpColor: "#888888",
  anchorALinkColor: "#0066cc",
  spoilerBackground: "rgba(0, 0, 0, 0.8)",

  // Layout
  breakpoint: "768px",
};

export const darkTheme = {
  mode: "dark" as const,

  // Colors
  background: "#0a0a0a",
  foreground: "#ededed",
  primary: "#4da6ff",
  secondary: "#adb5bd",
  accent: "#5a9cff",

  // Surface colors
  surface: "#1a1a1a",
  surfaceHover: "#2a2a2a",
  surfaceBorder: "#333333",

  // Text colors
  textPrimary: "#ededed",
  textSecondary: "#a0a0a0",
  textMuted: "#666666",

  // Status colors
  success: "#34c759",
  warning: "#ffcc00",
  error: "#ff453a",
  info: "#5ac8fa",

  // TOM specific
  calcExpColor: "#aaaaaa",
  anchorALinkColor: "#4da6ff",
  spoilerBackground: "rgba(255, 255, 255, 0.8)",

  // Layout
  breakpoint: "768px",
};

export type ThemeMode = "light" | "dark";
export type AppTheme = typeof lightTheme;

export const themes = {
  light: lightTheme,
  dark: darkTheme,
} as const;
