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
- React 19 (Vite) + **TypeScript strict** (2026-09-27 전체 전환, `.ts/.tsx`만 씀).
  `npm run build`가 `tsc --noEmit`부터 돌리므로 타입 에러 있으면 빌드 실패. 단독 확인은 `npm run typecheck`
- 백엔드 DTO 타입은 `src/types/api.ts` 한 곳 — 백엔드 응답 필드가 바뀌면 여기부터 고칠 것
- React Router (페이지 라우팅), Axios (HTTP 클라이언트)
- 상태관리: 전역 인증 상태만 Context API로 처리 (규모상 Redux/Zustand는 과함)
- React 19 기능을 적극 사용: `use(Context)`/`<Context value>`, 폼은 `useActionState` +
  `<form action>` + `SubmitButton`(useFormStatus), 낙관적 토글은 `useOptimistic`
  (`hooks/useFavoriteIds`), 비동기 버튼 상태는 `useTransition`, 공개 데이터는
  `use(promise)` + Suspense(`pages/home/publicHospitals.ts`), 페이지 제목은 컴포넌트 안 `<title>`

## 백엔드 API 계약
- Base URL: 같은 오리진 상대 경로(`BASE_URL = ''`). 개발은 vite `server.proxy`가 `/api`·`/uploads`를
  http://localhost:8080으로 넘기고, 운영(https://petcare-yongbin.duckdns.org)은 Caddy가 백엔드로 프록시.
  `http://호스트:8080` 직접 호출 금지(HTTPS에서 혼합 콘텐츠로 차단됨)
- 응답 포맷: `{ success: boolean, data: T | null, message: string | null }`
- 목록 API는 대부분 배열이 아니라 `{ content, page, size, totalElements, totalPages }`로
  내려옴(PageResponse) → `data.data.content`로 꺼내야 함. 예외(그대로 배열): 병원 검색
  GET /api/hospitals, 관리자 통계, 마이페이지 D-day 목록
- 에러 HTTP 코드: 400 유효성 실패, 401 인증 실패/토큰 만료, 403 권한 없음, 404 없음, 409 충돌
- Swagger: http://localhost:8080/swagger-ui/index.html (운영: https://petcare-yongbin.duckdns.org/swagger-ui/index.html)
- 로컬 테스트 계정: test-new@petcare.com/newpassword123(USER),
  admin@petcare.com/adminpass123(ADMIN), owner-test@petcare.com/ownerpass123(HOSPITAL_OWNER)

## 인증 규칙
- POST /api/auth/signup { email, password }
- POST /api/auth/login { email, password } → { accessToken, refreshToken, expiresIn(ms) }
- 이후 모든 요청에 Authorization: Bearer {accessToken} 필요 (auth/swagger 제외).
  **예외: 비회원 공개 GET** — `/api/hospitals`, `/api/hospitals/{id}`, `.../reviews`,
  `.../slots` (2026-09-27, 백엔드 `SecurityConfig.PUBLIC_GET_PATHS`)
- **비회원 모드**: 홈·병원 목록/상세·공지사항·FAQ·이용약관·개인정보처리방침은 로그인 없이 공개
  (홈은 회원/비회원 공용 한 화면 — 로그인 사용자용 접종·예약 요약은 /pets 반려동물 화면에 있음). 나머지 라우트는
  `PrivateRoute`가 /login으로 튕기지 않고 `LoginRequired`("회원가입/로그인 후 이용해 주세요")를
  Layout 안에 띄움. 화면 안 회원 기능(예약·즐겨찾기·문의·리뷰 작성)도 `<LoginRequired feature
  compact />`로 막음. 로그인/가입 링크는 `state.from`을 넘겨 로그인 후 보던 화면으로 복귀
- accessToken 만료(1시간) 또는 401 응답 시 axios 인터셉터가 POST /api/auth/reissue
  { refreshToken }로 자동 재발급 시도 (재발급마다 refreshToken도 회전됨, 응답 값으로 갱신).
  reissue까지 실패하면 그때 토큰 삭제 + /login 리다이렉트. 토큰이 아예 없는 비회원의 401은
  리다이렉트 없이 reject만
- POST /api/auth/logout (인증 필요) — 로그아웃 시 서버의 refreshToken 폐기용으로 호출
- POST /api/auth/password-reset/request { email } (항상 200, 계정 존재 여부 노출 안 함),
  POST /api/auth/password-reset/confirm { token, newPassword } → /forgot-password,
  /reset-password. 백엔드가 실제 이메일 발송 없이 토큰을 로그로만 남기므로(포트폴리오
  범위), ResetPasswordPage는 토큰을 URL 쿼리(`?token=`)에서 읽거나 수동 입력 가능
