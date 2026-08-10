# Bulk Show / Bulk Unban Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add bulk show (unhide) and bulk unban buttons to the thread manage modal, symmetric to the existing bulk hide and bulk ban.

**Architecture:** Client-only changes. Two new handler functions mirroring existing `handleBulkHide` and `handleBulkBan`, two new buttons in the manage modal, one new styled component, new i18n keys, and two new fields in the Labels interface. No API changes.

**Tech Stack:** React 19, styled-components, next-intl, TypeScript

---

### File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `lib/i18n/messages/ko.json` | Modify (line ~238) | Add `show` key to `trace` section |
| `lib/i18n/messages/en.json` | Modify (line ~238) | Add `show` key to `trace` section |
| `lib/i18n/messages/ja.json` | Modify (line ~238) | Add `show` key to `trace` section |
| `app/trace/[boardId]/[threadId]/[[...range]]/thread-detail-content.tsx` | Modify | Add `RevertButton` styled component, `show` to Labels, `bulkShowing` + `bulkUnbanning` state, `handleBulkShow` + `handleBulkUnban` handlers, two new buttons in modal |
| `app/trace/[boardId]/[threadId]/[[...range]]/page.tsx` | Modify (line ~214) | Pass `show` label |

---

### Task 1: Add i18n key `show` to trace section

**Files:**
- Modify: `lib/i18n/messages/ko.json:238`
- Modify: `lib/i18n/messages/en.json:238`
- Modify: `lib/i18n/messages/ja.json:238`

The `unban` key already exists in all three files. Only `show` needs to be added (for the bulk show button label — distinct from `restore` which is used for the per-response toggle).

- [ ] **Step 1: Add `show` key to ko.json**

In `ko.json`, after the `"unban": "차단해제",` line (line 238), add:

```json
    "show": "보이기",
```

- [ ] **Step 2: Add `show` key to en.json**

In `en.json`, after the `"unban": "Unban",` line (line 238), add:

```json
    "show": "Show",
```

- [ ] **Step 3: Add `show` key to ja.json**

In `ja.json`, after the `"unban": "BAN解除",` line (line 238), add:

```json
    "show": "表示",
```

- [ ] **Step 4: Commit**

```bash
git add lib/i18n/messages/ko.json lib/i18n/messages/en.json lib/i18n/messages/ja.json
git commit -m "feat: add 'show' i18n key for bulk show button in trace section"
```

---

### Task 2: Add `show` to Labels interface and pass from page.tsx

**Files:**
- Modify: `app/trace/[boardId]/[threadId]/[[...range]]/thread-detail-content.tsx:453-454`
- Modify: `app/trace/[boardId]/[threadId]/[[...range]]/page.tsx:214`

- [ ] **Step 1: Add `show` to Labels interface**

In `thread-detail-content.tsx`, in the `Labels` interface (around line 453-454), add `show` after `ban`:

```typescript
  ban: string;
  show: string;
  unban: string;
```

- [ ] **Step 2: Pass `show` label from page.tsx**

In `page.tsx`, after the `ban: t("ban"),` line (line 213), add:

```typescript
          show: t("show"),
```

- [ ] **Step 3: Commit**

```bash
git add "app/trace/[boardId]/[threadId]/[[...range]]/thread-detail-content.tsx" "app/trace/[boardId]/[threadId]/[[...range]]/page.tsx"
git commit -m "feat: add show field to Labels interface and pass from page"
```

---

### Task 3: Add `RevertButton` styled component and loading states

**Files:**
- Modify: `app/trace/[boardId]/[threadId]/[[...range]]/thread-detail-content.tsx:241` (after ConfirmButton)
- Modify: `app/trace/[boardId]/[threadId]/[[...range]]/thread-detail-content.tsx:836-837` (state declarations)

- [ ] **Step 1: Add `RevertButton` styled component**

In `thread-detail-content.tsx`, after the `ConfirmButton` styled component (after line 241, after the closing `};`), add:

