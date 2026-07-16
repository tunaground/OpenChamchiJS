# 코드 기반 롤 시스템 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** DB 기반 RBAC(Role/Permission/UserRole/RolePermission)를 코드 상수 롤 3종(`ADMIN`, `VERIFIED`, `{boardId}:ADMIN`)으로 교체한다.

**Architecture:** `User.roles String[]` 칼럼 하나에 롤 문자열을 저장한다. `lib/auth/roles.ts`가 롤 상수와 문자열 헬퍼를, `lib/services/role.ts`가 유일한 인가 판정 진입점(`isAdmin` / `isVerified` / `canManageBoard` / `listManagedBoardIds`)을 제공한다. 기존 권한 문자열 쌍 체크는 전부 이 네 술어로 접힌다. 보드별 롤은 보드 ID에서 즉석 계산되므로 DB에 심지 않는다.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Prisma 7 (PostgreSQL), NextAuth 4, Jest, styled-components, next-intl

## Global Constraints

- 스펙: `docs/superpowers/specs/2026-07-15-code-based-roles-design.md`
- 롤 문자열은 정확히 3종: `ADMIN`, `VERIFIED`, `{boardId}:ADMIN`. 다른 롤 문자열을 만들지 않는다.
- **기존 Role/Permission/UserRole/RolePermission 테이블은 이 계획에서 드롭하지 않는다.** 스키마에 남긴다 (Phase 2 별도 작업).
- **기존 데이터 이관 스크립트를 작성하지 않는다.** 운영자가 DB에서 직접 수행한다.
- `noticeService.findGlobal`과 `findByBoardId`, `findById`, `findPinnedAndRecent`에 인가를 추가하지 않는다. 공지 읽기는 공개다.
- `boardService.findAll()`(공개 사이드바용)에 인가를 추가하지 않는다.
- 서비스는 인가 실패 시 `ServiceError`를 `"FORBIDDEN"` 코드로 던진다. API 라우트는 `handleServiceError()`로 매핑한다.
- `userId`가 falsy면 모든 인가 술어는 `false`를 반환한다 (예외를 던지지 않는다).
- 각 태스크 끝에서 `npm test`와 `npm run build`가 통과해야 한다. 태스크마다 커밋한다.
- 모든 인가 판정은 `lib/services/role.ts`를 거친다. 컴포넌트/라우트에서 `roles` 배열을 직접 `includes` 하지 않는다.

---

## File Structure

**신규**
- `lib/auth/roles.ts` — 롤 상수와 순수 문자열 헬퍼. DB 접근 없음.
- `lib/services/role.ts` — 인가 판정 서비스 (기존 Role CRUD 서비스를 대체하는 동명 파일).
- `__tests__/auth/roles.test.ts`, `__tests__/services/role.test.ts`
- `__tests__/api/foreign-ip-check.test.ts`, `__tests__/api/write-lock-check.test.ts`

**삭제**
- `lib/services/permission.ts`, `lib/services/seed.ts`
- `lib/repositories/{interfaces,prisma}/permission.ts`, `lib/repositories/{interfaces,prisma}/role.ts`
- `app/admin/roles/`, `app/api/roles/`, `app/api/permissions/`
- `__tests__/services/permission.test.ts`, `__tests__/services/role.test.ts`(기존 CRUD 테스트 — 동명 신규 파일로 대체)

**수정**
- `prisma/schema.prisma`, `lib/cache.ts`, `proxy.ts`
- `lib/services/{board,thread,response,notice,thread-ban,user}.ts`
- `lib/api/{foreign-ip-check,write-lock-check}.ts`
- `lib/repositories/{interfaces,prisma}/user.ts`
- `app/setup/`, `app/admin/**`, `components/sidebar/AdminSidebar.tsx`

**태스크 순서 근거:** 기존 `lib/services/role.ts`(Role CRUD)와 신규 동명 파일이 충돌하므로, Task 2에서 DB 기반 역할 관리 스택을 먼저 걷어내고 Task 4에서 신규 파일을 만든다. Task 2~3 이후 `/admin/users`는 롤 UI가 일시적으로 없는 상태가 되며 Task 10에서 새 UI로 복구된다. 빌드는 매 태스크 통과한다.

---

### Task 1: `User.roles` 칼럼과 롤 상수

**Files:**
- Modify: `prisma/schema.prisma:46-57`
- Modify: `lib/cache.ts:34-35`
- Create: `lib/auth/roles.ts`
- Test: `__tests__/auth/roles.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `ROLE: { readonly ADMIN: "ADMIN"; readonly VERIFIED: "VERIFIED" }`
  - `boardAdminRole(boardId: string): string`
  - `isBoardAdminRole(role: string): boolean`
  - `boardIdFromRole(role: string): string | null`
  - Prisma `User.roles: string[]`
  - `CACHE_TAGS.userRoles(userId: string): string`

- [ ] **Step 1: 실패하는 테스트 작성**

`__tests__/auth/roles.test.ts`:

```ts
import {
  ROLE,
  boardAdminRole,
  isBoardAdminRole,
  boardIdFromRole,
} from "@/lib/auth/roles";

