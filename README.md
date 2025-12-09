# OpenChamchiJS

> [!WARNING]
> 이 프로젝트는 현재 개발 중입니다. 보안 및 안정성을 보장하지 않으므로 프로덕션 환경에서 사용 시 주의가 필요합니다.

Next.js 기반의 오픈소스 익명 게시판 시스템입니다.

## 주요 기능

- **익명 게시판** - 스레드/응답 기반 게시판 시스템
- **실시간 기능** - 채팅 모드, 접속자 수 표시 (Ably WebSocket)
- **이미지 업로드** - 응답에 이미지 첨부 (Supabase Storage)
- **관리자 페이지** - 사용자, 역할, 보드, 스레드, 공지사항 관리
- **권한 시스템** - 역할 기반 접근 제어 (RBAC)
- **다국어 지원** - 한국어, 영어
- **다크 모드** - 라이트/다크 테마 전환
- **해외 IP 차단** - 보드별 외국 IP 작성 제한 (선택 사항)

## 기술 스택

- Next.js 16 (App Router)
- React 19
- TypeScript
- Prisma 7 (PostgreSQL)
- NextAuth 4 (Google OAuth)
- styled-components
- next-intl

## Vercel 배포 가이드

### 1. 저장소 Fork

GitHub에서 이 저장소를 Fork합니다.

### 2. PostgreSQL 데이터베이스 준비

Vercel Postgres, Supabase, Neon 등에서 PostgreSQL 데이터베이스를 생성합니다.

**Vercel Postgres 사용 시:**
1. Vercel 대시보드 → Storage → Create Database → Postgres
2. 생성 후 `.env.local` 탭에서 연결 정보 확인

### 3. Google OAuth 설정

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. APIs & Services → Credentials → Create Credentials → OAuth client ID
4. Application type: Web application
5. Authorized redirect URIs 추가:
   - `https://your-domain.vercel.app/api/auth/callback/google`
   - (로컬 개발용) `http://localhost:3000/api/auth/callback/google`
6. Client ID와 Client Secret 저장

### 4. Vercel 프로젝트 생성

