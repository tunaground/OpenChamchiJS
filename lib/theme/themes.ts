// Theme definitions for light and dark modes

export const lightTheme = {
  mode: "light" as const,

  // Colors - Tunaground blue accent
  background: "#f8fafc",
  foreground: "#171717",
  primary: "#0077b6",
  secondary: "#6c757d",
  accent: "#00b4d8",

  // Surface colors
  surface: "#ffffff",
  surfaceHover: "#f0f7fa",
  surfaceBorder: "#d0e4ed",

  // Specific surface colors - blue tinted
  topBar: "#0077b6",
  topBarText: "#ffffff",
  topBarHover: "#006298",
  sidebar: "#e8f4f8",
  sidebarText: "#171717",
  sidebarHover: "#b8d8e8",
  sidebarActive: "#b8dae8",
  responseCard: "#ffffff",

  // Text colors
  textPrimary: "#171717",
  textSecondary: "#4a6572",
  textMuted: "#7a9aaa",

  // Button colors
  buttonPrimary: "#0077b6",
  buttonPrimaryText: "#ffffff",

  // Status colors
  success: "#28a745",
  warning: "#ffc107",
  error: "#dc3545",
  info: "#00b4d8",

  // TOM specific
  calcExpColor: "#5a8a9a",
  anchorALinkColor: "#0077b6",
  spoilerBackground: "rgba(0, 0, 0, 0.8)",

  // Toast
  toastBackground: "rgba(0, 50, 80, 0.9)",
  toastText: "#ffffff",

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

  // Specific surface colors (same as surface for dark theme)
  topBar: "#1a1a1a",
  topBarText: "#ededed",
  topBarHover: "#2a2a2a",
  sidebar: "#1a1a1a",
  sidebarText: "#ededed",
  sidebarHover: "#2a2a2a",
  sidebarActive: "#2a2a2a",
  responseCard: "#1a1a1a",

  // Text colors
  textPrimary: "#ededed",
  textSecondary: "#a0a0a0",
  textMuted: "#666666",

  // Button colors
  buttonPrimary: "#3a3a3a",
  buttonPrimaryText: "#ededed",

  // Status colors
  success: "#34c759",
  warning: "#ffcc00",
  error: "#ff453a",
  info: "#5ac8fa",

  // TOM specific
  calcExpColor: "#aaaaaa",
  anchorALinkColor: "#4da6ff",
  spoilerBackground: "rgba(255, 255, 255, 0.8)",

  // Toast
  toastBackground: "rgba(50, 50, 50, 0.95)",
  toastText: "#ffffff",

  // Layout
  breakpoint: "768px",
};

export const greyTheme = {
  mode: "grey" as const,

  // Colors - darker grey tones, no white
  // Order: topBar (darkest) > sidebar > background > responseCard (lightest)
  background: "#b0b0b0",
  foreground: "#1a1a1a",
  primary: "#0055aa",
  secondary: "#5a6570",
  accent: "#0a5ebd",

  // Surface colors (used by topBar/sidebar by default, we override with specific ones)
  surface: "#909090",
  surfaceHover: "#808080",
  surfaceBorder: "#707070",

  // Specific surface colors for grey theme
  topBar: "#606060",
  topBarText: "#e8e8e8",
  topBarHover: "#505050",
  sidebar: "#989898",
  sidebarText: "#1a1a1a",
  sidebarHover: "#888888",
  sidebarActive: "#808080",
  responseCard: "#d0d0d0",

  // Text colors
  textPrimary: "#1a1a1a",
  textSecondary: "#303030",
  textMuted: "#505050",

  // Button colors
  buttonPrimary: "#3a3a3a",
  buttonPrimaryText: "#d8d8d8",

  // Status colors
  success: "#228b22",
  warning: "#d4a000",
  error: "#c42020",
  info: "#0088a8",

  // TOM specific
  calcExpColor: "#505050",
  anchorALinkColor: "#0055aa",
  spoilerBackground: "rgba(0, 0, 0, 0.8)",

  // Toast
  toastBackground: "rgba(30, 30, 30, 0.92)",
  toastText: "#e0e0e0",

  // Layout
  breakpoint: "768px",
};

export type ThemeMode = "light" | "dark" | "grey";
export type AppTheme = Omit<typeof lightTheme, "mode"> & { mode: ThemeMode };

export const themes = {
  light: lightTheme,
  dark: darkTheme,
  grey: greyTheme,
} as const;
