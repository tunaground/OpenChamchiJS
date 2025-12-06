# OpenChamchiJS

Next.js 기반의 오픈소스 익명 게시판 시스템입니다.

## 주요 기능

- **익명 게시판** - 스레드/응답 기반 게시판 시스템
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
| `MAXMIND_LICENSE_KEY` | 해외 IP 차단용 GeoIP 라이센스 키 ([무료 발급](https://www.maxmind.com/en/geolite2/signup)) |

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
npx prisma db seed     # 시드 데이터 생성
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

## 해외 IP 차단 설정

1. [MaxMind](https://www.maxmind.com/en/geolite2/signup)에서 무료 계정 생성
2. Account → Manage License Keys → Generate new license key
3. Vercel 환경 변수에 `MAXMIND_LICENSE_KEY` 추가
4. 재배포 (빌드 시 자동으로 GeoIP 데이터베이스 다운로드)
5. 관리자 페이지 → 전역 설정에서 허용 국가 코드 설정 (예: `KR`)
6. 보드 설정에서 "해외 IP 차단" 활성화

## 라이센스

MIT License
