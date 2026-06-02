# 동적 robots.txt 관리 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 정적 `app/robots.txt` 를 `GlobalSettings` 에 저장된 값으로 서빙하는 동적 라우트로 전환하고, admin 설정 페이지에서 자유 텍스트로 편집할 수 있게 한다.

**Architecture:** 기존 `indexCustomHtml` / `threadCustomHtml` 커스텀 텍스트 필드 패턴을 그대로 따른다. `GlobalSettings` 에 `robotsTxt` 필드를 추가하고, Route Handler 가 캐시된 설정을 읽어 `text/plain` 으로 응답한다. 값이 비어있으면 현재 정적 내용을 코드 상수 기본값으로 반환한다.

**Tech Stack:** Next.js 16 App Router (Route Handler), Prisma 7, Zod, styled-components, next-intl, Jest.

---

## File Structure

| File | 책임 | 작업 |
|------|------|------|
| `prisma/schema.prisma` | `GlobalSettings.robotsTxt` 필드 | Modify |
| `lib/constants/robots.ts` | `DEFAULT_ROBOTS_TXT` 상수 | Create |
| `app/robots.txt` | 기존 정적 파일 | Delete |
| `app/robots.txt/route.ts` | `/robots.txt` 동적 서빙 | Create |
| `lib/repositories/interfaces/global-settings.ts` | 타입에 `robotsTxt` | Modify |
| `lib/repositories/prisma/global-settings.ts` | `robotsTxt` 매핑 | Modify |
| `lib/schemas/index.ts` | `updateSettingsSchema.robotsTxt` | Modify |
| `app/admin/settings/page.tsx` | initialSettings/labels 전달 | Modify |
| `app/admin/settings/admin-settings-content.tsx` | textarea 섹션 | Modify |
| `lib/i18n/messages/{ko,en,ja}.json` | i18n 라벨 | Modify |
| `__tests__/constants/robots.test.ts` | 상수 검증 | Create |

---

## Task 1: 기본값 상수 추가

**Files:**
- Create: `lib/constants/robots.ts`
- Test: `__tests__/constants/robots.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/constants/robots.test.ts`:

```typescript
import { DEFAULT_ROBOTS_TXT } from "@/lib/constants/robots";

describe("DEFAULT_ROBOTS_TXT", () => {
  it("includes the core disallow rules", () => {
    expect(DEFAULT_ROBOTS_TXT).toContain("User-agent: *");
    expect(DEFAULT_ROBOTS_TXT).toContain("Disallow: /api/");
    expect(DEFAULT_ROBOTS_TXT).toContain("Disallow: /admin/");
  });

  it("is a non-empty string with no trailing whitespace lines", () => {
    expect(DEFAULT_ROBOTS_TXT.length).toBeGreaterThan(0);
    expect(DEFAULT_ROBOTS_TXT.endsWith("\n")).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern=constants/robots`
Expected: FAIL — `Cannot find module '@/lib/constants/robots'`

- [ ] **Step 3: Create the constant**

Create `lib/constants/robots.ts` (내용은 현재 `app/robots.txt` 와 동일, 끝에 개행 포함):

```typescript
export const DEFAULT_ROBOTS_TXT = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Allow: /archive
Disallow: /archive/
Disallow: /setup
Disallow: /login
Disallow: /settings
Disallow: /test/
Disallow: /*?*
`;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --testPathPattern=constants/robots`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/constants/robots.ts __tests__/constants/robots.test.ts
git commit -m "feat: add DEFAULT_ROBOTS_TXT constant"
```

---

## Task 2: Prisma 스키마 + 마이그레이션

**Files:**
- Modify: `prisma/schema.prisma` (model `GlobalSettings`)

- [ ] **Step 1: Add the field**

`prisma/schema.prisma` 의 `GlobalSettings` 모델에서 `threadCustomHtml` 줄 바로 아래에 추가:

```prisma
  threadCustomHtml String?  @db.Text // Custom HTML for thread pages (above load more)
  robotsTxt        String?  @db.Text // Dynamic robots.txt content (falls back to DEFAULT_ROBOTS_TXT)
```

- [ ] **Step 2: Generate migration + client**

Run: `npx prisma migrate dev --name add_robots_txt`
Expected: 새 마이그레이션 생성, `npx prisma generate` 자동 실행, 에러 없음.