describe("roles", () => {
  it("exposes the three role constants", () => {
    expect(ROLE.ADMIN).toBe("ADMIN");
    expect(ROLE.VERIFIED).toBe("VERIFIED");
  });

  describe("boardAdminRole", () => {
    it("builds a board admin role string", () => {
      expect(boardAdminRole("free")).toBe("free:ADMIN");
    });
  });

  describe("isBoardAdminRole", () => {
    it("returns true for a board admin role", () => {
      expect(isBoardAdminRole("free:ADMIN")).toBe(true);
    });

    it("returns false for the system admin role", () => {
      expect(isBoardAdminRole("ADMIN")).toBe(false);
    });

    it("returns false for VERIFIED", () => {
      expect(isBoardAdminRole("VERIFIED")).toBe(false);
    });

    it("returns false for an empty board id", () => {
      expect(isBoardAdminRole(":ADMIN")).toBe(false);
    });
  });

  describe("boardIdFromRole", () => {
    it("extracts the board id", () => {
      expect(boardIdFromRole("free:ADMIN")).toBe("free");
    });

    it("returns null for non board admin roles", () => {
      expect(boardIdFromRole("ADMIN")).toBeNull();
      expect(boardIdFromRole("VERIFIED")).toBeNull();
    });
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- --testPathPattern=auth/roles`
Expected: FAIL — `Cannot find module '@/lib/auth/roles'`

- [ ] **Step 3: `lib/auth/roles.ts` 구현**

```ts
export const ROLE = {
  ADMIN: "ADMIN",
  VERIFIED: "VERIFIED",
} as const;

export type GlobalRole = (typeof ROLE)[keyof typeof ROLE];

const BOARD_ADMIN_SUFFIX = ":ADMIN";

export function boardAdminRole(boardId: string): string {
  return `${boardId}${BOARD_ADMIN_SUFFIX}`;
}

export function isBoardAdminRole(role: string): boolean {
  return (
    role.endsWith(BOARD_ADMIN_SUFFIX) && role.length > BOARD_ADMIN_SUFFIX.length
  );
}

export function boardIdFromRole(role: string): string | null {
  if (!isBoardAdminRole(role)) return null;
  return role.slice(0, -BOARD_ADMIN_SUFFIX.length);
}
```

`isBoardAdminRole("ADMIN")`은 `"ADMIN".endsWith(":ADMIN")`이 `false`라 자연히 걸러진다. `":ADMIN"`은 길이 검사로 걸러진다.

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- --testPathPattern=auth/roles`
Expected: PASS (모든 테스트)

- [ ] **Step 5: Prisma 스키마에 `roles` 칼럼 추가**

`prisma/schema.prisma`의 `model User`를 다음으로 변경한다. `userRoles`는 Phase 2까지 남긴다.

```prisma
model User {
  id            String     @id @default(cuid())
  name          String?
  email         String?    @unique
  emailVerified DateTime?
  image         String?
  roles         String[]   @default([])
  accounts      Account[]
  sessions      Session[]
  userRoles     UserRole[]
  threads       Thread[]
  responses     Response[]
}
```

- [ ] **Step 6: 마이그레이션 생성 및 적용**

Run: `npx prisma migrate dev --name add_user_roles`
Expected: `Your database is now in sync with your schema.` 그리고 `prisma/migrations/<timestamp>_add_user_roles/migration.sql` 생성. SQL은 `ALTER TABLE "User" ADD COLUMN "roles" TEXT[] DEFAULT ARRAY[]::TEXT[];` 형태여야 한다.

- [ ] **Step 7: 롤 캐시 태그 추가**

`lib/cache.ts:34-35`의 `userPermissions` 아래에 `userRoles`를 추가한다. `userPermissions`는 Task 14에서 제거하므로 그때까지 둘 다 둔다.

```ts
  // User permissions (Task 14에서 제거)
  userPermissions: (userId: string) => `permissions-${userId}`,

  // User roles
  userRoles: (userId: string) => `roles-${userId}`,
```

- [ ] **Step 8: 전체 테스트와 빌드 확인**

Run: `npm test && npm run build`
Expected: 둘 다 통과

- [ ] **Step 9: 커밋**

```bash
git add prisma/schema.prisma prisma/migrations lib/auth/roles.ts lib/cache.ts __tests__/auth/roles.test.ts
git commit -m "feat: add User.roles column and code-based role constants"
```

---

### Task 2: DB 기반 역할 관리 스택 제거

기존 Role CRUD 스택을 걷어낸다. 신규 `lib/services/role.ts`가 동명 파일을 차지하려면 이게 선행돼야 한다.

**Files:**
- Delete: `app/admin/roles/` (디렉터리 전체), `app/api/roles/` (디렉터리 전체), `app/api/users/[userId]/roles/route.ts`
- Delete: `lib/services/role.ts`, `lib/repositories/interfaces/role.ts`, `lib/repositories/prisma/role.ts`
- Delete: `__tests__/services/role.test.ts`
- Modify: `lib/services/user.ts` — `getAllRoles`/`addRole`/`removeRole` 제거, `roleRepository` 의존 제거
- Modify: `app/admin/users/page.tsx` 및 그 클라이언트 컴포넌트 — 롤 UI 제거
- Modify: `components/sidebar/AdminSidebar.tsx` — 역할 관리 링크 제거
- Modify: `__tests__/services/user.test.ts` — 삭제된 메서드 테스트 제거

**Interfaces:**
- Consumes: 없음
- Produces: `UserService`에서 `getAllRoles`/`addRole`/`removeRole`가 사라진다. 남는 메서드: `findAll`, `findById`, `delete`, `deleteSelf`.

- [ ] **Step 1: 삭제 대상의 실제 참조 확인**

Run:
```bash
grep -rn --include='*.ts' --include='*.tsx' 'services/role\|repositories/prisma/role\|repositories/interfaces/role\|getAllRoles\|addRole\|removeRole\|api/roles' app lib components __tests__ proxy.ts
```
Expected: 아래에서 수정할 파일들만 나온다. 목록에 없는 파일이 나오면 그 파일도 이 태스크에서 함께 정리한다.

- [ ] **Step 2: 디렉터리와 파일 삭제**

```bash
git rm -r app/admin/roles app/api/roles app/api/users/[userId]/roles
git rm lib/services/role.ts lib/repositories/interfaces/role.ts lib/repositories/prisma/role.ts
git rm __tests__/services/role.test.ts
```

- [ ] **Step 3: `lib/services/user.ts`에서 롤 메서드 제거**

`UserService` 인터페이스(`lib/services/user.ts:23-42`)에서 세 줄을 제거한다:

```ts
  getAllRoles(requesterId: string): Promise<RoleData[]>;
  addRole(requesterId: string, userId: string, roleId: string): Promise<void>;
  removeRole(requesterId: string, userId: string, roleId: string): Promise<void>;
```

구현체에서 `getAllRoles`(100-103), `addRole`(105-131), `removeRole`(133-154) 세 메서드를 통째로 제거한다.

임포트에서 role 관련을 제거한다 — `lib/services/user.ts:6`의 `roleRepository` 임포트와 `lib/services/user.ts:8`의 `RoleRepository, RoleData` 임포트.

`UserServiceDeps`에서 `roleRepository: RoleRepository;`를 제거하고, 구조분해(`:51`)와 싱글턴 생성(`:189-193`)에서도 `roleRepository`를 뺀다. 결과:

```ts
interface UserServiceDeps {
  userRepository: UserRepository;
  permissionService: PermissionService;
}

export function createUserService(deps: UserServiceDeps): UserService {
  const { userRepository, permissionService } = deps;
```

```ts
export const userService = createUserService({
  userRepository: defaultUserRepository,
  permissionService: defaultPermissionService,
});
```

`permissionService`는 Task 10에서 `roleService`로 바뀐다. 지금은 그대로 둔다.

- [ ] **Step 4: `lib/repositories/{interfaces,prisma}/user.ts`에서 롤 조작 메서드 제거**

`lib/repositories/interfaces/user.ts`의 `UserRepository`에서 `addRole`, `removeRole`, `findUserIdsByRoleId` 세 시그니처를 제거한다. `lib/repositories/prisma/user.ts`에서 같은 세 메서드 구현을 제거한다.

`UserWithRoles`와 `include: { userRoles: ... }`는 이 태스크에서 건드리지 않는다 — Task 10에서 `roles: string[]`로 바꾼다.

- [ ] **Step 5: `/admin/users` 롤 UI 제거**

`app/admin/users/page.tsx`에서 `userService.getAllRoles(...)` 호출과 그 결과를 `admin-users-content.tsx`로 넘기는 prop을 제거한다.

`app/admin/users/admin-users-content.tsx`에서 롤 부여/해제 UI와 `/api/users/${userId}/roles` fetch를 제거한다. 사용자 목록/검색/삭제 기능은 그대로 둔다.

`canUpdate` prop이 롤 UI 전용이라 미사용이 되면 두 파일에서 함께 제거한다.

- [ ] **Step 6: 사이드바에서 역할 관리 링크 제거**

`components/sidebar/AdminSidebar.tsx:42-71`에서 `labels.roles &&` 로 감싸인 `/admin/roles` `NavItem` 블록을 제거한다. 라벨 타입은 `components/sidebar/types.ts`의 `AdminSidebarLabels`에 있으므로, 거기서 `roles` 필드를 제거한다.

호출부 네 곳(`app/admin/boards/page.tsx`, `app/admin/users/page.tsx`, `app/admin/settings/page.tsx`, `app/admin/notices/page.tsx` — `app/admin/roles/page.tsx`는 Step 2에서 이미 삭제됨)에서 `roles: t("roles")` 라벨 전달을 제거한다.

번역 파일 `lib/i18n/messages/{ko,en,ja}.json`의 `adminSidebar.roles` 키를 제거한다. 롤 CRUD 화면 전용 번역 키가 있으면 함께 제거한다.

- [ ] **Step 7: `__tests__/services/user.test.ts` 정리**

`getAllRoles`/`addRole`/`removeRole` describe 블록을 제거한다. mock deps에서 `roleRepository`를 제거한다. `findAll`/`findById`/`delete`/`deleteSelf` 테스트는 유지한다.

- [ ] **Step 8: 테스트와 빌드 확인**

Run: `npm test && npm run build`
Expected: 둘 다 통과. 타입 에러가 남아 있으면 삭제된 심볼을 참조하는 파일이 있다는 뜻이므로 그 참조를 제거한다.

- [ ] **Step 9: 커밋**

```bash
git add -A
git commit -m "refactor: remove DB-backed role management stack"
```

---

### Task 3: `/setup` 부트스트랩을 `roles` 기반으로 재작성

**Files:**
- Modify: `app/setup/page.tsx:9-16`
- Modify: `app/setup/complete/page.tsx:9-42`
- Delete: `lib/services/seed.ts`

**Interfaces:**
- Consumes: `ROLE` from `@/lib/auth/roles`, Prisma `User.roles`, `CACHE_TAGS.userRoles` (모두 Task 1)
- Produces: 없음

- [ ] **Step 1: 남은 seed 참조 확인**

Run: `grep -rn --include='*.ts' --include='*.tsx' 'seedDefaultData\|services/seed' app lib __tests__`
Expected: `app/setup/complete/page.tsx`와 `lib/services/seed.ts`만. 다른 곳이 나오면 그 참조도 이 태스크에서 정리한다.

- [ ] **Step 2: `app/setup/page.tsx` 가드 교체**

기존 가드는 `Role` 테이블에서 `name: "ADMIN"`을 찾아 사용자가 붙어 있는지 본다. 이를 `roles` 칼럼 조회로 바꾼다. `page.tsx:9-16`의 가드를 다음으로 교체한다:

```ts
const adminCount = await prisma.user.count({
  where: { roles: { has: ROLE.ADMIN } },
});
if (adminCount > 0) {
  notFound();
}
```

`import { ROLE } from "@/lib/auth/roles";`를 추가하고, `Role` 조회에만 쓰이던 임포트가 남으면 제거한다.

- [ ] **Step 3: `app/setup/complete/page.tsx` 교체**

동일한 가드를 적용하고, `seedDefaultData()` + `userRole.upsert` 대신 현재 사용자의 `roles`에 `ADMIN`을 넣는다:

```ts
const adminCount = await prisma.user.count({
  where: { roles: { has: ROLE.ADMIN } },
});
if (adminCount > 0) {
  notFound();
}

const session = await getServerSession(authOptions);
if (!session?.user?.id) {
  redirect("/setup");
}

await prisma.user.update({
  where: { id: session.user.id },
  data: { roles: [ROLE.ADMIN] },
});

invalidateCache(CACHE_TAGS.userRoles(session.user.id));

redirect("/");
```

`import { invalidateCache, CACHE_TAGS } from "@/lib/cache";`와 `import { ROLE } from "@/lib/auth/roles";`를 추가한다.

기존 가드/세션 리다이렉트 순서와 `redirect("/")`는 유지한다. 스펙에 따라 check-then-act 경쟁 조건은 이번 범위 밖이므로 트랜잭션으로 감싸지 않는다.

- [ ] **Step 4: seed 삭제**

```bash
git rm lib/services/seed.ts
```

- [ ] **Step 5: 테스트와 빌드 확인**

Run: `npm test && npm run build`
Expected: 둘 다 통과

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "refactor: bootstrap first admin via User.roles"
```

---

### Task 4: 인가 판정 서비스 `lib/services/role.ts`

**Files:**
- Create: `lib/services/role.ts`
- Test: `__tests__/services/role.test.ts`

**Interfaces:**
- Consumes: `ROLE`, `boardAdminRole`, `boardIdFromRole` from `@/lib/auth/roles` (Task 1); `CACHE_TAGS.userRoles` from `@/lib/cache` (Task 1)
- Produces:
  - `RoleService` 인터페이스와 `createRoleService(prisma: PrismaClient): RoleService`
  - 싱글턴 `roleService`
  - `getUserRoles(userId: string): Promise<string[]>`
  - `isAdmin(userId: string): Promise<boolean>`
  - `isVerified(userId: string): Promise<boolean>`
  - `canManageBoard(userId: string, boardId: string): Promise<boolean>`
  - `listManagedBoardIds(userId: string): Promise<string[] | "all">`

- [ ] **Step 1: 실패하는 테스트 작성**

`__tests__/services/role.test.ts`:

```ts
import { createRoleService } from "@/lib/services/role";
import { PrismaClient } from "@prisma/client";

jest.mock("@/lib/cache", () => ({
  cached: <T>(fn: () => Promise<T>) => fn(),
  CACHE_TAGS: {
    userRoles: (userId: string) => `roles-${userId}`,
  },
}));

describe("RoleService", () => {
  const createMockPrisma = (roles: string[] | null) => ({
    user: {
      findUnique: jest.fn().mockResolvedValue(roles === null ? null : { roles }),
    },
  });

  const serviceWith = (roles: string[] | null) =>
    createRoleService(createMockPrisma(roles) as unknown as PrismaClient);

  describe("getUserRoles", () => {
    it("returns the roles column", async () => {
      const service = serviceWith(["ADMIN"]);
      await expect(service.getUserRoles("u1")).resolves.toEqual(["ADMIN"]);
    });

    it("returns empty array when the user does not exist", async () => {
      const service = serviceWith(null);
      await expect(service.getUserRoles("nope")).resolves.toEqual([]);
    });

    it("returns empty array for a falsy userId without hitting the db", async () => {
      const prisma = createMockPrisma(["ADMIN"]);
      const service = createRoleService(prisma as unknown as PrismaClient);
      await expect(service.getUserRoles("")).resolves.toEqual([]);
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });
  });

  describe("isAdmin", () => {
    it("is true for ADMIN", async () => {
      await expect(serviceWith(["ADMIN"]).isAdmin("u1")).resolves.toBe(true);
    });

    it("is false for VERIFIED", async () => {
      await expect(serviceWith(["VERIFIED"]).isAdmin("u1")).resolves.toBe(false);
    });

    it("is false for a board admin", async () => {
      await expect(serviceWith(["free:ADMIN"]).isAdmin("u1")).resolves.toBe(false);
    });

    it("is false for anonymous", async () => {
      await expect(serviceWith([]).isAdmin("")).resolves.toBe(false);
    });
  });

  describe("isVerified", () => {
    it("is true for VERIFIED", async () => {
      await expect(serviceWith(["VERIFIED"]).isVerified("u1")).resolves.toBe(true);
    });

    it("is true for ADMIN", async () => {
      await expect(serviceWith(["ADMIN"]).isVerified("u1")).resolves.toBe(true);
    });

    it("is false for a board admin only", async () => {
      await expect(serviceWith(["free:ADMIN"]).isVerified("u1")).resolves.toBe(false);
    });

    it("is false for anonymous", async () => {
      await expect(serviceWith([]).isVerified("")).resolves.toBe(false);
    });
  });

  describe("canManageBoard", () => {
    it("is true for ADMIN on any board", async () => {
      const service = serviceWith(["ADMIN"]);
      await expect(service.canManageBoard("u1", "anything")).resolves.toBe(true);
    });

    it("is true for the matching board admin", async () => {
      const service = serviceWith(["free:ADMIN"]);
      await expect(service.canManageBoard("u1", "free")).resolves.toBe(true);
    });

    it("is false for a different board", async () => {
      const service = serviceWith(["boardA:ADMIN"]);
      await expect(service.canManageBoard("u1", "boardB")).resolves.toBe(false);
    });

    it("is false for VERIFIED only", async () => {
      const service = serviceWith(["VERIFIED"]);
      await expect(service.canManageBoard("u1", "free")).resolves.toBe(false);
    });

    it("is false for anonymous", async () => {
      await expect(serviceWith([]).canManageBoard("", "free")).resolves.toBe(false);
    });
  });

  describe("listManagedBoardIds", () => {
    it('returns "all" for ADMIN', async () => {
      await expect(serviceWith(["ADMIN"]).listManagedBoardIds("u1")).resolves.toBe("all");
    });

    it("returns only board ids for a board admin", async () => {
      const service = serviceWith(["VERIFIED", "boardA:ADMIN", "boardB:ADMIN"]);
      await expect(service.listManagedBoardIds("u1")).resolves.toEqual([
        "boardA",
        "boardB",
      ]);
    });

    it("returns empty array for a user with no board roles", async () => {
      await expect(serviceWith(["VERIFIED"]).listManagedBoardIds("u1")).resolves.toEqual([]);
    });

    it("returns empty array for anonymous", async () => {
      await expect(serviceWith([]).listManagedBoardIds("")).resolves.toEqual([]);
    });
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- --testPathPattern=services/role`
Expected: FAIL — `Cannot find module '@/lib/services/role'`

- [ ] **Step 3: `lib/services/role.ts` 구현**

```ts
import { PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "@/lib/prisma";
import { cached, CACHE_TAGS } from "@/lib/cache";
import { ROLE, boardAdminRole, boardIdFromRole } from "@/lib/auth/roles";

export interface RoleService {
  getUserRoles(userId: string): Promise<string[]>;
  isAdmin(userId: string): Promise<boolean>;
  isVerified(userId: string): Promise<boolean>;
  canManageBoard(userId: string, boardId: string): Promise<boolean>;
  listManagedBoardIds(userId: string): Promise<string[] | "all">;
}

export function createRoleService(prisma: PrismaClient): RoleService {
  async function fetchUserRoles(userId: string): Promise<string[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { roles: true },
    });
    return user?.roles ?? [];
  }

  const service: RoleService = {
    async getUserRoles(userId: string): Promise<string[]> {
      if (!userId) return [];
      return cached(
        () => fetchUserRoles(userId),
        ["roles", userId],
        [CACHE_TAGS.userRoles(userId)]
      );
    },

    async isAdmin(userId: string): Promise<boolean> {
      const roles = await service.getUserRoles(userId);
      return roles.includes(ROLE.ADMIN);
    },

    async isVerified(userId: string): Promise<boolean> {
      const roles = await service.getUserRoles(userId);
      return roles.includes(ROLE.ADMIN) || roles.includes(ROLE.VERIFIED);
    },

    async canManageBoard(userId: string, boardId: string): Promise<boolean> {
      const roles = await service.getUserRoles(userId);
      return roles.includes(ROLE.ADMIN) || roles.includes(boardAdminRole(boardId));
    },

    async listManagedBoardIds(userId: string): Promise<string[] | "all"> {
      const roles = await service.getUserRoles(userId);
      if (roles.includes(ROLE.ADMIN)) return "all";
      return roles
        .map(boardIdFromRole)
        .filter((id): id is string => id !== null);
    },
  };

  return service;
}

export const roleService = createRoleService(defaultPrisma);
```

`this` 대신 `service` 상수를 참조하는 이유는, 호출부에서 메서드를 구조분해해 넘겨도 바인딩이 깨지지 않게 하기 위함이다.

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- --testPathPattern=services/role`
Expected: PASS (모든 테스트)

- [ ] **Step 5: 전체 테스트와 빌드 확인**

Run: `npm test && npm run build`
Expected: 둘 다 통과

- [ ] **Step 6: 커밋**

```bash
git add lib/services/role.ts __tests__/services/role.test.ts
git commit -m "feat: add role service with authorization predicates"
```

---

### Task 5: `boardService` 이관

**Files:**
- Modify: `lib/services/board.ts` (전면)
- Modify: `__tests__/services/board.test.ts`

**Interfaces:**
- Consumes: `roleService`, `RoleService` from `@/lib/services/role` (Task 4)
- Produces: `BoardServiceDeps`가 `{ boardRepository: BoardRepository; roleService: RoleService }`가 된다. `permissionService`/`permissionRepository`는 사라진다. `BoardService`의 공개 시그니처는 변하지 않는다.

- [ ] **Step 1: 실패하는 테스트 작성**

`__tests__/services/board.test.ts`의 mock deps를 `roleService`로 교체하고, 아래 케이스를 추가한다. 기존 테스트의 `permissionService` mock은 전부 제거한다.

```ts
const createMockRoleService = (overrides = {}) => ({
  getUserRoles: jest.fn().mockResolvedValue([]),
  isAdmin: jest.fn().mockResolvedValue(false),
  isVerified: jest.fn().mockResolvedValue(false),
  canManageBoard: jest.fn().mockResolvedValue(false),
  listManagedBoardIds: jest.fn().mockResolvedValue([]),
  ...overrides,
});
```

```ts
describe("update", () => {
  it("lets a board admin update a normal field", async () => {
    const boardRepository = createMockBoardRepository();
    boardRepository.findById.mockResolvedValue({ id: "free", deleted: false });
    boardRepository.update.mockResolvedValue({ id: "free", deleted: false });
    const service = createBoardService({
      boardRepository,
      roleService: createMockRoleService({
        canManageBoard: jest.fn().mockResolvedValue(true),
      }),
    });

    await expect(
      service.update("u1", "free", { name: "새 이름" })
    ).resolves.toEqual({ id: "free", deleted: false });
  });

  it("forbids a board admin from deleting the board", async () => {
    const boardRepository = createMockBoardRepository();
    boardRepository.findById.mockResolvedValue({ id: "free", deleted: false });
    const service = createBoardService({
      boardRepository,
      roleService: createMockRoleService({
        canManageBoard: jest.fn().mockResolvedValue(true),
        isAdmin: jest.fn().mockResolvedValue(false),
      }),
    });

    await expect(service.update("u1", "free", { deleted: true })).rejects.toThrow(
      "Permission denied"
    );
    expect(boardRepository.update).not.toHaveBeenCalled();
  });

  it("lets an admin delete the board", async () => {
    const boardRepository = createMockBoardRepository();
    boardRepository.findById.mockResolvedValue({ id: "free", deleted: false });
    boardRepository.update.mockResolvedValue({ id: "free", deleted: true });
    const service = createBoardService({
      boardRepository,
      roleService: createMockRoleService({
        canManageBoard: jest.fn().mockResolvedValue(true),
        isAdmin: jest.fn().mockResolvedValue(true),
      }),
    });

    await expect(
      service.update("admin", "free", { deleted: true })
    ).resolves.toEqual({ id: "free", deleted: true });
  });

  it("forbids a board admin from restoring a board", async () => {
    const boardRepository = createMockBoardRepository();
    boardRepository.findById.mockResolvedValue({ id: "free", deleted: true });
    const service = createBoardService({
      boardRepository,
      roleService: createMockRoleService({
        canManageBoard: jest.fn().mockResolvedValue(true),
        isAdmin: jest.fn().mockResolvedValue(false),
      }),
    });

    await expect(
      service.update("u1", "free", { deleted: false })
    ).rejects.toThrow("Permission denied");
  });
});

describe("findAllWithThreadCount", () => {
  it("returns every board for an admin", async () => {
    const boardRepository = createMockBoardRepository();
    boardRepository.findAllWithThreadCount.mockResolvedValue([
      { id: "a" },
      { id: "b" },
    ]);
    const service = createBoardService({
      boardRepository,
      roleService: createMockRoleService({
        listManagedBoardIds: jest.fn().mockResolvedValue("all"),
      }),
    });

    await expect(service.findAllWithThreadCount("admin")).resolves.toEqual([
      { id: "a" },
      { id: "b" },
    ]);
  });

  it("returns only managed boards for a board admin", async () => {
    const boardRepository = createMockBoardRepository();
    boardRepository.findAllWithThreadCount.mockResolvedValue([
      { id: "a" },
      { id: "b" },
    ]);
    const service = createBoardService({
      boardRepository,
      roleService: createMockRoleService({
        listManagedBoardIds: jest.fn().mockResolvedValue(["b"]),
      }),
    });

    await expect(service.findAllWithThreadCount("u1")).resolves.toEqual([
      { id: "b" },
    ]);
  });

  it("forbids a user who manages no boards", async () => {
    const service = createBoardService({
      boardRepository: createMockBoardRepository(),
      roleService: createMockRoleService({
        listManagedBoardIds: jest.fn().mockResolvedValue([]),
      }),
    });

    await expect(service.findAllWithThreadCount("u1")).rejects.toThrow(
      "Permission denied"
    );
  });
});

describe("create", () => {
  it("forbids a board admin from creating a board", async () => {
    const service = createBoardService({
      boardRepository: createMockBoardRepository(),
      roleService: createMockRoleService({
        isAdmin: jest.fn().mockResolvedValue(false),
      }),
    });

    await expect(service.create("u1", { id: "new" })).rejects.toThrow(
      "Permission denied"
    );
  });
});
```

`createMockBoardRepository`는 기존 테스트 파일의 헬퍼를 그대로 쓴다. 없으면 `findById`, `findAll`, `findAllWithThreadCount`, `create`, `update`, `updateConfig`를 `jest.fn()`으로 가진 객체를 만든다.

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- --testPathPattern=services/board`
Expected: FAIL — `roleService`가 `BoardServiceDeps`에 없다는 타입 에러 또는 삭제 가드 부재로 인한 assertion 실패

- [ ] **Step 3: `lib/services/board.ts` 재작성**

`:1-17`의 임포트에서 `permissionService`/`PermissionService`/`permissionRepository`/`PermissionRepository`를 제거하고 `roleService`를 넣는다:

```ts
import {
  roleService as defaultRoleService,
  RoleService,
} from "@/lib/services/role";
import { boardRepository as defaultBoardRepository } from "@/lib/repositories/prisma/board";
import {
  BoardRepository,
  BoardData,
  BoardWithThreadCount,
  CreateBoardInput,
  UpdateBoardInput,
  ConfigBoardInput,
} from "@/lib/repositories/interfaces/board";
import { ServiceError, ServiceErrorCode } from "@/lib/services/errors";
import { cached, invalidateCache, CACHE_TAGS } from "@/lib/cache";
```

`BoardServiceDeps`(`:38-42`)와 구조분해(`:45`)를 교체하고, `checkPermissions`(`:47-52`)와 `createBoardPermissions`(`:54-97`)를 삭제한다:

```ts
interface BoardServiceDeps {
  boardRepository: BoardRepository;
  roleService: RoleService;
}

export function createBoardService(deps: BoardServiceDeps): BoardService {
  const { boardRepository, roleService } = deps;
```

`findAllWithThreadCount`(`:108-118`)를 교체한다:

```ts
    async findAllWithThreadCount(userId: string): Promise<BoardWithThreadCount[]> {
      const managed = await roleService.listManagedBoardIds(userId);
      if (managed !== "all" && managed.length === 0) {
        throw new BoardServiceError("Permission denied", "FORBIDDEN");
      }

      const boards = await cached(
        () => boardRepository.findAllWithThreadCount(),
        ["boards-with-count"],
        [CACHE_TAGS.boards]
      );

      if (managed === "all") return boards;
      return boards.filter((board) => managed.includes(board.id));
    },
```

`create`(`:132-150`)의 인가를 교체한다. `createBoardPermissions` 호출(`:144`)을 제거한다:

```ts
    async create(userId: string, data: CreateBoardInput): Promise<BoardData> {
      if (!(await roleService.isAdmin(userId))) {
        throw new BoardServiceError("Permission denied", "FORBIDDEN");
      }

      const existingBoard = await boardRepository.findById(data.id);
      if (existingBoard) {
        throw new BoardServiceError("Board already exists", "CONFLICT");
      }

      const board = await boardRepository.create(data);

      invalidateCache(CACHE_TAGS.boards);

      return board;
    },
```

`update`(`:152-185`)를 교체한다. `deleted` 필드가 실린 요청은 ADMIN만 허용하고, 권한 소프트삭제/복구 동기화(`:172-178`)를 제거한다:

```ts
    async update(
      userId: string,
      id: string,
      data: UpdateBoardInput
    ): Promise<BoardData> {
      const board = await boardRepository.findById(id);
      if (!board) {
        throw new BoardServiceError("Board not found", "NOT_FOUND");
      }

      if (!(await roleService.canManageBoard(userId, id))) {
        throw new BoardServiceError("Permission denied", "FORBIDDEN");
      }

      // 보드 삭제/복구는 시스템 어드민 전용
      if (data.deleted !== undefined && !(await roleService.isAdmin(userId))) {
        throw new BoardServiceError("Permission denied", "FORBIDDEN");
      }

      const result = await boardRepository.update(id, data);

      invalidateCache(CACHE_TAGS.boards);
      invalidateCache(CACHE_TAGS.board(id));

      return result;
    },
```

`updateConfig`(`:187-212`)의 인가만 교체한다:

```ts
      if (!(await roleService.canManageBoard(userId, id))) {
        throw new BoardServiceError("Permission denied", "FORBIDDEN");
      }
```

싱글턴(`:216-220`)을 교체한다:

```ts
export const boardService = createBoardService({
  boardRepository: defaultBoardRepository,
  roleService: defaultRoleService,
});
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- --testPathPattern=services/board`
Expected: PASS (모든 테스트)

- [ ] **Step 5: 커밋**

```bash
git add lib/services/board.ts __tests__/services/board.test.ts
git commit -m "refactor: authorize board service via roles"
```

---

### Task 6: `threadService` 이관

**Files:**
- Modify: `lib/services/thread.ts:1-5, 60-80, 150-200`
- Modify: `__tests__/services/thread.test.ts`

**Interfaces:**
- Consumes: `roleService`, `RoleService` from `@/lib/services/role` (Task 4)
- Produces: `ThreadServiceDeps`의 `permissionService`가 `roleService: RoleService`로 바뀐다. 공개 시그니처 변화 없음.

- [ ] **Step 1: 실패하는 테스트 작성**

`__tests__/services/thread.test.ts`의 mock deps에서 `permissionService`를 제거하고 `roleService`를 넣는다. Task 5의 `createMockRoleService` 헬퍼와 동일한 형태를 이 파일에도 만든다.

```ts
const createMockRoleService = (overrides = {}) => ({
  getUserRoles: jest.fn().mockResolvedValue([]),
  isAdmin: jest.fn().mockResolvedValue(false),
  isVerified: jest.fn().mockResolvedValue(false),
  canManageBoard: jest.fn().mockResolvedValue(false),
  listManagedBoardIds: jest.fn().mockResolvedValue([]),
  ...overrides,
});
```

기존 테스트에서 `permissionService.checkUserPermissions.mockResolvedValue(true)`로 통과시키던 케이스는 `canManageBoard: jest.fn().mockResolvedValue(true)`로 바꾼다. 그리고 다음을 추가한다:

```ts
it("checks the board admin role for the thread's board", async () => {
  const threadRepository = createMockThreadRepository();
  threadRepository.findById.mockResolvedValue({ id: 1, boardId: "free" });
  threadRepository.update.mockResolvedValue({ id: 1, boardId: "free" });
  const roleService = createMockRoleService({
    canManageBoard: jest.fn().mockResolvedValue(true),
  });
  const service = createThreadService({
    threadRepository,
    boardRepository: createMockBoardRepository(),
    roleService,
  });

  await service.update("u1", 1, { title: "새 제목" });

  expect(roleService.canManageBoard).toHaveBeenCalledWith("u1", "free");
});

it("forbids deleting a thread on a board the user does not manage", async () => {
  const threadRepository = createMockThreadRepository();
  threadRepository.findById.mockResolvedValue({ id: 1, boardId: "free" });
  const service = createThreadService({
    threadRepository,
    boardRepository: createMockBoardRepository(),
    roleService: createMockRoleService({
      canManageBoard: jest.fn().mockResolvedValue(false),
    }),
  });

  await expect(service.delete("u1", 1)).rejects.toThrow("Permission denied");
});
```

`service.update`/`service.delete`의 정확한 인자는 기존 테스트 파일의 호출부를 그대로 따른다.

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- --testPathPattern=services/thread`
Expected: FAIL — `roleService`가 `ThreadServiceDeps`에 없다는 타입 에러

- [ ] **Step 3: `lib/services/thread.ts` 교체**

`:1-5`의 임포트를 교체한다:

```ts
import {
  roleService as defaultRoleService,
  RoleService,
} from "@/lib/services/role";
```

`ThreadServiceDeps`(`:62`)의 `permissionService: PermissionService;`를 `roleService: RoleService;`로, 구조분해(`:66`)를 `const { threadRepository, boardRepository, roleService } = deps;`로 바꾼다.

`checkThreadPermission`(`:68-77`)을 제거한다. 이 헬퍼는 `action`을 받아 권한 문자열 쌍을 만들었으나, 이제 수정/삭제 판정이 동일하므로 헬퍼가 필요 없다.

호출부(`:156`, `:177`)를 직접 판정으로 교체한다:

```ts
      const hasPermission = await roleService.canManageBoard(userId, thread.boardId);
      if (!hasPermission) {
        throw new ThreadServiceError("Permission denied", "FORBIDDEN");
      }
```

싱글턴(`:197`)의 `permissionService: defaultPermissionService,`를 `roleService: defaultRoleService,`로 바꾼다.

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- --testPathPattern=services/thread`
Expected: PASS (모든 테스트)

- [ ] **Step 5: 커밋**

```bash
git add lib/services/thread.ts __tests__/services/thread.test.ts
git commit -m "refactor: authorize thread service via roles"
```

---

### Task 7: `responseService` 이관

**Files:**
- Modify: `lib/services/response.ts:1-5, 92-110, 335-420`
- Modify: `__tests__/services/response.test.ts`

**Interfaces:**
- Consumes: `roleService`, `RoleService` from `@/lib/services/role` (Task 4)
- Produces: `ResponseServiceDeps`의 `permissionService`가 `roleService: RoleService`로 바뀐다. 공개 시그니처 변화 없음.

응답 삭제는 "권한 또는 비밀번호"다. 이 OR 구조를 반드시 유지한다.

- [ ] **Step 1: 실패하는 테스트 작성**

`__tests__/services/response.test.ts`의 mock deps에서 `permissionService`를 제거하고 Task 6과 동일한 `createMockRoleService` 헬퍼를 넣는다. 기존 `checkUserPermissions` mock 설정을 `canManageBoard`로 바꾼다. 그리고 다음을 추가한다:

```ts
it("still allows password-based deletion without any role", async () => {
  const service = createResponseService({
    ...baseDeps,
    roleService: createMockRoleService({
      canManageBoard: jest.fn().mockResolvedValue(false),
    }),
  });

  await expect(service.delete("", validResponseId, correctPassword)).resolves.not.toThrow();
});

it("allows a board admin to delete without a password", async () => {
  const service = createResponseService({
    ...baseDeps,
    roleService: createMockRoleService({
      canManageBoard: jest.fn().mockResolvedValue(true),
    }),
  });

  await expect(service.delete("u1", validResponseId, undefined)).resolves.not.toThrow();
});
```

`baseDeps`, `validResponseId`, `correctPassword`는 기존 테스트 파일의 픽스처를 그대로 쓴다. 기존 삭제 테스트의 호출 형태를 그대로 따라간다.

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- --testPathPattern=services/response`
Expected: FAIL — `roleService`가 `ResponseServiceDeps`에 없다는 타입 에러

- [ ] **Step 3: `lib/services/response.ts` 교체**

`:1-5`의 임포트를 Task 6과 같은 형태로 교체한다. `ResponseServiceDeps`(`:94`)의 `permissionService: PermissionService;`를 `roleService: RoleService;`로, 구조분해(`:98`)를 `const { responseRepository, threadRepository, boardRepository, roleService } = deps;`로 바꾼다.

`checkResponsePermission`(`:100-110`)을 제거한다.

`update`의 호출부(`:340`)를 교체한다:

```ts
      const hasPermission = await roleService.canManageBoard(userId, thread.boardId);
      if (!hasPermission) {
        throw new ResponseServiceError("Permission denied", "FORBIDDEN");
      }
```

`delete`의 호출부(`:408-416`)를 교체한다. `passwordValid`와의 OR 구조를 유지한다:

```ts
      const hasPermission = await roleService.canManageBoard(userId, thread.boardId);

      if (!hasPermission && !passwordValid) {
        throw new ResponseServiceError("Permission denied", "FORBIDDEN");
      }
```

`passwordValid` 계산 로직은 손대지 않는다.

싱글턴(`:434`)의 `permissionService: defaultPermissionService,`를 `roleService: defaultRoleService,`로 바꾼다.

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- --testPathPattern=services/response`
Expected: PASS (모든 테스트)

- [ ] **Step 5: 커밋**

```bash
git add lib/services/response.ts __tests__/services/response.test.ts
git commit -m "refactor: authorize response service via roles"
```

---

### Task 8: `noticeService` 이관

**Files:**
- Modify: `lib/services/notice.ts:1-4, 52-66, 145-235, 245-252`
- Modify: `__tests__/services/notice.test.ts`

**Interfaces:**
- Consumes: `roleService`, `RoleService` from `@/lib/services/role` (Task 4)
- Produces: `NoticeServiceDeps`의 `permissionService`가 `roleService: RoleService`로 바뀐다. 공개 시그니처 변화 없음.

전역 공지(`boardId === null`)는 `isAdmin`, 보드 공지는 `canManageBoard`다. **읽기 메서드(`findGlobal`, `findByBoardId`, `findById`, `findPinnedAndRecent`)에는 인가를 추가하지 않는다** — `GET /api/notices`는 비로그인 공개 엔드포인트다.

- [ ] **Step 1: 실패하는 테스트 작성**

`__tests__/services/notice.test.ts`의 mock deps에서 `permissionService`를 제거하고 Task 6과 동일한 `createMockRoleService` 헬퍼를 넣는다. 기존 `checkUserPermissions` mock 설정은 대상에 따라 `isAdmin`(전역) 또는 `canManageBoard`(보드)로 바꾼다. 그리고 다음을 추가한다:

```ts
it("forbids a board admin from creating a global notice", async () => {
  const service = createNoticeService({
    ...baseDeps,
    roleService: createMockRoleService({
      isAdmin: jest.fn().mockResolvedValue(false),
      canManageBoard: jest.fn().mockResolvedValue(true),
    }),
  });

  await expect(
    service.createGlobal("u1", { title: "공지", content: "내용" })
  ).rejects.toThrow("Permission denied");
});

it("lets a board admin create a notice on their board", async () => {
  const roleService = createMockRoleService({
    isAdmin: jest.fn().mockResolvedValue(false),
    canManageBoard: jest.fn().mockResolvedValue(true),
  });
  const service = createNoticeService({ ...baseDeps, roleService });

  await service.create("u1", { boardId: "free", title: "공지", content: "내용" });

  expect(roleService.canManageBoard).toHaveBeenCalledWith("u1", "free");
});

it("does not authorize global notice reads", async () => {
  const roleService = createMockRoleService();
  const service = createNoticeService({ ...baseDeps, roleService });

  await service.findGlobal({ page: 1 });

  expect(roleService.isAdmin).not.toHaveBeenCalled();
  expect(roleService.getUserRoles).not.toHaveBeenCalled();
});
```

`baseDeps`와 `create`/`createGlobal`의 정확한 인자는 기존 테스트 파일의 픽스처와 호출부를 따른다.

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- --testPathPattern=services/notice`
Expected: FAIL — `roleService`가 `NoticeServiceDeps`에 없다는 타입 에러

- [ ] **Step 3: `lib/services/notice.ts` 교체**

`:1-4`의 임포트를 Task 6과 같은 형태로 교체한다. `NoticeServiceDeps`(`:54`)의 `permissionService: PermissionService;`를 `roleService: RoleService;`로, 구조분해(`:58`)를 `const { noticeRepository, boardRepository, roleService } = deps;`로 바꾼다.

`checkPermissions`(`:60-65`)를 대상 기준 판정 헬퍼로 교체한다:

```ts
  async function canManageNotice(
    userId: string,
    boardId: string | null
  ): Promise<boolean> {
    return boardId === null
      ? roleService.isAdmin(userId)
      : roleService.canManageBoard(userId, boardId);
  }
```

`create`(`:149-155`)를 교체한다:

```ts
      const hasPermission = await canManageNotice(userId, data.boardId);
      if (!hasPermission) {
        throw new NoticeServiceError("Permission denied", "FORBIDDEN");
      }
```

`createGlobal`(`:173-176`)을 교체한다:

```ts
      const hasPermission = await roleService.isAdmin(userId);
      if (!hasPermission) {
        throw new NoticeServiceError("Permission denied", "FORBIDDEN");
      }
```

`update`(`:197-203`)와 `delete`(`:224-230`)를 각각 교체한다. 두 곳 모두 `notice.boardId`를 기준으로 삼는다:

```ts
      const hasPermission = await canManageNotice(userId, notice.boardId);
      if (!hasPermission) {
        throw new NoticeServiceError("Permission denied", "FORBIDDEN");
      }
```

싱글턴(`:250`)의 `permissionService: defaultPermissionService,`를 `roleService: defaultRoleService,`로 바꾼다.

읽기 메서드는 한 줄도 건드리지 않는다.

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- --testPathPattern=services/notice`
Expected: PASS (모든 테스트)

- [ ] **Step 5: 공개 공지 조회가 살아 있는지 확인**

Run: `npm run dev` 후 다른 터미널에서 `curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/api/notices`
Expected: `200` (401/403이면 읽기 경로에 인가가 잘못 들어간 것이다). 확인 후 dev 서버를 종료한다.

- [ ] **Step 6: 커밋**

```bash
git add lib/services/notice.ts __tests__/services/notice.test.ts
git commit -m "refactor: authorize notice writes via roles"
```

---

### Task 9: `threadBanService` 이관

**Files:**
- Modify: `lib/services/thread-ban.ts:1-4, 36-65, 160-167`
- Modify: `__tests__/services/thread-ban.test.ts`
- Modify: `app/api/boards/[boardId]/threads/[threadId]/bans/route.ts:89`

**Interfaces:**
- Consumes: `roleService`, `RoleService` from `@/lib/services/role` (Task 4)
- Produces: `ThreadBanServiceDeps`의 `permissionService`가 `roleService: RoleService`로 바뀐다. 공개 시그니처 변화 없음.

- [ ] **Step 1: 실패하는 테스트 작성**

`__tests__/services/thread-ban.test.ts`의 mock deps를 Task 6과 동일한 `createMockRoleService`로 교체하고 다음을 추가한다:

```ts
it("lets a board admin ban on their board", async () => {
  const roleService = createMockRoleService({
    canManageBoard: jest.fn().mockResolvedValue(true),
  });
  const threadRepository = createMockThreadRepository();
  threadRepository.findById.mockResolvedValue({ id: 1, boardId: "free" });
  const service = createThreadBanService({
    ...baseDeps,
    threadRepository,
    roleService,
  });

  await service.findByThreadId("u1", 1);

  expect(roleService.canManageBoard).toHaveBeenCalledWith("u1", "free");
});

it("forbids a user who does not manage the board", async () => {
  const threadRepository = createMockThreadRepository();
  threadRepository.findById.mockResolvedValue({ id: 1, boardId: "free" });
  const service = createThreadBanService({
    ...baseDeps,
    threadRepository,
    roleService: createMockRoleService({
      canManageBoard: jest.fn().mockResolvedValue(false),
    }),
  });

  await expect(service.findByThreadId("u1", 1)).rejects.toThrow(
    "Permission denied"
  );
});
```

메서드명과 인자는 기존 테스트 파일의 호출부를 그대로 따른다 (`thread-ban.ts:73`, `:99`, `:140`이 `checkPermissions`를 호출하는 세 메서드다).

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- --testPathPattern=thread-ban`
Expected: FAIL — `roleService`가 `ThreadBanServiceDeps`에 없다는 타입 에러

- [ ] **Step 3: `lib/services/thread-ban.ts` 교체**

`:1-4`의 임포트를 Task 6과 같은 형태로 교체한다. `ThreadBanServiceDeps`(`:38`)의 `permissionService: PermissionService;`를 `roleService: RoleService;`로, 구조분해(`:44`)를 `const { threadBanRepository, threadRepository, roleService } = deps;`로 바꾼다.

`checkPermissions`(`:54-64`)의 내부 판정만 교체한다. 이 헬퍼는 실패 시 던지는 형태이므로 구조를 유지한다:

```ts
  async function checkPermissions(userId: string, boardId: string): Promise<void> {
    const hasPermission = await roleService.canManageBoard(userId, boardId);
    if (!hasPermission) {
      throw new ThreadBanServiceError("Permission denied", "FORBIDDEN");
    }
  }
```

호출부 세 곳(`:73`, `:99`, `:140`)은 시그니처가 그대로이므로 수정하지 않는다.

싱글턴(`:165`)의 `permissionService: defaultPermissionService,`를 `roleService: defaultRoleService,`로 바꾼다.

- [ ] **Step 4: bans 라우트의 동적 import 교체**

`app/api/boards/[boardId]/threads/[threadId]/bans/route.ts:89` 부근에 `permissionService`를 동적 `import()`로 불러 `["response:delete", \`response:${thread.boardId}:delete\`]`를 체크하는 코드가 있다. 이를 교체한다:

```ts
const { roleService } = await import("@/lib/services/role");
const hasPermission = await roleService.canManageBoard(
  session.user.id,
  thread.boardId
);
```

동적 import 형태와 주변 분기 구조는 그대로 유지한다.

- [ ] **Step 5: 테스트 통과 확인**

Run: `npm test -- --testPathPattern=thread-ban`
Expected: PASS (모든 테스트)

- [ ] **Step 6: 커밋**

```bash
git add lib/services/thread-ban.ts __tests__/services/thread-ban.test.ts "app/api/boards/[boardId]/threads/[threadId]/bans/route.ts"
git commit -m "refactor: authorize thread bans via roles"
```

---

### Task 10: `userService` 이관과 롤 갱신 API

**Files:**
- Modify: `lib/services/user.ts`
- Modify: `lib/repositories/interfaces/user.ts`, `lib/repositories/prisma/user.ts`
- Create: `app/api/users/[userId]/roles/route.ts`
- Modify: `__tests__/services/user.test.ts`

**Interfaces:**
- Consumes: `roleService`, `RoleService` from `@/lib/services/role` (Task 4); `ROLE`, `isBoardAdminRole` from `@/lib/auth/roles` (Task 1)
- Produces:
  - `UserWithRoles.roles: string[]` (기존 `{ id, name }[]`에서 변경)
  - `userService.setRoles(requesterId: string, userId: string, roles: string[]): Promise<void>`
  - `userRepository.setRoles(userId: string, roles: string[]): Promise<void>`
  - `PATCH /api/users/[userId]/roles` — body `{ roles: string[] }`

- [ ] **Step 1: 실패하는 테스트 작성**

`__tests__/services/user.test.ts`의 mock deps에서 `permissionService`를 제거하고 Task 6과 동일한 `createMockRoleService`를 넣는다. 기존 `checkUserPermission` mock 설정을 `isAdmin`으로 바꾼다. 그리고 다음을 추가한다:

```ts
describe("setRoles", () => {
  it("forbids a non-admin", async () => {
    const service = createUserService({
      userRepository: createMockUserRepository(),
      roleService: createMockRoleService({ isAdmin: jest.fn().mockResolvedValue(false) }),
    });

    await expect(service.setRoles("u1", "u2", ["ADMIN"])).rejects.toThrow(
      "Permission denied"
    );
  });

  it("saves the roles for an admin", async () => {
    const userRepository = createMockUserRepository();
    userRepository.findById.mockResolvedValue({ id: "u2", roles: [] });
    const service = createUserService({
      userRepository,
      roleService: createMockRoleService({ isAdmin: jest.fn().mockResolvedValue(true) }),
    });

    await service.setRoles("admin", "u2", ["VERIFIED", "free:ADMIN"]);

    expect(userRepository.setRoles).toHaveBeenCalledWith("u2", [
      "VERIFIED",
      "free:ADMIN",
    ]);
  });

  it("rejects unknown role strings", async () => {
    const userRepository = createMockUserRepository();
    userRepository.findById.mockResolvedValue({ id: "u2", roles: [] });
    const service = createUserService({
      userRepository,
      roleService: createMockRoleService({ isAdmin: jest.fn().mockResolvedValue(true) }),
    });

    await expect(service.setRoles("admin", "u2", ["SUPERUSER"])).rejects.toThrow(
      "Invalid role"
    );
    expect(userRepository.setRoles).not.toHaveBeenCalled();
  });

  it("deduplicates roles", async () => {
    const userRepository = createMockUserRepository();
    userRepository.findById.mockResolvedValue({ id: "u2", roles: [] });
    const service = createUserService({
      userRepository,
      roleService: createMockRoleService({ isAdmin: jest.fn().mockResolvedValue(true) }),
    });

    await service.setRoles("admin", "u2", ["ADMIN", "ADMIN"]);

    expect(userRepository.setRoles).toHaveBeenCalledWith("u2", ["ADMIN"]);
  });

  it("rejects when the target user does not exist", async () => {
    const userRepository = createMockUserRepository();
    userRepository.findById.mockResolvedValue(null);
    const service = createUserService({
      userRepository,
      roleService: createMockRoleService({ isAdmin: jest.fn().mockResolvedValue(true) }),
    });

    await expect(service.setRoles("admin", "nope", ["ADMIN"])).rejects.toThrow(
      "User not found"
    );
  });

  it("prevents an admin from removing their own ADMIN role", async () => {
    const userRepository = createMockUserRepository();
    userRepository.findById.mockResolvedValue({ id: "admin", roles: ["ADMIN"] });
    const service = createUserService({
      userRepository,
      roleService: createMockRoleService({ isAdmin: jest.fn().mockResolvedValue(true) }),
    });

    await expect(service.setRoles("admin", "admin", ["VERIFIED"])).rejects.toThrow(
      "Cannot remove your own ADMIN role"
    );
  });
});
```

마지막 케이스는 마지막 관리자가 스스로를 잠가버리는 것을 막는다. 기존 `delete`의 자기 삭제 방지(`user.ts:160-162`)와 같은 성격의 가드다.

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- --testPathPattern=services/user`
Expected: FAIL — `setRoles`가 `UserService`에 없다는 타입 에러

- [ ] **Step 3: 리포지토리 교체**

`lib/repositories/interfaces/user.ts`의 `UserWithRoles`를 바꾸고 `setRoles`를 추가한다:

```ts
export interface UserWithRoles extends UserData {
  roles: string[];
}
```

```ts
export interface UserRepository {
  findAll(options?: {
    limit?: number;
    offset?: number;
    search?: string;
  }): Promise<UserWithRoles[]>;
  findAllWithCount(options?: {
    limit?: number;
    offset?: number;
    search?: string;
  }): Promise<FindAllWithCountResult>;
  findById(id: string): Promise<UserWithRoles | null>;
  count(search?: string): Promise<number>;
  setRoles(userId: string, roles: string[]): Promise<void>;
  delete(id: string): Promise<void>;
}
```

`lib/repositories/prisma/user.ts`에서 `findAll`, `findById`, `findAllWithCount` 세 곳의 `include: { userRoles: { include: { role: ... } } }`를 제거하고 `roles`를 직접 select 한다. `findAll` 예시:

```ts
    const users = await prisma.user.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: { id: "asc" },
      take: limit,
      skip: offset,
    });

    return users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      emailVerified: user.emailVerified,
      roles: user.roles,
    }));
```

`findById`와 `findAllWithCount`도 같은 방식으로 `include`를 제거하고 `roles: user.roles`로 매핑한다. `findAllWithCount`의 `prisma.$transaction([...])` 구조는 유지한다.

`setRoles`를 추가한다:

```ts
  async setRoles(userId: string, roles: string[]): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { roles },
    });
  },
