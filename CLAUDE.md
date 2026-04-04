# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Info

- **License**: MIT (open source)
- **Repository**: https://github.com/tunaground/OpenChamchiJS
- Next.js 16 익명 게시판 시스템 (App Router, React 19, TypeScript)

## Build & Development Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Prisma Commands

```bash
npx prisma generate    # Generate Prisma Client after schema changes
npx prisma migrate dev # Create and apply migrations (development)
npx prisma db push     # Push schema changes without migration (prototyping)
npx prisma studio      # Open Prisma Studio GUI
```

## Architecture

### Key Directories
- `app/` - App Router pages and layouts
- `app/api/` - API routes
- `app/admin/` - Admin pages (requires `admin:read` permission)
- `app/index/[boardId]/` - Board index page (thread list)
- `app/trace/[boardId]/[threadId]/[[...range]]/` - Thread detail page (with optional range)
- `app/notice/[boardId]/` - Notice list/detail pages
- `app/archive/` - Archive pages (legacy thread static viewer)
- `app/settings/` - User preferences page
- `app/manual/` - Manual/documentation page
- `lib/services/` - Business logic (board, thread, response, permission, notice, user, role, thread-ban, global-settings)
- `lib/repositories/` - Data access layer (Prisma implementations, interfaces)
- `lib/schemas/` - Zod validation schemas with input sanitization
- `lib/api/` - API utilities (auth, csrf, foreign-ip-check, write-lock-check, error-handler)
- `lib/tom/` - TOM (Tunaground Object Markup) parser/renderer
- `lib/theme/` - Theme definitions (light, dark, grey)
- `lib/store/` - Zustand stores (theme, sidebar, responseOptions, threadResponseOptions)
- `lib/hooks/` - Client hooks (useChatMode, usePresence, useResponseOptions)
- `lib/i18n/messages/` - Translation files (ko.json, en.json, ja.json)
- `lib/storage/` - File upload with Ports/Adapters pattern (Supabase, S3 adapters)
- `lib/realtime/` - Realtime messaging with Ports/Adapters pattern (WS, Ably adapters)
- `lib/utils/` - Utilities (anon-id, date-formatter, format-bytes, notification, shortcuts, tripcode)
- `lib/types/` - Type definitions (pagination, response-range)
- `lib/cache.ts` - Tag-based cache invalidation (unstable_cache wrapper)
- `lib/ip.ts` - GeoIP detection (MaxMind GeoLite2)
- `components/layout/` - PageLayout, TopBar, Sidebar, buttons
- `components/sidebar/` - AdminSidebar, AdminBoardSidebar, BoardListSidebar, TraceSidebar
- `components/response/` - ResponseCard, ResponseFormSection, ImageUpload, AnchorPreview
- `ws-server/` - Standalone WebSocket server (Node.js, separate Docker image)
- `deploy/` - Docker Compose, Swarm config, deploy/setup scripts
- `__tests__/` - Jest unit tests (mirrors lib/ structure)
- `proxy.ts` - Next.js 16 middleware (admin auth redirects, permission checks)

### Conventions
- **Server Components by default** - Add `'use client'` directive only when needed
- **Hexagonal Architecture** - External integrations (storage, realtime) use Ports/Adapters pattern (`lib/*/ports/` for interfaces, `lib/*/adapters/` for implementations)
- **Path alias** - Use `@/*` for imports from root directory
- **Image optimization** - Use `next/image` component with `priority` for above-the-fold images
- **Prisma Client** - Import from `@/lib/prisma` (singleton pattern with PrismaPg adapter for Prisma 7)
- **Auth config** - Import `authOptions` from `@/lib/auth`
- **Permission check** - Use `permissionService.checkUserPermission(userId, "permission:name")` from `@/lib/services/permission`
- **CSRF protection** - State-changing API endpoints use `validateOrigin()` from `@/lib/api/csrf`
- **Error handling** - Services throw `ServiceError` with typed codes, API routes use `handleServiceError()` to map to HTTP status
- **Validation** - Use Zod schemas from `@/lib/schemas` for input validation with control character sanitization

