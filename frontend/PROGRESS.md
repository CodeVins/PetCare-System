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

## 참고
- 빌드 번들이 500KB를 넘어 vite가 code-splitting 권장 경고를 띄움 (motion
  추가 후 630KB로 더 커짐). 기능은 다 붙었으니 라우트 단위 lazy import
  (`React.lazy`)로 정리하면 되는데, 디자인 작업 마무리 후 한 번에 처리하는
  게 효율적
