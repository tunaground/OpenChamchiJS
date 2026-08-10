# Thread-Ban Stale Cache Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove `unstable_cache` wrapping from `ThreadBanService.isBanned()` so ban / unban take effect from the very next POST instead of one request later.

**Architecture:** `isBanned()` will call `threadBanRepository.isBanned()` directly. The four `invalidateCache(CACHE_TAGS.bans(...))` calls in `createBans` / `createBansDirect` / `deleteBan` / `deleteBanDirect` become dead code and are removed. `CACHE_TAGS.bans` is no longer referenced anywhere and is removed from `lib/cache.ts`. Public API of the service is unchanged.

**Tech Stack:** Next.js 16 (App Router) / Prisma 7 / TypeScript.

**Spec:** `docs/superpowers/specs/2026-05-16-thread-ban-stale-cache-design.md`

**Note on commits:** User preference is to commit only once at the very end of the work, not per task. Tasks below do NOT include per-task commit steps. A final commit task is provided at the end.

---

## File Structure

| Path | Action |
|------|--------|
| `lib/services/thread-ban.ts` | Modify: drop `cached()` in `isBanned`, drop 4 `invalidateCache` calls, prune unused imports. |
| `lib/cache.ts` | Modify: remove `bans` from `CACHE_TAGS`. |

No new files. No DB / schema changes. No API surface changes.

---

### Task 1: Strip caching from `ThreadBanService.isBanned`

**Files:**
- Modify: `lib/services/thread-ban.ts`

- [ ] **Step 1: Confirm there is exactly one caller of `isBanned`**

Run:
```bash
grep -rn "isBanned" /Users/tunarider/Sources/openchamchijs/app /Users/tunarider/Sources/openchamchijs/lib /Users/tunarider/Sources/openchamchijs/components 2>/dev/null
```

Expected: hits inside `lib/services/thread-ban.ts`, `lib/repositories/interfaces/thread-ban.ts`, `lib/repositories/prisma/thread-ban.ts`, and one production call in `app/api/boards/[boardId]/threads/[threadId]/responses/route.ts:211`. No other production callers. If something else appears, stop and revisit the plan before editing.

- [ ] **Step 2: Replace the `isBanned` body so it bypasses `cached()`**

In `lib/services/thread-ban.ts`, locate the current implementation (around lines 83-89):

```ts
    async isBanned(threadId: number, authorId: string): Promise<boolean> {
      return cached(
        () => threadBanRepository.isBanned(threadId, authorId),
        ["thread-ban", threadId.toString(), authorId],
        [CACHE_TAGS.bans(threadId)]
      );
    },
```

Replace it with a direct repository call:

```ts
    async isBanned(threadId: number, authorId: string): Promise<boolean> {
      return threadBanRepository.isBanned(threadId, authorId);
    },
```

Why: `unstable_cache` + `revalidateTag` gives stale-while-revalidate semantics, which means the first POST after a ban/unban sees the previous value. Ban checks must never serve stale data. A `(threadId, authorId)` index lookup is cheap enough to run on every POST.

- [ ] **Step 3: Remove the four now-unneeded `invalidateCache` calls**

In the same file, delete these four lines (one occurrence per method, currently lines 111, 134, 153, 168):

```ts
      invalidateCache(CACHE_TAGS.bans(threadId));
```

and

```ts
      invalidateCache(CACHE_TAGS.bans(ban.threadId));
```

The blank line preceding each `invalidateCache(...)` plus the line itself should be removed, leaving the existing `return bans;` / `return result;` directly after the repository call.

For reference, `createBans` should end up looking like:

```ts
    async createBans(
      adminUserId: string,
      threadId: number,
      authorIds: string[]
    ): Promise<ThreadBanData[]> {
      if (authorIds.length === 0) {
        throw new ThreadBanServiceError(
          "At least one authorId is required",
          "BAD_REQUEST"
        );
      }

      const thread = await getThread(threadId);
      await checkPermissions(adminUserId, thread.boardId);

      const uniqueAuthorIds = [...new Set(authorIds)];
      const bans = await threadBanRepository.createMany(
        uniqueAuthorIds.map((authorId) => ({ threadId, authorId }))
      );

      return bans;
    },
```

`createBansDirect`, `deleteBan`, and `deleteBanDirect` follow the same shape: the cache invalidation line goes away and `return result;` / `return bans;` immediately follows the repository write.

- [ ] **Step 4: Prune unused imports**

Now that `cached`, `invalidateCache`, and `CACHE_TAGS` are no longer referenced in this file, remove the import on line 13:

```ts
import { cached, invalidateCache, CACHE_TAGS } from "@/lib/cache";
```

