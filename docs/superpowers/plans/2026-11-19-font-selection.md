# 본문 글꼴 선택 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 개인 설정에서 본문/UI 글꼴을 9개 후보 중에 고르면 즉시, 그리고 새로고침 후에도 깜빡임 없이 적용된다.

**Architecture:** 글꼴 후보는 `lib/theme/fonts.ts` 한 곳에 정의한다. 선택은 zustand `persist`(localStorage 키 `font`)에 저장하고, `<head>` 인라인 스크립트가 첫 화면 전에 `html[data-font]`를 설정하며 고른 글꼴의 스타일시트만 넣는다. `theme.fontSans`는 `var(--font-sans)`가 되고 값은 `html[data-font]`별 CSS로 정해진다 (테마의 `data-mode`와 같은 구조).

**Tech Stack:** Next.js 16 App Router, React 19, styled-components, zustand, next-intl, Jest (`testEnvironment: "node"`).

**Spec:** `docs/superpowers/specs/2026-11-19-font-selection-design.md`

## Global Constraints

- `fontMono`와 `fontAA`, 그리고 `lib/tom/renderer.tsx`의 글꼴 지정은 건드리지 않는다.
- 기본값은 `plex`(IBM Plex Sans KR). 설정을 건드리지 않은 사용자는 지금과 같은 글꼴 요청만 보낸다.
- 저장은 localStorage뿐이다. 쿠키, DB, API 변경 없음.
- 고른 글꼴의 스타일시트만 불러온다. 후보 전체를 불러오지 않는다.
- 글꼴 이름은 번역하지 않는다. 분류 이름과 "시스템 기본"만 `ko`/`en`/`ja`로 번역한다.
- 커밋은 마지막 태스크에서 한 번만 한다. 그 전에 `CHANGELOG.md` Unreleased를 갱신한다.
- 코드 주석은 영어 (기존 관례).

## Review Focus

1. **localStorage를 쓸 수 없는 브라우저** (차단, 사생활 보호 모드에서 예외): 기본 글꼴이 정상 적용돼야 한다. 스타일시트가 빠져 시스템 글꼴로 보이면 안 된다. → Task 1 테스트.
2. **저장된 키가 목록에 없음** (후보를 나중에 뺐거나 값이 손상됨): 기본값으로 처리한다. → Task 1 테스트.
3. **설정에서 글꼴을 여러 번 바꿈**: 같은 스타일시트 `<link>`가 중복으로 쌓이지 않는다. → Task 2 테스트.
4. **서버 렌더링과 첫 클라이언트 렌더링의 불일치**: 설정 화면의 드롭다운이 hydration 경고를 내지 않는다 (마운트 전에는 기본값 표시). → Task 3 브라우저 확인.
5. **AA와 다이스/계산 결과**: 어떤 글꼴을 골라도 모양이 그대로다. → Task 4 브라우저 확인.

---

### Task 1: 글꼴 목록과 첫 화면 전 스크립트

**Files:**
- Create: `lib/theme/fonts.ts`
- Test: `__tests__/theme/fonts.test.ts`

**Interfaces:**
- Produces:
  - `type FontCategory = "gothic" | "serif" | "mono" | "system"`
  - `interface FontOption { key: string; category: FontCategory; name: string | null; stack: string; stylesheet: string | null }` (`name`이 `null`이면 번역된 이름을 쓴다: 시스템)
  - `const FONTS: readonly FontOption[]`
  - `const DEFAULT_FONT = "plex"`
  - `const FONT_STORAGE_KEY = "font"`
  - `function resolveFont(key: unknown): FontOption` — 목록에 없으면 기본값
  - `function fontVariablesCss(): string` — `:root{--font-sans:…}` + `html[data-font="…"]{--font-sans:…}` 규칙들
  - `function fontBootScript(): string` — `<head>` 인라인 스크립트 본문

**목록 (순서 그대로, 값 고정):**

| key | category | name | stack 앞부분 | stylesheet |
|---|---|---|---|---|
| `plex` | gothic | IBM Plex Sans KR | `"IBM Plex Sans KR"` | `https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@300;400;500;600;700&display=swap` |
| `pretendard` | gothic | Pretendard | `"Pretendard Variable", Pretendard` | `https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css` |
| `noto-sans` | gothic | Noto Sans KR | `"Noto Sans KR"` | `https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700&display=swap` |
| `noto-serif` | serif | Noto Serif KR | `"Noto Serif KR"` | `https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@300;400;500;600;700&display=swap` |
| `nanum-myeongjo` | serif | 나눔명조 | `"Nanum Myeongjo"` | `https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700;800&display=swap` |
| `gowun-batang` | serif | 고운바탕 | `"Gowun Batang"` | `https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&display=swap` |
| `nanum-gothic-coding` | mono | 나눔고딕코딩 | `"Nanum Gothic Coding"` | `https://fonts.googleapis.com/css2?family=Nanum+Gothic+Coding:wght@400;700&display=swap` |
| `d2coding` | mono | D2Coding | `"D2Coding"` | `null` (Task 2에서 `@font-face`로 선언) |
| `system` | system | `null` | (없음) | `null` |

