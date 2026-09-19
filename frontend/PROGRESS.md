# PetCare Frontend — 진행 상황

CLAUDE.md에서 분리한 상세 변경 이력. 현재 상태 요약은 루트 CLAUDE.md를 보고,
"왜 이렇게 구현했는지" 배경이 필요할 때만 이 파일을 읽는다.

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
- [x] 2026-09-19 반려동물 확장 (그룹 1/4) — species(강아지/고양이, 필수)·size(소형/중형/
      대형, 선택) 폼 필드 추가. 다중 보호자(가족 공유): `GuardianSection`(소유자는
      초대/내보내기, 공동보호자는 나가기만) — 초대/퇴출/삭제는 최초 등록자 전용이라
      role==='OWNER'일 때만 해당 UI 노출, 삭제 버튼도 동일 조건. 급여량 계산기:
      `FeedingCalculatorSection`(체중/활동량 입력 → RER/DER 기반 일일 급여량, 결과에
      "수의사 자문 필요" disclaimer 그대로 노출). 건강 자가문진: `/health-check`
      페이지 — 고정 8문항 라디오 선택 → 위험도(LOW/MEDIUM/HIGH) 결과, "저장" 체크 시
      HealthRecordType.HEALTH_CHECK로 저장. PetListPage에 종/공동보호자 배지 추가
- [x] 2026-09-19 리뷰 시스템 (그룹 2/4) — `ReviewSection`(병원 상세 하단): 평점(1~5)+
      내용 작성/수정/삭제, 신고(사유 입력), 관리자·병원 답글 작성/수정/삭제(1개 제한).
      "내 리뷰" 판별은 API에 작성자 식별 필드가 없어서 localStorage(`myReviewIds`)에
      작성 직후 reviewId를 저장해서 판별 — 다른 브라우저/기기에서는 수정·삭제 버튼이
      안 보임(알려진 한계). 관리자 화면에 `ReviewModerationSection`(신고 목록 +
      숨김/해제 토글) 추가
- [x] 2026-09-19 예약 확장 (그룹 3/4) — 노쇼: 대시보드 예약 대기열에 CONFIRMED 건 "노쇼
      처리" 버튼, 고객/오너 화면 상태 배지에 NO_SHOW 반영, 관리자 통계에 노쇼 건수
      추가. 대기자명단: 병원 상세에서 슬롯이 AVAILABLE이면 기존처럼 선택해서 예약,
      RESERVED면 "대기 신청" 버튼으로 전환(이전엔 AVAILABLE 슬롯만 불러왔는데 이제
      전체 상태를 불러오도록 변경). `/waitlist` 새 페이지(대기 취소 가능), 예약
      목록에 진입 링크 추가
- [x] 2026-09-19 병원 + 계정 폴리시 (그룹 4/4, 마지막) — 병원 사진 업로드/삭제
      (대시보드), 24시간·주차 체크박스 + 평균진료비 입력(수정폼) 및 목록 검색
      필터, 카드/상세에 배지·이미지 표시. 비밀번호 재설정: `/forgot-password`
      (이메일 요청, 항상 성공 메시지) → `/reset-password`(토큰+새 비밀번호,
      백엔드가 실제 메일 발송을 안 해서 토큰은 백엔드 로그에서 확인 필요 —
      URL 쿼리로 넘어오면 자동 채움, 아니면 수동 입력). 알림 카테고리 on/off:
      MyPage에 `NotificationPreferenceSection`(5개 토글). 관리자 유저 정지:
      UserManagementSection에 정지/정지해제 버튼 + 배지
- [x] 2026-09-19 마무리 정리 — HealthRecordType에 WALK(산책)/MEAL(식사)/
      EXCRETION(배변)/HEALTH_CHECK(자가문진) 라벨·아이콘 추가(TYPE_LABEL/TYPE_ICON
      3개→7개, 이전엔 자가문진 결과가 기록 목록에서 아이콘 없이 깨졌을 것).
      병원 등록(`POST /api/hospitals`, ADMIN 전용) 화면이 아예 없었던 걸 발견해서
      UserManagementSection에 이름+주소만 받는 간단한 등록 폼 추가 — 위경도·운영시간·
      24시간·주차·진료비·사진은 등록 후 대시보드에서 채우도록 안내 문구로 분리
- [x] 2026-09-20 문서 재구성 — CLAUDE.md가 세션마다 항상 로드되는데 진행상황
      체인지로그와 엔드포인트 상세 매핑이 계속 길어져서, 진행상황은 이 파일
      (PROGRESS.md)로, 엔드포인트 매핑은 API_MAP.md로 분리. 루트 CLAUDE.md는
      개요/스택/컨벤션/핵심 API 계약만 남김. src/api/CLAUDE.md도 추가(해당 폴더
      작업할 때만 로드됨 — axios 인스턴스/페이지네이션 컨벤션 요약)

- [x] 2026-09-20 디자인 업그레이드 1단계 (기반 작업) — `redesign-existing-projects`
      스킬 적용(design-taste-frontend는 스킬 자체 규정상 대시보드/제품 UI가
      out-of-scope라 전환). `motion` 라이브러리 설치, `Reveal`/`RevealItem`
      컴포넌트(useReducedMotion 대응 whileInView 스태거) 추가 후 HomePage/
      PetListPage/HospitalListPage에 적용. index.css `@theme`에서 shadow-sm/
      shadow/shadow-md를 브랜드 teal 톤으로 틴트(기존 shadow 클래스 쓰는 곳
      전부 자동 적용), text-wrap: pretty/balance, prefers-reduced-motion
      감안한 smooth scroll, `.skip-link` 유틸리티 추가. Button.jsx에
      active:scale-[0.97] 프레스 피드백 + hover:shadow-md(공용 컴포넌트라
      전체 버튼에 자동 적용). 페이지 h1을 19개 파일에서 `text-xl
      font-semibold` → `text-2xl font-bold tracking-tight`로 일괄 업그레이드.
      HospitalCard에 hover 리프트(-translate-y-0.5 + shadow-md) 추가.
      기본 Vite 파비콘(AI-보라 `#863bff`)을 브랜드 teal 발바닥 아이콘으로 교체.
      `NotFoundPage.jsx` 추가 — 이전엔 `*` 라우트가 그냥 `/`로 조용히
      리다이렉트했음. Layout에 스킵 링크 추가
- [ ] 남은 것 (디자인 업그레이드, 다음 라운드 후보) — 나머지 목록 화면들
      (알림/예약/대기목록/채팅방/즐겨찾기/대시보드/관리자)에 Reveal 확장,
      반복되는 카드 마크업(37곳, 25파일)을 공유 `Card` 컴포넌트로 추출,
      성공/실패 피드백용 가벼운 토스트 시스템(인라인 텍스트만 있던 걸 보강),
      로그인/회원가입 폼 전환 애니메이션, 대시보드/관리자 통계 카드 숫자
      카운트업 등. 사용자 확인 후 순서 정하기로 함

## 참고
- 빌드 번들이 500KB를 넘어 vite가 code-splitting 권장 경고를 띄움 (motion
  추가 후 630KB로 더 커짐). 기능은 다 붙었으니 라우트 단위 lazy import
  (`React.lazy`)로 정리하면 되는데, 디자인 작업 마무리 후 한 번에 처리하는
  게 효율적