- accessToken/refreshToken 둘 다 axios 인터셉터/훅에서 자동 처리 (localStorage에
  accessToken, refreshToken 키로 저장)
- User.role: USER / HOSPITAL_OWNER / ADMIN — useAuth가 로그인 시 GET /api/users/me로
  role/userId까지 가져와 보관. 라우터에서 OwnerRoute(HOSPITAL_OWNER 전용, `/dashboard/*` —
  ADMIN은 /admin으로 보냄) / AdminRoute(ADMIN 전용, `/admin/*`)로 가드, Header 네비도 role에 따라 항목 추가

## 주요 엔드포인트
도메인: 내 정보/반려동물(+건강기록/보호자/급여계산기/자가문진)/병원(+슬롯/즐겨찾기/
리뷰)/예약(+대기자명단)/알림(+설정)/채팅/관리자. 전부 프론트 연동 완료.
**엔드포인트별 상세 매핑(요청·응답 필드, 연결된 화면)은 API_MAP.md 참고** — 특정
도메인 작업할 때만 그 부분 읽으면 됨, 매번 로드 안 해도 됨.

## 폴더 구조
src
├── pages       (화면 단위 컴포넌트, 도메인별 하위 폴더: auth/pet/hospital/reservation/
│               mypage/notification/chat/dashboard/admin/support(공지·FAQ·약관·방침).
│               HomePage는 최상위, 회원/비회원 공용 한 화면)
├── content     (notices.ts 공지, faq.ts FAQ — 공지 API가 없어 정적 데이터. 공지 추가는 여기)
├── components  (common: Button/TextField/LoginRequired/SubmitButton 등 / layout: Header/Layout/Footer)
├── api         (axiosInstance.ts — ApiPromise<T> 타입·errorMessage() 헬퍼 포함 + 도메인별
│               api 함수: authApi, userApi, petApi, petGuardianApi, healthCheckApi,
│               healthRecordApi, hospitalApi, reviewApi, reservationApi,
│               reservationAdminApi, waitlistApi, notificationApi, chatApi, adminApi)
│               chatApi.subscribeChatRoom — 채팅방 실시간 수신(@stomp/stompjs, /api/ws). 전송은 REST,
│               재연결·인증 실패 때 목록 재조회(그 401이 토큰 재발급을 일으켜 다음 재연결은 새 토큰)
│               chatApi.markChatRoomRead — 방 진입·열어둔 채 상대 메시지 수신 시 호출(목록 안 읽은 수 0으로)
├── types       (api.ts — 백엔드 DTO/enum 타입)
├── lib         (format.ts 포맷터, roles.ts OWNER_ROLES)
├── hooks       (useAuth — 인증상태+role+userId, useNotifications — SSE 안읽음뱃지,
│               usePagedList — 더 보기, useFavoriteIds — 즐겨찾기 useOptimistic)
└── router      (AppRouter.tsx, PrivateRoute, OwnerRoute, AdminRoute)

## 컨벤션
- API 응답의 success/message를 활용해 에러 토스트/얼럿 처리 통일 — catch에서는
  `errorMessage(err, '기본 문구')`(api/axiosInstance) 사용 (`err`가 unknown이라 직접 접근 금지)
- 401 수신 시 공통 인터셉터에서 토큰 삭제 + /login으로 리다이렉트 (로그인 상태였을 때만)
- 커밋 메시지: "타입: 설명" 형식, 한국어 (예: feat: 로그인 화면 구현)
- **기존 코드를 수정하면 수정 지점에 이유 주석을 남길 것** (백엔드와 같은 규칙, 나중에 변경 이력/회고 글의
  근거로 쓰기 위함). 형식: `// 변경(YYYY-MM-DD): 무엇을 어떻게 바꿨는지 — 왜 (이전: 기존 동작/문제)`.
  JSX 안이면 `{/* 변경(...): ... */}`. 새로 추가한 코드에는 붙이지 않고 기존 동작이 바뀐 곳에만

## 진행 방식
- 한 번에 다 만들지 말고 단계별 진행 (세팅 → 인증 플로우 → 핵심 화면 → 심화 기능)
- CORS는 백엔드에서 localhost:5173(Vite), localhost:3000 허용됨. 다른 포트 쓰면
  백엔드 SecurityConfig.corsConfigurationSource()에 추가 필요