stack 뒷부분은 분류별로 붙인다:
- gothic: `system-ui, -apple-system, "Apple SD Gothic Neo", sans-serif` (지금 `fontSans`와 같음)
- serif: `"AppleMyungjo", "Batang", serif`
- mono: `ui-monospace, monospace`
- system: `system-ui, -apple-system, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`

**`fontBootScript()`가 만드는 스크립트의 동작:**
- `localStorage.getItem("font")`을 JSON으로 읽어 `.state.font`를 얻는다. 읽기만 `try/catch`로 감싼다. 실패하거나 목록에 없는 키면 `plex`.
- `document.documentElement.dataset.font = key`.
- 그 글꼴에 stylesheet가 있으면 `document.write('<link rel="stylesheet" data-font-link="KEY" href="URL">')`. (`document.write`는 파서가 넣는 것이라 지금의 고정 `<link>`처럼 렌더링 전에 적용된다.)
- 스크립트에는 key → stylesheet 맵만 넣는다 (stack은 CSS에 있다).

- [ ] **Step 1: 실패하는 테스트 작성** (`__tests__/theme/fonts.test.ts`)

스크립트는 `new Function("localStorage", "document", fontBootScript())`로 실행하고, `document`는 `{ documentElement: { dataset: {} }, write: jest.fn() }`로 대신한다.