> DB 연결이 없는 환경이면 `npx prisma migrate dev` 대신 마이그레이션 SQL 을 수동 작성하고 `npx prisma generate` 만 실행. 둘 중 무엇을 했는지 커밋 메시지에 명시.

- [ ] **Step 3: Verify Prisma Client type**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | head -20`
Expected: `robotsTxt` 관련 타입 에러 없음 (기존 무관 에러는 무시).

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat: add robotsTxt column to GlobalSettings"
```

---

## Task 3: 동적 robots.txt Route Handler

**Files:**
- Delete: `app/robots.txt`
- Create: `app/robots.txt/route.ts`

- [ ] **Step 1: Delete the static file**

Run: `git rm app/robots.txt`
Expected: `app/robots.txt` 삭제됨.

- [ ] **Step 2: Create the Route Handler**

Create `app/robots.txt/route.ts`:

```typescript
import { globalSettingsService } from "@/lib/services/global-settings";
import { DEFAULT_ROBOTS_TXT } from "@/lib/constants/robots";

export async function GET() {
  const settings = await globalSettingsService.get();
  const body =
    settings.robotsTxt && settings.robotsTxt.trim().length > 0
      ? settings.robotsTxt
      : DEFAULT_ROBOTS_TXT;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
```

> 참고: `globalSettingsService.get()` 는 이미 `CACHE_TAGS.settings` 로 캐시되므로 별도 캐시 처리 불필요. 설정 저장 시 `update()` 가 캐시를 무효화한다.

- [ ] **Step 3: Verify build serves /robots.txt**

Run: `npm run build 2>&1 | tail -30`
Expected: 빌드 성공. `app/robots.txt/route.ts` 가 metadata 규약과 충돌한다는 에러가 없어야 함. route 목록에 `/robots.txt` 가 표시되면 정상.

> **충돌 발생 시 대안:** 폴더형 라우트가 metadata robots 규약과 충돌하면, `app/robots.txt/route.ts` 대신 metadata 동적 라우트로 전환 불가(자유 텍스트 불가)하므로, 핸들러를 `app/(seo)/robots.txt/route.ts` 같은 route group 으로 감싸거나, `app/api/robots/route.ts` 로 두고 `next.config.ts` rewrite 로 `/robots.txt` → `/api/robots` 연결. 빌드 에러 메시지에 맞춰 선택하고 변경 사항을 기록.

- [ ] **Step 4: Smoke test (선택, dev 서버 가능 시)**

Run: `npm run dev` 후 다른 터미널에서 `curl -i http://localhost:3000/robots.txt`
Expected: `200`, `Content-Type: text/plain`, 본문에 `Disallow: /api/` 포함. 확인 후 dev 서버 종료.

- [ ] **Step 5: Commit**

```bash
git add app/robots.txt app/robots.txt/route.ts
git commit -m "feat: serve robots.txt dynamically from GlobalSettings"
```

---

## Task 4: 저장 경로 (repository interface + impl + zod)

**Files:**
- Modify: `lib/repositories/interfaces/global-settings.ts`
- Modify: `lib/repositories/prisma/global-settings.ts`
- Modify: `lib/schemas/index.ts`

- [ ] **Step 1: Add to interface — `GlobalSettingsData`**

`lib/repositories/interfaces/global-settings.ts` 의 `GlobalSettingsData` 에서 `threadCustomHtml` 아래에 추가:

```typescript
  threadCustomHtml: string | null;
  robotsTxt: string | null;
```

- [ ] **Step 2: Add to interface — `UpdateGlobalSettingsInput`**

같은 파일의 `UpdateGlobalSettingsInput` 에서 `threadCustomHtml?` 아래에 추가:

```typescript
  threadCustomHtml?: string | null;
  robotsTxt?: string | null;
```

- [ ] **Step 3: Add to Prisma impl — `updateData` 타입 + 매핑**

`lib/repositories/prisma/global-settings.ts` 의 `updateData` 로컬 타입에서 `threadCustomHtml?: string | null;` 아래에 추가:

```typescript
      threadCustomHtml?: string | null;
      robotsTxt?: string | null;
```

그리고 `if (data.threadCustomHtml !== undefined) { ... }` 블록 아래에 추가:

```typescript
    if (data.robotsTxt !== undefined) {
      updateData.robotsTxt = data.robotsTxt;
    }
```

