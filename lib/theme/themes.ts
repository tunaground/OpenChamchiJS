// Theme definitions for light, grey and dark modes
//
// Surface colors point at CSS variables (declared in ThemeProvider's GlobalStyle,
// keyed by html[data-mode]) so the mode applies before React mounts. Text and
// button colors stay hex because some components append a hex alpha suffix to
// them (e.g. `theme.textSecondary + "60"`).

// Layout constants (shared across all themes)
const layout = {
  breakpoint: "768px",
  contentMaxWidth: "80rem",
  adminMaxWidth: "96rem",
  containerPadding: "1.6rem",
  // Floating panes: gap to the window edge and between panes
  paneGap: "0.8rem",
  sidebarWidth: "23.2rem",
  toolbarHeight: "5.2rem",
  radiusPane: "10px",
  radiusControl: "6px",
  radiusChip: "4px",
  // Thread pages: seq-number gutter (sized per thread by ledgerGutterStyle, 4 digits by
  // default) and the minimal side padding (AA and wide text need the room)
  ledgerGutter: "var(--ledger-gutter, 5.6rem)",
  ledgerPadding: "1.2rem",
  fontSans: '"IBM Plex Sans KR", system-ui, -apple-system, "Apple SD Gothic Neo", sans-serif',
  fontMono: '"Google Sans Code", ui-monospace, monospace',
  fontAA: '"AAFont", "HeadKasen", "Saitamaar", sans-serif',
};

// Shared surface tokens (values live in CSS variables per mode)
const surfaces = {
  canvas: "var(--c-canvas)",
  pane: "var(--c-pane)",
  paneRaised: "var(--c-raised)",
  paneSunken: "var(--c-sunken)",
  line: "var(--c-line)",
  lineStrong: "var(--c-line-strong)",
  hover: "var(--c-hover)",
  accentSoft: "var(--c-accent-soft)",
  paneEdge: "var(--c-edge)",
  paneShadow: "var(--c-shadow)",
  scrim: "var(--c-scrim)",

  // Legacy names mapped onto the pane system
  background: "var(--c-field)",
  surface: "var(--c-pane)",
  surfaceHover: "var(--c-hover-solid)",
  surfaceBorder: "var(--c-line)",
  topBar: "var(--c-pane)",
  topBarHover: "var(--c-hover)",
  sidebar: "var(--c-pane)",
  sidebarHover: "var(--c-hover)",
  sidebarActive: "var(--c-accent-soft)",
  responseCard: "var(--c-pane)",
  toastBackground: "var(--c-toast)",
};

export const lightTheme = {
  mode: "light" as const,

  foreground: "#1b1f24",
  primary: "#0a6cb0",
  secondary: "#5b6470",
  accent: "#0a6cb0",

  topBarText: "#1b1f24",
  sidebarText: "#1b1f24",

  // Text colors
  textPrimary: "#1b1f24",
  textSecondary: "#5b6470",
  textMuted: "#8b939d",

  // Button colors
  buttonPrimary: "#0a6cb0",
  buttonPrimaryText: "#ffffff",

  // Status colors
  success: "#2f8a57",
  warning: "#c98a12",
  error: "#c43d3d",
  info: "#0a6cb0",

  // TOM specific
  calcExpColor: "#c43d3d",
  anchorALinkColor: "#0a6cb0",
  spoilerBackground: "rgba(0, 0, 0, 0.8)",

  toastText: "#ffffff",

  ...surfaces,
  ...layout,
};

export const darkTheme = {
  mode: "dark" as const,

  foreground: "#e7e8ea",
  primary: "#5aa9f0",
  secondary: "#9aa1ab",
  accent: "#5aa9f0",

  topBarText: "#e7e8ea",
  sidebarText: "#e7e8ea",

  // Text colors
  textPrimary: "#e7e8ea",
  textSecondary: "#9aa1ab",
  textMuted: "#6b727c",

  // Button colors
  buttonPrimary: "#5aa9f0",
  buttonPrimaryText: "#0d1a26",

  // Status colors
  success: "#4cc38a",
  warning: "#e0b341",
  error: "#f07070",
  info: "#5aa9f0",

  // TOM specific
  calcExpColor: "#ef7b7b",
  anchorALinkColor: "#5aa9f0",
  spoilerBackground: "rgba(255, 255, 255, 0.8)",

  toastText: "#ffffff",

  ...surfaces,
  ...layout,
};

// Between the two: no white, no black, for readers who find light too bright
// and dark too dark
export const greyTheme = {
  mode: "grey" as const,

  foreground: "#1d2126",
  primary: "#094c80",
  secondary: "#3f464e",
  accent: "#094c80",

  topBarText: "#1d2126",
  sidebarText: "#1d2126",

  // Text colors
  textPrimary: "#1d2126",
  textSecondary: "#3f464e",
  textMuted: "#4b5159",

  // Button colors
  buttonPrimary: "#094c80",
  buttonPrimaryText: "#e9edf0",

  // Status colors
  success: "#22703f",
  warning: "#8a5d00",
  error: "#a82e2e",
  info: "#094c80",

  // TOM specific
  calcExpColor: "#a82e2e",
  anchorALinkColor: "#094c80",
  spoilerBackground: "rgba(0, 0, 0, 0.8)",

  toastText: "#e9edf0",

  ...surfaces,
  ...layout,
};

export type ThemeMode = "light" | "grey" | "dark";
export type AppTheme = Omit<typeof lightTheme, "mode"> & { mode: ThemeMode };

export const themes = {
  light: lightTheme,
  grey: greyTheme,
  dark: darkTheme,
} as const;
