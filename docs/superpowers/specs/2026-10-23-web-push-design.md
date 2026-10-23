# 스레드 웹 푸시 알림 설계

- 작성일: 2026-10-23
- 상태: 구현됨

> **구현 중 변경 (2026-10-23, 브라우저 테스트 결과)**
> - 알림은 "교체"하지 않고 답글마다 쌓는다. 태그는 `{구독 id}:r-{답글 id}`. 같은 태그로 교체하면 macOS Chrome이 배너를 띄우지 않고 클릭도 전달되지 않았다.
> - 알림 본문에 작성자와 답글 발췌(TOM 마크업 제거, 스포일러 가림, 최대 100자)를 넣는다. 아래 §2 비목표의 "본문·작성자 미포함"과 §3-6 "티켓 교체"는 이 변경으로 대체된다.
> - "보는 중"은 화면에 보이는 것(`visible`)에 더해 창 포커스(`document.hasFocus()`)까지 있어야 한다. 스레드를 띄워 둔 채 다른 앱을 쓰면 푸시가 온다(듀얼 모니터에서도). 아래 §3-5는 이 기준으로 대체된다.
> - 같은 스레드 알림 최소 간격은 `GlobalSettings.pushCooldownSeconds`(기본 60, 0~86400)로 조정한다.

## 1. 의도

사용자가 관심 있는 스레드를 "알림 등록"해 두면, 브라우저를 닫았거나 다른 앱/탭(예: 유튜브)을 보고 있어도 새 답글이 달렸다는 사실을 알 수 있어야 한다. 서비스는 메신저가 아니라 게시판이므로, 알림은 "등록한 스레드에 아무튼 새 글이 있다"만 전달하면 충분하다. 최신 글 내용을 실시간으로 보여줄 필요는 없다. 성능 부담이 작은 것이 중요하다.

## 2. 목표 / 비목표 / 반목표

### 목표
- 로그인 사용자가 스레드를 알림 등록하고, 서비스 워커 기반 Web Push(VAPID)로 OS 알림을 받는다. 데스크톱 브라우저, 안드로이드, 홈 화면에 설치한 iOS PWA(16.4+)에서 동작한다.
- 사용자당 활성 등록은 최대 n개다. n은 어드민이 전역 설정에서 조정한다.
- TopBar 🔔 드롭다운에서 등록 목록을 확인하고 전체 on/off, 개별 on/off, 제거를 할 수 있다.
- 사용자×스레드 단위로 1분에 최대 1회 발송한다. 첫 알림은 즉시 나간다.
- 사용자가 해당 스레드를 화면에 실제로 띄워 두고 있는 동안에는 그 스레드 알림을 보내지 않는다.

### 비목표
- 알림에 답글 본문이나 작성자를 넣는 것.
- 1분 쿨다운 동안 쌓인 답글을 나중에 묶어서 보내는 것. 쿨다운 중 답글은 무시한다.
- 비로그인(익명) 사용자 지원.
- iOS 설치 안내 UI를 새로 만드는 것. 매니페스트(`app/manifest.json`, standalone)는 이미 있다.

### 반목표 (이렇게 되면 기술적으로 동작해도 실패)
- 답글 작성 API의 응답이 푸시 발송 때문에 느려지는 것.
- 같은 스레드 알림이 기기 알림 센터에 여러 개 쌓이는 것.
- 전체 off 후 다시 on 했을 때 개별 off 상태가 사라지는 것.
- 보고 있는 스레드의 알림이 계속 울리는 것.

## 3. 사용자가 정한 규칙

1. **로그인 사용자 전용.**
2. **등록 상한 n**: `GlobalSettings`에서 어드민이 설정한다. 개별 off(일시 비활성화)한 스레드도 활성 등록으로 세어 자리를 차지한다. 가득 찬 상태에서 새로 등록하려 하면 **거부**한다("가득 찼어요"). 오래된 등록을 밀어내지 않는다.
   - 어드민이 n을 줄여서 기존 등록 수가 n을 넘게 되어도 기존 등록은 유지한다. n 미만으로 줄어들 때까지 새 등록만 막는다.
   - **n의 기본값은 0이다. n = 0이면 푸시 기능 전체가 꺼진다.** 서버는 발송, 등록, 하트비트를 모두 하지 않는다. UI에서도 기능이 아예 없는 것처럼 보인다(TopBar 🔔, 스레드 페이지 등록 버튼 모두 미표시). 기존 등록 레코드는 지우지 않고 남겨 둔다. 그래서 n을 다시 올리면 그대로 되살아난다.
