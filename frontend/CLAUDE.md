# PetCare Frontend

## 프로젝트 개요
반려견 케어 시스템 프론트엔드. 백엔드(Spring Boot)는 이미 구현 완료 상태이며,
이 저장소는 React로 화면을 붙이는 작업만 진행한다. 포트폴리오 목적, 혼자 개발.

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
- accessToken/refreshToken 둘 다 axios 인터셉터/훅에서 자동 처리 (localStorage에
  accessToken, refreshToken 키로 저장)
- User.role: USER / HOSPITAL_OWNER / ADMIN — useAuth가 로그인 시 GET /api/users/me로
  role/userId까지 가져와 보관. 라우터에서 OwnerRoute(HOSPITAL_OWNER+ADMIN, `/dashboard`)
  / AdminRoute(ADMIN 전용, `/admin`)로 가드, Header 네비도 role에 따라 항목 추가

## 주요 엔드포인트
(→ 표시는 연결된 프론트 라우트/화면. 전부 구현 완료, 예외는 명시)
- 내 정보: GET/PATCH /api/users/me, PATCH /api/users/me/password → MyPage.
  GET /api/users/me/upcoming-vaccinations → HomePage (D-day 목록)
- 반려동물: /api/pets (CRUD) → /pets, /pets/new, /pets/:petId.
  /api/pets/{id}/image (업로드/삭제) → PetFormPage 원형 썸네일.
  /api/pets/{petId}/health-records (CRUD) → HealthRecordSection (WEIGHT 기록은
  체중 그래프, VACCINATION은 nextDueDate 입력 가능)
- 병원: GET /api/hospitals(검색 — keyword/minRating/sort/lat/lng/radiusKm, 응답에
  openingHours/specialty/averageRating/reviewCount/distanceKm 포함, 배열 그대로)
  → /hospitals. GET/PATCH /api/hospitals/{id} → 상세/대시보드 수정폼.
  /api/hospitals/{id}/slots → 예약 가능 시간 + 대시보드 슬롯 등록.
  /api/hospitals/{id}/favorites, GET /api/favorites → 하트 토글, /favorites.
  /api/hospitals/{id}/reviews (리뷰 CRUD) — **프론트 미구현**, averageRating/
  reviewCount는 표시만 하고 리뷰 작성 화면은 없음
- 예약: PENDING으로 생성 → 병원측이 확정/거절 (CONFIRMED/REJECTED). 상태: PENDING/
  CONFIRMED/REJECTED/CANCELLED. /api/reservations (CRUD + cancel) → /reservations.
  /api/admin/reservations (목록+confirm/reject) → /dashboard 예약 대기열
- 알림: GET /api/notifications, GET /unread-count, GET /subscribe(SSE, 쿼리파라미터
  ?token={accessToken}로 인증, "connect"/"notification" 이벤트), PATCH /{id}/read
  → /notifications, Header 벨 아이콘 뱃지(useNotifications 컨텍스트)
- 채팅: /api/chat-rooms (방 생성/목록/메시지) → /chats, /chats/:roomId. 새 메시지는
  SSE 알림 type: CHAT_MESSAGE_RECEIVED로 옴 → 열려있는 채팅방이면 재조회