```typescript
const RevertButton = styled(ModalButton)`
  background: transparent;
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  color: ${(props) => props.theme.textPrimary};

  &:hover {
    background: ${(props) => props.theme.surfaceHover};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
```

- [ ] **Step 2: Add loading state variables**

In the component function, after the `bulkBanning` state (line 837), add:

```typescript
  const [bulkShowing, setBulkShowing] = useState(false);
  const [bulkUnbanning, setBulkUnbanning] = useState(false);
```

- [ ] **Step 3: Commit**

```bash
git add "app/trace/[boardId]/[threadId]/[[...range]]/thread-detail-content.tsx"
git commit -m "feat: add RevertButton styled component and bulk show/unban loading states"
```

---

### Task 4: Add `handleBulkShow` handler

**Files:**
- Modify: `app/trace/[boardId]/[threadId]/[[...range]]/thread-detail-content.tsx:1136` (after handleBulkHide)

- [ ] **Step 1: Add `handleBulkShow` function**

After `handleBulkHide` (after line 1136), add the following function. It mirrors `handleBulkHide` exactly, but with `visible: true`:

```typescript
  const handleBulkShow = async () => {
    if (selectedResponseIds.size === 0) return;
    setBulkShowing(true);
    try {
      const body = manageUnlockedByAdmin
        ? { visible: true }
        : { password: managePassword, visible: true };

      const showPromises = Array.from(selectedResponseIds).map((id) =>
        fetch(
          `/api/boards/${thread.boardId}/threads/${thread.id}/responses/${id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        )
      );
      await Promise.all(showPromises);

      setAllResponses((prev) =>
        prev.map((r) =>
          selectedResponseIds.has(r.id) ? { ...r, visible: true } : r
        )
      );
      setSelectedResponseIds(new Set());
      router.refresh();
    } finally {
      setBulkShowing(false);
    }
  };
```

- [ ] **Step 2: Commit**

```bash
git add "app/trace/[boardId]/[threadId]/[[...range]]/thread-detail-content.tsx"
git commit -m "feat: add handleBulkShow handler for bulk unhide"
```

---

### Task 5: Add `handleBulkUnban` handler

**Files:**
- Modify: `app/trace/[boardId]/[threadId]/[[...range]]/thread-detail-content.tsx` (after handleBulkBan, around line 1174)

- [ ] **Step 1: Add `handleBulkUnban` function**

After `handleBulkBan` (after line 1174), add:

```typescript
  const handleBulkUnban = async () => {
    if (selectedResponseIds.size === 0) return;
    setBulkUnbanning(true);
    try {
      const authorIdSet = new Set<string>();
      for (const id of selectedResponseIds) {
        const response = allResponses.find((r) => r.id === id);
        if (response) authorIdSet.add(response.authorId);
      }

      const headers: Record<string, string> = {};
      if (managePassword) {
        headers["X-Thread-Password"] = btoa(encodeURIComponent(managePassword));
      }

      const deletePromises: Promise<Response>[] = [];
      const authorIdsToRemove: string[] = [];
      for (const authorId of authorIdSet) {
        const banId = bannedAuthorIds.get(authorId);
        if (banId) {
          authorIdsToRemove.push(authorId);
          deletePromises.push(
            fetch(
              `/api/boards/${thread.boardId}/threads/${thread.id}/bans/${banId}`,
              { method: "DELETE", headers }
            )
          );
        }
      }

      await Promise.all(deletePromises);

      setBannedAuthorIds((prev) => {
        const map = new Map(prev);
        for (const authorId of authorIdsToRemove) {
          map.delete(authorId);
        }
        return map;
      });
      setSelectedResponseIds(new Set());
    } finally {
      setBulkUnbanning(false);
    }
  };
```

- [ ] **Step 2: Commit**

```bash
git add "app/trace/[boardId]/[threadId]/[[...range]]/thread-detail-content.tsx"
git commit -m "feat: add handleBulkUnban handler for bulk unban"
```

---

### Task 6: Add bulk show and bulk unban buttons to the manage modal UI

**Files:**
- Modify: `app/trace/[boardId]/[threadId]/[[...range]]/thread-detail-content.tsx:1422-1431`

- [ ] **Step 1: Replace the bulk actions section**

Replace the current bulk actions block (lines 1422-1431):

```tsx
                      {selectedResponseIds.size > 0 && (
                        <>
                          <ConfirmButton onClick={handleBulkHide} disabled={bulkDeleting}>
                            {labels.hide} ({selectedResponseIds.size})
                          </ConfirmButton>
                          <ConfirmButton onClick={handleBulkBan} disabled={bulkBanning}>
                            {labels.ban} ({selectedResponseIds.size})
                          </ConfirmButton>
                        </>
                      )}
```

With the following (4 buttons always visible, `ConfirmButton` for destructive, `RevertButton` for revert):

```tsx
                      <ConfirmButton onClick={handleBulkHide} disabled={bulkDeleting}>
                        {labels.hide} ({selectedResponseIds.size})
                      </ConfirmButton>
                      <RevertButton onClick={handleBulkShow} disabled={bulkShowing}>
                        {labels.show} ({selectedResponseIds.size})
                      </RevertButton>
                      <ConfirmButton onClick={handleBulkBan} disabled={bulkBanning}>
                        {labels.ban} ({selectedResponseIds.size})
                      </ConfirmButton>
                      <RevertButton onClick={handleBulkUnban} disabled={bulkUnbanning}>
                        {labels.unban} ({selectedResponseIds.size})
                      </RevertButton>
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds with no type errors.

- [ ] **Step 3: Commit**

```bash
git add "app/trace/[boardId]/[threadId]/[[...range]]/thread-detail-content.tsx"
git commit -m "feat: add bulk show and bulk unban buttons to manage modal"
```

---

### Task 7: Manual testing

- [ ] **Step 1: Start dev server**

Run: `npm run dev`

- [ ] **Step 2: Test bulk show**

1. Open a thread with responses
2. Open the manage modal (via sidebar or with thread password)
3. Hide a few responses individually first
4. Select those hidden responses via checkboxes
5. Click the "보이기(N)" button
6. Verify all selected responses become visible again (status badge changes to "공개")

- [ ] **Step 3: Test bulk unban**

1. In the manage modal, ban a few authors individually or via bulk ban
2. Select responses from those banned authors
3. Click the "차단 풀기(N)" button
4. Verify the "차단됨" badges disappear and the individual action buttons switch back to "차단"

- [ ] **Step 4: Test button always visible**

1. With zero responses selected, verify all 4 bulk buttons are still visible and show "(0)"
2. Click them with 0 selected — verify no errors (handlers return early)

- [ ] **Step 5: Test button styles**

1. Verify "숨기기" and "차단" buttons have red background (ConfirmButton)
2. Verify "보이기" and "차단 풀기" buttons have transparent background with border (RevertButton)
