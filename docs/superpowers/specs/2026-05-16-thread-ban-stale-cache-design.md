# Thread-ban stale cache fix

## Bug

스레드 차단(ThreadBan) 적용/해제 후 1-request lag가 발생한다.

- 차단 직후: 차단된 사용자가 **1번은 글을 작성할 수 있음**
- 해제 직후: 첫 번째 작성 요청은 여전히 차단으로 실패하고, 두 번째 요청부터 성공

## 원인

`lib/services/thread-ban.ts`의 `isBanned()`가 `unstable_cache`(`lib/cache.ts`의 `cached()`)로 래핑되어 있고, ban 생성/삭제 시 `invalidateCache(CACHE_TAGS.bans(threadId))` → 내부적으로 `revalidateTag()`를 호출한다.

Next.js의 `revalidateTag`는 즉시 캐시를 비우는 것이 아니라 "다음 요청에서 재검증" 마킹만 수행한다(stale-while-revalidate). 따라서:

1. 차단/해제 직후 첫 POST → stale한 캐시 값(false 또는 true) 반환
2. 그 요청이 처리되는 동안 재검증 트리거
3. 두 번째 POST부터 정상 동작

이로 인해 모더레이션 결과가 1 요청만큼 항상 늦게 반영된다.

## 해결: `isBanned`에서 캐시 제거 (Option A)

`lib/services/thread-ban.ts`의 `isBanned()`에서 `cached()` 래퍼를 제거하고 `threadBanRepository.isBanned()`를 직접 호출한다.

### 근거

- **정확성**: 차단 체크는 보안·모더레이션 직결 경로다. stale data를 허용해선 안 된다.
- **비용**: `(threadId, authorId)` 인덱스 lookup은 매우 가볍다. 매 POST마다 1회 수행해도 부담이 없다.
- **캐시 효용 자체가 작음**: 캐시 키가 `["thread-ban", threadId, authorId]`로 authorId별 분리되어, 같은 authorId가 같은 스레드에 반복 작성할 때만 적중한다. 익명 IP·날짜 기반 authorId 특성상 적중률이 낮다.
- **무효화 경로도 단순화**: `createBans`/`createBansDirect`/`deleteBan`/`deleteBanDirect`에서 호출하던 `invalidateCache(CACHE_TAGS.bans(threadId))`도 함께 제거. `CACHE_TAGS.bans`는 `thread-ban.ts` 내부에서만 참조되므로(코드베이스 grep 확인) `lib/cache.ts`에서도 제거 가능.

### 변경 범위

| 파일 | 변경 |
|------|------|
| `lib/services/thread-ban.ts` | `isBanned()`에서 `cached()` 래퍼 제거(repo 직접 호출). 4곳의 `invalidateCache(CACHE_TAGS.bans(...))` 제거. `cached`, `invalidateCache`, `CACHE_TAGS` import 정리. |
| `lib/cache.ts` | `CACHE_TAGS.bans` 엔트리 제거. |

### 변경하지 않는 것

- `isBanned`의 시그니처, 호출자(`responses/route.ts:211`)는 그대로.
- 다른 캐시 태그나 무효화 로직은 영향 없음.
- DB 인덱스, 스키마 변경 없음.

## 검증

호출자가 단 한 곳(`app/api/boards/[boardId]/threads/[threadId]/responses/route.ts:211`)뿐이고, 변경 후 동작이 명확하므로 다음으로 검증한다:

1. **수동 테스트**: 스레드에서 사용자 A 차단 → A로 즉시 POST → 1번째 요청부터 403 차단 확인.
2. **수동 테스트**: A 차단 해제 → A로 즉시 POST → 1번째 요청부터 성공 확인.
3. **린트/타입체크**: `npm run lint`, `npm run build`로 미사용 import 제거 확인. (`__tests__/lib/services` 디렉터리는 현재 없으므로 별도 테스트 추가는 범위 밖.)