### 진행 상황
현재: 세팅·인증·핵심 화면·심화 기능(반려동물 확장/리뷰/예약 확장/병원·계정 폴리시)
전부 완료. **남은 작업은 PROGRESS.md의 "다음 할 일" 섹션** — 2026-09-27에 ①②③④⑦ 처리,
같은 날 비회원 모드(병원 공개)+TypeScript 전환+React 19 기능 도입, 홈 통일(회원 요약은 /pets로)
+공지·FAQ·약관·방침+푸터, 건강기록 화면 개편(작성 다이얼로그 분리·종류 필터·월별 묶음). ⑤ 403 문구·⑧ 토스트(`hooks/useToast` — 동작 결과는 토스트, 입력 검증은 인라인)도 완료. 2026-09-30 병원 관리 콘솔
분리(본인 병원만)·ADMIN은 /admin만·리뷰/신고 관리 필터·내가 쓴 리뷰(백엔드 포함). 남은 건 ⑥ 브라우저 눈 확인
(홈·비회원 흐름·건강기록 다이얼로그·토스트·병원 관리 콘솔·리뷰/신고 관리 포함). 새 세션은 여기부터.
- 제목 폰트 규칙: Jua는 **h1(PageHeader·홈 배너)과 로고만**. 섹션 제목(h2)은 `h-section`(Noto 700) —
  DESIGN_SPEC 기준. Jua는 index.html에서 `display=block`으로 따로 로드(조각 로딩 중 폰트 섞임 방지)
