# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Bulk show and bulk unban buttons to thread manage modal
- AWS standalone deployment support
- S3 storage adapter with CloudFront/CDN and S3-compatible service support
- S3 storage settings UI in admin global settings
- Provider settings moved from env vars to `GlobalSettings` DB
- Custom HTML slots for board index and thread pages
- Google Analytics settings in admin panel
- Thread-level ban feature for blocking users by `authorId`
- Thread ban feature enabled for password-authenticated users
- IP/country display and IP search in admin responses page
- Legacy PHP URL redirects to archive pages
- Archive system for legacy threads
- Archive redirect for missing threads
- Archive data fetching moved to client-side to reduce serverless costs
- Global notice system (nullable `boardId`)
- Per-board write lock (`writeLocked`) to restrict posting
- Board `threadCount` calibration and counter cache fix on thread update
- `boardId` included in `authorId` generation for per-board anonymity
- Admin responses management page with click-to-search
- Username/authorId filtering for responses
- Response count made clickable to navigate to full thread view
- Real-time clock in response preview
- Tripcode support and preview username display
- AA mode styling and auto-resize for textareas
- Day-of-week added to date display across all pages
- Dynamic page titles via `generateMetadata`
- Site title and description settings in `GlobalSettings`
- Homepage content editing and custom sidebar links
- Homepage content rendered as HTML instead of TOM markup
- Custom links on manual and notice pages
- `PageLayout` on notice detail page
- Japanese locale, language settings UI, and various improvements
- Browser autocomplete enabled on username input fields
- NCR (numeric character references) decoded in text input
- Favicon and PWA manifest with file-based icon convention
- Next.js data caching with tag-based revalidation
- Security limits and permission caching improvements
- `--attachments-only` and `--thread-ids` options in import script

### Changed

- Shared Response components extracted (`ResponseCard`, `AnchorPreview`, `TomPreview`)
- Shared `ResponseCard` component reused; seq copy feature added
- Realtime provider configuration centralized
- Shared layout constants extracted into the theme system
- Queries optimized with window functions for pagination
- Storage upload folder path simplified
- User data storage from Google OAuth minimized
- Mobile `ResponseCard` header layout improved
- Response header layout simplified to two-line format
- Dice/calc expression color changed to red scheme
- AA block line-height adjusted from 1.8rem to 1.6rem

### Fixed

- `storageProvider` enum now includes `s3`; S3 fields added to settings validation schema
- `serverMaxWindowBits:10` removed to prevent chat mode character corruption
- `seq 0` excluded from anchor preview unless `>>0` is requested
- Hidden responses filtered in single and range mode
- TOM parser now handles deep nesting gracefully instead of crashing
- `seq 0` response shown in anchor preview for `>>0`
- `overflow-x` removed from `CustomHtml` container
- Ad content no longer overflows container on mobile
- Script tags now execute inside custom HTML for ad rendering
- `overflow:hidden` removed from `CustomHtmlContainer` to allow ad rendering
- `chatMode` removed from auto-scroll condition on new responses
- Dice/calc expressions now evaluate in response preview mode
- Pure integer validation enforced for dice attributes in preprocessor
- Malformed TOM nodes no longer destroy subsequent content parsing
- Input form font-size unified to match response content (1.5rem)
- Auto-scroll to bottom on page refresh suppressed when only chat mode is enabled
- Input lag resolved on trace page with many responses
- Missing mocks added for `userRepository` and cache in role service tests
- `toISOString` helper used for cached `Date` fields serialized as strings
- Missing `traceSidebar` filter translations added for Japanese locale
- Trace page users now included in board presence count
- Browser spellcheck disabled on text input fields
- Calc expression `vertical-align` changed from `super` to `text-top`
- Thread password header base64-encoded to support non-ASCII characters
- Manage modal network error message now includes error details
- Pinned notices on board index sorted ascending (oldest first)
- Admin thread pagination uses actual count when `includeDeleted` is true
- Scroll-to-bottom triggered on page entry and textarea resize in `alwaysBottom` mode
- Soft delete used for `ThreadBan` to avoid DB `DELETE` permission issue
- Admin users pagination not updating on page change
- Missing `goToBoard` translation key added on notice list page
- Anchor link to thread opens full view instead of Recent
- Previous button navigation corrected in Recent view
- `pg_trgm` extension added in migration; `DIRECT_URL` used for Prisma
- Fallback added for seq conflict when `responseCount` is out of sync
- Thread page title changed to `{boardName} - {threadTitle}`
- Original password hash preserved in import script
- Image overflow prevented on mobile devices
- Anchor preview toggle and replace behavior fixed
- `boardId` and `published` status validated in anchor preview
- Images displayed in anchor preview
- Loading flash removed when switching anchor previews
- `key` prop added to `flattenWithBreaks` Fragment
- `white-space: pre` used instead of `nowrap` in AA mode textarea
- Nested `[sub]` tags no longer stack vertically
- Current theme icon shown instead of next theme
- KST timezone used for AuthorID date calculation

### Performance

- Database indexes added for query optimization
- Counter cache added for `Thread.responseCount` and `Board.threadCount`
- `pg_trgm` GIN indexes added for thread search optimization
- `boardId` added to `Response` for faster board-level queries
- Admin responses optimized with cursor pagination and UI improvements
- Setup-check middleware removed (previously queried DB on every page request)
- Middleware matcher restricted to reduce unnecessary Edge Requests
- Caching added to high-traffic queries to reduce Fast Origin Transfer costs

### Security

- CSS color values in `[clr]` tag sanitized to prevent injection
- Prisma upgraded to 7.3.0 to fix high severity vulnerabilities

### Dependencies

- Next.js bumped from 16.0.7 to 16.1.1

### Removed

- Unused default Next.js SVG assets

### Documentation

- `CLAUDE.md` and `README.md` updated to reflect current architecture
- Response interaction section added to manual
- `NOTICE` file added for third-party license attributions
- `README` updated and `.env.example` added

## [0.2.0] - 2025-12-08

Initial tagged release. See git history for details.

## [0.1.2]

## [0.1.1]

## [0.1.0]

[Unreleased]: https://github.com/tunaground/OpenChamchiJS/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/tunaground/OpenChamchiJS/releases/tag/v0.2.0
[0.1.2]: https://github.com/tunaground/OpenChamchiJS/releases/tag/v0.1.2
[0.1.1]: https://github.com/tunaground/OpenChamchiJS/releases/tag/v0.1.1
[0.1.0]: https://github.com/tunaground/OpenChamchiJS/releases/tag/v0.1.0
