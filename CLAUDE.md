# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
- `lib/` - Shared utilities (Prisma client, auth config, permissions)
- `prisma/` - Prisma schema and migrations
- `types/` - TypeScript type declarations
- `public/` - Static assets

### Conventions
- **Server Components by default** - Add `'use client'` directive only when needed
- **CSS Modules** - Use `.module.css` files for component-scoped styles
- **Path alias** - Use `@/*` for imports from root directory
- **Image optimization** - Use `next/image` component with `priority` for above-the-fold images
- **Fonts** - Geist Sans and Geist Mono loaded via `next/font/google`, available as CSS variables
- **Prisma Client** - Import from `@/lib/prisma` (singleton pattern with adapter for Prisma 7)
- **Auth config** - Import `authOptions` from `@/lib/auth`
- **Permission check** - Use `checkUserPermission(userId, "permission:name")` from `@/lib/permissions`

### Authentication & Authorization
- NextAuth 4 with Google OAuth provider
- JWT session strategy
- RBAC with User → UserRole → Role → RolePermission → Permission
- `all:all` permission grants access to everything
- First-time setup at `/setup` creates initial admin

### Styling
- Global styles in `app/globals.css` with CSS custom properties for theming
- Dark mode support via `prefers-color-scheme: dark`
- Color variables: `--background`, `--foreground`
