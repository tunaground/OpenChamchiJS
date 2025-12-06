# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Info

- **License**: MIT (open source)
- **Repository**: https://github.com/tunaground/OpenChamchiJS

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

This is a Next.js 16 project using the App Router with React 19 and TypeScript.

### Key Directories
- `app/` - App Router pages and layouts
- `app/api/auth/` - NextAuth API route
- `app/admin/` - Admin pages (requires `admin:read` permission)
- `app/setup/` - Initial admin setup flow
- `lib/` - Shared utilities (Prisma client, auth config, i18n)
- `lib/services/` - Business logic (board, permission)
- `lib/repositories/prisma/` - Prisma data access
- `lib/i18n/` - Internationalization config (next-intl)
- `lib/i18n/messages/` - Translation files (ko.json, en.json)
- `prisma/` - Prisma schema and migrations
- `types/` - TypeScript type declarations
- `public/` - Static assets
- `proxy.ts` - Next.js 16 proxy (handles setup check, auth redirects)

### Conventions
- **Server Components by default** - Add `'use client'` directive only when needed
- **CSS Modules** - Use `.module.css` files for component-scoped styles
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
- Protected routes (`/dashboard`, `/admin`) redirect to `/login?callbackUrl=...` if not authenticated
- Login page shows logout button when already authenticated

### Internationalization (i18n)
- **next-intl** with browser language detection (no URL prefix)
- Supported locales: `ko` (default), `en`
- Locale detected from: cookie (`NEXT_LOCALE`) → `Accept-Language` header → default
- Server: `import { getTranslations } from 'next-intl/server'`
- Client: `import { useTranslations } from 'next-intl'`

### Styling
- **styled-components** - Use for component styling in Client Components (requires `'use client'`)
- Global styles in `app/globals.css` with CSS custom properties for theming
- Dark mode support via `prefers-color-scheme: dark`
- Color variables: `--background`, `--foreground`

### Board System
- **Board** - 게시판 설정 (threadsPerPage, responsesPerPage, blockForeignIp 등)
- **Thread** - 글타래, `password`로 수정/삭제 인증 (애플리케이션에서 해시 처리)
- **Response** - 스레드 응답, `seq` 0번이 스레드 본문 (작성자)
- `authorId` - IP+날짜 기반 익명 식별자 (같은 사람 구분용)
- `userId` - 로그인 사용자만 저장 (optional)
- `Thread.updatedAt` - 새 Response 추가 시 수동 갱신 (범프)
- `blockForeignIp` - 외국 IP 차단, `foreign:write` 권한 있으면 허용