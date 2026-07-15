# 코드 기반 롤 시스템 설계

- 작성일: 2026-07-15
- 상태: 승인됨

## 배경

현재 인가 시스템은 `User → UserRole → Role → RolePermission → Permission` 5개 테이블의 RBAC이다. 권한은 DB에 문자열로 저장되고, 보드 생성 시 보드별 권한 9개(`board:{id}:update`, `thread:{id}:delete` 등)가 자동 생성된다.

이 구조는 실제 필요보다 복잡하다. 운영상 구분되는 주체는 시스템 어드민, 게시판 어드민, 인증 계정 세 종류뿐인데, 권한 문자열이 40개 이상 존재하고 호출부마다 전역/보드별 권한 쌍을 넘긴다. 문자열 매칭이라 오타가 조용히 통과하고, 실제로 통과하지 못하는 버그가 살아 있다(아래 참조).

이 설계는 롤을 DB가 아닌 코드 상수로 옮기고, 권한 개념을 제거한다.

## 현행 시스템의 알려진 결함

이 설계가 해소하는 기존 버그들이다. 구현 시 회귀 여부 확인용으로 기록한다.

1. **`thread:edit`는 존재하지 않는 권한이다.** `lib/api/write-lock-check.ts:17`과 `app/admin/boards/[boardId]/threads/page.tsx:24`가 이를 체크하나, 생성되는 것은 `thread:update`뿐이다. 결과적으로 `writeLocked` 게시판에는 `all:all` 보유자만 글을 쓸 수 있다.
2. **`board:{boardId}:delete`는 생성되지만 아무도 읽지 않는다.** 보드 삭제는 `board:update` 계열로만 막혀 있어, 보드 수정 권한자가 곧 삭제 권한자다.
3. **보드 생성과 권한 생성이 원자적이지 않다** (`board.ts:143-144`). 실패 시 권한 없는 보드가 남는다.
4. **`noticeService.findGlobal`은 인가 체크가 없다** (`app/admin/notices/page.tsx:23`). `admin:read` 레이아웃 게이트에만 의존한다.
5. **어드민 사이드바의 조건부 렌더링이 죽어 있다.** `labels.roles && ...` 형태로 권한이 아닌 라벨 존재만 확인하는데, 호출부 5곳이 라벨을 무조건 전부 넘긴다.
6. **`/setup` 부트스트랩은 check-then-act 경쟁 조건이다.** 동시 요청 시 둘 다 통과할 수 있고, 시드와 롤 바인딩이 트랜잭션이 아니다.

1, 2, 5는 본 설계로 해소된다. 3은 보드별 권한 생성 자체가 사라져 소멸한다.

4는 `noticeService.findGlobal`에 `userId`를 받아 `isAdmin`을 요구하도록 고친다 — 어차피 전역 공지가 ADMIN 전용이 되면서 손대는 코드다.

6의 경쟁 조건은 이번 범위 밖으로 둔다. `/setup`은 최초 1회 부트스트랩이고 동시 요청 가능성이 현실적으로 낮으며, 이를 고치려면 트랜잭션 경계 설계가 별도로 필요하다. `/setup`의 판정 로직 자체는 `roles` 기반으로 바뀌지만 check-then-act 구조는 그대로 유지된다.

## 롤 정의

롤은 `lib/auth/roles.ts`에 정의하는 코드 상수다. DB에 롤 정의 테이블은 두지 않는다.

| 롤 | 의미 |
|---|---|
| `ADMIN` | 시스템 어드민. 전체 권한 |
| `VERIFIED` | 인증 계정. 해외 IP 차단 면역 |
| `{boardId}:ADMIN` | 해당 게시판 어드민 |

```ts
export const ROLE = { ADMIN: "ADMIN", VERIFIED: "VERIFIED" } as const;
export const boardAdminRole = (boardId: string) => `${boardId}:ADMIN`;
```

보드 어드민 롤 문자열은 보드 ID에서 즉석 계산한다. 보드 생성 시 심는 것은 없다. 보드가 삭제되면 해당 롤은 가리키는 대상이 없어 무력해지고, 복구하면 다시 유효해진다.

VERIFIED는 ADMIN이 수동 부여한다. 자동 부여 조건(이메일 인증, 가입 경과 등)은 이번 범위 밖이다.

