# PetCare Frontend

## 프로젝트 개요
반려견 케어 시스템 프론트엔드. 백엔드(Spring Boot)는 이미 구현 완료 상태이며,
이 저장소는 React로 화면을 붙이는 작업만 진행한다. 포트폴리오 목적, 혼자 개발.

## 문서 구조 (언제 어떤 파일을 읽는지)
- **CLAUDE.md** (이 파일) — 세션 시작 시 항상 자동 로드됨. 개요/스택/핵심 API
  계약/폴더구조/컨벤션처럼 매 세션 필요한 것만 유지. 뭔가 추가하기 전에 "이거
  매번 필요한가?"부터 따지고, 아니면 아래 파일 중 하나로 보낼 것.
- **PROGRESS.md** — 날짜별 상세 변경 이력, 설계 이유("왜 이렇게 했는지"), 알려진
  한계. 자동 로드 안 됨. "이 기능 예전에 어떻게 구현했었지" 싶을 때, 또는 새
  작업 시작 전에 과거 맥락이 필요할 때만 직접 읽기. 작업 끝낼 때마다 여기에
  항목 추가 — CLAUDE.md 쪽 진행상황은 한두 줄 요약만 유지.
- **API_MAP.md** — 엔드포인트별 상세 매핑(요청·응답 필드, 연결된 화면/컴포넌트).
  특정 도메인(반려동물/병원/예약 등) 작업할 때 그 부분만 찾아 읽기. 새
  엔드포인트 연동하면 여기에 한 줄 추가.
- **src/api/CLAUDE.md** — axios 인스턴스/페이지네이션 컨벤션. Claude Code가
  `src/api/` 안 파일을 열 때 자동 로드됨(중첩 CLAUDE.md라 따로 안 챙겨도 됨).
  api 폴더 전용 규칙만 여기 적고, 다른 폴더에도 필요한 규칙은 루트에 둘 것.
- 특정 폴더 전용 규칙이 쌓이면(예: `src/pages/hospital/` 전용 패턴) 그 폴더에도
  CLAUDE.md 추가하는 식으로 확장 — 루트는 계속 얇게 유지하는 게 원칙.

## 기술 스택
- React (Vite)
- React Router (페이지 라우팅)
- Axios (HTTP 클라이언트)
- 상태관리: 전역 인증 상태만 Context API로 처리 (규모상 Redux/Zustand는 과함)

## 백엔드 API 계약
- Base URL: http://localhost:8080
- 응답 포맷: `{ success: boolean, data: T | null, message: string | null }`
- 목록 API는 대부분 배열이 아니라 `{ content, page, size, totalElements, totalPages }`로
  내려옴(PageResponse) → `data.data.content`로 꺼내야 함. 예외(그대로 배열): 병원 검색
  GET /api/hospitals, 관리자 통계, 마이페이지 D-day 목록
- 에러 HTTP 코드: 400 유효성 실패, 401 인증 실패/토큰 만료, 403 권한 없음, 404 없음, 409 충돌
- Swagger: http://localhost:8080/swagger-ui/index.html
- 로컬 테스트 계정: test-new@petcare.com/newpassword123(USER),
  admin@petcare.com/adminpass123(ADMIN), owner-test@petcare.com/ownerpass123(HOSPITAL_OWNER)

## 인증 규칙
- POST /api/auth/signup { email, password }
- POST /api/auth/login { email, password } → { accessToken, refreshToken, expiresIn(ms) }
- 이후 모든 요청에 Authorization: Bearer {accessToken} 필요 (auth/swagger 제외)
- accessToken 만료(1시간) 또는 401 응답 시 axios 인터셉터가 POST /api/auth/reissue
  { refreshToken }로 자동 재발급 시도 (재발급마다 refreshToken도 회전됨, 응답 값으로 갱신).
  reissue까지 실패하면 그때 토큰 삭제 + /login 리다이렉트
- POST /api/auth/logout (인증 필요) — 로그아웃 시 서버의 refreshToken 폐기용으로 호출
- POST /api/auth/password-reset/request { email } (항상 200, 계정 존재 여부 노출 안 함),
  POST /api/auth/password-reset/confirm { token, newPassword } → /forgot-password,
  /reset-password. 백엔드가 실제 이메일 발송 없이 토큰을 로그로만 남기므로(포트폴리오
  범위), ResetPasswordPage는 토큰을 URL 쿼리(`?token=`)에서 읽거나 수동 입력 가능
- accessToken/refreshToken 둘 다 axios 인터셉터/훅에서 자동 처리 (localStorage에
  accessToken, refreshToken 키로 저장)
- User.role: USER / HOSPITAL_OWNER / ADMIN — useAuth가 로그인 시 GET /api/users/me로
  role/userId까지 가져와 보관. 라우터에서 OwnerRoute(HOSPITAL_OWNER+ADMIN, `/dashboard`)
  / AdminRoute(ADMIN 전용, `/admin`)로 가드, Header 네비도 role에 따라 항목 추가