> `get()` 의 `toGlobalSettingsData` 는 `...settings` 스프레드라 `robotsTxt` 가 자동 포함됨. 별도 수정 불필요.

- [ ] **Step 4: Add to Zod schema**

`lib/schemas/index.ts` 의 `updateSettingsSchema` 에서 `threadCustomHtml` 줄 아래에 추가:

```typescript
  threadCustomHtml: z.string().max(50000).optional().nullable(),
  robotsTxt: z.string().max(50000).optional().nullable(),
```

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit 2>&1 | grep -i robots || echo "no robots type errors"`
Expected: `no robots type errors`

- [ ] **Step 6: Commit**

```bash
git add lib/repositories/interfaces/global-settings.ts lib/repositories/prisma/global-settings.ts lib/schemas/index.ts
git commit -m "feat: persist robotsTxt through settings repository and schema"
```

> API 라우트(`app/api/settings/route.ts`)는 `parsed.data` 를 그대로 `update()` 에 넘기므로 수정 불필요.

---

## Task 5: i18n 라벨 추가

**Files:**
- Modify: `lib/i18n/messages/ko.json`
- Modify: `lib/i18n/messages/en.json`
- Modify: `lib/i18n/messages/ja.json`

- [ ] **Step 1: ko.json**

`lib/i18n/messages/ko.json` 의 `adminSettings` 객체에서 `threadCustomHtmlDescription` 줄 아래에 추가:

```json
    "threadCustomHtmlDescription": "스레드 페이지의 본문 아래에 표시되는 커스텀 HTML입니다. 광고, 안내문 등에 활용할 수 있습니다.",
    "robotsTxt": "robots.txt",
    "robotsTxtPlaceholder": "비워두면 기본 robots.txt가 사용됩니다",
    "robotsTxtDescription": "검색엔진 크롤러에게 제공되는 robots.txt 내용입니다. 비워두면 기본값이 사용됩니다.",
```

- [ ] **Step 2: en.json**

`lib/i18n/messages/en.json` 의 동일 위치에 추가:

```json
    "threadCustomHtmlDescription": "Custom HTML displayed below the thread body on thread pages. Can be used for ads, announcements, widgets, etc.",
    "robotsTxt": "robots.txt",
    "robotsTxtPlaceholder": "Leave empty to use the default robots.txt",
    "robotsTxtDescription": "The robots.txt content served to search engine crawlers. The default is used when left empty.",
```

- [ ] **Step 3: ja.json**

`lib/i18n/messages/ja.json` 의 동일 위치에 추가:

```json
    "threadCustomHtmlDescription": "スレッドページの本文の下に表示されるカスタムHTMLです。広告やお知らせなどに活用できます。",
    "robotsTxt": "robots.txt",
    "robotsTxtPlaceholder": "空欄の場合はデフォルトのrobots.txtが使用されます",
    "robotsTxtDescription": "検索エンジンのクローラーに提供されるrobots.txtの内容です。空欄の場合はデフォルトが使用されます。",
```

- [ ] **Step 4: Validate JSON**

Run: `node -e "['ko','en','ja'].forEach(l=>{const m=require('./lib/i18n/messages/'+l+'.json');if(!m.adminSettings.robotsTxt)throw new Error(l);});console.log('ok')"`
Expected: `ok`

- [ ] **Step 5: Commit**

```bash
git add lib/i18n/messages/ko.json lib/i18n/messages/en.json lib/i18n/messages/ja.json
git commit -m "feat: add robots.txt settings i18n labels"
```

---

## Task 6: Admin 설정 UI

**Files:**
- Modify: `app/admin/settings/page.tsx`
- Modify: `app/admin/settings/admin-settings-content.tsx`

- [ ] **Step 1: page.tsx — initialSettings 에 전달**

`app/admin/settings/page.tsx` 의 `initialSettings={{ ... }}` 에서 `threadCustomHtml: settings.threadCustomHtml,` 아래에 추가:

```tsx
        threadCustomHtml: settings.threadCustomHtml,
        robotsTxt: settings.robotsTxt,
```

- [ ] **Step 2: page.tsx — labels 에 전달**

같은 파일 `labels={{ ... }}` 에서 `threadCustomHtmlDescription: t("threadCustomHtmlDescription"),` 아래에 추가:

```tsx
        threadCustomHtmlDescription: t("threadCustomHtmlDescription"),
        robotsTxt: t("robotsTxt"),
        robotsTxtPlaceholder: t("robotsTxtPlaceholder"),
        robotsTxtDescription: t("robotsTxtDescription"),