## 데이터 모델

Phase 1에서는 `User`에 칼럼 하나만 추가한다. 기존 4개 테이블은 남기되 코드에서 아무도 읽지 않는다.

```prisma
model User {
  // ...기존 필드
  roles     String[]   @default([])
  userRoles UserRole[] // Phase 2에서 제거
}
```

기존 데이터 이관은 이 설계의 범위가 아니다. 운영자가 DB에서 직접 `roles`를 채운다.

Phase 2(별도 작업)에서 `Role`, `Permission`, `UserRole`, `RolePermission` 테이블과 관련 리포지토리를 드롭한다.

## 판정 서비스

`lib/services/role.ts`가 유일한 인가 진입점이다. 기존 `lib/services/permission.ts`와 기존 Role CRUD 서비스를 대체한다.

```ts
getUserRoles(userId): Promise<string[]>
isAdmin(userId): Promise<boolean>                  // ADMIN
isVerified(userId): Promise<boolean>               // ADMIN || VERIFIED
canManageBoard(userId, boardId): Promise<boolean>  // ADMIN || `${boardId}:ADMIN`
listManagedBoardIds(userId): Promise<string[] | "all">
```

조회는 현행과 동일하게 DB 1회 + 태그 캐시(`cached(fn, ["roles", userId], [CACHE_TAGS.userRoles(userId)])`)다. 캐시 태그는 `permissions-{userId}`에서 `roles-{userId}`로 이름을 바꾼다. TTL 없이 태그 무효화만 사용하는 현행 방식을 유지하며, 롤 변경 시 해당 태그를 무효화한다.

`userId`가 없으면(비로그인) 모든 술어가 `false`를 반환한다. 호출부에서 널 체크를 반복하지 않기 위함이다.

`listManagedBoardIds`는 ADMIN에 대해 `"all"`을 반환한다. 보드 ID 목록을 만들어 넘기면 보드가 늘어날 때마다 커지는 무의미한 필터가 되기 때문이다.

## 호출부 매핑

기존 호출부 전부가 네 술어 중 하나로 접힌다.

| 대상 | 기존 | 신규 |
|---|---|---|
| `/admin` 진입, 어드민 사이드바 | `admin:read` | `isAdmin` 또는 보드 어드민 1개 이상 |
| 스레드/응답 수정·삭제, ThreadBan, 카운터 교정, 보드 설정 수정, `writeLocked` 우회 | `thread:*`, `response:*`, `board:*` 전역/보드별 쌍 | `canManageBoard(userId, boardId)` |
| 보드 공지 CRUD | `notice:{boardId}:*` | `canManageBoard(userId, boardId)` |
| 보드 생성, 보드 삭제, 전역 공지, 사용자·롤 관리, 전역 설정, 캐시 무효화 | `board:create`, `board:update`, `notice:*`, `user:*`, `role:*`, `all:all` | `isAdmin(userId)` |
| 해외 IP 우회 | `foreign:write` | `isVerified(userId)` |

### 보드 삭제

보드 삭제는 별도 경로가 아니라 `boardService.update()`에 `deleted: true`를 실어 보내는 방식이다(`board.ts:162-178`). 보드 어드민에게 수정은 허용하고 삭제는 막기 위해, `update()` 내부에서 `data.deleted`가 포함된 경우에만 `isAdmin`을 추가로 요구한다.

### 보드 목록 조회

`boardService.findAllWithThreadCount(userId)`는 현재 `board:read`를 요구한다(`board.ts:109-112`). 이 권한은 사라지므로 다음과 같이 분리한다.

- 어드민 화면: `listManagedBoardIds` 결과로 필터링
- 공개 화면(사이드바 보드 목록): 인가 체크 없이 전부 반환

## 삭제되는 것

- `lib/services/permission.ts`, `lib/services/seed.ts`
- `permissionRepository` 및 보드별 권한 생성/소프트삭제 연동 (`board.ts:54-97`, `board.ts:172-178`)
- `/admin/roles` 페이지, 역할 CRUD API (`/api/roles/*`)
- `/api/permissions` 엔드포인트 (소비자 소멸)
- `proxy.ts`의 어드민 게이트 (아래 참조)

## UI 변경

### 어드민 사이드바

실제 롤 기반 조건부 렌더링으로 교체한다.