### Authentication & Authorization
- NextAuth 4 with Google OAuth provider
- JWT session strategy with Prisma adapter
- RBAC with User → UserRole → Role → RolePermission → Permission
- `all:all` permission grants access to everything
- First-time setup at `/setup` creates initial admin
- Protected routes (`/admin`, `/dashboard`) redirect to `/login?callbackUrl=...` if not authenticated
- Login page shows logout button when already authenticated

### Internationalization (i18n)
- **next-intl** with browser language detection (no URL prefix)
- Supported locales: `ko` (default), `en`, `ja` (defined in `lib/i18n/routing.ts`)
- Locale detected from: cookie (`NEXT_LOCALE`) → `Accept-Language` header → default
- Server: `import { getTranslations } from 'next-intl/server'`
- Client: `import { useTranslations } from 'next-intl'`

### Styling & Theming
- **styled-components** - Primary styling method for Client Components (requires `'use client'`)
- Three themes: light, dark, grey (defined in `lib/theme/themes.ts`)
- Theme state via Zustand store (`lib/store/theme.ts`)
- Use `props.theme.textPrimary`, `props.theme.buttonPrimary`, etc.
- `ThemeToggleButton` component cycles through light → dark → grey
- Fonts: Saitamaar, Nanum Gothic loaded in ThemeProvider
- Responsive breakpoint: `props.theme.breakpoint` (768px)
- Content max width: `props.theme.contentMaxWidth` (80rem)

### Board System
- **Board** - 게시판 설정 (threadsPerPage, responsesPerPage, blockForeignIp, writeLocked, uploadMaxSize, uploadMimeTypes, showUserCount 등)
- **Thread** - 글타래, `password`는 Response 삭제용 (bcryptjs로 해시 저장), `top` 플래그로 상단 고정
- **Response** - 스레드 응답, `seq` 0번이 스레드 본문 (작성자), `attachment`로 이미지 첨부
- **Notice** - 공지사항, `boardId`가 null이면 전역 공지, pinned 지원
- **ThreadBan** - 스레드별 작성자 차단 (authorId 기반)
- `authorId` - SHA256(IP:boardId:date) 기반 익명 식별자 (같은 사람 구분용, 서버 생성)
- `anonId` - 클라이언트 생성 UUID (localStorage), realtime에서 자기 글 식별용
- `userId` - 로그인 사용자만 저장 (optional)
- `Thread.updatedAt` - 새 Response 추가 시 수동 갱신 (범프)
- `blockForeignIp` - 외국 IP 차단, `foreign:write` 권한 있으면 허용
- `writeLocked` - 쓰기 잠금, `thread:edit` 권한 있으면 허용
- Tripcode 지원 - 사용자명에 `#` 포함 시 트립코드 생성

### API Endpoints

#### Auth & Settings
- `GET/POST /api/auth/[...nextauth]` - NextAuth 핸들러
- `GET/PUT /api/settings` - 전역 설정 조회/수정
- `GET /api/permissions` - 현재 사용자 권한 조회
- `GET /api/realtime/token` - Realtime 토큰 발급

#### Boards
- `GET/POST /api/boards` - 보드 목록/생성
- `GET/PUT/PATCH /api/boards/[boardId]` - 보드 상세/수정/설정
- `POST /api/boards/[boardId]/fix-count` - 스레드 수 보정 (admin)

#### Threads
- `GET/POST /api/boards/[boardId]/threads` - 스레드 목록/생성
- `GET/PUT/DELETE /api/boards/[boardId]/threads/[threadId]` - 스레드 상세/수정/삭제

#### Responses
- `GET/POST .../threads/[threadId]/responses` - 응답 목록/생성 (FormData 지원, 파일 업로드)
- `GET/PUT/DELETE .../responses/[responseId]` - 응답 상세/수정/삭제

#### Thread Bans
- `GET/POST .../threads/[threadId]/bans` - 차단 목록/일괄 생성
- `DELETE .../threads/[threadId]/bans/[banId]` - 차단 해제