3. **등록 목록 관리**: TopBar 🔔 버튼 아래에 열리는 **드롭다운(popover)** 으로 한다(목업 B안).
   - 상단: "스레드 알림 {현재}/{n}" 표시와 **전체 on/off** 토글.
   - 목록 행: **개별 on/off** 토글, 스레드 제목, 🗑 제거.
   - 전체 off와 개별 off는 서로 독립적으로 저장된다. 예를 들어 2, 3번을 개별 off하고, 전체 off 후 다시 전체 on 해도 2, 3번은 off로 남아야 한다. 전체 off일 때 목록은 흐리게 표시하지만 개별 토글 값은 그대로 보여준다.
4. **스레드당 1분에 하나**: 마지막 발송 후 1분이 지났으면 즉시 발송하고, 지나지 않았으면 아무것도 하지 않는다. 예약 발송이나 묶음 발송은 없다.
5. **보는 중 억제**: 사용자가 그 스레드 페이지를 화면에 실제로 띄워 두고 있을 때(`document.visibilityState === 'visible'`)만 "보는 중"으로 친다. 탭이 열려 있어도 숨겨져 있으면 알림을 보낸다.
6. **티켓 교체**: 같은 스레드 알림은 같은 `tag`를 쓰고 `renotify: true`를 준다. 그러면 기기 알림 센터에는 스레드마다 하나만 남고, 새 알림이 올 때마다 다시 울린다.
7. **하드 삭제**: 제거하면 레코드를 바로 지운다. 처음에는 소프트 삭제로 정했지만, 계정 삭제가 이미 하드 삭제(`prisma.user.delete`)로 동작하고 있어 앱 DB 계정에 DELETE 권한이 있다고 보고 바꿨다. 웹 푸시 레코드는 필요할 때 하드 삭제한다. 그래서 사용자당 레코드는 항상 n개 이하로 유지된다(n을 줄인 경우는 예외).
8. **VAPID 키는 `GlobalSettings`에 저장한다.**
9. **기존 채팅 모드 브라우저 알림을 제거한다.** `thread-detail-content.tsx`의 `requestNotificationPermission`/`createThrottledNotifier` 사용과 `lib/utils/notification.ts`의 관련 함수를 웹 푸시로 대체한다.

## 4. 설계

### 4.1 데이터 모델 (Prisma)

**GlobalSettings 추가 필드**
- `pushWatchLimit Int @default(0)`: n. 0이면 기능이 꺼진다.
- `vapidPublicKey String?`, `vapidPrivateKey String?`, `vapidSubject String?` (예: `mailto:admin@example.com`)

**User 추가 필드**
- `pushEnabled Boolean @default(true)`: 전체 on/off. 사용자 단위이므로 모든 기기에 적용된다.

**PushSubscription (기기 구독)**: 브라우저/기기마다 하나씩 생긴다.
- `id`, `userId`, `endpoint String`, `p256dh String`, `auth String`, `locale String?`, `userAgent String?`, `createdAt`, `lastUsedAt DateTime?`
- `endpoint`는 `@unique`다. 전체 사용자를 통틀어 하나의 endpoint에는 레코드가 하나만 있다.
- 구독 등록 시 처리 *(내 판단: 공용 브라우저 대비)*:
  - endpoint 기준으로 upsert하고 `userId`, 키, locale을 덮어쓴다. 그래서 같은 브라우저에 다른 사용자가 로그인해서 구독하면 소유자가 그 사용자로 바뀐다.
- 로그아웃할 때 클라이언트는 `pushManager.unsubscribe()`와 `DELETE /api/push/subscriptions`를 호출한다. 그래서 다음 로그인 사용자에게 이전 사용자의 알림이 가지 않는다. *(내 판단)*
- 푸시 서비스가 404/410을 돌려주면 그 구독을 삭제한다. 401/403도 키 불일치로 보고 삭제한다.
- 인덱스: `(userId)`, `endpoint` 유니크.
- `user` 관계는 `onDelete: Cascade`로 둔다. 계정을 삭제하면 같이 지워진다.