```

- [ ] **Step 3: admin-settings-content.tsx — labels 인터페이스**

`app/admin/settings/admin-settings-content.tsx` 의 labels 타입(약 364–369줄)에서 `threadCustomHtmlDescription: string;` 아래에 추가:

```tsx
  threadCustomHtmlDescription: string;
  robotsTxt: string;
  robotsTxtPlaceholder: string;
  robotsTxtDescription: string;
```

- [ ] **Step 4: admin-settings-content.tsx — initialSettings 타입**

같은 파일 `initialSettings` prop 타입(약 408–409줄)에서 `threadCustomHtml: string | null;` 아래에 추가:

```tsx
    threadCustomHtml: string | null;
    robotsTxt: string | null;
```

- [ ] **Step 5: admin-settings-content.tsx — state**

`const [threadCustomHtml, setThreadCustomHtml] = useState(...)` (약 452줄) 아래에 추가:

```tsx
  const [robotsTxt, setRobotsTxt] = useState(initialSettings.robotsTxt ?? "");
```

- [ ] **Step 6: admin-settings-content.tsx — save payload**

`threadCustomHtml: threadCustomHtml || null,` (약 526줄) 아래에 추가:

```tsx
          threadCustomHtml: threadCustomHtml || null,
          robotsTxt: robotsTxt || null,
```

- [ ] **Step 7: admin-settings-content.tsx — JSX FormGroup**

`threadCustomHtml` FormGroup (약 674–684줄, `<Description>{labels.threadCustomHtmlDescription}</Description>` 로 끝나는 `</FormGroup>`) 바로 아래에 추가:

```tsx
        <FormGroup>
          <Label htmlFor="robotsTxt">{labels.robotsTxt}</Label>
          <TextArea
            id="robotsTxt"
            value={robotsTxt}
            onChange={(e) => setRobotsTxt(e.target.value)}
            placeholder={labels.robotsTxtPlaceholder}
            disabled={!canUpdate}
          />
          <Description>{labels.robotsTxtDescription}</Description>
        </FormGroup>
```

- [ ] **Step 8: Typecheck + lint**

Run: `npx tsc --noEmit 2>&1 | grep -i "robots\|settings" || echo "clean"` then `npm run lint 2>&1 | tail -5`
Expected: robots/settings 관련 타입 에러 없음, lint 통과.

- [ ] **Step 9: Commit**

```bash
git add app/admin/settings/page.tsx app/admin/settings/admin-settings-content.tsx
git commit -m "feat: add robots.txt editor to admin settings page"
```

---

## Task 7: 최종 검증

- [ ] **Step 1: 전체 테스트**

Run: `npm test`
Expected: 전체 통과 (신규 `constants/robots` 포함).

- [ ] **Step 2: 빌드**

Run: `npm run build 2>&1 | tail -20`
Expected: 성공, `/robots.txt` route 포함.

- [ ] **Step 3: 동작 확인 (dev)**

Run: `npm run dev`, 그 후 `curl -s http://localhost:3000/robots.txt`
Expected: 기본값 출력. (DB에 값이 있으면 그 값.) 확인 후 종료.

- [ ] **Step 4: CHANGELOG 갱신 (선택)**

`CHANGELOG.md` Unreleased 섹션에 한 줄 추가:

```
- feat: 동적 robots.txt 관리 (admin 설정에서 편집 가능)
```

Commit:

```bash
git add CHANGELOG.md
git commit -m "docs: note dynamic robots.txt in changelog"
```

---

## Self-Review Notes

- **Spec coverage:** 데이터(Task 2)·기본값 상수(Task 1)·서빙 라우트(Task 3)·검증 스키마+저장(Task 4)·i18n(Task 5)·UI(Task 6)·테스트(Task 1, 7) 모두 spec 항목과 1:1 대응.
- **서빙 메커니즘 리스크:** Task 3 Step 3 에서 빌드로 검증하고 대안 경로를 명시.
- **타입 일관성:** `robotsTxt: string | null` (data), `robotsTxt?: string | null` (input), state `robotsTxt: string`, payload `robotsTxt || null` 로 전 구간 일치.