## 주요 엔드포인트
도메인: 내 정보/반려동물(+건강기록/보호자/급여계산기/자가문진)/병원(+슬롯/즐겨찾기/
리뷰)/예약(+대기자명단)/알림(+설정)/채팅/관리자. 전부 프론트 연동 완료.
**엔드포인트별 상세 매핑(요청·응답 필드, 연결된 화면)은 API_MAP.md 참고** — 특정
도메인 작업할 때만 그 부분 읽으면 됨, 매번 로드 안 해도 됨.

## 폴더 구조
src
├── pages       (화면 단위 컴포넌트, 도메인별 하위 폴더: auth/pet/hospital/reservation/
│               mypage/notification/chat/dashboard/admin. HomePage는 최상위)
├── components  (common: Button/TextField / layout: Header/Layout)
├── api         (axiosInstance.js + 도메인별 api 함수: authApi, userApi, petApi,
│               petGuardianApi, healthCheckApi, healthRecordApi, hospitalApi,
│               reviewApi, reservationApi, reservationAdminApi, waitlistApi,
│               notificationApi, chatApi, adminApi)
├── hooks       (useAuth — 인증상태+role+userId, useNotifications — SSE 안읽음뱃지)
└── router      (AppRouter.jsx, PrivateRoute, OwnerRoute, AdminRoute)

## 컨벤션
- API 응답의 success/message를 활용해 에러 토스트/얼럿 처리 통일
- 401 수신 시 공통 인터셉터에서 토큰 삭제 + /login으로 리다이렉트
- 커밋 메시지: "타입: 설명" 형식, 한국어 (예: feat: 로그인 화면 구현)

## 진행 방식
- 한 번에 다 만들지 말고 단계별 진행 (세팅 → 인증 플로우 → 핵심 화면 → 심화 기능)
- CORS는 백엔드에서 localhost:5173(Vite), localhost:3000 허용됨. 다른 포트 쓰면
  백엔드 SecurityConfig.corsConfigurationSource()에 추가 필요

### 진행 상황
현재: 세팅·인증·핵심 화면·심화 기능(반려동물 확장/리뷰/예약 확장/병원·계정 폴리시)
전부 완료 — CLAUDE.md 기준 백엔드 엔드포인트 전부 프론트 연동됨. 남은 작업 없음.
**날짜별 상세 이력·설계 이유·알려진 한계는 PROGRESS.md 참고.**
- 디자인: **DESIGN_SPEC.md**가 단일 기준(색·폰트·형태·레이아웃). `petcare-ui-source/`
  는 화면별 HTML 시안 원본. 2026-09-22에 전 화면 이식 완료 — teal `#0F766E` accent,
  stone 배경, Jua(제목)+Noto Sans KR(본문), 버튼 pill / 카드 rounded-2xl /
  입력창 rounded-lg. 상세·의도적으로 시안과 다르게 둔 부분은 PROGRESS.md 참고.
- 공통 클래스는 `src/index.css`에 **`@utility`로** 정의(`card` `btn-*` `input`
  `chip*` `segmented` `badge-*` `icon-badge*` `h-section`). Tailwind v4의 @apply는
  유틸리티만 받으므로 `@layer components`로 만들면 서로 조합이 안 된다.
  동적 spacing은 정수만 생성됨 — `h-5.5` 같은 소수는 조용히 무시되니 쓰지 말 것.
- 공통 컴포넌트(`src/components/common/`): Button, TextField, SelectField,
  ChoiceGroup, Toggle, Tabs, Alert, EmptyState, StatusBadge, MenuList, PageHeader,
  InfoRow, Stars, Reveal. 새 화면은 이것부터 찾아 쓰고, 날짜·종·D-day·예약
  진료유형 포맷은 `src/lib/format.js`.
- **관리자 패널(`/admin/*`, `src/pages/admin/`)은 소비자 앱과 별도 UI.**
  `AdminLayout`(사이드바/상단 탭, stone-900 어두운 톤, pill 대신 rounded-lg 버튼)
  아래에서 렌더되고 `Layout`(하단 탭바 등)은 안 씀 — 공용 컴포넌트도 재사용 안
  하고 `admin-card` `admin-btn-*` `admin-input` `admin-th/td`(index.css @utility)
  를 따로 씀. ADMIN 전용(HOSPITAL_OWNER는 기존 `/dashboard` 그대로), 로그인 시
  role 보고 자동 이동. 상세는 PROGRESS.md, 엔드포인트는 API_MAP.md·ADMIN.md(백엔드).

## 반응형 정책
- 모든 화면은 웹(데스크톱)과 모바일 브라우저 양쪽에서 정상 동작해야 함
- CSS는 모바일 퍼스트로 작성, 미디어 쿼리로 데스크톱 레이아웃 확장
- 기준 브레이크포인트: 모바일 ~767px, 태블릿 768~1023px, 데스크톱 1024px~
- 별도 네이티브 앱이 아니라 반응형 웹 하나로 대응 (모바일 전용 페이지 분리 없음)
- CSS 프레임워크: Tailwind CSS v4 (`@tailwindcss/vite`, 별도 config 파일 없이
  `src/index.css`의 `@theme`로 brand 컬러/폰트 정의)