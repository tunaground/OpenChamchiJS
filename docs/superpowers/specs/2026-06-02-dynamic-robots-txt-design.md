# 동적 robots.txt 관리 — 설계

- **작성일**: 2026-06-02
- **상태**: 승인됨 (구현 대기)

## 목표

정적 `app/robots.txt` 파일을 제거하고, `GlobalSettings`에 저장된 값을 읽어
`text/plain`으로 응답하는 동적 라우트로 전환한다. 운영자가 admin 설정 페이지에서
robots.txt 내용을 자유 텍스트로 직접 편집할 수 있게 한다.

## 핵심 결정

| 항목 | 결정 |
|------|------|
| 편집 방식 | 자유 텍스트 (textarea, 전체 내용 그대로 입력/저장) |
| 빈 값 동작 | 현재 정적 `app/robots.txt` 내용을 코드 상수 기본값으로 사용 |
| 패턴 | 기존 `homepageContent` / `indexCustomHtml` / `threadCustomHtml` 와 동일 |

기존 커스텀 텍스트 필드 패턴을 그대로 따르므로 데이터 모델·검증·저장·캐시·UI 흐름이
이미 검증된 경로를 재사용한다.

## 구성 요소

### 1. 데이터 (`prisma/schema.prisma`)
- `GlobalSettings` 모델에 `robotsTxt String? @db.Text` 추가
- Prisma 마이그레이션 생성 (`npx prisma migrate dev`)

### 2. 기본값 상수 (신규: `lib/constants/robots.ts`)
현재 `app/robots.txt` 내용을 `DEFAULT_ROBOTS_TXT` 상수로 보존:

```
User-agent: *
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
```

### 3. 서빙 라우트
- 정적 `app/robots.txt` 파일 삭제
- `app/robots.txt/route.ts` Route Handler 추가 (폴더명 `robots.txt`)
  - `globalSettingsService.get()` 으로 값 조회 (이미 `CACHE_TAGS.settings` 로 캐시됨)
  - `settings.robotsTxt` 가 비어있지 않으면 그대로, 아니면 `DEFAULT_ROBOTS_TXT` 반환
  - 응답 헤더 `Content-Type: text/plain`
  - **검증 필요**: Next 16 App Router 에서 폴더형 라우트(`app/robots.txt/route.ts`)가
    metadata 파일 규약(`app/robots.ts`)과 충돌 없이 `/robots.txt` 로 서빙되는지
    `npm run build` 로 확인. 충돌 시 대안으로 metadata 동적 라우트(`app/robots.ts`)
    또는 다른 핸들러 경로로 조정.

### 4. 검증 스키마 (`lib/schemas/index.ts`)
- `robotsTxt: z.string().max(50000).optional().nullable()` 추가
  (기존 `indexCustomHtml` 등과 동일한 제약)

### 5. 저장 경로
- `lib/repositories/interfaces/global-settings.ts` — `GlobalSettingsData`,
  `UpdateGlobalSettingsInput` 에 `robotsTxt` 추가
- `lib/repositories/prisma/global-settings.ts` — 필드 매핑 추가
- `app/api/settings/route.ts` — PUT 처리에 포함 (기존 spread 처리 여부 확인)
- 캐시: `globalSettingsService.update()` 가 이미 `CACHE_TAGS.settings` 무효화 →
  별도 작업 불필요

### 6. UI (`app/admin/settings/admin-settings-content.tsx`)
- 기존 customHtml textarea 패턴 복제 → robots.txt 편집용 textarea 섹션 추가
- i18n 라벨/설명/placeholder 를 `lib/i18n/messages/ko.json`, `en.json`, `ja.json` 에 추가

## 데이터 흐름

```
크롤러 → GET /robots.txt → Route Handler → globalSettingsService.get() (캐시)
        → robotsTxt ?? DEFAULT_ROBOTS_TXT → text/plain 응답

admin → 설정 페이지 textarea → PUT /api/settings → DB 저장 + settings 캐시 무효화
```

## 테스트

- 기본값 fallback 로직, DB 값 우선 로직 단위 테스트 (`__tests__/`)
- robots route handler 응답 Content-Type / 내용 검증

## 범위 밖 (YAGNI)

- 구조화된 규칙 에디터 (User-agent/Allow/Disallow 폼 필드)
- sitemap.xml 동적 생성
- 보드별 robots 설정