**ThreadWatch (스레드 알림 등록)**
- `id`, `userId`, `threadId Int`, `enabled Boolean @default(true)` (개별 on/off), `lastPushedAt DateTime?`, `lastViewingAt DateTime?`, `createdAt`
- `@@unique([userId, threadId])`. `@@index([threadId])`는 발송 대상 조회용이다. 목록과 개수 조회는 유니크 인덱스의 userId 선두 열로 충분하다.
- `user`, `thread` 관계 모두 `onDelete: Cascade`다. 스레드는 보통 `deleted` 플래그로 소프트 삭제되므로 등록은 남는다. 이 경우 발송 대상에서 빼고 목록에는 "삭제된 스레드"로 보여준다.

### 4.2 서버 로직

**등록/해제/토글**: 서비스 `lib/services/thread-watch.ts`와 레포지토리 레이어를 만든다. 기존 패턴(ServiceError, handleServiceError, validateOrigin, Zod)을 따른다.
- 등록: 로그인 확인 → 스레드 존재 여부 확인(`deleted=false`) → 이미 활성 등록이 있으면 그대로 반환(멱등) → 활성 등록 수가 n 이상이면 `WATCH_LIMIT_EXCEEDED` → 생성. 개수 확인과 생성 사이의 경쟁 조건은 트랜잭션 안에서 처리한다. 유니크 제약이 중복 등록을 막는다.
- 해제(제거): 레코드 삭제.
- 개별 토글: `enabled` 갱신. 전체 토글: `User.pushEnabled` 갱신.

**발송 흐름** (답글 생성 직후):
1. 답글 생성 API는 DB 저장과 realtime publish를 마친 뒤 `after()`(next/server)로 푸시 처리를 예약하고 곧바로 응답한다. 답글 작성 응답은 푸시를 기다리지 않는다.
2. 대상 조회(쿼리 한 번): `threadId`가 일치하고, 스레드 `deleted = false`, `enabled = true`, `user.pushEnabled = true`, `userId ≠ 작성자 userId`이며, (`lastPushedAt IS NULL` 또는 `lastPushedAt < now − 60s`)이고, (`lastViewingAt IS NULL` 또는 `lastViewingAt < now − 45s`)인 ThreadWatch.
3. 쿨다운 선점: 대상 id들에 대해 `UPDATE ... SET lastPushedAt = now WHERE id IN (...) AND (lastPushedAt IS NULL OR lastPushedAt < now − 60s) RETURNING userId`를 실행한다. 그러면 동시에 들어온 답글 두 개가 같은 사용자에게 중복 발송하지 않는다. 선점에 성공한 사용자에게만 보낸다.
4. 해당 사용자들의 활성 PushSubscription에 `web-push` 라이브러리로 발송한다. 페이로드는 아래와 같다.
   ```json
   { "threadId": 123, "boardId": "free", "title": "<스레드 제목>", "url": "/trace/free/123/recent" }
   ```
   - TTL은 짧게 둔다. *(내 판단: 1시간)* `urgency`는 `normal`로 둔다.
   - 404/410/401/403 응답이면 그 구독을 삭제한다. 다른 오류는 로그만 남긴다.
5. **기능 활성 조건**: `pushWatchLimit > 0` 그리고 VAPID 키 설정 완료. 하나라도 빠지면 발송 단계를 통째로 건너뛰고 등록 UI도 숨긴다. 이 판단은 공용 헬퍼 하나로 모은다(예: `isPushFeatureEnabled(settings)`). 비활성 상태에서는 `/api/push/*` 중 상태를 바꾸는 API가 `FEATURE_DISABLED`(예: 404)를 돌려주고, 하트비트는 조용히 204를 돌려준다. 서비스 워커 등록도 기능이 켜져 있을 때만 한다.

