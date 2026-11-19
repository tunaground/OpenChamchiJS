// Body/UI fonts the user can pick in Settings.
//
// The choice lives in localStorage (lib/store/font.ts). app/layout.tsx runs
// fontBootScript() before first paint: it sets html[data-font] and loads the
// stylesheet of the chosen font only. --font-sans (theme.fontSans) follows
// html[data-font] through fontVariablesCss(). Mono and AA fonts are not part
// of this: they are functional.
//
// No DOM access here: the root layout (a Server Component) imports this file.

export type FontCategory = "gothic" | "serif" | "mono" | "system";

export interface FontOption {
  key: string;
  category: FontCategory;
  /** Shown as is in every locale; null means a translated label (system) */
  name: string | null;
  /** Full font-family value */
  stack: string;
  /** Stylesheet to load for this font, if it needs one */
  stylesheet: string | null;
}

/** Used until the user picks one. IBM Plex Sans KR ("plex") was the default before */
export const DEFAULT_FONT = "pretendard";

/** localStorage key of the persisted font store */
export const FONT_STORAGE_KEY = "font";

const fallbacks: Record<FontCategory, string> = {
  gothic: 'system-ui, -apple-system, "Apple SD Gothic Neo", sans-serif',
  serif: '"AppleMyungjo", "Batang", serif',
  mono: "ui-monospace, monospace",
  system: 'system-ui, -apple-system, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif',
};

const googleFont = (family: string, weights: string) =>
  `https://fonts.googleapis.com/css2?family=${family}:wght@${weights}&display=swap`;

function font(
  key: string,
  category: FontCategory,
  name: string | null,
  families: string | null,
  stylesheet: string | null
): FontOption {
  const stack = families ? `${families}, ${fallbacks[category]}` : fallbacks[category];
  return { key, category, name, stack, stylesheet };
}

export const FONTS: readonly FontOption[] = [
  font("pretendard", "gothic", "Pretendard", '"Pretendard Variable", Pretendard',
    "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"),
  font("plex", "gothic", "IBM Plex Sans KR", '"IBM Plex Sans KR"',
    googleFont("IBM+Plex+Sans+KR", "300;400;500;600;700")),
  font("noto-sans", "gothic", "Noto Sans KR", '"Noto Sans KR"',
    googleFont("Noto+Sans+KR", "300;400;500;600;700")),
  font("noto-serif", "serif", "Noto Serif KR", '"Noto Serif KR"',
    googleFont("Noto+Serif+KR", "300;400;500;600;700")),
  font("nanum-myeongjo", "serif", "나눔명조", '"Nanum Myeongjo"',
    googleFont("Nanum+Myeongjo", "400;700;800")),
  font("gowun-batang", "serif", "고운바탕", '"Gowun Batang"',
    googleFont("Gowun+Batang", "400;700")),
  font("nanum-gothic-coding", "mono", "나눔고딕코딩", '"Nanum Gothic Coding"',
    googleFont("Nanum+Gothic+Coding", "400;700")),
  // Its @font-face is declared in ThemeProvider's GlobalStyle (no subset
  // stylesheet exists); the files download only when the font is in use
  font("d2coding", "mono", "D2Coding", '"D2Coding"', null),
  font("system", "system", null, null, null),
];

const byKey = new Map(FONTS.map((f) => [f.key, f]));

/** The option for a saved key; anything unknown is the default */
export function resolveFont(key: unknown): FontOption {
  return (typeof key === "string" && byKey.get(key)) || byKey.get(DEFAULT_FONT)!;
}

/** CSS that points --font-sans at the font named by html[data-font] */
export function fontVariablesCss(): string {
  return (
    `:root{--font-sans:${resolveFont(DEFAULT_FONT).stack};}` +
    FONTS.map((f) => `html[data-font="${f.key}"]{--font-sans:${f.stack};}`).join("")
  );
}

/**
 * Inline script for <head>: applies the saved font before first paint.
 * document.write makes the stylesheet parser-inserted, so it blocks rendering
 * just like a <link> in the markup. Only the storage read is guarded: when it
 * fails the default font still gets its stylesheet.
 */
export function fontBootScript(): string {
  // null marks a font that needs no stylesheet
  const sheets = Object.fromEntries(FONTS.map((f) => [f.key, f.stylesheet]));
  return (
    `(function(){var s=${JSON.stringify(sheets)},k;` +
    `try{k=(JSON.parse(localStorage.getItem(${JSON.stringify(FONT_STORAGE_KEY)})||"{}").state||{}).font}catch(e){}` +
    `if(typeof k!=="string"||!Object.prototype.hasOwnProperty.call(s,k))k=${JSON.stringify(DEFAULT_FONT)};` +
    `document.documentElement.dataset.font=k;` +
    `if(s[k])document.write('<link rel="stylesheet" data-font-link="'+k+'" href="'+s[k]+'">')` +
    `})()`
  );
}
