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
- `app/trace/[boardId]/[threadId]/` - Thread detail page
- `app/notice/[boardId]/` - Notice list/detail pages
- `lib/services/` - Business logic (board, thread, response, permission, notice)
- `lib/repositories/` - Data access layer (Repository Pattern)
- `lib/tom/` - TOM (Tunaground Object Markup) parser/renderer
- `lib/theme/` - Zustand theme store and theme definitions
- `lib/i18n/messages/` - Translation files (ko.json, en.json)
- `components/layout/` - PageLayout, TopBar, Sidebar, buttons
- `components/sidebar/` - AdminSidebar, BoardListSidebar, TraceSidebar
- `proxy.ts` - Next.js 16 middleware (setup check, auth redirects)

### Conventions
- **Server Components by default** - Add `'use client'` directive only when needed
- **Repository Pattern** - Services (`lib/services/`) use repositories (`lib/repositories/`) for data access
- **Path alias** - Use `@/*` for imports from root directory
- **Image optimization** - Use `next/image` component with `priority` for above-the-fold images
- **Fonts** - Geist Sans and Geist Mono loaded via `next/font/google`, available as CSS variables
- **Prisma Client** - Import from `@/lib/prisma` (singleton pattern with adapter for Prisma 7)
- **Auth config** - Import `authOptions` from `@/lib/auth`
- **Permission check** - Use `permissionService.checkUserPermission(userId, "permission:name")` from `@/lib/services/permission`

### Authentication & Authorization
- NextAuth 4 with Google OAuth provider
- JWT session strategy
- RBAC with User → UserRole → Role → RolePermission → Permission
- `all:all` permission grants access to everything
- First-time setup at `/setup` creates initial admin
- Protected routes (`/admin`) redirect to `/login?callbackUrl=...` if not authenticated
- Login page shows logout button when already authenticated

### Internationalization (i18n)
- **next-intl** with browser language detection (no URL prefix)
- Supported locales: `ko` (default), `en`
- Locale detected from: cookie (`NEXT_LOCALE`) → `Accept-Language` header → default
- Server: `import { getTranslations } from 'next-intl/server'`
- Client: `import { useTranslations } from 'next-intl'`

### Styling & Theming
- **styled-components** - Primary styling method for Client Components (requires `'use client'`)
- Theme system via Zustand store (`lib/theme/store.ts`) with light/dark mode toggle
- Theme colors defined in `lib/theme/themes.ts` - use `props.theme.textPrimary`, `props.theme.buttonPrimary`, etc.
- Global styles in `app/globals.css`
- `ThemeToggleButton` component for user theme switching
- Button height standard: `height: 3.5rem` (35px)
- Responsive breakpoint: `props.theme.breakpoint` (768px)

### Board System
- **Board** - 게시판 설정 (threadsPerPage, responsesPerPage, blockForeignIp 등)
- **Thread** - 글타래, `password`는 Response 삭제용 (bcryptjs로 해시 저장)
- **Response** - 스레드 응답, `seq` 0번이 스레드 본문 (작성자)
- `authorId` - IP+날짜 기반 익명 식별자 (같은 사람 구분용)
- `userId` - 로그인 사용자만 저장 (optional)
- `Thread.updatedAt` - 새 Response 추가 시 수동 갱신 (범프)
- `blockForeignIp` - 외국 IP 차단, `foreign:write` 권한 있으면 허용

### API Endpoints
- `GET/POST /api/boards` - 보드 목록/생성
- `GET/PUT/PATCH /api/boards/[id]` - 보드 상세/수정/설정
- `GET/POST /api/boards/[boardId]/threads` - 스레드 목록/생성
- `GET/PUT/DELETE /api/boards/[boardId]/threads/[threadId]` - 스레드 상세/수정/삭제 (권한 필요)
- `GET/POST .../threads/[threadId]/responses` - 응답 목록/생성
- `GET/PUT/DELETE .../responses/[responseId]` - 응답 상세/수정/삭제
- `GET/POST /api/boards/[boardId]/notices` - 공지사항 목록/생성
- `GET/PUT/DELETE .../notices/[noticeId]` - 공지사항 상세/수정/삭제
- `GET/PUT /api/settings` - 전역 설정 조회/수정

### Permissions
- `all:all` - 모든 권한
- `board:all`, `board:write`, `board:edit`, `board:config` - 보드 관리
- `thread:all`, `thread:edit`, `thread:delete` - 전역 스레드/응답 권한
- `thread:{boardId}:all`, `thread:{boardId}:edit`, `thread:{boardId}:delete` - 보드별 권한 (보드 생성 시 자동 생성)

### Authorization Rules
| 대상 | 수정 | 삭제 |
|------|------|------|
| Thread | 권한만 | 권한만 |
| Response | 권한만 | 권한 또는 비밀번호 |

### Foreign IP Blocking
- `blockForeignIp` 보드 설정 활성화 시 외국 IP 차단
- `GlobalSettings.countryCode` (ISO 3166-1 alpha-2) 기준으로 판단
- `foreign:write` 권한 있으면 차단 우회
- GeoLite2-Country.mmdb 파일로 IP 국가 조회

#### GeoIP Setup (Optional)
외국 IP 차단 기능을 사용하려면 MaxMind GeoLite2 데이터베이스가 필요합니다:

1. MaxMind 무료 계정 생성: https://www.maxmind.com/en/geolite2/signup
2. 라이센스 키 발급
3. 환경 변수 설정: `MAXMIND_LICENSE_KEY=your_license_key`
4. 빌드 시 자동으로 mmdb 파일 다운로드됨

라이센스 키 없이 빌드해도 정상 작동하며, IP 차단 기능만 비활성화됩니다.

### TOM (Tunaground Object Markup)
- Custom markup language for response content (`lib/tom/`)
- `parse()` - Parse TOM string to AST
- `prerender()` - Process dice rolls, calculations before rendering
- `render()` - Convert AST to React elements
- Tags: `>>N` (anchor), `[dice:NdM]`, `[calc:expr]`, `[color:hex]`, `[s]` (spoiler), etc.

### Page Layout Pattern
- Use `PageLayout` component with `sidebar` and `rightContent` props
- Admin pages: `AdminSidebar` or `AdminBoardSidebar`
- Index pages: `BoardListSidebar`
- Thread pages: `TraceSidebar`
- Right content: `HomeButton`, `ThemeToggleButton`, `AdminButton`, `AuthButton`

### Testing
```bash
npm test                           # Run all Jest unit tests
npm test -- --testPathPattern=tom  # Run tests matching pattern
npm run test:watch                 # Watch mode
npm run test:coverage              # With coverage report
```