**보는 중 하트비트**
- `POST /api/push/viewing/{threadId}` 바디: `{ viewing: boolean }`
- 로그인했고 그 스레드에 등록이 있는 사용자만 처리한다. `viewing: true`면 `lastViewingAt = now`, `false`면 `lastViewingAt = null`. 등록이 없으면 아무것도 하지 않고 204를 돌려준다.
- 클라이언트(스레드 페이지)는 등록된 스레드이고 `visibilityState === 'visible'`인 동안 30초마다 `true`를 보낸다. 페이지가 다시 보이게 되면 즉시 `true`를 보낸다. `visibilitychange → hidden`이나 `pagehide`가 발생하면 `navigator.sendBeacon`으로 `false`를 보낸다. sendBeacon은 POST이고 같은 출처이므로 validateOrigin을 통과한다.
- 서버는 `lastViewingAt`이 45초 이내이면 보는 중으로 판단한다. 하트비트를 놓쳤을 때를 대비한 여유다.
- 보는 중 억제는 사용자 단위다. PC에서 보고 있으면 폰으로도 보내지 않는다.

### 4.3 API (안)
- `GET /api/push/vapid-public-key`: 공개키 (기능 비활성이면 null)
- `POST /api/push/subscriptions`: 기기 구독 등록/갱신 `{ endpoint, keys: { p256dh, auth } }`
- `DELETE /api/push/subscriptions` `{ endpoint }`: 이 기기 구독 해제(삭제). 본인 소유인 경우에만 처리한다.
- `GET /api/push/watches`: 내 등록 목록 `{ items: [{ id, threadId, boardId, title, enabled }], limit, pushEnabled }`
- `POST /api/push/watches` `{ threadId }`: 등록
- `PATCH /api/push/watches/{watchId}` `{ enabled }`: 개별 토글
- `DELETE /api/push/watches/{watchId}`: 제거 (삭제)
- `PATCH /api/push/settings` `{ pushEnabled }`: 전체 토글
- `POST /api/push/viewing/{threadId}`: 하트비트 (위 참고). `watches/[watchId]`와 동적 세그먼트가 겹치지 않도록 경로를 분리했다.
- 상태를 바꾸는 API는 모두 로그인 필수이고 `validateOrigin()`을 거친다. 목록 응답의 제목은 스레드가 삭제됐으면 "삭제된 스레드"로 표시하고, 사용자가 직접 제거하게 한다.

### 4.4 서비스 워커
- `public/sw.js`를 새로 만들고, 루트 레이아웃의 클라이언트 컴포넌트에서 로그인 사용자일 때 등록한다.
- `push`: 페이로드로 `showNotification(title, { body: <i18n 문구>, tag: 'thread-'+threadId, renotify: true, data: { url }, icon: '/web-app-manifest-192x192.png' })`를 호출한다. iOS와 크롬 정책상 push를 받으면 반드시 알림을 표시해야 하므로, 여기서 따로 억제하지 않는다. 억제는 서버에서 끝낸다.
- `notificationclick`: 같은 출처 창 중 해당 URL을 연 창이 있으면 focus하고, 없으면 `clients.openWindow(url)`를 호출한다.
- 알림 문구 언어: 기기 구독을 등록할 때 클라이언트 locale을 `PushSubscription.locale`에 저장하고, 서버가 페이로드에 `body`를 담아 보낸다. *(내 판단)* 문구는 ko/en/ja 메시지 파일에 추가한다. 예: "새 답글이 있어요".

### 4.5 UI
- **TopBar 🔔 버튼**(`components/layout/`): 로그인 상태이고 기능이 활성(n > 0, VAPID 설정)일 때만 보인다. 클라이언트는 이 값을 서버에서 받아 판단한다(`window.__RUNTIME_CONFIG__` 등 기존 주입 경로 활용은 구현자 판단). 클릭하면 드롭다운이 열린다.
  - 헤더: "스레드 알림 {count}/{limit}" + 전체 토글
  - 목록: 개별 토글, 제목(클릭하면 스레드로 이동, 게시판 이름은 작게), 🗑
  - 하단: 이 기기의 상태(허용됨 / 차단됨 / 아직 미구독). 미구독이면 "이 기기에서 받기" 버튼을 보여주고, 차단됨이면 브라우저 설정 안내를 보여준다.
  - 모바일(< breakpoint)에서는 화면 폭에 맞게 늘린다. *(내 판단)*
  - 전체 off일 때 목록은 opacity를 낮추고 토글은 계속 조작할 수 있게 둔다.
