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
- 에러 HTTP 코드: 400 유효성 실패, 401 인증 실패/토큰 만료, 403 권한 없음, 404 없음, 409 충돌
- Swagger: http://localhost:8080/swagger-ui/index.html

## 인증 규칙
- POST /api/auth/signup { email, password }
- POST /api/auth/login { email, password } → { accessToken, expiresIn(ms) }
- 이후 모든 요청에 Authorization: Bearer {accessToken} 필요 (auth/swagger 제외)
- Refresh Token 없음 — 토큰 만료(1시간) 또는 401 응답 시 즉시 로그인 화면으로 리다이렉트
- 토큰은 axios 인터셉터에서 자동으로 헤더에 첨부

## 주요 엔드포인트
- 내 정보: GET/PATCH /api/users/me, PATCH /api/users/me/password
- 반려동물: GET/POST /api/pets, GET/PATCH/DELETE /api/pets/{id}
- 건강기록: GET/POST /api/pets/{petId}/health-records, PATCH/DELETE /api/pets/{petId}/health-records/{id}
- 병원 조회: GET /api/hospitals (로그인만 하면 조회 가능)
- 슬롯 조회: GET /api/hospitals/{hospitalId}/slots?status=AVAILABLE
- 예약: GET/POST /api/reservations, PATCH /api/reservations/{id}/cancel
- 알림: GET /api/notifications, PATCH /api/notifications/{id}/read

## 폴더 구조
src
├── pages       (화면 단위 컴포넌트, 도메인별 하위 폴더: auth/pet/hospital/reservation)
├── components  (common: 버튼/인풋 등 / layout: 헤더/푸터)
├── api         (axiosInstance.js + 도메인별 api 함수: authApi, petApi 등)
├── hooks       (useAuth 등 커스텀 훅)
└── router      (AppRouter.jsx, PrivateRoute)

## 컨벤션
- API 응답의 success/message를 활용해 에러 토스트/얼럿 처리 통일
- 401 수신 시 공통 인터셉터에서 토큰 삭제 + /login으로 리다이렉트
- 커밋 메시지: "타입: 설명" 형식, 한국어 (예: feat: 로그인 화면 구현)

## 진행 방식
- 한 번에 다 만들지 말고 단계별 진행 (세팅 → 인증 플로우 → 핵심 화면 → 심화 기능)
- CORS는 백엔드에서 http://localhost:5173만 허용됨. 다른 포트 쓰면 백엔드
  SecurityConfig.corsConfigurationSource()에 추가 필요

### 진행 상황
- [x] 세팅 — Vite+React+Router+Axios+Tailwind, axiosInstance(토큰 첨부/401 리다이렉트),
      AppRouter+PrivateRoute, 반응형 Header(데스크톱 가로 네비 / 모바일 하단 탭바)
- [x] 인증 플로우 — LoginPage, SignupPage
- [x] 핵심 화면 — 반려동물 CRUD, 마이페이지(이메일·비밀번호 변경), 병원 목록/상세+예약,
      예약 목록/취소, 알림 목록/읽음 처리
- [x] 심화 기능 (일부) — 건강기록 CRUD (반려동물 수정 화면 안 섹션으로 통합)
- [ ] 남은 것 — 체중 그래프, 알림 안읽음 뱃지, 검색/필터 등 (필요해지면 논의 후 진행)
- 디자인: teal 계열 단일 accent 컬러, stone 중성 배경. 모양은 버튼 pill / 카드
  rounded-2xl / 입력창 rounded-lg로 통일

  ## 반응형 정책
- 모든 화면은 웹(데스크톱)과 모바일 브라우저 양쪽에서 정상 동작해야 함
- CSS는 모바일 퍼스트로 작성, 미디어 쿼리로 데스크톱 레이아웃 확장
- 기준 브레이크포인트: 모바일 ~767px, 태블릿 768~1023px, 데스크톱 1024px~
- 별도 네이티브 앱이 아니라 반응형 웹 하나로 대응 (모바일 전용 페이지 분리 없음)
- CSS 프레임워크는 아직 미정 — Tailwind CSS 사용 여부를 세팅 단계에서 결정