#### Notices
- `GET/POST /api/boards/[boardId]/notices` - 보드 공지 목록/생성
- `GET/PUT/DELETE .../notices/[noticeId]` - 보드 공지 상세/수정/삭제
- `GET/POST /api/notices` - 전역 공지 목록/생성
- `GET/PUT/DELETE /api/notices/[noticeId]` - 전역 공지 상세/수정/삭제

#### Users & Roles
- `GET /api/users` - 사용자 목록 (검색, 페이지네이션)
- `DELETE /api/users/me` - 내 계정 삭제
- `GET/DELETE /api/users/[userId]` - 사용자 상세/삭제
- `POST/DELETE /api/users/[userId]/roles` - 역할 부여/해제
- `GET/POST /api/roles` - 역할 목록/생성
- `GET/PUT/DELETE /api/roles/[roleId]` - 역할 상세/수정/삭제
- `POST/DELETE /api/roles/[roleId]/permissions` - 권한 부여/해제

#### Admin
- `GET /api/admin/boards/[boardId]/responses` - 응답 검색 (admin)
- `POST /api/admin/cache` - 캐시 무효화 (requires `all:all`)

### Permissions
- `all:all` - 모든 권한
- `admin:read` - 관리자 페이지 접근
- `board:all`, `board:create`, `board:update`, `board:config` - 보드 관리
- `thread:all`, `thread:edit`, `thread:delete` - 전역 스레드/응답 권한
- `thread:{boardId}:all`, `thread:{boardId}:edit`, `thread:{boardId}:delete` - 보드별 권한 (보드 생성 시 자동 생성)
- `notice:{boardId}:create/update/delete` - 보드별 공지 권한
- `response:delete` - 응답 삭제 (admin 검색에서도 사용)
- `foreign:write` - 해외 IP 차단 우회

### Authorization Rules
| 대상 | 수정 | 삭제 |
|------|------|------|
| Thread | 권한만 | 권한만 |
| Response | 권한만 | 권한 또는 비밀번호 |

### Foreign IP Blocking
- `blockForeignIp` 보드 설정 활성화 시 외국 IP 차단
- `GlobalSettings.countryCode` (ISO 3166-1 alpha-2) 기준으로 판단
- `foreign:write` 권한 있으면 차단 우회
- GeoLite2-Country.mmdb 파일로 IP 국가 조회 (`lib/ip.ts`)

#### GeoIP Setup (Optional)
외국 IP 차단 기능을 사용하려면 MaxMind GeoLite2 데이터베이스가 필요합니다:

1. MaxMind 무료 계정 생성: https://www.maxmind.com/en/geolite2/signup
2. 라이센스 키 발급
3. 환경 변수 설정: `MAXMIND_LICENSE_KEY=your_license_key`
4. 빌드 시 자동으로 mmdb 파일 다운로드됨 (`scripts/download-mmdb.mjs`)

라이센스 키 없이 빌드해도 정상 작동하며, IP 차단 기능만 비활성화됩니다.

### TOM (Tunaground Object Markup)
- Custom markup language for response content (`lib/tom/`)
- Data flow: User Input → Preparse → Preprocess → DB Store → Parse → Prerender → Render to React
- `preparser.ts` - 사용자 입력 처리 (write-time)
- `preprocessor.ts` - DB 저장 전 처리 (dice/calc)
- `parser.ts` - DB 데이터 파싱 (read-time)
- `prerenderer.ts` - 렌더링 전 처리 (dice roll 결과, calc 평가)
- `renderer.tsx` - AST를 React 컴포넌트로 변환
- Tags: `>>N` (anchor), `[dice min max]`, `[calc]expr[/calc]`, `[clr color]text[/clr]`, `[spo]spoiler[/spo]`, `[aa]ascii art[/aa]`, `[youtube]`, `[hr]` 등
- Input shortcuts: `.d10.` → `[dice 1 10]`, `.D10.` → `[dice 0 10]`