- **스레드 페이지**: "🔔 알림 받기 / 🔕 알림 해제" 버튼. *(위치는 구현자 판단. 스레드 제목 근처나 TraceSidebar)*
  - "알림 받기"를 눌렀을 때 이 기기가 미구독이면 권한을 요청하고 구독을 등록한 뒤 스레드를 등록한다. 권한 요청은 반드시 사용자 클릭 핸들러 안에서 해야 한다(iOS 요구사항).
  - 상한에 걸리면 "알림은 최대 {n}개까지 등록할 수 있어요. 🔔 목록에서 정리해 주세요."라는 토스트나 인라인 문구를 띄운다.
- **어드민 설정**(`app/admin/settings`): n 입력, VAPID subject 입력, 공개키 표시, "키 생성" 버튼(`web-push.generateVAPIDKeys()`, 서버에서 실행). 이미 키가 있는데 다시 생성하면 "기존 기기 구독이 모두 무효가 됩니다"라는 확인을 받는다. 확인 후에는 서버가 PushSubscription 전체를 삭제한다. 클라이언트는 앱을 열 때 자기 구독의 `applicationServerKey`를 현재 공개키와 비교하고, 다르면 권한이 허용된 상태에서 조용히 다시 구독한다. *(내 판단)* 비밀키는 응답으로 클라이언트에 내보내지 않는다.
- 스타일: styled-components와 기존 테마 토큰을 쓴다. 모든 문구는 i18n(ko/en/ja)으로 처리한다.

### 4.6 제거 대상
- `thread-detail-content.tsx`의 채팅 모드 Notification 관련 코드(`throttledNotify`, 권한 요청 effect, 호출부)
- `lib/utils/notification.ts`의 해당 함수와 관련 테스트(있다면). 다른 사용처가 없으면 파일을 삭제한다.

## 5. 제약
- Next.js 16 App Router, Prisma 7, NextAuth 4 (JWT) 기존 스택을 그대로 쓴다.
- 앱 DB 계정에 DELETE 권한이 있다고 가정한다(계정 삭제가 이미 하드 삭제로 동작 중). 이 가정이 틀리면 계정 삭제도 이미 실패하고 있는 것이다.
- 의존성 추가: `web-push` (+ `@types/web-push`).
- 웹 서비스는 Swarm에서 여러 레플리카로 돌 수 있다. 그래서 쿨다운과 보는 중 상태는 메모리가 아니라 DB에 둔다.
- CSP나 보안 헤더(next.config.ts)가 `/sw.js` 등록을 막지 않는지 확인한다. 필요하면 `/sw.js`에 `Service-Worker-Allowed`나 `Cache-Control: no-cache` 헤더를 추가한다.

## 6. 구현자에게 맡기는 것
- 컴포넌트 분리와 파일 이름, 스레드 페이지 버튼의 정확한 위치
- 드롭다운의 세부 스타일과 애니메이션
- 하트비트 훅 구현 방식(`lib/hooks/useThreadViewingHeartbeat` 등)
- 테스트 범위. 최소한 서비스 레이어의 상한, 멱등, 쿨다운 선점, 보는 중 필터와 전체/개별 토글 독립성을 단위 테스트로 검증한다.
- CHANGELOG의 Unreleased 항목과 CLAUDE.md의 API 목록 갱신

## 7. 결정 기록 (내 판단, 검토 필요)
- 쿨다운은 사용자×스레드 단위 60초, 보는 중 판정 45초, 하트비트 30초 간격
- 자기가 단 답글로는 자기에게 알림을 보내지 않음(userId 기준)
- 기기 구독 404/410/401/403은 삭제
- endpoint는 전역 유니크, 다른 사용자가 구독하면 소유자 교체
- 로그아웃 시 이 기기 구독 해제
- VAPID 재생성 시 기기 구독 전체 삭제 + 클라이언트 키 비교 후 자동 재구독
- 푸시 TTL 1시간
- 알림 문구는 구독 시 locale 기준 서버 생성
- VAPID 미설정 시에도 n = 0과 똑같이 기능 전체를 숨김
- n = 0으로 바꿔도 기존 등록 레코드는 보존