Delete the entire line.

- [ ] **Step 5: Verify no stale references remain in this file**

Run:
```bash
grep -n "cached\|invalidateCache\|CACHE_TAGS" /Users/tunarider/Sources/openchamchijs/lib/services/thread-ban.ts
```

Expected: no output. If anything still matches, finish removing it before moving on.

---

### Task 2: Remove `bans` entry from `CACHE_TAGS`

**Files:**
- Modify: `lib/cache.ts`

- [ ] **Step 1: Verify `CACHE_TAGS.bans` has no other references**

Run:
```bash
grep -rn "CACHE_TAGS\.bans\|\.bans(" /Users/tunarider/Sources/openchamchijs/app /Users/tunarider/Sources/openchamchijs/lib /Users/tunarider/Sources/openchamchijs/components /Users/tunarider/Sources/openchamchijs/__tests__ 2>/dev/null
```

Expected: empty (after Task 1 removed the references inside `thread-ban.ts`). If anything still matches, do not remove the entry — investigate the leftover usage instead.

- [ ] **Step 2: Delete the `bans` tag definition**

In `lib/cache.ts`, remove these three lines (currently lines 31-33):

```ts
  // Thread ban tags
  bans: (threadId: number) => `bans-${threadId}`,

```

The block now looks like:

```ts
  // Notice tags
  notices: "notices",
  noticesByBoard: (boardId: string) => `notices-${boardId}`,
  notice: (id: number) => `notice-${id}`,
  globalNotices: "notices-global",

  // Global settings
  settings: "settings",
```

(i.e. the `// Thread ban tags` comment and the `bans:` line are gone; the blank line that separated it from `// Global settings` is also removed.)

---

### Task 3: Type-check, lint, and manual verification

**Files:** none modified.

- [ ] **Step 1: Run type-check via build**

Run:
```bash
npm run build
```

Expected: build succeeds. Most importantly, no TS errors about unused imports or missing `CACHE_TAGS.bans` references.

If the build fails because something still imports `CACHE_TAGS.bans` or because of an unused import in `thread-ban.ts`, fix the file pointed to by the error and re-run.

- [ ] **Step 2: Run lint**

Run:
```bash
npm run lint
```

Expected: passes with no new warnings related to the two edited files.

- [ ] **Step 3: Manual smoke test — ban path**

Start the dev server (`npm run dev`), create or pick a thread, then with an admin account ban an `authorId` from that thread. Immediately attempt to POST a response from that author (e.g. via the response form in another browser session, or via curl using the same IP/board/date so the SHA256 `authorId` matches).

Expected: the **first** POST after the ban returns 403 (banned). Previously this first POST went through and only the second one was blocked.

- [ ] **Step 4: Manual smoke test — unban path**

Delete the ban created in Step 3. Immediately attempt to POST a response from the same author.

Expected: the **first** POST after the unban succeeds. Previously this first POST was still rejected and only the second one succeeded.

---

### Task 4: Final commit

**Files:** none additional.

- [ ] **Step 1: Stage the two edited files**

```bash
git add lib/services/thread-ban.ts lib/cache.ts
```

- [ ] **Step 2: Confirm diff is limited to these two files**

```bash
git status
git diff --cached --stat
```

Expected: only `lib/services/thread-ban.ts` and `lib/cache.ts` staged. No other files modified.

- [ ] **Step 3: Commit with a descriptive message**

```bash
git commit -m "$(cat <<'EOF'
fix: remove stale ThreadBan cache so ban/unban take effect immediately

isBanned() was wrapped in unstable_cache and invalidated via
revalidateTag, which is stale-while-revalidate. The first POST after a
ban/unban therefore saw the previous value, causing a 1-request lag
(first banned write still went through, first write after unban still
got blocked). Drop the cache wrapper and the now-unneeded
invalidateCache calls; remove the orphaned CACHE_TAGS.bans entry.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Self-Review Notes

- **Spec coverage:** The spec lists changes to `lib/services/thread-ban.ts` (drop cache + 4 invalidations + import cleanup) → Task 1; changes to `lib/cache.ts` (drop `CACHE_TAGS.bans`) → Task 2; manual ban/unban verification and lint/build → Task 3. All covered.
- **Placeholder scan:** No "TBD", no "add appropriate X", every code-changing step shows the exact code.
- **Type consistency:** No new types or signatures introduced. `isBanned`'s signature `(threadId: number, authorId: string) => Promise<boolean>` is preserved across the interface, repository, and service.
- **Commit policy:** Per user preference (single commit at end), per-task commits are intentionally omitted; Task 4 is the only commit.