| 메뉴 | ADMIN | 보드 어드민 |
|---|---|---|
| 게시판 관리 | O | O |
| 사용자 관리 | O | X |
| 전역 공지 | O | X |
| 전역 설정 | O | X |
| 역할 관리 | 페이지 삭제 | 페이지 삭제 |

### `/admin/boards`

`listManagedBoardIds`로 카드를 필터링한다. 보드 어드민에게는 게시판 생성 버튼과 카드별 삭제 버튼을 숨긴다. 보드 상세 하위(스레드/응답/공지/설정)는 `canManageBoard` 통과 시 그대로 열린다.

### `/admin/users`

롤 부여 UI가 여기로 통합된다. ADMIN만 접근 가능하다. 사용자별로 `ADMIN`·`VERIFIED` 토글과 보드 어드민 부여(보드 선택 → `{boardId}:ADMIN` 추가/제거)를 제공한다.

롤 갱신 API는 `PATCH /api/users/[userId]/roles`로 `{ roles: string[] }`를 통째로 저장한다. 기존 `POST`/`DELETE` 역할 부여·해제 엔드포인트를 대체한다.

보드 어드민은 롤을 부여할 수 없다. 롤 부여는 ADMIN 전용이다.

### `proxy.ts`

현재 `/api/permissions`를 self-fetch해 `admin:read`를 확인한다. 이 HTTP 왕복은 `app/admin/layout.tsx`의 체크와 완전히 중복이며 네비게이션마다 네트워크 요청을 발생시킨다. 실제 방어는 layout과 서비스 레이어가 수행하므로, proxy의 어드민 게이트를 제거하고 layout에 맡긴다. `/dashboard` 인증 리다이렉트는 유지한다.

## 에러 처리

기존 패턴을 유지한다. 서비스는 인가 실패 시 `ServiceError`를 `FORBIDDEN` 코드로 던지고, API 라우트가 `handleServiceError()`로 403에 매핑한다. 페이지는 `app/admin/layout.tsx`에서 `/?error=forbidden`으로 리다이렉트한다.

새로 추가되는 것은 보드 삭제 경로의 `FORBIDDEN`뿐이다.

## `/setup` 부트스트랩

판정이 "ADMIN 역할에 사용자가 있는가"에서 "`roles`에 `ADMIN`을 가진 User가 존재하는가"로 바뀐다. `/setup/complete`는 `seedDefaultData()` 호출 대신 현재 사용자의 `roles`에 `ADMIN`을 추가한다.

## 테스트

### `__tests__/services/role.test.ts`

기존 `permission.test.ts`를 대체한다. `cached`를 pass-through로 목킹한다. 필수 케이스:

- 비로그인(`userId` 없음)은 모든 술어가 `false`
- `VERIFIED`만 보유한 사용자는 `canManageBoard`가 `false`
- `ADMIN`은 임의의 `boardId`에 대해 `canManageBoard`가 `true`
- `boardA:ADMIN` 보유자는 `boardB`에 대해 `false`
- `listManagedBoardIds`가 ADMIN에 대해 `"all"` 반환

### 기존 서비스 테스트 갱신

`board`, `thread`, `response`, `notice`, `thread-ban` 테스트는 `permissionService` 목킹을 `roleService` 목킹으로 교체한다. 보드 삭제 케이스를 추가한다 — 보드 어드민의 `update({ deleted: true })`는 `FORBIDDEN`, 일반 필드 수정은 통과.

### 신규 테스트

`foreign-ip-check.ts`와 `write-lock-check.ts`에는 현재 테스트가 없다. `thread:edit` 버그가 살아남은 원인이기도 하다. 두 파일의 판정이 모두 바뀌므로 최소 테스트를 추가한다.

- `VERIFIED`가 해외 IP 차단을 통과한다
- 보드 어드민이 `writeLocked` 게시판에 쓸 수 있다

### 삭제

`__tests__/services/permission.test.ts`, 기존 Role CRUD 테스트, seed 관련 테스트.

## 범위 밖

- 기존 Role/Permission 데이터의 코드 롤로의 이관 (운영자가 DB에서 직접 수행)
- Phase 2 테이블 드롭
- 게시판별 "VERIFIED 계정만 쓰기 가능" 옵션 (후속 작업)
- VERIFIED 자동 부여 조건