### Realtime (Chat Mode)
- Pluggable provider architecture (`lib/realtime/`)
- Implemented adapters: **WS** (자체 WebSocket 서버), **Ably**
- Stub adapters: Pusher, Socket.io (미구현)
- Provider 선택: `GlobalSettings.realtimeProvider` (DB) 또는 `REALTIME_PROVIDER` 환경변수
- 클라이언트 설정: `window.__RUNTIME_CONFIG__` (layout.tsx에서 주입)

#### WS Server (`ws-server/`)
- 별도 Node.js WebSocket 서버 (독립 Docker 이미지: `ghcr.io/tunaground/openchamchijs-ws-server`)
- HMAC-SHA256 토큰 인증
- 채널 기반 구독/브로드캐스트 (인메모리)
- Presence 추적 (clientId = SHA256(IP) 기반 중복 제거)
- HTTP endpoints: `POST /publish` (Bearer 인증), `GET /health`
- WebSocket: `/ws?token=...`
- 환경변수: `WS_PORT`, `WS_API_KEY`, `WS_TOKEN_SECRET`

#### 메시지 흐름
1. 클라이언트 → `POST /api/.../responses` (응답 생성)
2. Next.js API → DB 저장 → `POST ws-server/publish` (HTTP)
3. ws-server → WebSocket broadcast → 구독 중인 클라이언트들

#### Hooks
- `useChatMode` - 채팅 모드 연결/해제 관리
- `usePresence` - 접속자 수 표시
- 브라우저 알림: 새 응답 시 Notification API 사용 (자기 글은 anonId로 필터링)

### Storage (File Upload)
- Pluggable provider architecture (`lib/storage/`)
- Implemented adapters: **Supabase** (`@supabase/supabase-js`), **S3** (`@aws-sdk/client-s3`, CloudFront/CDN 지원, S3 호환 서비스 지원)
- Stub adapters: Local (미구현)
- Board별 업로드 설정: `uploadMaxSize` (기본 5MB), `uploadMimeTypes` (기본 image/png,jpeg,gif,webp)
- Provider 선택: `GlobalSettings.storageProvider` (DB) 또는 `STORAGE_PROVIDER` 환경변수

### Page Layout Pattern
- Use `PageLayout` component with `sidebar` and topbar integration
- Admin pages: `AdminSidebar` or `AdminBoardSidebar`
- Index pages: `BoardListSidebar`
- Thread pages: `TraceSidebar`
- TopBar: HomeButton, ThemeToggleButton, SettingsButton, AdminButton, AuthButton, UserCounter

### Caching
- Tag-based cache invalidation via `lib/cache.ts`
- Tags: `board`, `boards`, `board-{id}`, `threads-{boardId}`, `thread-{id}`, `responses-{threadId}`, `bans-{threadId}`, `notices`, `notices-{boardId}`, `notices-global`, `settings`, `permissions-{userId}`
- Admin cache invalidation endpoint: `POST /api/admin/cache`

### Deployment
- **Docker Swarm** - `deploy/docker-compose.swarm.yml` (web + ws services, overlay network)
- **Docker Compose** - `deploy/docker-compose.yml` (simple deployment)
- **deploy.sh** - Stack: `chamchi`, commands: `init`, `deploy [service] [version]`, `rollback <service>`
- **setup.sh** - EC2 Amazon Linux 2023 초기 설정
- **GitHub Actions** - 자동 빌드: `docker-publish.yml` (web), `docker-publish-ws.yml` (ws), `docker-release.yml` (version tags)
- Images: `ghcr.io/tunaground/openchamchijs`, `ghcr.io/tunaground/openchamchijs-ws-server` (amd64/arm64)
- Output: standalone (for Docker)

### Security Headers (next.config.ts)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- X-XSS-Protection: 1; mode=block
- Permissions-Policy: camera(), microphone(), geolocation()

### Testing
```bash
npm test                           # Run all Jest unit tests
npm test -- --testPathPattern=tom  # Run tests matching pattern
npm run test:watch                 # Watch mode
npm run test:coverage              # With coverage report
```
