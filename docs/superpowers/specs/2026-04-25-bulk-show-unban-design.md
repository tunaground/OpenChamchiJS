# Bulk Show / Bulk Unban Design

## Overview

thread-detail-content.tsx 관리 모달에 일괄 보이기(bulk show)와 일괄 차단 풀기(bulk unban) 버튼을 추가한다. 기존의 일괄 숨기기/일괄 차단과 대칭되는 역방향 동작이다.

## 변경 범위

- `app/trace/[boardId]/[threadId]/[[...range]]/thread-detail-content.tsx` — UI 및 핸들러 추가
- `lib/i18n/messages/ko.json`, `en.json`, `ja.json` — 라벨 추가

새로운 API 엔드포인트 없음. 기존 엔드포인트 재활용.

## UI

### 버튼 배치

일괄 액션 영역에 4개 버튼을 한 줄로 나열:

```
[숨기기(N)] [보이기(N)] [차단(N)] [차단 풀기(N)]
```

- 4개 버튼 모두 항상 표시
- 선택된 응답 개수와 무관하게 클릭 가능 (기존 숨기기/차단 버튼과 동일)

### 버튼 스타일

| 버튼 | 스타일 | 근거 |
|------|--------|------|
| 숨기기 | `ConfirmButton` (빨간 배경, 흰 텍스트) | 기존 유지 |
| 차단 | `ConfirmButton` | 기존 유지 |
| 보이기 | `CancelButton` 유사 (투명 배경, 테두리) | 되돌리기 동작 구분 |
| 차단 풀기 | `CancelButton` 유사 | 되돌리기 동작 구분 |

## 핸들러

### handleBulkShow

기존 `handleBulkHide`와 동일한 패턴:

1. 선택된 `responseId` 목록 수집
2. 각 responseId에 대해 PUT `/api/boards/{boardId}/threads/{threadId}/responses/{responseId}` 병렬 호출
3. body: `{ visible: true }` (숨기기는 `{ visible: false }`)
4. 비밀번호 모드인 경우 `{ password, visible: true }`
5. 완료 후 로컬 상태 갱신 + 페이지 리프레시

### handleBulkUnban

기존 `handleUnban`을 다중으로 확장:

1. 선택된 응답들의 `authorId` 목록 추출 (중복 제거)
2. `bannedAuthorIds` Map에서 각 authorId의 `banId` 조회
3. banId가 존재하는 항목만 필터링
4. 각 banId에 대해 DELETE `/api/boards/{boardId}/threads/{threadId}/bans/{banId}` 병렬 호출
5. 비밀번호 모드인 경우 `X-Thread-Password` 헤더에 `btoa(encodeURIComponent(password))` 전달 (기존 unban과 동일)
6. 완료 후 `bannedAuthorIds` Map에서 해당 항목 제거

## i18n 라벨

| 키 | ko | en | ja |
|----|----|----|-----|
| show | 보이기 | Show | 表示 |
| unban | 차단 풀기 | Unban | ブロック解除 |

## 에러 처리

기존 일괄 숨기기/차단과 동일:
- `Promise.all`로 병렬 호출 (기존 패턴 유지)
- try/finally로 로딩 상태 관리