1. [Vercel](https://vercel.com) 접속 → Add New Project
2. Fork한 저장소 Import
3. Framework Preset: Next.js (자동 감지)

### 5. 환경 변수 설정

Vercel 프로젝트 Settings → Environment Variables에서 다음 변수 추가:

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `DATABASE_URL` | PostgreSQL 연결 URL | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_URL` | 사이트 URL | `https://your-domain.vercel.app` |
| `NEXTAUTH_SECRET` | 세션 암호화 키 | `openssl rand -base64 32`로 생성 |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | `GOCSPX-xxx` |

#### 선택 사항

| 변수명 | 설명 |
|--------|------|
| `ABLY_API_KEY` | 실시간 기능용 Ably API 키 ([무료 발급](https://ably.com/)) |
| `MAXMIND_LICENSE_KEY` | 해외 IP 차단용 GeoIP 라이센스 키 ([무료 발급](https://www.maxmind.com/en/geolite2/signup)) |
| `STORAGE_PROVIDER` | 이미지 업로드 스토리지 (`supabase`) |
| `SUPABASE_URL` | Supabase 프로젝트 URL |
| `SUPABASE_SERVICE_KEY` | Supabase service_role 키 |
| `SUPABASE_STORAGE_BUCKET` | 스토리지 버킷 이름 |

### 6. 배포

환경 변수 설정 후 Deploy 버튼 클릭. 첫 배포 시 Prisma가 자동으로 데이터베이스 스키마를 생성합니다.

### 7. 초기 설정

1. 배포된 사이트 접속
2. `/setup` 페이지로 자동 리다이렉트
3. Google 계정으로 로그인하면 해당 계정이 관리자로 설정됨
4. 관리자 페이지(`/admin`)에서 보드 생성

## 로컬 개발

### 요구사항

- Node.js 20+
- PostgreSQL 데이터베이스

### 설치

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일 편집

# 데이터베이스 마이그레이션
npx prisma migrate dev

# 개발 서버 시작
npm run dev
```

### 환경 변수 (.env)

```env
DATABASE_URL="postgresql://user:password@localhost:5432/chamchi"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### 명령어

```bash
npm run dev      # 개발 서버 (localhost:3000)
npm run build    # 프로덕션 빌드
npm run start    # 프로덕션 서버
npm run lint     # ESLint 검사
npm test         # Jest 테스트
```

### Prisma 명령어

```bash
npx prisma generate    # Prisma Client 생성
npx prisma migrate dev # 마이그레이션 생성 및 적용
npx prisma studio      # Prisma Studio GUI
```

## 권한 시스템

### 기본 권한

| 권한 | 설명 |
|------|------|
| `all:all` | 모든 권한 (슈퍼관리자) |
| `admin:read` | 관리자 페이지 접근 |
| `board:create` | 보드 생성 |
| `board:update` | 보드 수정 |
| `thread:edit` | 모든 스레드 수정 |
| `thread:delete` | 모든 스레드 삭제 |
| `foreign:write` | 해외 IP 차단 우회 |

### 보드별 권한

보드 생성 시 자동으로 생성되는 권한:
- `thread:{boardId}:edit` - 해당 보드 스레드 수정
- `thread:{boardId}:delete` - 해당 보드 스레드 삭제
- `notice:{boardId}:create` - 해당 보드 공지 작성
- `notice:{boardId}:update` - 해당 보드 공지 수정
- `notice:{boardId}:delete` - 해당 보드 공지 삭제

## 실시간 기능 설정 (Ably)

실시간 채팅 모드와 접속자 수 표시를 사용하려면 Ably 설정이 필요합니다.

1. [Ably](https://ably.com/)에서 무료 계정 생성
2. 새 앱 생성 후 API Keys 탭으로 이동
3. API 키 생성 (필요 권한: Publish, Subscribe, Presence)
4. 환경 변수에 `ABLY_API_KEY` 추가
5. 재배포

### 기능

- **채팅 모드**: 스레드에서 새 응답을 실시간으로 수신 (페이지 새로고침 불필요)
- **접속자 수 (사용자 카운터)**: 현재 페이지를 보고 있는 사용자 수를 상단 바에 표시
  - `/index` 페이지: 항상 표시 (해당 보드를 보고 있는 접속자 수)
  - `/trace` 페이지: 보드 설정에서 "접속자 수 표시" 활성화 시 표시 (해당 스레드를 보고 있는 접속자 수)
  - Ably의 Presence 기능을 사용하여 실시간 집계
  - 동일 사용자가 여러 탭을 열어도 중복 없이 1명으로 카운트

Ably 무료 플랜: 월 600만 메시지, 동시 접속 200명

## 이미지 업로드 설정 (Supabase Storage)

응답에 이미지 첨부 기능을 사용하려면 Supabase Storage 설정이 필요합니다.

### 1. Supabase 프로젝트 설정

1. [Supabase](https://supabase.com/)에서 프로젝트 생성 (또는 기존 프로젝트 사용)
2. Settings → API에서 Project URL과 service_role 키 확인

### 2. Storage 버킷 생성

1. Supabase 대시보드 → Storage
2. "New bucket" 클릭
3. 버킷 이름 입력 (예: `attachments`)
4. **Public bucket** 체크 (이미지를 공개 URL로 제공하기 위해 필요)
5. Create bucket

### 3. 환경 변수 설정

```env
STORAGE_PROVIDER=supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_STORAGE_BUCKET=attachments
```

### 4. 보드별 업로드 설정

관리자 페이지 → 보드 설정에서 각 보드별로 설정 가능:
- **최대 업로드 용량**: 기본 5MB
- **허용 MIME 타입**: 기본 `image/png,image/jpeg,image/gif,image/webp`

### 기능

- 응답 작성 시 이미지 첨부 가능
- 이미지는 응답 본문 상단에 썸네일(최대 400px)로 표시
- 클릭 시 원본 크기로 확대
- 글 작성 실패 시 업로드된 이미지 자동 정리

> 환경 변수가 설정되지 않으면 이미지 업로드 버튼이 표시되지 않습니다.

## 해외 IP 차단 설정

1. [MaxMind](https://www.maxmind.com/en/geolite2/signup)에서 무료 계정 생성
2. Account → Manage License Keys → Generate new license key
3. Vercel 환경 변수에 `MAXMIND_LICENSE_KEY` 추가
4. 재배포 (빌드 시 자동으로 GeoIP 데이터베이스 다운로드)
5. 관리자 페이지 → 전역 설정에서 허용 국가 코드 설정 (예: `KR`)
6. 보드 설정에서 "해외 IP 차단" 활성화

## 라이센스

MIT License