```

- [ ] **Step 4: `lib/services/user.ts` 교체**

임포트(`:1-4`)를 교체하고 롤 상수를 들여온다:

```ts
import {
  roleService as defaultRoleService,
  RoleService,
} from "@/lib/services/role";
import { ROLE, isBoardAdminRole } from "@/lib/auth/roles";
```

`UserService`에 `setRoles`를 추가한다:

```ts
  setRoles(requesterId: string, userId: string, roles: string[]): Promise<void>;
```

`UserServiceDeps`와 구조분해, 싱글턴에서 `permissionService`를 `roleService`로 바꾼다:

```ts
interface UserServiceDeps {
  userRepository: UserRepository;
  roleService: RoleService;
}

export function createUserService(deps: UserServiceDeps): UserService {
  const { userRepository, roleService } = deps;
```

```ts
export const userService = createUserService({
  userRepository: defaultUserRepository,
  roleService: defaultRoleService,
});
```

`checkPermission`(`:53-64`)을 `requireAdmin`으로 교체하고, 호출부 `checkPermission(requesterId, "user:read" | "user:update" | "user:delete")` 전부(`:71`, `:91`, `:157`)를 `requireAdmin(requesterId)`로 바꾼다:

```ts
  async function requireAdmin(requesterId: string): Promise<void> {
    if (!(await roleService.isAdmin(requesterId))) {
      throw new UserServiceError("Permission denied", "FORBIDDEN");
    }
  }
```

`setRoles`를 구현한다:

```ts
    async setRoles(
      requesterId: string,
      userId: string,
      roles: string[]
    ): Promise<void> {
      await requireAdmin(requesterId);

      const invalid = roles.filter(
        (role) =>
          role !== ROLE.ADMIN &&
          role !== ROLE.VERIFIED &&
          !isBoardAdminRole(role)
      );
      if (invalid.length > 0) {
        throw new UserServiceError(`Invalid role: ${invalid[0]}`, "BAD_REQUEST");
      }

      const user = await userRepository.findById(userId);
      if (!user) {
        throw new UserServiceError("User not found", "NOT_FOUND");
      }

      const nextRoles = [...new Set(roles)];

      if (
        requesterId === userId &&
        user.roles.includes(ROLE.ADMIN) &&
        !nextRoles.includes(ROLE.ADMIN)
      ) {
        throw new UserServiceError(
          "Cannot remove your own ADMIN role",
          "BAD_REQUEST"
        );
      }

      await userRepository.setRoles(userId, nextRoles);

      invalidateCache(CACHE_TAGS.userRoles(userId));
    },
```

`delete`(`:172`)와 `deleteSelf`(`:184`)의 `invalidateCache(CACHE_TAGS.userPermissions(userId))`를 `CACHE_TAGS.userRoles(userId)`로 바꾼다.

- [ ] **Step 5: 테스트 통과 확인**

Run: `npm test -- --testPathPattern=services/user`
Expected: PASS (모든 테스트)

- [ ] **Step 6: `PATCH /api/users/[userId]/roles` 라우트 생성**

`app/api/users/[userId]/roles/route.ts`. 형태는 기존 라우트(예: `app/api/settings/route.ts`)의 세션 확인 / `validateOrigin` / `handleServiceError` 패턴을 따른다.

```ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { validateOrigin } from "@/lib/api/csrf";
import { userService, UserServiceError } from "@/lib/services/user";
import { handleServiceError } from "@/lib/api/error-handler";

const setRolesSchema = z.object({
  roles: z.array(z.string()),
});

// PATCH /api/users/[userId]/roles - 사용자 롤 일괄 저장
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const originError = validateOrigin(request);
  if (originError) return originError;

  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await params;
  const parsed = setRolesSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    await userService.setRoles(session.user.id, userId, parsed.data.roles);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof UserServiceError) {
      return handleServiceError(error);
    }
    throw error;
  }
}
```

`validateOrigin`의 정확한 반환 형태와 `params` 타입은 인접 라우트(`app/api/users/[userId]/route.ts`)를 열어 그대로 맞춘다.

- [ ] **Step 7: 빌드 확인**

Run: `npm test && npm run build`
Expected: 둘 다 통과. `UserWithRoles.roles` 타입 변경으로 `/admin/users` 화면에 타입 에러가 나면, 표시 로직을 `user.roles.join(", ")` 형태로 임시 조정한다. 롤 편집 UI는 Task 12에서 붙인다.

- [ ] **Step 8: 커밋**

```bash
git add -A
git commit -m "feat: manage user roles via User.roles column"
```

---

### Task 11: `foreign-ip-check`와 `write-lock-check` 이관

이 두 파일에는 테스트가 없었고, 그래서 `thread:edit` 버그(존재하지 않는 권한을 체크해 `all:all` 보유자만 통과)가 살아남았다. 이번에 테스트를 붙인다.

**Files:**
- Modify: `lib/api/foreign-ip-check.ts:6, 42-52`
- Modify: `lib/api/write-lock-check.ts:4, 15-24`
- Test: `__tests__/api/foreign-ip-check.test.ts`, `__tests__/api/write-lock-check.test.ts`

**Interfaces:**
- Consumes: `roleService` from `@/lib/services/role` (Task 4)
- Produces: `checkForeignIpBlocked(request, board)`, `checkWriteLocked(request, board)` — 시그니처 변화 없음

- [ ] **Step 1: 실패하는 테스트 작성**

`__tests__/api/write-lock-check.test.ts`:

```ts
import { NextRequest } from "next/server";
import { checkWriteLocked } from "@/lib/api/write-lock-check";
import { getServerSession } from "next-auth";
import { roleService } from "@/lib/services/role";

jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
jest.mock("@/lib/services/role", () => ({
  roleService: { canManageBoard: jest.fn() },
}));

const mockSession = getServerSession as jest.Mock;
const mockCanManageBoard = roleService.canManageBoard as jest.Mock;

const request = new NextRequest("http://localhost/api/test");
const lockedBoard = { id: "free", writeLocked: true } as never;
const openBoard = { id: "free", writeLocked: false } as never;

describe("checkWriteLocked", () => {
  beforeEach(() => jest.clearAllMocks());

  it("allows anyone when the board is not locked", async () => {
    await expect(checkWriteLocked(request, openBoard)).resolves.toBeNull();
  });

  it("blocks an anonymous writer on a locked board", async () => {
    mockSession.mockResolvedValue(null);

    const result = await checkWriteLocked(request, lockedBoard);

    expect(result?.status).toBe(403);
    await expect(result?.json()).resolves.toEqual({ error: "WRITE_LOCKED" });
  });

  it("allows a board admin on a locked board", async () => {
    mockSession.mockResolvedValue({ user: { id: "u1" } });
    mockCanManageBoard.mockResolvedValue(true);

    await expect(checkWriteLocked(request, lockedBoard)).resolves.toBeNull();
    expect(mockCanManageBoard).toHaveBeenCalledWith("u1", "free");
  });

  it("blocks a logged-in user who does not manage the board", async () => {
    mockSession.mockResolvedValue({ user: { id: "u1" } });
    mockCanManageBoard.mockResolvedValue(false);

    const result = await checkWriteLocked(request, lockedBoard);

    expect(result?.status).toBe(403);
  });
});
```

`__tests__/api/foreign-ip-check.test.ts`:

```ts
import { NextRequest } from "next/server";
import { checkForeignIpBlocked } from "@/lib/api/foreign-ip-check";
import { getServerSession } from "next-auth";
import { roleService } from "@/lib/services/role";
import { isForeignIp } from "@/lib/ip";

jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
jest.mock("@/lib/ip", () => ({ isForeignIp: jest.fn() }));
jest.mock("@/lib/services/global-settings", () => ({
  globalSettingsService: { getCountryCode: jest.fn().mockResolvedValue("KR") },
}));
jest.mock("@/lib/services/role", () => ({
  roleService: { isVerified: jest.fn() },
}));

const mockSession = getServerSession as jest.Mock;
const mockIsVerified = roleService.isVerified as jest.Mock;
const mockIsForeignIp = isForeignIp as jest.Mock;

const request = new NextRequest("http://localhost/api/test");
const blockingBoard = { id: "free", blockForeignIp: true } as never;
const openBoard = { id: "free", blockForeignIp: false } as never;

describe("checkForeignIpBlocked", () => {
  beforeEach(() => jest.clearAllMocks());

  it("allows when the board does not block foreign ips", async () => {
    await expect(checkForeignIpBlocked(request, openBoard)).resolves.toBeNull();
  });

  it("allows a domestic ip", async () => {
    mockIsForeignIp.mockReturnValue(false);

    await expect(checkForeignIpBlocked(request, blockingBoard)).resolves.toBeNull();
  });

  it("blocks an anonymous foreign ip", async () => {
    mockIsForeignIp.mockReturnValue(true);
    mockSession.mockResolvedValue(null);

    const result = await checkForeignIpBlocked(request, blockingBoard);

    expect(result?.status).toBe(403);
    await expect(result?.json()).resolves.toEqual({ error: "FOREIGN_IP_BLOCKED" });
  });

  it("allows a VERIFIED user from a foreign ip", async () => {
    mockIsForeignIp.mockReturnValue(true);
    mockSession.mockResolvedValue({ user: { id: "u1" } });
    mockIsVerified.mockResolvedValue(true);

    await expect(checkForeignIpBlocked(request, blockingBoard)).resolves.toBeNull();
    expect(mockIsVerified).toHaveBeenCalledWith("u1");
  });

  it("blocks a non-verified logged-in user from a foreign ip", async () => {
    mockIsForeignIp.mockReturnValue(true);
    mockSession.mockResolvedValue({ user: { id: "u1" } });
    mockIsVerified.mockResolvedValue(false);

    const result = await checkForeignIpBlocked(request, blockingBoard);

    expect(result?.status).toBe(403);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- --testPathPattern=api/`
Expected: FAIL — `roleService`에 `isVerified`/`canManageBoard` mock을 걸었으나 구현이 아직 `permissionService`를 호출한다

- [ ] **Step 3: `lib/api/write-lock-check.ts` 교체**

`:4`의 임포트를 `import { roleService } from "@/lib/services/role";`로 바꾸고, `:15-24`를 교체한다:

```ts
  const session = await getServerSession(authOptions);
  if (session) {
    const canManage = await roleService.canManageBoard(session.user.id, board.id);
    if (canManage) {
      return null;
    }
  }
```

- [ ] **Step 4: `lib/api/foreign-ip-check.ts` 교체**

`:6`의 임포트를 `import { roleService } from "@/lib/services/role";`로 바꾸고, `:42-52`를 교체한다:

```ts
  // VERIFIED(또는 ADMIN) 계정은 해외 IP 차단 면제
  const session = await getServerSession(authOptions);
  if (session) {
    const verified = await roleService.isVerified(session.user.id);
    if (verified) {
      return null;
    }
  }
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `npm test -- --testPathPattern=api/`
Expected: PASS (두 파일 모든 테스트)

- [ ] **Step 6: 커밋**

```bash
git add lib/api/write-lock-check.ts lib/api/foreign-ip-check.ts __tests__/api/
git commit -m "fix: authorize write lock and foreign ip bypass via roles"
```

---

### Task 12: 어드민 페이지와 사이드바 이관

**Files:**
- Modify: `app/admin/layout.tsx:17`
- Modify: `app/admin/boards/page.tsx:13-14`, `app/admin/users/page.tsx:18-19`, `app/admin/notices/page.tsx:19-21`, `app/admin/settings/page.tsx:13`
- Modify: `app/admin/boards/[boardId]/threads/page.tsx:24-29`, `app/admin/boards/[boardId]/responses/page.tsx:39-44`, `app/admin/boards/[boardId]/notices/page.tsx:24-33`
- Modify: `components/sidebar/AdminSidebar.tsx`
- Modify: `app/page.tsx:19`, `app/settings/page.tsx:19`, `app/manual/page.tsx:22`, `app/index/[boardId]/page.tsx:56`, `app/index/[boardId]/create/page.tsx:28`, `app/notice/[boardId]/page.tsx:42`, `app/notice/[boardId]/[noticeId]/page.tsx:48`, `app/trace/[boardId]/[threadId]/[[...range]]/page.tsx:110-120`
- Modify: `app/api/settings/route.ts:17, 42`, `app/api/admin/cache/route.ts:14`, `app/api/admin/boards/[boardId]/responses/route.ts:23-24`, `app/api/boards/[boardId]/fix-count/route.ts:23-24`, `app/api/boards/[boardId]/threads/route.ts:32`, `app/api/boards/[boardId]/threads/[threadId]/route.ts:30`, `app/api/boards/[boardId]/threads/[threadId]/responses/route.ts:63`

**Interfaces:**
- Consumes: `roleService` from `@/lib/services/role` (Task 4); `userService.setRoles` and `PATCH /api/users/[userId]/roles` (Task 10)
- Produces: `AdminSidebar`가 `isAdmin: boolean` prop을 받는다

- [ ] **Step 1: 남은 permissionService 호출부 목록화**

Run: `grep -rn --include='*.ts' --include='*.tsx' 'permissionService\|checkUserPermission' app components proxy.ts`
Expected: 위 Files 목록의 파일들. 이 태스크에서 전부 없앤다.

- [ ] **Step 2: `/admin` 게이트 교체**

`app/admin/layout.tsx:17`의 `admin:read` 체크를 교체한다. ADMIN이거나 보드 어드민이 하나라도 있으면 통과한다:

```ts
const managed = await roleService.listManagedBoardIds(session.user.id);
if (managed !== "all" && managed.length === 0) {
  redirect("/?error=forbidden");
}
```

기존 세션 확인과 리다이렉트 경로는 유지한다. 임포트를 `import { roleService } from "@/lib/services/role";`로 교체한다.

- [ ] **Step 3: 사이드바를 롤 기반으로 교체**

`components/sidebar/AdminSidebar.tsx`의 `AdminSidebarProps`에 `isAdmin: boolean`을 추가한다. 게시판 관리는 `/admin` 진입 자체가 이미 걸러졌으므로 항상 표시한다. 사용자 관리·전역 공지·전역 설정은 셋 다 ADMIN 전용이므로 하나의 조건으로 묶는다.

```tsx
{isAdmin && (
  <>
    <NavItem>
      <NavLink href="/admin/users" $active={pathname.startsWith("/admin/users")}>
        {labels.users}
      </NavLink>
    </NavItem>
    <NavItem>
      <NavLink href="/admin/notices" $active={pathname.startsWith("/admin/notices")}>
        {labels.notices}
      </NavLink>
    </NavItem>
    <NavItem>
      <NavLink href="/admin/settings" $active={pathname.startsWith("/admin/settings")}>
        {labels.settings}
      </NavLink>
    </NavItem>
  </>
)}
```

기존 `labels.X &&` 조건은 제거한다 — 라벨은 항상 전달되므로 조건으로 쓸 수 없다. `$active` prop의 정확한 형태는 기존 `/admin/boards` `NavLink`(`AdminSidebar.tsx:27-33`)를 그대로 따른다.

호출부 네 곳(`app/admin/boards/page.tsx`, `app/admin/users/page.tsx`, `app/admin/settings/page.tsx`, `app/admin/notices/page.tsx`)에서 `const isAdmin = await roleService.isAdmin(session.user.id);`를 계산해 `isAdmin={isAdmin}`으로 넘긴다.

- [ ] **Step 4: ADMIN 전용 페이지 게이트 교체**

각 페이지에서 `permissionService.checkUserPermission(...)` 호출을 `roleService.isAdmin(userId)`로 바꾼다.

- `app/admin/users/page.tsx:18-19` — `user:update`/`user:delete` → `isAdmin` 하나. 비-ADMIN이면 `redirect("/admin/boards")`.
- `app/admin/notices/page.tsx:19-21` — `notice:create|update|delete` → `isAdmin` 하나. 비-ADMIN이면 `redirect("/admin/boards")`.
- `app/admin/settings/page.tsx:13` — `all:all` → `isAdmin`. 비-ADMIN이면 `redirect("/admin/boards")`.
- `app/admin/boards/page.tsx:13-14` — `board:create`/`board:update` → `canCreate = await roleService.isAdmin(userId)`. 이 값을 생성 버튼과 카드별 삭제 버튼 표시에 쓴다. 보드 카드 목록은 `boardService.findAllWithThreadCount(userId)`가 이미 Task 5에서 필터링하므로 추가 작업이 없다.

`redirect`를 새로 넣는 세 페이지는 `import { redirect } from "next/navigation";`이 이미 있는지 확인하고 없으면 추가한다.

- [ ] **Step 5: 보드 하위 어드민 페이지 게이트 교체**

세 페이지 모두 `boardId`를 이미 params로 받는다. 전역/보드별 권한 쌍 체크를 `canManageBoard` 하나로 바꾸고, 실패 시 `redirect("/admin/boards")`를 추가한다.

```ts
const canManage = await roleService.canManageBoard(session.user.id, boardId);
if (!canManage) {
  redirect("/admin/boards");
}
```

- `app/admin/boards/[boardId]/threads/page.tsx:24-29` — `canEdit`/`canDelete` 두 flag를 계산하던 네 번의 체크를 위 한 번으로 대체하고, 기존에 두 flag를 받던 컴포넌트에는 `canManage`를 동일하게 넘긴다. (여기서 `thread:edit` 죽은 문자열이 사라진다.)
- `app/admin/boards/[boardId]/responses/page.tsx:39-44` — 동일.
- `app/admin/boards/[boardId]/notices/page.tsx:24-33` — 동일.

- [ ] **Step 6: 공개 페이지의 `canAccessAdmin` 교체**

`app/page.tsx:19`, `app/settings/page.tsx:19`, `app/manual/page.tsx:22`, `app/index/[boardId]/page.tsx:56`, `app/index/[boardId]/create/page.tsx:28`, `app/notice/[boardId]/page.tsx:42`, `app/notice/[boardId]/[noticeId]/page.tsx:48`는 TopBar의 관리자 버튼 표시용으로 `admin:read`를 체크한다. 이를 `/admin` 게이트와 같은 판정으로 바꾼다:

```ts
const managed = await roleService.listManagedBoardIds(session.user.id);
const canAccessAdmin = managed === "all" || managed.length > 0;
```

세션이 없는 경우 기존 코드가 `canAccessAdmin`을 `false`로 두는 분기를 유지한다.

`app/trace/[boardId]/[threadId]/[[...range]]/page.tsx:110-120`은 `canAccessAdmin`(위와 동일)과 `response:delete`/`response:${boardId}:delete`(`:116`, `:120`)를 함께 본다. 후자는 `await roleService.canManageBoard(session.user.id, boardId)` 하나로 바꾼다.

- [ ] **Step 7: API 라우트 게이트 교체**

- `app/api/settings/route.ts:17` (GET, `admin:read`) → `roleService.isAdmin(session.user.id)`. 전역 설정 조회는 ADMIN 전용이다.
- `app/api/settings/route.ts:42` (PUT, `all:all`) → `roleService.isAdmin(session.user.id)`
- `app/api/admin/cache/route.ts:14` (`all:all`) → `roleService.isAdmin(session.user.id)`
- `app/api/admin/boards/[boardId]/responses/route.ts:23-24` → `roleService.canManageBoard(session.user.id, boardId)`
- `app/api/boards/[boardId]/fix-count/route.ts:23-24` → `roleService.canManageBoard(session.user.id, boardId)`
- `app/api/boards/[boardId]/threads/route.ts:32` → `roleService.canManageBoard(session.user.id, boardId)`
- `app/api/boards/[boardId]/threads/[threadId]/route.ts:30` → `roleService.canManageBoard(session.user.id, boardId)`
- `app/api/boards/[boardId]/threads/[threadId]/responses/route.ts:63` → `roleService.canManageBoard(session.user.id, boardId)`

각 라우트의 401/403 응답 형태와 세션 확인 분기는 그대로 유지한다. `boardId`가 params에 없는 라우트는 없다 — 위 목록의 보드 범위 라우트는 전부 `[boardId]` 세그먼트를 가진다.

- [ ] **Step 8: `/admin/users` 롤 편집 UI 추가**

Task 2에서 제거했던 롤 UI 자리에 새 UI를 붙인다. 서버 컴포넌트에서 보드 목록을 가져와 클라이언트로 넘긴다:

```ts
const boards = await boardService.findAll();
```

클라이언트 컴포넌트에서 사용자마다 다음을 렌더링한다.

- `ADMIN` 체크박스, `VERIFIED` 체크박스
- 보드별 어드민 체크박스 목록 (`boards.map`, 값은 `boardAdminRole(board.id)`)

저장 시 선택된 롤 배열 전체를 `PATCH /api/users/${userId}/roles`에 `{ roles }`로 보낸다. `boardAdminRole`을 `@/lib/auth/roles`에서 임포트해 문자열을 손으로 조립하지 않는다.

403/400 응답은 기존 사용자 목록 화면의 에러 표시 패턴을 따른다. 성공 시 `router.refresh()`로 목록을 갱신한다.

번역 키가 필요하면 `lib/i18n/messages/{ko,en,ja}.json`의 `adminUsers` 네임스페이스에 추가한다.

- [ ] **Step 9: 테스트와 빌드 확인**

Run: `npm test && npm run build`
Expected: 둘 다 통과

- [ ] **Step 10: 커밋**

```bash
git add -A
git commit -m "feat: gate admin UI by roles and add role editor"
```

---

### Task 13: `proxy.ts` 어드민 게이트 제거

**Files:**
- Modify: `proxy.ts:5-8, 22-75`
- Delete: `app/api/permissions/route.ts`

**Interfaces:**
- Consumes: 없음
- Produces: 없음

`proxy.ts`의 `/admin` 게이트는 `/api/permissions`를 self-fetch 한다 — 네비게이션마다 자기 서버로 HTTP 왕복을 하면서 `app/admin/layout.tsx`가 이미 하는 일을 중복한다. 실제 방어는 layout과 서비스 레이어가 하므로 제거한다.

- [ ] **Step 1: `/api/permissions`의 다른 소비자가 없는지 확인**

Run: `grep -rn --include='*.ts' --include='*.tsx' 'api/permissions\|usePermissions' app lib components proxy.ts`
Expected: `proxy.ts`와 `app/api/permissions/route.ts` 두 곳만. 다른 소비자가 나오면 이 태스크를 멈추고 그 소비자를 먼저 처리한다.

- [ ] **Step 2: `proxy.ts`에서 어드민 게이트 제거**

`adminRoutes` 상수와 그것을 쓰는 분기(권한 fetch, 권한 판정, 리다이렉트, `catch`)를 전부 제거한다. `protectedRoutes = ["/dashboard"]`의 인증 리다이렉트는 유지한다.

`matcher`(`:74`)에서 `/admin/:path*`를 제거한다:

```ts
export const config = {
  matcher: ["/dashboard/:path*"],
};
```

`/api`, `/_next`, 확장자 포함 경로를 건너뛰는 로직(`:13-20`)은 유지한다.

- [ ] **Step 3: `/api/permissions` 삭제**

```bash
git rm -r app/api/permissions
```

- [ ] **Step 4: 어드민 게이트가 여전히 동작하는지 확인**

Run: `npm run dev` 후 다른 터미널에서:
```bash
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' http://localhost:3000/admin/boards
```
Expected: 비로그인 상태에서 리다이렉트(`307`/`302`)가 나오고 `/admin` 콘텐츠가 응답 본문에 없어야 한다. `app/admin/layout.tsx`의 세션 확인이 이를 처리한다. 확인 후 dev 서버를 종료한다.

- [ ] **Step 5: 테스트와 빌드 확인**

Run: `npm test && npm run build`
Expected: 둘 다 통과

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "refactor: drop proxy admin gate and permissions endpoint"
```

---

### Task 14: `permissionService` 제거와 최종 정리

**Files:**
- Delete: `lib/services/permission.ts`, `__tests__/services/permission.test.ts`
- Delete: `lib/repositories/interfaces/permission.ts`, `lib/repositories/prisma/permission.ts`
- Modify: `lib/cache.ts` — `userPermissions` 태그 제거
- Modify: `CLAUDE.md`

**Interfaces:**
- Consumes: 없음
- Produces: 없음

- [ ] **Step 1: 파일 삭제**

```bash
git rm lib/services/permission.ts __tests__/services/permission.test.ts
git rm lib/repositories/interfaces/permission.ts lib/repositories/prisma/permission.ts
```

- [ ] **Step 2: `lib/cache.ts`에서 `userPermissions` 제거**

Task 1에서 남겨둔 두 줄을 지우고 `userRoles`만 남긴다:

```ts
  // User roles
  userRoles: (userId: string) => `roles-${userId}`,
```

- [ ] **Step 3: 남은 참조가 없는지 확인**

삭제를 먼저 한 뒤 grep 한다 — 삭제 대상 파일 자신이 결과에 잡히지 않게 하기 위함이다.

```bash
grep -rn --include='*.ts' --include='*.tsx' 'permissionService\|checkUserPermission\|userPermissions\|services/permission\|repositories/prisma/permission\|repositories/interfaces/permission\|all:all\|admin:read\|foreign:write\|thread:edit\|board:read' app lib components __tests__ proxy.ts
```
Expected: 결과 없음. 나오는 게 있으면 그 파일을 정리한 뒤 계속한다.

- [ ] **Step 4: 테스트와 빌드 확인**

Run: `npm test && npm run build`
Expected: 둘 다 통과

- [ ] **Step 5: `CLAUDE.md` 갱신**

다음 섹션을 수정한다.

- **Key Directories** — `lib/services/`의 나열에서 `permission`을 빼고 `role`을 넣는다. `lib/auth/roles.ts` 언급을 추가한다.
- **Conventions** — `Permission check` 항목을 교체한다: ``Role check - Use `roleService.isAdmin(userId)` / `roleService.canManageBoard(userId, boardId)` from `@/lib/services/role` ``
- **Authentication & Authorization** — RBAC 설명을 교체한다:
  ```
  - 코드 기반 롤 (`lib/auth/roles.ts`), `User.roles` 칼럼에 문자열 배열로 저장
  - `ADMIN` - 시스템 어드민, 전체 권한
  - `VERIFIED` - 인증 계정, 해외 IP 차단 면역
  - `{boardId}:ADMIN` - 게시판 어드민. 게시판 삭제를 제외한 해당 게시판 관리
  - 롤 부여는 ADMIN 전용 (`/admin/users`)
  - First-time setup at `/setup` creates initial admin
  ```
  `Protected routes (/admin, /dashboard) redirect...` 줄에서 `/admin`을 뺀다 — proxy 게이트가 사라졌고 `/admin`은 layout이 처리한다.
- **Permissions** 섹션 전체를 삭제한다.
- **Authorization Rules** 표는 유지한다 (Response 삭제의 권한-또는-비밀번호 규칙은 그대로다).
- **Foreign IP Blocking** — `foreign:write 권한 있으면 차단 우회`를 `VERIFIED 롤이 있으면 차단 우회`로 바꾼다.
- **Board System** — `blockForeignIp` 설명의 `foreign:write 권한 있으면 허용`을 `VERIFIED 롤이면 허용`으로, `writeLocked` 설명의 `thread:edit 권한 있으면 허용`을 `ADMIN 또는 해당 게시판 어드민이면 허용`으로 바꾼다.
- **API Endpoints** — `GET /api/permissions` 줄과 `Roles` 하위의 역할 CRUD 줄들을 삭제한다. `POST/DELETE /api/users/[userId]/roles`를 `PATCH /api/users/[userId]/roles - 롤 일괄 저장 (ADMIN)`으로 바꾼다.
- **Caching** — Tags 나열에서 `permissions-{userId}`를 `roles-{userId}`로 바꾼다.

- [ ] **Step 6: 수동 검증**

Run: `npm run dev`

DB에서 자기 계정에 롤을 넣어가며 확인한다:

```sql
UPDATE "User" SET roles = ARRAY['ADMIN'] WHERE email = '<your-email>';
```

- ADMIN으로 `/admin` 접속 → 게시판/사용자/전역 공지/전역 설정 메뉴가 모두 보이고, 역할 관리 메뉴는 없다
- `/admin/users`에서 다른 계정에 `VERIFIED`와 특정 보드의 어드민 롤을 부여할 수 있다

```sql
UPDATE "User" SET roles = ARRAY['<board-id>:ADMIN'] WHERE email = '<your-email>';
```

- 보드 어드민으로 `/admin` 접속 → 게시판 관리만 보인다
- `/admin/boards`에 자신이 어드민인 게시판 카드만 보이고, 게시판 생성/삭제 버튼이 없다
- 그 게시판의 스레드/응답/공지 관리와 카운터 교정이 동작한다
- 다른 게시판의 `/admin/boards/<other-id>/threads`로 직접 접근하면 `/admin/boards`로 리다이렉트된다

```sql
UPDATE "User" SET roles = ARRAY[]::TEXT[] WHERE email = '<your-email>';
```

- 롤이 없는 계정으로 `/admin` 접속 → `/?error=forbidden`으로 리다이렉트된다
- 로그아웃 상태에서 `/api/notices`가 200을 반환한다

확인 후 dev 서버를 종료한다.

- [ ] **Step 7: 커밋**

```bash
git add -A
git commit -m "refactor: remove permission service and document code-based roles"
```

---

## Phase 2 (별도 작업, 이 계획에 포함되지 않음)

운영에서 문제 없음이 확인된 뒤 진행한다.

- `prisma/schema.prisma`에서 `Role`, `Permission`, `UserRole`, `RolePermission` 모델과 `User.userRoles` 관계 제거
- 해당 마이그레이션 생성 및 적용