- 목록 "더 보기"는 `hooks/usePagedList` 재사용 (PageResponse 목록 새로 붙일 때).
- 채팅 UI(2026-10-02): 채팅방은 WebSocket 구독으로 새 메시지만 붙임(id로 중복 제거 — 내 메시지는 REST 응답과 WebSocket으로 두 번 옴). 채팅 목록은 방 칸마다 빨간 안 읽은 수 배지(헤더 알림 배지와 같은 스타일), 알림 SSE가 오면 목록 재조회로 갱신. 헤더 채팅 아이콘도 `UnreadDot`으로 전체 합계 표시(`Header`에서 알림 수신·페이지 이동 때 재조회 — 채팅 알림을 끈 유저는 페이지 이동 때만 갱신). 알림 목록에서 `CHAT_MESSAGE_RECEIVED`는 하늘색(`bg-sky-50`, `icon-badge-sky`, 점 `bg-sky-600`) + "채팅" 라벨로 구분하고 누르면 `/chats`로 이동 — 다른 알림은 브랜드색 유지
- 진료 기록(2026-10-05): 예약 관리 화면(`AdminReservationsPage` — 관리자·병원 소유자 공용)에서 진료 시간이 지난 CONFIRMED 예약에 "진료 기록" 버튼 → `pages/admin/TreatmentRecordDialog`(열 때 기존 기록을 불러와 수정, 종류 진료/접종, 다음 예정일은 진료일 다음 날부터). 반려동물 건강 기록 목록은 `hospitalName`이 있으면 "OO병원 작성" 하늘색 배지 + 수정/삭제 버튼 숨김, 다음 예정일 문구는 접종만 "다음 접종", 나머지는 "다음 내원". 알림 아이콘 `TREATMENT_RECORDED: Stethoscope`
- 예약 메모·자가 문진 첨부(2026-10-05): 병원 상세 예약 폼에 `pages/hospital/ReservationNoteFields`(증상 메모 + 최근 14일 자가 문진 첨부 체크박스, 반려동물을 바꾸면 다시 찾음). `AdminReservationsPage`는 반려동물 칸 아래에 메모·문진(하늘색) 표시
- 예약 시간 변경(2026-10-05): 내 예약 목록에서 시작 전 PENDING/CONFIRMED 예약에 "시간 변경" → `pages/reservation/RescheduleDialog`(같은 병원 AVAILABLE 슬롯을 날짜별로 보여주고 선택, "확정 대기로 돌아감" 안내). 성공하면 응답으로 목록 항목 교체
- 내 예약 화면 개편(2026-10-09): `pages/reservation/ReservationListPage` + `ReservationCard`. 반려동물 칩(둘 이상일 때, 사진 아바타)·보기 탭(다가오는/지난/취소·거절/전체 + 개수, 기본 다가오는)은 **서버 필터**(`getMyReservations(page, {petId, view})`, `getMyReservationCounts`) — 예전엔 불러온 페이지 안에서만 걸러서 다음 페이지 항목이 안 보였음. 카드: 날짜 블록(월·일·요일) + 병원명(상세 링크) + 시간·오늘/내일/D-n·진료 유형 + 반려동물 사진·이름·종·품종·나이 + 메모. 버튼: 다가오는 예약은 시간 변경·문의(채팅방 get-or-create)·예약 취소, 끝난 예약은 리뷰 쓰기(확정+지난 것)·다시 예약·삭제(목록에서 숨김). 취소·거절 탭에 "모두 삭제". 병원 상세는 `?tab=reviews|booking`으로 첫 탭 지정 가능. /pets의 다가오는 예약도 `view: UPCOMING`으로 서버에서 받음
- 리뷰 사진(2026-10-05): `pages/hospital/ReviewImages`(썸네일 줄, 누르면 원본 새 탭, 작성자면 삭제 버튼 — 병원 리뷰·내 리뷰·관리 화면 공용). 새 리뷰는 폼에서 최대 3장 고르면 리뷰 생성 후 한 장씩 업로드(사진 실패는 리뷰를 되돌리지 않고 토스트), 이후 추가/삭제는 목록의 내 리뷰에서("사진 추가 n/3"). 관리 화면은 접힌 상태 "사진 n장", 펼치면 썸네일
- 병원 통계(2026-10-05): 소유자 콘솔 "통계" 메뉴(`/dashboard/stats`, `pages/dashboard/OwnerStatsPage`) — 기간 탭 7/30/90일, KPI(전체 예약·노쇼율·취소율·슬롯 이용률), 일별 누적 막대(예약/취소·거절, 열 전체 hover 툴팁, "표로 보기"), 상태별·진료 유형별. 차트 색은 dataviz 검증기 통과값 `teal-600`(#0d9488)/`amber-600`(#d97706) — 브랜드 `#0f766e`는 채도가 낮아 차트에서 회색처럼 보여서 차트에만 한 단계 밝은 teal
- 대기 차례(2026-10-05): 내 대기 목록에서 `offerExpiresAt`이 있으면 "자리 났어요" 배지 + 강조 테두리 + "~까지 예약하지 않으면 다음 대기자에게" 안내 + "예약하러 가기"(병원 상세)
- 진료 시간(2026-10-05): `lib/openingHours.openStatus()`(서버 `isOpenAt`과 같은 규칙, 현재 시각으로 계산 — 상세 응답이 캐시돼서), `HospitalCard`·상세에 "진료 중/진료 종료" 배지(미등록이면 숨김), 병원 목록 칩 "지금 진료 중"(`openNow`, `?openNow=true`로 진입 가능), 상세 정보 탭 `WeeklyHoursTable`(오늘 강조, 구간 없는 요일 휴무) + 기존 자유 텍스트는 "운영 안내". 소유자 "병원 정보"에 `pages/dashboard/OpeningHoursEditor`(요일별 구간 추가/삭제, "월요일 시간을 평일에 적용", 저장은 별도 버튼·전체 교체). `DayOfWeek` 타입은 슬롯 일괄 생성과 공용
- 병원 프로필(2026-10-09): 라벨은 `lib/format`의 `HOSPITAL_ANIMAL_LABEL`·`HOSPITAL_AMENITY_LABEL`(키 순서 = 표시 순서), 야간 진료는 `lib/openingHours.hasNightHours()`. 상세 정보 탭 맨 위 소개 + 전화번호(`tel:` 링크) + 진료 동물, 상단 배지에 야간 진료·편의 서비스. 카드에 "강아지 · 고양이 진료"·야간 진료 배지. 목록 필터에 진료 동물·편의 서비스 셀렉트(`?animal=&amenity=`로 진입 가능). 소유자 병원 정보 폼에 전화번호·소개·진료 동물/편의 서비스 토글 — **수정 API가 전체 교체라 폼이 이 값들을 항상 같이 보내야 함**(안 보내면 저장 때 지워짐)
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
  를 따로 씀. ADMIN 전용, 로그인 시 role 보고 자동 이동.
  **병원 관리 콘솔(`/dashboard/*`, `src/pages/dashboard/`)도 같은 쉘** — `OwnerLayout`이
  `AdminLayout`에 OWNER_NAV를 넘겨 재사용, 선택 병원은 `useOwnerHospital()`. 예약·리뷰·신고 화면은
  admin 페이지를 그대로 쓰고 범위는 서버가 역할로 스코핑. 리뷰/신고 필터는 URL 쿼리(`ReviewFilterBar`).
  상세는 PROGRESS.md, 엔드포인트는 API_MAP.md·ADMIN.md(백엔드).

## 반응형 정책
- 모든 화면은 웹(데스크톱)과 모바일 브라우저 양쪽에서 정상 동작해야 함
- CSS는 모바일 퍼스트로 작성, 미디어 쿼리로 데스크톱 레이아웃 확장
- 기준 브레이크포인트: 모바일 ~767px, 태블릿 768~1023px, 데스크톱 1024px~
- 별도 네이티브 앱이 아니라 반응형 웹 하나로 대응 (모바일 전용 페이지 분리 없음)
- CSS 프레임워크: Tailwind CSS v4 (`@tailwindcss/vite`, 별도 config 파일 없이
  `src/index.css`의 `@theme`로 brand 컬러/폰트 정의)