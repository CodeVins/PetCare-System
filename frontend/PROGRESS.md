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

- [x] 2026-09-22 디자인 시안(petcare-ui-source/) 이식 — DESIGN_SPEC.md 규칙대로
      전면 재작업. **토큰부터 갈아끼우는 방식**을 택함: index.css `@theme`의
      brand 램프를 스펙 teal(#0F766E 축)로 재매핑해서, 앱 전반에 이미 쓰이던
      bg-brand-600 / text-brand-700 / border-brand-200 호출부를 한 줄도 안 고치고
      새 팔레트가 적용되게 했다. 폰트도 Pretendard → Noto Sans KR 본문 +
      Jua(`--font-display`, h1에 전역 적용).
      공통 클래스는 `@layer components`가 아니라 `@utility`로 정의 — Tailwind v4는
      @apply가 유틸리티만 받아서, `.card-interactive`가 `.card`를 @apply하려면
      @utility여야 함(빌드 에러로 확인). card / btn(+primary·secondary·danger·sm) /
      input / chip(+on·soft) / segmented / badge(ok·wait·danger·neutral) /
      icon-badge(+amber·sky) / h-section.
      주의: Tailwind v4 동적 spacing 스케일은 정수만 됨 — `h-5.5`, `px-4.5`,
      `size-5.5`, `leading-5.5`는 CSS가 아예 생성되지 않아 정수로 교체했다.
      빌드는 그냥 통과하므로 dist CSS를 grep해야 발견된다.
      새 공통 컴포넌트: Alert, EmptyState, StatusBadge, SelectField, ChoiceGroup,
      Tabs(motion layoutId 밑줄), Toggle(role=switch), MenuList, PageHeader.
      Header/Layout 재작성 — 모바일 56px 헤더 + 76px 하단 탭바(활성 탭 pill을
      layoutId로 슬라이드), 데스크톱 72px 네비 + 본문 1120px 중앙 정렬. 탭 구성은
      스펙대로 role에 따라 갈림: 보호자는 홈·반려동물·병원·예약·마이페이지,
      HOSPITAL_OWNER/ADMIN은 홈·대시보드·채팅·알림·마이페이지(빠진 항목은
      마이페이지 하위 메뉴로 내려감).
      중복 제거: 화면 6~7곳에 흩어져 있던 날짜/체중/종 포맷터를 `src/lib/format.js`로,
      예약↔슬롯↔병원 N+1 조인을 `reservationApi.getSlotIndex()` /
      `getMyReservationsDetailed()`로 합침(예약목록·대기목록·홈·대시보드가 공유).
      화면 구조가 바뀐 곳: 홈(인사말+반려동물 아바타+접종+예약+바로가기, 데스크톱
      7/5 그리드), 반려동물 상세(개요·건강기록·급여량·보호자 탭), 병원 상세(정보·
      예약·리뷰 탭 + 데스크톱 340px 사이드), 병원 목록(데스크톱 280px 필터 사이드바),
      자가문진(반려동물 선택 → 문항 1개씩 + 진행바 → 결과, 3단계 위저드),
      마이페이지(메뉴 리스트로 바꾸고 `/mypage/notifications`, `/mypage/account`
      라우트 분리), 대시보드(예약관리·병원정보·예약슬롯·리뷰답글 탭 —
      HospitalManageSection을 HospitalInfoSection + SlotSection으로 분리),
      관리자(현황·사용자·리뷰신고 탭)
- [ ] 시안과 다르게 둔 것 (의도적) — 1. 예약 플로우를 Booking1~3 별도 3페이지
      위저드로 만들지 않고 병원 상세의 "예약" 탭 하나로 뒀다. 라우트·상태를 3개로
      쪼개는 비용 대비 얻는 게 적어서. 2. 상세·폼 화면의 56px 전용 헤더 + 하단 고정
      액션바 대신, 공통 헤더/탭바를 그대로 두고 본문 맨 위 PageHeader(뒤로가기+제목)로
      대체. 3. 관리자 신고 목록은 시안의 테이블 대신 카드 리스트 유지 — 모바일용
      마크업을 따로 만들지 않기 위해. 4. 예약/대기 세그먼트의 "대기 n" 개수는 예약
      화면에서 대기 목록을 한 번 더 부르게 되므로 대기 화면에서만 표시.
      5. 아이콘은 시안의 인라인 SVG를 그대로 베끼지 않고 이미 설치된
      @phosphor-icons/react(outline) 유지

- [x] 2026-09-22 예약 목록 상태 필터 + 반려동물 개요 탭 읽기전용화 —
      ReservationListPage에 전체/대기중/확정/지난 예약(거절·취소·노쇼 통합) 칩
      필터 추가, 칩마다 개수 표시. PetFormPage의 "개요" 탭이 곧장 수정 폼을
      보여주던 걸 읽기전용 정보 카드(이름/종/품종/생년월일+나이/크기/현재 체중)로
      바꾸고, 우측 상단 연필 아이콘으로 폼 진입/취소(스냅샷으로 되돌림) 하게 함.
      현재 체중은 건강기록 중 WEIGHT 타입 최신 값을 조회해서 표시(ponytail: 개요
      탭 전용 API가 없어 건강기록 전체를 한 번 더 불러옴 — 건강기록 탭 전환 시
      중복 호출됨, 전용 "최신 체중" 엔드포인트 생기면 교체).
      InfoRow(dl 한 줄 표시)를 HospitalDetailPage에서 `components/common/`으로
      추출해 공유.

- [x] 2026-09-22 관리자 전용 대시보드 패널 신설 — 백엔드 ADMIN.md 기능을 따라가되
      소비자 앱(모바일 하단탭바/pill/Jua)과 완전히 분리된 `/admin/*` 영역을 새로
      만듦. `AdminLayout`(데스크톱 좌측 사이드바 + 모바일 상단 스크롤 탭, stone-900
      어두운 톤)이 소비자 `Layout`을 대체하고, 버튼/입력창/표는 pill이 아니라
      `admin-card`/`admin-btn-*`/`admin-input`/`admin-th`·`admin-td`(index.css에
      새 @utility 블록)로 밀도 높은 "관리 도구" 톤을 줌 — 색(brand/stone/badge-*)만
      공유하고 형태는 의도적으로 다르게 함.
      페이지: `/admin`(대시보드 — 요약 KPI 7개 + 병원별 예약 순위 바 + "처리가
      필요해요" 퀵링크(대기중 예약·미처리 리뷰신고 건수) + 리마인더 수동실행),
      `/admin/stats`(통계 — KPI + 예약 상태 분포 스택바 + 검색·정렬 가능한 병원별
      통계 표), `/admin/users`(검색·역할/정지 필터 + 인라인 역할변경·정지 표),
      `/admin/users/:userId`(개인 통계 — 예약/노쇼(율)/리뷰답글/펫/공동보호자 수,
      새로 붙은 `GET /api/admin/users/{id}/stats` 연동. 단일유저 조회 API가
      없어서 목록에서 find), `/admin/hospitals`(목록+검색 + 병원 등록 + 소유자
      지정), `/admin/reservations`, `/admin/reviews`(기존 대시보드 컴포넌트를
      표 형태로 재작성). 기존 AdminPage.jsx/UserManagementSection.jsx/
      ReviewModerationSection.jsx는 삭제하고 이 구조로 대체.
      ADMIN 전용 가드(AdminRoute 그대로 재사용, 로딩 스켈레톤만 어두운 톤으로
      교체) — HOSPITAL_OWNER는 건드리지 않고 기존 `/dashboard`(소비자 앱 톤)
      그대로 씀, 백엔드가 이미 같은 엔드포인트를 역할별로 스코핑해서 내려주므로
      프론트가 따로 나눌 필요는 없었음.
      로그인 흐름 변경: 로그인 응답에 role이 없어서(accessToken/refreshToken만
      옴) LoginPage가 로그인 직후 `GET /api/users/me`를 한 번 더 호출해 role을
      확인하고 ADMIN이면 `/admin`, 아니면 기존처럼 `/`로 보냄.

- [x] 2026-09-22 반려동물 성별/중성화 + 예약 진료유형 프론트 연동, 관리자
      리뷰신고 화면 개선 — 백엔드가 이미 추가해 둔 필드들을 뒤늦게 반영.
      **반려동물**: `Pet.sex`(MALE/FEMALE)·`neutered`(Boolean, 둘 다 nullable) →
      PetFormPage 폼에 ChoiceGroup 2개 추가(성별, 중성화 완료/안함/모름 3택),
      개요 InfoRow에도 노출. neutered는 tri-state라 폼 상태는 `''|'true'|'false'`
      문자열로 다루다가 제출 시 `null|true|false`로 변환.
      **예약 진료유형**: `ReservationCreateRequest.type`이 `@NotNull`로 바뀌어서
      HospitalDetailPage 예약 탭에 "진료 유형" SelectField(정기검진/예방접종/진료/
      수술/미용/기타)를 필수로 추가 안 했으면 예약 자체가 400으로 실패하는
      상황이었음 — 예약 버튼도 유형 선택 전까진 비활성화하도록 바꿈.
      **덤으로 얻은 단순화**: `ReservationResponse`가 이제 반려동물 스냅샷
      (petName/petSpecies/petBreed/petBirthDate/petSize/petSex/petNeutered/
      petImageUrl)을 통째로 실어 보내서, `reservationApi.getMyReservationsDetailed()`
      가 하던 `getMyPets()` 조인이 통째로 필요 없어짐 — 삭제. 슬롯→병원명 조인만
      남음. 예약 목록/대시보드 예약대기열/관리자 예약 테이블 3곳 전부 "반려동물
      ID {id}" 대신 실제 이름(+종·나이 캡션)과 진료유형 배지를 보여주도록 갱신.
      `lib/format.js`에 `SEX_LABEL`/`RESERVATION_TYPE_LABEL`/
      `reservationPetCaption()` 추가.
      **관리자 리뷰 신고**: 표 레이아웃이 별점을 숫자("5점")로, 리뷰 내용을
      2줄로 잘라 보여줘서 "숨길지 말지" 판단하기 불편했음 — 카드 레이아웃으로
      바꿔 원문 전체 + 실제 별 아이콘(`Stars` 컴포넌트, ReviewSection.jsx 안에
      있던 걸 `components/common/`으로 추출해 공유) + 신고 사유 + 병원명(신고
      응답의 hospitalId를 `getHospitals()` 목록과 조인) + 신고 일시를 다 보여줌.
      "노출중인 신고만" 체크박스로 처리 안 된 것만 걸러볼 수 있게 함.

- [x] 2026-09-27 클라이언트 조인 제거 + 내 리뷰 판별을 서버 값으로 — 백엔드가
      ReservationResponse/WaitlistResponse에 hospitalName/startTime/endTime
      (대기는 petName도)을, ReviewResponse에 `mine`을 추가해서 우회 코드 삭제.
      `reservationApi.getSlotIndex()`/`getMyReservationsDetailed()` 삭제 — 예약
      목록·홈·대기 목록·대시보드 예약대기열·관리자 예약 5곳이 응답 필드를 바로
      씀(`formatSlot(reservation)`). 겸사겸사 고쳐진 버그: getSlotIndex는 병원별
      슬롯 첫 페이지(20개)만 받아서, 슬롯이 많은 병원의 예약은 "병원 정보 없음/
      시간 정보 없음"으로 보였음. ReviewSection의 localStorage(`myReviewIds`)
      추적 삭제 → `review.mine`. 같이 발견한 버그: 리뷰 수정 응답은 reply가 항상
      null이라 `{...review, ...data.data}`로 덮으면 병원 답글이 새로고침 전까지
      사라졌음 → 기존 reply 유지

- [x] 2026-09-27 대시보드 슬롯 반복 등록/삭제 — SlotSection에 "한 개씩/반복
      등록" 전환(ChoiceGroup). 반복 등록은 기간(date 2개) + 요일 토글 칩(기본
      월~금) + 하루 시간대(time 2개) + 간격(15/20/30/60분) → `createSlotsBulk`,
      결과를 "N개 등록 (겹친 M개는 건너뜀)"으로 안내. 예약 가능 슬롯 칩에 X 버튼
      으로 삭제(confirm 후). 삭제 실패(409) 메시지가 목록을 가리지 않도록 에러가
      있어도 목록은 계속 보여줌. 백엔드 GET slots가 지난 슬롯을 빼고 시간순으로
      주게 바뀌어서 프론트 정렬 코드는 필요 없음
- [x] 2026-09-27 "다음 할 일" ①②③④⑦ 처리 (빌드·lint 통과, 브라우저 확인은 ⑤⑥과 함께 남음)
    - ① `useNotifications`: `onerror`에서 직접 close → 3초 뒤 `getUnreadCount()`(axios
      인터셉터가 만료 토큰 reissue, 놓친 알림 수도 재동기화) → 최신 토큰으로 새
      EventSource. reissue 실패면 인터셉터가 /login으로 보냄(계정 정지 포함)
    - ② `hooks/usePagedList(fetchPage, key, errorMessage)` — 0페이지 로드 + "더 보기"
      append(id 중복 제거), key 바뀌면 처음부터. 내 예약/알림/대시보드·관리자 예약에 적용.
      한계: offset 페이지라 확정·거절로 항목이 빠지면 다음 페이지에서 그만큼 건너뛸 수
      있음. 내 예약 필터 칩 개수는 불러온 만큼 기준. size:100 목록(채팅 메시지 등)은 그대로
    - ③ 알림 화면 PageHeader에 "모두 읽음" → `markAllNotificationsAsRead` 후 목록 전부 read +
      `refreshUnreadCount()`. 부제 "읽지 않은 알림 N개"는 전역 뱃지 수로 바꿈(페이지 단위라)
    - ④ 대시보드 "리뷰 신고" 탭 = `dashboard/ReviewReportSection`(admin 카드 구성을 card/
      badge/btn-* 톤으로). 서버가 스코핑하는 탭이라 예약 관리처럼 병원 선택 없이 표시.
      숨김 토글 시 같은 reviewId 신고 전부 같이 갱신
    - ⑦ AppRouter 전 페이지 `React.lazy`, Layout/AdminLayout의 Outlet을 `Suspense`로 감싸서
      헤더·사이드바 유지. 메인 번들 718KB → 417KB, vite 경고 사라짐
- [x] 2026-09-27 비회원 모드 + 랜딩 + TypeScript 전환 + React 19 기능 (typecheck·빌드·lint
      통과, 백엔드 AuthFlowTest 통과. **브라우저 눈 확인은 안 함** — 랜딩 레이아웃/모바일 확인 필요)
    - 요구: 첫 진입이 /login으로 튕기지 않게, 비회원도 홈·병원 목록을 보며 서비스 목적과
      기능을 한 번에 알 수 있게, 예약·마이페이지 등은 "회원가입/로그인 후 이용해 주세요" 안내
    - 백엔드: `SecurityConfig.PUBLIC_GET_PATHS`로 병원 목록/상세/리뷰/슬롯 GET만 공개(경로
      명시, `/**` 안 씀). `ReviewController.getReviews`가 비회원(principal null) 처리
    - 라우터: Layout을 바깥으로 빼고 `/`, `/hospitals`, `/hospitals/:id`는 공개, 나머지는
      PrivateRoute → 비회원이면 `LoginRequired` 화면(Layout 안, 로그인/회원가입 버튼 +
      `state.from`). 관리자 패널은 Layout 밖이라 AdminRoute가 비회원을 /login으로 직접 보냄
    - axiosInstance: 토큰이 없는 비회원의 401은 /login 리다이렉트 없이 reject만(화면이 안내)
    - 로그인 후 `state.from`으로 원래 화면 복귀(ADMIN은 from 없을 때만 /admin). 가입→로그인까지
      from 이어서 전달. AuthShell에 "둘러보기로 돌아가기" 링크. 로그아웃은 /login 대신 홈으로
    - Header: 비회원은 채팅/알림/로그아웃 대신 로그인·회원가입 버튼, 탭은 USER_NAV 그대로
      (회원 탭을 누르면 LoginRequired). SSE는 원래도 isAuthenticated일 때만 연결
    - 홈 = `HomePage`가 분기: 비회원 `home/GuestLanding`(teal 히어로 + 실제 화면 축약 미리보기
      카드(motion 부유) + 공개 API 실시간 숫자 + 기능 6개 카드(누구나/회원 전용 뱃지) + 평점
      상위 병원 3곳 + 3단계 시작 + 병원 운영자 안내 + 마지막 CTA), 회원 `home/MemberHome`(기존 홈)
    - 병원 상세: 병원·슬롯(공개)과 내 반려동물(회원)을 분리 조회 — 이전엔 Promise.all 하나라
      비회원이면 통째로 실패. 비회원은 예약 시간을 표시용 칩으로 보고 "진료 예약" 안내,
      하트/문의 버튼은 누르면 해당 기능 LoginRequired. 리뷰는 읽기만, 작성 폼 자리에 안내
    - TS: tsconfig strict + noUnused*, `src/types/api.ts`(백엔드 record/enum 그대로 옮김),
      api 함수 전부 `ApiPromise<T>` 반환 타입, catch는 `errorMessage(err, fallback)` 헬퍼로 통일
      (24개 파일 codemod). `npm run build` = `tsc --noEmit && vite build`
    - TS 전환 중 발견해 고친 것: 병원 상세 "전화번호" 행이 DTO에 없는 `hospital.phone`을 읽어
      항상 숨겨지던 죽은 코드(삭제), RevealItem의 `motion[as]` 동적 조회 → div/li 분기
    - React 19: `use(Context)` + `<Context value>`(useAuth/useNotifications, Provider 밖 사용 시
      에러), 인증 폼 4개 `useActionState` + `<form action>` + `SubmitButton`(useFormStatus),
      즐겨찾기 `useOptimistic`(`hooks/useFavoriteIds`, 실패 시 자동 복귀 — 목록·상세 공용),
      예약 버튼 `useTransition`, 랜딩 숫자/추천 병원은 `use(promise)` + Suspense, 페이지 `<title>`
    - 한계: 랜딩 공개 데이터 Promise는 세션 동안 캐시(새로고침 전까지 갱신 X). 인증 폼은
      비제어 입력이라 실패 시 비밀번호 칸은 비워짐(이메일은 state로 유지). 나머지 화면은
      기존 로직에 타입만 붙였고(useActionState 등은 인증 폼·즐겨찾기·예약에만), 다른 폼은 그대로
- [x] 2026-09-27 홈 통일 + 사람이 만든 듯한 구성 + 공지·FAQ·약관·방침 (typecheck·빌드 통과,
      **브라우저 눈 확인 안 함**)
    - 폰트 섞임: Jua 글리프 누락은 아님(unicode-range로 확인). 원인 두 가지 — ① 랜딩 h2에 Jua를 써서
      Noto 굵은 머리말·인라인 뱃지와 한 줄에 섞임(DESIGN_SPEC은 h2를 Noto 700으로 규정) ② 한글
      웹폰트가 글자 범위별 조각으로 로드되는데 display=swap이라 늦게 온 조각 글자만 기본 폰트로
      그려짐. → 섹션 제목은 전부 `h-section`, Jua는 index.html에서 display=block 별도 링크
    - 홈: 회원/비회원 분기(GuestLanding/MemberHome) 삭제하고 HomePage 하나로. 구성은 검색 배너
      (React 19 form action → /hospitals?keyword=, #24시간 등 바로 찾기) → 바로가기 6칸 → 이용 안내
      (비회원/보호자/병원 관리자가 각각 할 수 있는 일) → 평점 높은 병원 5곳(use+Suspense) →
      공지사항/FAQ 미리보기. 로그인 여부로 바뀌는 건 이용 안내의 링크 하나(회원가입 ↔ 내 반려동물)
    - "AI스러운" 요소 제거: 그라데이션 블러 원·부유하는 미리보기 카드·아이브로 알약·3단계 번호·
      마지막 CTA 띠·통계 숫자 줄·스크롤 페이드인. 문구도 광고체 대신 서비스 안내체로
    - /pets: MemberHome의 인사말(→ PageHeader 부제), 다가오는 접종, 다가오는 예약(3건+전체보기),
      병원 찾기 바로가기(예약 없을 때)를 옮김. 반려동물 카드의 페이드인 애니메이션도 뺌
    - 공지사항(/notices, /notices/:id 이전·다음글), FAQ(/faq, 분류 칩 + details 아코디언),
      이용약관(/terms), 개인정보처리방침(/privacy) — 전부 공개 라우트. 데이터는 `src/content/`
      정적 파일. 약관·방침·FAQ 문구는 실제 백엔드 규칙 기준으로 작성(리뷰는 확정 예약 이력 필요,
      접종 알림 D-3부터 매일 9시, 예약 이력 있는 반려동물 삭제 불가, 위치정보 미저장 등).
      데모 서비스이며 실제 병원과 무관하다는 고지를 공지·약관·방침·푸터에 넣음
    - 푸터(Layout): 공지사항 | FAQ | 이용약관 | **개인정보처리방침**, 문의 help@petcare.example
      (예약 도메인). 모바일 탭바 여백을 main → Footer로 옮김
    - HospitalListPage가 URL 쿼리(keyword/is24Hours/hasParking/minRating)로 초기 필터를 채움
- [x] 2026-09-27 건강기록 화면 개편 (typecheck·빌드·lint 통과, 브라우저 확인 안 함)
    - 작성/수정 폼을 `HealthRecordDialog`로 분리 — 네이티브 `<dialog>`(모바일 하단 시트,
      데스크톱 가운데 창, Esc·포커스 가두기는 브라우저 기본). 열 때마다 key로 새로 마운트해서
      초기값만 props에서 채움(effect에서 폼 리셋 안 함)
    - 폼: 종류를 아이콘 라디오 8칸으로, 날짜 기본값 오늘(미래 불가), 체중 칸은 "체중"일 때만
      (필수), 메모는 체중이면 선택 — 비우면 "체중 NNkg"로 채워 보냄(서버 content 필수).
      다음 접종일은 "예방접종"일 때만
    - 목록: 종류 필터 칩(기록 있는 종류만, 개수 표시) + 월별 묶음 + 왼쪽 날짜 칸(같은 날 연속이면
      첫 줄만) + 종류별 색 아이콘. 체중 기록은 수치를 크게, 지난 측정 대비 ±kg 표시.
      체중 그래프는 전체/체중 필터에서만. 필터 중인 종류를 다 지우면 전체로 복귀
    - 종류별 라벨·아이콘·색·예시 문구는 `pet/healthRecordTypes.ts` 한 곳
    - 한계: 체중 외 종류에 weight가 들어 있던 예전 기록은 수정 저장 시 weight가 비워짐
      (그래프는 원래 WEIGHT 종류만 썼으므로 표시상 차이 없음)
- [x] 2026-09-27 "다음 할 일" ⑤ 403 문구 확인 + ⑧ 토스트 (typecheck·빌드 통과, 브라우저 확인 안 함)
    - ⑤ 실행 중인 백엔드로 API 확인: 공동보호자(owner-test)가 6번 펫 DELETE → 403 "반려동물 삭제는
      최초 등록자만 할 수 있습니다."(펫은 그대로), 관리자 API를 USER가 호출 → Spring 기본 "접근 권한이
      없습니다."(@PreAuthorize 거부라 서비스 문구 없음, 일반 화면에선 호출 안 함). 화면 쪽은 대부분
      `errorMessage()`로 서버 문구를 그대로 띄움 — 공동보호자에겐 삭제 버튼 자체가 안 보임.
      빈틈 하나 수정: **사용 중 계정이 정지되면** 재발급이 403으로 실패해 이유 없이 /login으로 튕겼음 →
      axiosInstance가 서버 문구(만료면 "로그인이 만료되었습니다")를 sessionStorage `loginNotice`에 남기고
      LoginPage가 한 번 보여준 뒤 지움
    - ⑧ `hooks/useToast`(ToastProvider, App에서 감쌈): `toast(message, 'ok' | 'error')`, 3.5초 후 사라짐,
      최대 3개, 모바일은 하단 탭바 위·데스크톱은 아래 가운데, 성공 role=status / 실패 role=alert.
      규칙: **동작 결과**(저장·삭제·취소·확정 등)는 토스트, **입력값 검증 오류**는 칸 옆 인라인 유지
    - 적용: 반려동물 등록/저장/삭제, 이메일·비밀번호 변경, 병원 정보 저장, 슬롯 등록(건너뛴 개수 포함)/
      삭제, 예약 신청·취소, 대기 신청·취소, 즐겨찾기 추가/해제(실패 시 원래 조용히 되돌아가기만 했음),
      리뷰 등록/수정/삭제/신고, 답글, 건강기록 저장/삭제, 공동 보호자 초대/내보내기/나가기, 알림 모두
      읽음(처리 건수 표시), 대시보드·관리자 예약 확정/거절/노쇼, 리뷰 신고 숨김/해제
    - 같이 고친 것: 예약 취소·대시보드 확정·즐겨찾기 해제·기록 삭제 등이 실패하면 `setError`로 **목록
      전체가 에러 문구로 바뀌던** 곳들 → 목록은 두고 실패 토스트만
    - 남은 것: ⑥ 브라우저 눈 확인(토스트 위치·다이얼로그·홈 포함)
- [x] 2026-09-30 ⑥ 중 데이터 부분 API로 확인 (슬롯 지난 것 제외·시간순, 리뷰 `mine`, 리뷰 수정 후 답글
      유지, 예약·대기·관리자 예약 응답의 병원명·시간). 화면 눈 확인은 여전히 남음
- [x] 2026-09-30 병원 관리 콘솔 분리 + 관리자 역할 정리 + 리뷰/신고 관리 필터 + 내가 쓴 리뷰
      (백엔드 포함, typecheck·빌드·백엔드 테스트 통과, 브라우저 확인 안 함)
    - **관리할 병원이 전체 병원으로 뜨던 문제**: 대시보드가 공개 검색 `GET /api/hospitals`로 선택지를
      채웠음(저장은 서버가 막았지만 목록엔 다 보임). 백엔드에 `GET /api/users/me/hospitals`(Hospital.owner =
      나) 추가 → OwnerLayout이 이걸로 채움. 병원이 하나면 사이드바에 이름만, 여러 개면 select, 없으면 안내
    - **병원 관리 = 관리자 패널과 같은 쉘**: AdminLayout에 nav/panelName/sidebarExtra/outletContext/children
      props를 열어 OwnerLayout이 재사용(어두운 사이드바·admin-card·표). `/dashboard` 한 화면 탭 5개 →
      현황(/dashboard: StatTile 5개 + 승인 대기 예약 5건 + 7일 슬롯 예약률 막대 + 최근 리뷰), 예약 관리·
      리뷰·신고(관리자 화면 그대로 재사용 — 서버가 본인 병원으로 스코핑), 예약 슬롯·병원 정보(기존
      SlotSection/HospitalInfoSection을 admin 톤으로). OwnerDashboardPage·ReservationQueueSection·
      ReviewReportSection 삭제. 선택한 병원은 `useOwnerHospital()`(Outlet context)
    - **ADMIN은 /admin만**: OwnerRoute를 HOSPITAL_OWNER 전용으로(ADMIN은 /admin으로 리다이렉트, 비회원은
      /login), Header 탭은 ADMIN이면 "관리자"(/admin), 마이페이지도 관리 진입점은 역할별 하나. 로그인 시
      ADMIN은 보던 화면이 /admin/*가 아니면 항상 /admin
    - **리뷰/신고 관리 필터**: 백엔드 `GET /api/admin/reviews`(신규, Querydsl `ReviewRepositoryImpl`)와
      `GET /api/admin/reviews/reports`(Querydsl `ReviewReportRepositoryImpl`로 교체)가 병원·작성자 이메일·
      신고자 이메일·날짜 범위(작성일/신고일)·숨김 필터 + 정렬을 받음. 응답에 작성자/신고자 이메일,
      리뷰 작성일, 병원명, 신고 수. 프론트 `ReviewFilterBar` + `useReviewFilter()`가 필터를 **URL 쿼리**로
      관리 — 새로고침·뒤로가기 유지, 사용자 상세의 "작성한 리뷰/받은 신고/한 신고" 링크가 `?author=` 등으로
      바로 열림. 표에서 이메일 누르면 그 사람으로 필터(`AuthorCell`), 날짜 프리셋 오늘/7일/30일.
      관리자 메뉴 "리뷰 신고" → "리뷰"(/admin/reviews)·"신고"(/admin/reports) 둘로
    - **내가 쓴 리뷰**: 백엔드 `GET /api/users/me/reviews`(답글은 IN 쿼리 한 번 — `ReviewService.repliesOf`)
      → /mypage/reviews. 숨김 처리된 리뷰는 배지+안내, 병원 답글 표시. 수정·삭제는 병원 상세에서
    - `usePagedList`에 `total`(필터 후 전체 건수) 추가 — "검색 결과 N건"
    - 한계: 병원 소유자도 리뷰 작성자·신고자 이메일을 봄(채팅 목록이 이미 고객 이메일을 보여주는 것과 같은
      수준으로 판단). 현황의 "오늘 남은 예약"은 슬롯 기준(취소 후 다시 열린 슬롯은 제외됨)

## 다음 할 일 (2026-09-27 백엔드 세션에서 정리, 추천 순서: ① → ③ → ② → ④ → ⑦ → ⑧, ⑤⑥은 ① 하면서 브라우저 띄울 때 같이)

- [x] **① 실시간 알림이 30분~1시간 뒤 끊김 (버그, 최우선)** — `hooks/useNotifications.jsx`.
      백엔드 SSE emitter 타임아웃이 30분이라 연결이 끊기면 브라우저 `EventSource`가 처음 URL
      (`?token=<그때의 accessToken>`) 그대로 자동 재연결함. accessToken은 1시간 만료라 그 뒤
      재연결은 401 → EventSource는 401을 받으면 재시도를 멈춤 → 오래 켜둔 탭은 새로고침 전까지
      알림 뱃지·채팅 알림이 안 옴. 해결: `onerror`에서 직접 close 후 최신 accessToken으로 새
      EventSource 생성(만료됐으면 axiosInstance의 reissue 흐름을 먼저 태우기 — 예: 가벼운 인증
      API 하나 호출해서 인터셉터가 재발급하게 한 뒤 재연결). 계정 정지 시(401)도 여기서 끊김.
      참고: 백엔드는 25초마다 `:ping` heartbeat를 보냄(EventSource는 주석 무시, 프론트 처리 불필요)
- [x] **② 목록이 첫 페이지만 보임** — 페이지 UI가 없어서 21번째부터 안 보임:
      내 예약(`getMyReservations`, 기본 20), 알림 목록(`getNotifications`, 기본 20), 대시보드·관리자
      예약(`getAdminReservations`, 기본 20). 나머지는 `size: 100`으로 잘림(채팅 메시지 100개 제한
      포함). 응답의 `totalPages`로 "더 보기" 버튼 — 공용 훅 하나 만들어 재사용
- [x] **③ 알림 "모두 읽음" 버튼** — 백엔드 `PATCH /api/notifications/read-all`(응답 data =
      처리 건수) 준비 완료, 프론트 미연결. notificationApi에 함수 추가 → 알림 목록 화면 버튼 →
      목록 read 표시 + 뱃지 0으로
- [x] **④ 병원 대시보드 "리뷰 신고" 탭** — 백엔드는 HOSPITAL_OWNER에게 본인 병원 신고만
      스코핑해서 `GET /api/admin/reviews/reports`, `PATCH .../{reviewId}/hide|unhide` 허용 중.
      대시보드엔 "리뷰 답글" 탭뿐. 관리자 `/admin/reviews` 카드 UI 참고(대시보드는 소비자 앱 톤)
- [x] **⑤ 403 안내 문구 확인** — 백엔드가 이제 403에 구체 메시지를 내려줌("정지된 계정입니다.
      관리자에게 문의해주세요.", "반려동물 삭제는 최초 등록자만 할 수 있습니다." 등, 이전엔 전부
      "접근 권한이 없습니다."). 대부분 `err.response.data.message`를 그대로 띄워서 코드 수정은
      거의 없을 것 — 로그인/반려동물 삭제 화면에서 잘 보이는지 눈으로만 확인
- [ ] **⑥ 2026-09-27 변경 화면 브라우저 확인** — 빌드/lint만 통과, 화면 확인 안 함
      (2026-09-30: 데이터는 API로 확인 완료, 화면 눈 확인만 남음 + 같은 날 만든 병원 관리 콘솔·리뷰/신고
      관리·내가 쓴 리뷰 화면도 같이):
      대시보드 슬롯 반복 등록 폼 + 슬롯 X 삭제, 리뷰 `mine` 기반 수정·삭제 버튼(다른 기기에서도),
      리뷰 수정 후 병원 답글 유지, 예약·대기 목록/홈/대시보드/관리자 예약의 병원명·시간 표시.
      슬롯 목록은 이제 백엔드가 지난 슬롯 빼고 시간순으로 줌
- [x] **⑦ 라우트 코드 스플리팅** — 번들 718KB(vite 경고). 특히 `/admin/*`은 일반 사용자에게
      불필요 → `React.lazy` + `Suspense`로 라우트 단위 분리
- [x] **⑧ 토스트 알림** — 성공/실패 안내가 폼 안 인라인 텍스트뿐(위 2026-09 항목에서도 후보로 언급됨)
- [x] 2026-09-30 배포 — https://petcare-yongbin.duckdns.org. API 호출을 같은 오리진 상대 경로(`BASE_URL = ''`)로
      바꾸고 개발은 vite 프록시로 8080에 연결. 프론트는 빌드 결과를 Caddy 이미지에 넣어 서빙(SPA 폴백 `try_files`).
      절차는 `../docs/DEPLOY.md`

## 참고
- 빌드 번들이 500KB를 넘어 vite가 code-splitting 권장 경고를 띄움 (motion
  추가 후 630KB로 더 커짐). 기능은 다 붙었으니 라우트 단위 lazy import
  (`React.lazy`)로 정리하면 되는데, 디자인 작업 마무리 후 한 번에 처리하는
  게 효율적
