# PetCare Frontend — API ↔ 화면 매핑

CLAUDE.md에서 분리한 상세 엔드포인트 매핑. 특정 도메인 작업할 때만 참고.
→ 표시는 연결된 프론트 라우트/화면. 전부 구현 완료, 예외는 명시.

- 내 정보: GET/PATCH /api/users/me, PATCH /api/users/me/password → MyPage.
  GET /api/users/me/upcoming-vaccinations → HomePage (D-day 목록)
- 반려동물: /api/pets (CRUD, species 필수/size 선택, 응답에 role(OWNER/GUARDIAN))
  → /pets, /pets/new, /pets/:petId.
  /api/pets/{id}/image (업로드/삭제) → PetFormPage 원형 썸네일.
  /api/pets/{petId}/health-records (CRUD) → HealthRecordSection (WEIGHT 기록은
  체중 그래프, VACCINATION은 nextDueDate 입력 가능).
  /api/pets/{petId}/guardians (초대/목록/퇴출/나가기, 초대·퇴출은 최초 등록자 전용)
  → GuardianSection.
  /api/pets/{petId}/feeding-calculator → FeedingCalculatorSection.
  /api/health-check/questions, /api/health-check/submit → /health-check
- 병원: GET /api/hospitals(검색 — keyword/minRating/sort/lat/lng/radiusKm/is24Hours/
  hasParking, 응답에 openingHours/specialty/is24Hours/hasParking/avgTreatmentPrice/
  imageUrl/averageRating/reviewCount/distanceKm 포함, 배열 그대로) → /hospitals(필터
  체크박스 2개 추가). POST /api/hospitals(등록, ADMIN 전용) → UserManagementSection
  (이름+주소만, 나머지는 등록 후 대시보드에서). GET/PATCH /api/hospitals/{id} →
  상세/대시보드 수정폼(24시간·주차·평균진료비 입력 추가). POST·DELETE
  /api/hospitals/{id}/image → 대시보드 HospitalManageSection 썸네일 업로드.
  /api/hospitals/{id}/slots → 예약 가능 시간 + 대시보드 슬롯 등록.
  /api/hospitals/{id}/favorites, GET /api/favorites → 하트 토글, /favorites.
  /api/hospitals/{id}/reviews (CRUD), .../report, .../reply(CRUD, ADMIN/소유
  HOSPITAL_OWNER 전용) → ReviewSection(병원 상세 하단). 리뷰 작성자 식별 필드가
  없어서 "내 리뷰"는 작성 직후 reviewId를 localStorage(`myReviewIds`)에 저장해서
  판별 — 다른 브라우저/기기에서는 수정·삭제 버튼이 안 보임(알려진 한계).
  /api/admin/reviews/reports, .../hide, .../unhide → AdminPage의
  ReviewModerationSection
- 예약: PENDING으로 생성 → 병원측이 확정/거절 (CONFIRMED/REJECTED). 상태: PENDING/
  CONFIRMED/REJECTED/CANCELLED/NO_SHOW. /api/reservations (CRUD + cancel)
  → /reservations. /api/admin/reservations (목록+confirm/reject/no-show, CONFIRMED만
  노쇼 전환 가능) → /dashboard 예약 대기열.
  /api/waitlists (신청/내목록/취소, RESERVED 슬롯에만 신청 가능) → /waitlist,
  병원 상세에서 마감된 슬롯에 "대기 신청" 버튼으로 진입. 슬롯이 풀리면 대기 1순위
  에게만 WAITLIST_SLOT_AVAILABLE 알림(선착순, 나머지는 못 받음 — 백엔드 의도적 설계)
- 알림: GET /api/notifications, GET /unread-count, GET /subscribe(SSE, 쿼리파라미터
  ?token={accessToken}로 인증, "connect"/"notification" 이벤트), PATCH /{id}/read
  → /notifications, Header 벨 아이콘 뱃지(useNotifications 컨텍스트).
  GET/PATCH /api/notifications/preferences (카테고리별 RESERVATION/VACCINATION/
  FAVORITE/CHAT/WAITLIST on/off) → MyPage의 NotificationPreferenceSection
- 채팅: /api/chat-rooms (방 생성/목록/메시지) → /chats, /chats/:roomId. 새 메시지는
  SSE 알림 type: CHAT_MESSAGE_RECEIVED로 옴 → 열려있는 채팅방이면 재조회
- 관리자(ADMIN 또는 소유 HOSPITAL_OWNER): /api/admin/reservations(위 참고),
  /api/admin/stats/*, /api/admin/users(ADMIN 전용, 역할변경/정지(suspend)/
  활성화(activate) — UserResponse에 suspended 필드),
  /api/admin/hospitals/{id}/owner(ADMIN 전용), /api/admin/reminders/run(ADMIN 전용)
  → /admin (AdminPage + UserManagementSection)
- 비밀번호 재설정: POST /api/auth/password-reset/request { email } (항상 200),
  POST /api/auth/password-reset/confirm { token, newPassword } → /forgot-password,
  /reset-password. 백엔드가 실제 메일 발송 없이 토큰을 로그로만 남김(포트폴리오
  범위) — ResetPasswordPage가 URL 쿼리(`?token=`)로 자동 채움, 없으면 수동 입력