- 관리자(ADMIN 또는 소유 HOSPITAL_OWNER): /api/admin/reservations(위 참고),
  /api/admin/stats/*, /api/admin/users(ADMIN 전용, 역할변경),
  /api/admin/hospitals/{id}/owner(ADMIN 전용), /api/admin/reminders/run(ADMIN 전용)
  → /admin (AdminPage + UserManagementSection)

## 폴더 구조
src
├── pages       (화면 단위 컴포넌트, 도메인별 하위 폴더: auth/pet/hospital/reservation/
│               mypage/notification/chat/dashboard/admin. HomePage는 최상위)
├── components  (common: Button/TextField / layout: Header/Layout)
├── api         (axiosInstance.js + 도메인별 api 함수: authApi, userApi, petApi,
│               healthRecordApi, hospitalApi, reservationApi, reservationAdminApi,
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
- [x] 세팅 — Vite+React+Router+Axios+Tailwind, axiosInstance(토큰 첨부/401 리다이렉트),
      AppRouter+PrivateRoute, 반응형 Header(데스크톱 가로 네비 / 모바일 하단 탭바)
- [x] 인증 플로우 — LoginPage, SignupPage (+ refreshToken 재발급, 로그아웃 API 연동)
- [x] 핵심 화면 — 반려동물 CRUD, 마이페이지(이메일·비밀번호 변경), 병원 목록/상세+예약,
      예약 목록/취소, 알림 목록/읽음 처리
- [x] 심화 기능 (일부) — 건강기록 CRUD (반려동물 수정 화면 안 섹션으로 통합),
      알림 SSE 실시간 구독 + Header 안읽음 뱃지
- [x] 2026-09-17 백엔드 대규모 업데이트 대응 — 목록 API PageResponse(`.content`)
      전환, 로그인 refreshToken/reissue/logout, 예약 REJECTED 상태 반영
- [x] 병원 검색 강화 — 이름 검색(디바운스), 평점 필터, 정렬(이름/평점/리뷰순),
      "내 주변"(Geolocation API로 lat/lng, 반경 선택) → 목록/상세에 평점·진료과목·
      운영시간·거리 표시
- [x] HOSPITAL_OWNER/ADMIN 대시보드 (`/dashboard`, useAuth에 role 추가해 OwnerRoute로
      가드) — 예약 대기열(확정/거절), 병원 정보 수정, 슬롯 등록. 백엔드에 "내 병원
      조회" API가 없어서 병원은 드롭다운으로 직접 선택하게 하고 권한은 백엔드
      403(`isManagedBy`)로 걸러짐. 예약 목록엔 반려동물 이름 대신 petId만 표시
      (다른 유저 반려동물 조회 API가 없음 — 이름 표시하려면 백엔드에
      ReservationResponse에 petName 추가하거나 관리자용 pet 조회 API가 필요)
- [x] 2026-09-18 반려동물 이미지 업로드 — PetFormPage에 원형 썸네일 업로드/삭제
      (POST·DELETE /api/pets/{id}/image), PetListPage 카드에도 썸네일 반영
- [x] 병원 즐겨찾기 — `HospitalCard` 컴포넌트로 병원 목록/즐겨찾기 목록 카드 통일,
      하트 토글(목록·상세 양쪽), 마이페이지에 "즐겨찾기한 병원 보기" 링크(`/favorites`)
- [x] 1:1 채팅 — 병원 상세의 "병원에 문의하기" → 방 생성/조회 → `/chats/:roomId`,
      Header에 채팅 아이콘(항상 노출). useAuth에 userId 추가해서 내 메시지 구분.
      새 메시지는 SSE notification 이벤트가 오면 무조건 재조회(방 구분 정보가
      알림 payload에 없어서 — 열려 있는 채팅방 기준으로만 재조회, 과다호출은 감수)
- [x] 관리자(ADMIN) 전용 화면 (`/admin`, AdminRoute로 ADMIN만 가드) — 전체
      통계 요약, 병원별 통계, 리마인더 수동 실행, 사용자 목록+역할 변경, 병원
      소유자 지정
- [x] 2026-09-18 예정 접종(D-day) 목록 + 체중 그래프 — HomePage를 자리표시자에서
      `GET /api/users/me/upcoming-vaccinations` 기반 D-day 목록으로 교체(7일 이내는
      빨간 배지). HealthRecord에 있던 `nextDueDate` 필드를 그동안 건강기록 폼에서
      입력할 곳이 없었어서 VACCINATION 타입일 때만 보이는 입력으로 추가(이게 없으면
      D-day 목록이 항상 비어있었음). 체중 그래프는 라이브러리 없이 순수 SVG
      폴리라인(`WeightChart.jsx`)으로 구현, HealthRecordSection에서 WEIGHT 타입
      기록만 뽑아 날짜순 정렬해 표시
- [ ] 남은 것 — 병원 리뷰 작성/수정/삭제 화면 (`/api/hospitals/{id}/reviews`, 백엔드는
      구현되어 있고 평점/리뷰수는 표시 중이나 작성 UI가 없음)
- [ ] 발견한 것 — Pet에 `size`(PetSize enum) 필드가 있는데 PetFormPage가 아직 안 씀
      (사이즈 선택 UI 미구현, imageUrl은 반영함)
- 디자인: teal 계열 단일 accent 컬러, stone 중성 배경. 모양은 버튼 pill / 카드
  rounded-2xl / 입력창 rounded-lg로 통일

## 반응형 정책
- 모든 화면은 웹(데스크톱)과 모바일 브라우저 양쪽에서 정상 동작해야 함
- CSS는 모바일 퍼스트로 작성, 미디어 쿼리로 데스크톱 레이아웃 확장
- 기준 브레이크포인트: 모바일 ~767px, 태블릿 768~1023px, 데스크톱 1024px~
- 별도 네이티브 앱이 아니라 반응형 웹 하나로 대응 (모바일 전용 페이지 분리 없음)
- CSS 프레임워크: Tailwind CSS v4 (`@tailwindcss/vite`, 별도 config 파일 없이
  `src/index.css`의 `@theme`로 brand 컬러/폰트 정의)