```ts
describe("FONTS", () => {
  it("has 9 options with unique keys, default first", () => {
    expect(FONTS).toHaveLength(9);
    expect(new Set(FONTS.map((f) => f.key)).size).toBe(9);
    expect(FONTS[0].key).toBe(DEFAULT_FONT);
  });
  it("keeps the current stack for the default", () => {
    expect(resolveFont("plex").stack).toBe(
      '"IBM Plex Sans KR", system-ui, -apple-system, "Apple SD Gothic Neo", sans-serif'
    );
  });
  it("loads no stylesheet for system or d2coding", () => {
    expect(resolveFont("system").stylesheet).toBeNull();
    expect(resolveFont("d2coding").stylesheet).toBeNull();
  });
});

describe("resolveFont", () => {
  it.each([undefined, null, 3, "", "comic-sans"])("falls back to the default for %p", (key) => {
    expect(resolveFont(key).key).toBe("plex");
  });
});

describe("fontVariablesCss", () => {
  it("declares the default on :root and one rule per font", () => {
    const css = fontVariablesCss();
    expect(css).toContain(":root{--font-sans:" + resolveFont("plex").stack);
    for (const f of FONTS) expect(css).toContain(`html[data-font="${f.key}"]{--font-sans:${f.stack}`);
  });
});

describe("fontBootScript", () => {
  // run(stored) returns { font: dataset.font, written: document.write calls }
  it("applies the saved font and writes only its stylesheet", () => {
    const r = run(JSON.stringify({ state: { font: "noto-serif" }, version: 0 }));
    expect(r.font).toBe("noto-serif");
    expect(r.written).toHaveLength(1);
    expect(r.written[0]).toContain("family=Noto+Serif+KR");
    expect(r.written[0]).toContain('data-font-link="noto-serif"');
  });
  it("writes no stylesheet for system", () => {
    const r = run(JSON.stringify({ state: { font: "system" } }));
    expect(r.font).toBe("system");
    expect(r.written).toHaveLength(0);
  });
  it.each([null, "not json", JSON.stringify({ state: { font: "comic-sans" } })])(
    "uses the default with its stylesheet when storage holds %p",
    (stored) => {
      const r = run(stored);
      expect(r.font).toBe("plex");
      expect(r.written[0]).toContain("family=IBM+Plex+Sans+KR");
    }
  );
  it("uses the default with its stylesheet when localStorage throws", () => {
    const r = runWithThrowingStorage();
    expect(r.font).toBe("plex");
    expect(r.written[0]).toContain("family=IBM+Plex+Sans+KR");
  });
});
```

- [ ] **Step 2: 실패 확인** — `npm test -- --testPathPattern=theme/fonts` → FAIL (모듈 없음)
- [ ] **Step 3: `lib/theme/fonts.ts` 구현** — 위 Interfaces와 표대로. DOM에 의존하는 코드는 이 파일에 넣지 않는다 (서버 컴포넌트인 `app/layout.tsx`가 import한다).
- [ ] **Step 4: 통과 확인** — `npm test -- --testPathPattern=theme/fonts` → PASS

---

### Task 2: 저장과 적용

**Files:**
- Create: `lib/store/font.ts`
- Create: `lib/theme/apply-font.ts`
- Modify: `lib/theme/themes.ts:25` (`fontSans`)
- Modify: `lib/theme/ThemeProvider.tsx` (GlobalStyle, `ThemeProvider`)
- Modify: `app/layout.tsx:42-51`
- Test: `__tests__/theme/apply-font.test.ts`

**Interfaces:**
- Consumes: Task 1의 `FONTS`, `DEFAULT_FONT`, `FONT_STORAGE_KEY`, `resolveFont`, `fontVariablesCss`, `fontBootScript`
- Produces:
  - `useFontStore` — `{ font: string; setFont: (font: string) => void }`, `persist` 이름 `FONT_STORAGE_KEY`, 초깃값 `DEFAULT_FONT` (`lib/store/theme.ts`와 같은 모양, `version`/`migrate` 없음)
  - `function applyFont(key: string, doc: Document = document): void` — `doc.documentElement.dataset.font`를 `resolveFont(key).key`로 설정하고, stylesheet가 있고 `link[data-font-link="KEY"]`가 아직 없으면 `<head>`에 추가

- [ ] **Step 1: 실패하는 테스트 작성** (`__tests__/theme/apply-font.test.ts`)

`doc`은 `documentElement.dataset`, `querySelector`, `createElement`, `head.appendChild`만 가진 가짜 객체로 넘긴다.

```ts
it("sets data-font and appends the stylesheet once", () => {
  applyFont("noto-sans", doc);
  applyFont("noto-sans", doc);
  expect(doc.documentElement.dataset.font).toBe("noto-sans");
  expect(appended).toHaveLength(1);
  expect(appended[0].href).toContain("family=Noto+Sans+KR");
  expect(appended[0].dataset.fontLink).toBe("noto-sans");
});
it("appends nothing for system", () => {
  applyFont("system", doc);
  expect(doc.documentElement.dataset.font).toBe("system");
  expect(appended).toHaveLength(0);
});
it("falls back to the default for an unknown key", () => {
  applyFont("comic-sans", doc);
  expect(doc.documentElement.dataset.font).toBe("plex");
});
```

- [ ] **Step 2: 실패 확인** — `npm test -- --testPathPattern=theme/apply-font` → FAIL
- [ ] **Step 3: `lib/store/font.ts`와 `lib/theme/apply-font.ts` 구현**
- [ ] **Step 4: 통과 확인** — `npm test -- --testPathPattern=theme` → PASS
- [ ] **Step 5: `lib/theme/themes.ts`** — `fontSans: "var(--font-sans)"`. 파일 머리 주석에 글꼴 변수도 `html[data-font]`로 정해진다는 한 줄 추가.
- [ ] **Step 6: `lib/theme/ThemeProvider.tsx`의 GlobalStyle**
  - `${fontVariablesCss()}`를 넣는다.
  - D2Coding `@font-face` 두 개(400, 700)를 AAFont 선언 옆에 추가한다: `font-family: "D2Coding"`, `src: local("D2Coding"), url("https://cdn.jsdelivr.net/gh/joungkyun/font-d2coding@1.3.2/D2Coding.woff2") format("woff2")` (700은 `local("D2Coding Bold")`, `D2CodingBold.woff2`), `font-display: swap`. 브라우저는 실제로 쓰일 때만 파일을 받는다. 구현 전에 두 URL이 200인지 `curl -sI`로 확인한다.
- [ ] **Step 7: `ThemeProvider` 컴포넌트** — `useFontStore`의 `font`를 읽고, `data-mode` 동기화 effect 옆에 `if (mounted) applyFont(font)` effect 추가.
- [ ] **Step 8: `app/layout.tsx`**
  - IBM Plex Sans KR 고정 `<link>`(42-45행)를 지운다. Google Sans Code 링크는 그대로.
  - `<link rel="preconnect" href="https://fonts.googleapis.com" />`, `<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />` 추가 (스크립트가 넣는 링크는 브라우저가 미리 찾지 못하므로).
  - 테마 스크립트 바로 뒤에 `<script dangerouslySetInnerHTML={{ __html: fontBootScript() }} />` 추가, 주석 한 줄.
- [ ] **Step 9: 타입/린트 확인** — `npx tsc --noEmit && npm run lint` → 오류 없음

---

### Task 3: 설정 화면과 번역

**Files:**
- Modify: `app/settings/settings-content.tsx` (테마 `OptionItem` 바로 아래, 462-482행 부근)
- Modify: `lib/i18n/messages/ko.json`, `en.json`, `ja.json` (`settings` 네임스페이스, `themeGrey` 뒤)

**Interfaces:**
- Consumes: `FONTS`, `DEFAULT_FONT`, `FontCategory` (Task 1), `useFontStore` (Task 2)

**번역 키 (값 고정):**

| key | ko | en | ja |
|---|---|---|---|
| `font` | 글꼴 | Font | フォント |
| `fontDescription` | 본문과 메뉴에 쓰는 글꼴을 고릅니다. AA와 다이스·계산 결과는 바뀌지 않습니다. | Choose the font for text and menus. AA and dice/calc results keep their own fonts. | 本文とメニューのフォントを選びます。AAとダイス・計算結果は変わりません。 |
| `fontGroupGothic` | 고딕 | Sans-serif | ゴシック |
| `fontGroupSerif` | 명조 | Serif | 明朝 |
| `fontGroupMono` | 고정폭 | Monospace | 等幅 |
| `fontGroupSystem` | 시스템 | System | システム |
| `fontSystem` | 시스템 기본 | System default | システム標準 |

- [ ] **Step 1: 번역 키 추가** — 세 파일 모두.
- [ ] **Step 2: 드롭다운 추가**
  - 테마 항목 아래에 `OptionItem` 하나: `OptionLabel` = `t("font")`, `OptionDescription` = `t("fontDescription")`.
  - 컨트롤은 `<select>` 하나 (styled `FontSelect`: `paneRaised` 배경, `line` 테두리, `radiusControl`, `font-family: inherit`, 같은 파일의 `Segmented`와 높이를 맞춘다). `aria-label` = `t("font")`.
  - `FONTS`를 `category` 순서(gothic, serif, mono, system)대로 `<optgroup label={t("fontGroup…")}>`로 묶는다. 옵션 글자는 `name ?? t("fontSystem")`.
  - 값은 `mounted ? font : DEFAULT_FONT` (테마 항목과 같은 hydration 처리), `onChange`에서 `setFont`.
- [ ] **Step 3: 확인** — `npx tsc --noEmit && npm run lint` → 오류 없음

---

### Task 4: 브라우저 확인, 문서, 커밋

**Files:**
- Modify: `CLAUDE.md` (Styling & Theming의 "Fonts:" 줄, Key Directories의 `lib/store/` 줄)
- Modify: `CHANGELOG.md` (Unreleased → Added)
- Modify: `docs/superpowers/specs/2026-11-19-font-selection-design.md` (상태 → 구현됨, 구현 중 달라진 점이 있으면 머리에 기록)

- [ ] **Step 1: 전체 테스트와 빌드** — `npm test` → 전부 PASS, `npm run build` → 성공
- [ ] **Step 2: 브라우저 확인** (개발 서버. 사용자가 띄운 서버나 브라우저는 허락 없이 쓰지 않는다)
  - 저장값 없이 접속: 네트워크에 글꼴 스타일시트가 IBM Plex Sans KR 하나(+ Google Sans Code)뿐이고 본문이 지금과 같다.
  - `/settings`에서 글꼴 9개를 차례로 고른다: 새로고침 없이 바뀌고, `<head>`에 같은 `data-font-link`가 중복되지 않는다. 콘솔에 hydration 경고 없음.
  - 명조를 고른 뒤 새로고침: 첫 화면부터 명조이고 IBM Plex 스타일시트 요청이 없다.
  - 시스템을 고른 뒤 새로고침: 본문 글꼴용 스타일시트 요청이 없다.
  - 스레드 화면에서 AA, 다이스, 계산 결과의 글꼴이 그대로다. AA 모드를 끈 입력란은 고른 글꼴을 따른다.
  - light/grey/dark, 모바일 폭에서 드롭다운이 깨지지 않는다.
- [ ] **Step 3: 문서 갱신**
  - `CLAUDE.md` Fonts 줄: 본문 글꼴은 `lib/theme/fonts.ts`의 후보 중 사용자가 고르고(`lib/store/font.ts`, 기본 IBM Plex Sans KR), `--font-sans`가 `html[data-font]`로 정해지며 `app/layout.tsx` 스크립트가 첫 화면 전에 적용한다는 내용. `lib/store/` 줄에 `font` 추가.
  - `CHANGELOG.md` Added: 설정에서 본문 글꼴을 고를 수 있다는 한 항목 (영어, 기존 문체).
- [ ] **Step 4: 커밋** (한 번)

```bash
git add -A
git commit -m "feat: choose the body font in settings"
```
