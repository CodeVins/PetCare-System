# PetCare Backend

## 프로젝트 개요
반려견 케어 시스템 백엔드 — 병원 예약을 시작으로 프로필 관리, 건강 기록,
알림 등 반려견 관련 기능을 확장해나갈 예정. 포트폴리오 목적, 혼자 개발 진행.

## 기술 스택
- Java 21, Spring Boot 3.x, Gradle
- Spring Data JPA, Querydsl
- Spring Security + JWT
- MySQL (로컬 개발은 Docker 컨테이너)
- springdoc-openapi (Swagger)

## 패키지 구조 (도메인 중심)
com.petcare
├── domain
│   ├── user (Auth/프로필 포함)
│   ├── pet (HealthRecord 포함)
│   ├── hospital (Hospital, Slot, Favorite, Review 포함)
│   ├── reservation
│   ├── notification
│   ├── admin (통계/유저관리/예약관리/병원소유자지정/리뷰 모더레이션)
│   ├── chat
│   └── healthcheck (비대면 자가 문진)
└── global
    ├── config (WebConfig-정적리소스, QuerydslConfig)
    ├── security (JWT, SecurityConfig)
    ├── exception (GlobalExceptionHandler)
    ├── file (FileStorageService)
    └── common (ApiResponse, BaseEntity)

각 도메인 패키지 내부는 타입별이 아니라 도메인별로 뭉쳐서 배치: `Xxx.java`(엔티티), `XxxRepository`, `XxxService`, `XxxController`, `dto/`.

## 엔티티
- User: id, email, password, role(USER/HOSPITAL_OWNER/ADMIN), suspended(boolean, 기본 false)
- RefreshToken: id, user_id(FK, unique — 유저당 1개), token(unique), expires_at
- Pet: id, user_id(FK, "최초 등록자"), name, species(DOG/CAT), breed, birth_date, size(SMALL/MEDIUM/LARGE, nullable), image_url(nullable)
- PetGuardian: id, pet_id(FK), user_id(FK) — (pet_id, user_id) 유니크, 공동 보호자(가족 공유) 전용. 최초 등록자는 `Pet.user`로 이미 표현되므로 여기 포함 안 됨
- Hospital: id, name, address, latitude, longitude, opening_hours(nullable, 자유 텍스트), specialty(nullable, 자유 텍스트), is_24_hours(nullable), has_parking(nullable), avg_treatment_price(nullable), image_url(nullable), owner_id(FK, nullable), weeklyHours(값 컬렉션 → `hospital_opening_hour`(hospital_id, day_of_week, open_time, close_time)), phone(nullable, 20자), description(nullable, 500자 — 상세 상단 소개), animals(값 컬렉션 → `hospital_animal`, `HospitalAnimal` DOG/CAT/EXOTIC — 진료 동물), amenities(값 컬렉션 → `hospital_amenity`, `HospitalAmenity` 응급·미용·호텔·고양이 전용 진료실·건강검진·재활 — 편의 서비스) (응답 시 averageRating/reviewCount를 Review 집계로 붙여서 내려줌, 컬럼은 아님). opening_hours(자유 텍스트)는 2026-10-05부터 "운영 안내"(점심시간·공휴일 휴무 등) 용도
- Slot: id, hospital_id(FK), start_time, end_time, status(AVAILABLE/RESERVED), version(낙관적 락)
- Reservation: id, slot_id(FK), pet_id(FK), user_id(FK), status(PENDING/CONFIRMED/REJECTED/CANCELLED/NO_SHOW) — 생성 시 PENDING, 관리자/병원이 확정/거절/노쇼 처리, memo(nullable, 500자 — 보호자 증상·요청 메모), health_check_summary/health_check_date(nullable — 예약 때 첨부한 자가 문진의 복사본)
- HealthRecord: id, pet_id(FK), type(WEIGHT/VACCINATION/TREATMENT/WALK/MEAL/EXCRETION/HEALTH_CHECK), recorded_at, content, weight, next_due_date(nullable — 다음 접종/진료 예정일), reservation_id(FK, nullable, unique — 병원이 진료 후 작성한 기록이면 해당 예약, 보호자 작성이면 null)
- Notification: id, user_id(FK), type(RESERVATION_REQUESTED/CONFIRMED/REJECTED/CANCELLED/NO_SHOW, RESERVATION_REMINDER, VACCINATION_DUE_SOON, FAVORITE_HOSPITAL_NEW_SLOT, CHAT_MESSAGE_RECEIVED, WAITLIST_SLOT_AVAILABLE, TREATMENT_RECORDED), content, is_read — `NotificationType.category()`로 `NotificationCategory`(RESERVATION/VACCINATION/FAVORITE/CHAT/WAITLIST) 그룹핑, 알림 on/off 설정에 사용
- NotificationPreference: id, user_id(FK), category(NotificationCategory), enabled — (user_id, category) 유니크, 행이 없으면 기본 enabled=true로 취급
- Favorite: id, user_id(FK), hospital_id(FK), (user_id, hospital_id) 유니크
- Review: id, hospital_id(FK), user_id(FK), rating(1~5), content, hidden(boolean, 기본 false), imageUrls(값 컬렉션 → `review_image` 테이블(review_id, sort_order, image_url), 최대 3장) — (user_id, hospital_id) 유니크(병원당 리뷰 1개), 작성 자격은 해당 병원 CONFIRMED 예약 이력 보유자만
- ReviewReport: id, review_id(FK), reporter_id(FK), reason — (review_id, reporter_id) 유니크(같은 리뷰 중복 신고 불가)
- ReviewReply: id, review_id(FK, unique — 리뷰당 답글 1개), content — 병원 측(ADMIN 또는 해당 병원 HOSPITAL_OWNER)이 작성
- ChatRoom: id, customer_id(FK), hospital_id(FK), (customer_id, hospital_id) 유니크(고객-병원당 방 1개)
- ChatMessage: id, chat_room_id(FK), sender_id(FK), content
- Waitlist: id, slot_id(FK), pet_id(FK), user_id(FK), offered_at(nullable — 자리가 나서 차례를 받은 시각) — (slot_id, user_id) 유니크, 슬롯이 이미 RESERVED일 때만 등록 가능
- PasswordResetToken: id, user_id(FK), token(unique), expires_at(발급 30분), used(boolean)

## 동적 쿼리 (Querydsl)
- `GET /api/hospitals?keyword=&minRating=&sort=NAME_ASC|RATING_DESC|REVIEW_COUNT_DESC` — Hospital-Review left join + groupBy로 평점 집계/필터/정렬을 쿼리 하나로 처리 (`HospitalRepositoryImpl`)
- 같은 엔드포인트에 `&lat=&lng=&radiusKm=` 추가하면 거리 기반 필터링. 셋 다 줘야 동작, 좌표 없는 병원(latitude/longitude null)은 결과에서 제외. 응답의 `distanceKm`은 이 파라미터를 줬을 때만 채워짐
  - 2단계(2026-10-02, 병원 수 증가 대비): ① `GeoBox.around()`로 반경을 감싸는 위경도 사각형을 만들어 Querydsl where절 `between`으로 DB에서 후보만 조회(`idx_hospital_lat_lng(latitude, longitude)` 인덱스) ② 후보만 `HospitalService`에서 Haversine으로 정확한 원 필터+거리순 정렬. 이전엔 전체 병원을 불러와 메모리에서 계산. MySQL 공간 함수/공간 인덱스는 안 씀(ponytail: 병원 수가 수십만 단위가 되면 `POINT` + `SPATIAL INDEX` 검토). 날짜변경선·극지방 미고려(국내 전용)
  - 여전히 페이지네이션 없음 — 좌표 없이 검색하면 조건에 맞는 병원 전체를 반환
- Querydsl 커스텀 레포지토리 패턴: `XxxRepositoryCustom` 인터페이스 + `XxxRepositoryImpl`(반드시 이 이름, Spring Data가 자동 인식) + `XxxRepository extends JpaRepository<...>, XxxRepositoryCustom`
- `JPAQueryFactory` 빈은 `global/config/QuerydslConfig`에 등록
- `GET /api/admin/stats/summary`, `GET /api/admin/stats/hospitals` (ADMIN 전용) — 병원별/전체 예약·리뷰 집계
- 병원 기간 통계(2026-10-05): `GET /api/admin/stats/hospitals/{hospitalId}?days=7|30|90`(그 외 400) — 클래스는 ADMIN 전용이지만 이 메서드만 `@PreAuthorize(ADMIN or HOSPITAL_OWNER)`(메서드 애너테이션 우선) + 서비스에서 `isManagedBy` 재검증(타 병원 403). 기간은 오늘 포함 최근 N일, **예약 슬롯 시작 시간 기준**. 예약은 `ReservationRepository.findAllForStats`(slot fetch join) 한 번, 슬롯은 기존 겹침 조회 재사용 → 집계는 `AdminStatsService.getHospitalPeriodStats`에서 자바로(병원 1곳·최대 90일이라 소량). 노쇼율 = 시간이 지난 예약 중 NO_SHOW / (CONFIRMED + NO_SHOW)(진료 후에도 CONFIRMED 유지라 지난 CONFIRMED = 내원), 취소율 = CANCELLED / 전체, 분모 0이면 null. 일별 booked(대기·확정·노쇼)/cancelled(취소·거절), 진료 유형별, 슬롯 이용률(RESERVED/전체). `/summary`·`/hospitals`는 계속 ADMIN 전용

## 예약 확정 플로우
- 예약 생성(`POST /api/reservations`) 시 바로 CONFIRMED가 아니라 PENDING으로 생성됨 (슬롯은 즉시 RESERVED로 잠금 — 동시 예약 방지는 그대로 유지)
- `GET /api/admin/reservations?status=`, `PATCH /api/admin/reservations/{id}/confirm`, `PATCH /api/admin/reservations/{id}/reject` (전부 ADMIN 전용) — PENDING만 확정/거절 가능
- 거절(REJECTED)과 취소(CANCELLED)는 의미가 달라서 별도 상태로 분리. 리뷰 작성 자격은 여전히 CONFIRMED 기준(PENDING/REJECTED 상태로는 리뷰 불가)
- 유저는 PENDING이든 CONFIRMED든 취소 가능(`PATCH /api/reservations/{id}/cancel`), REJECTED/CANCELLED는 재취소 불가(409)
- 예약 시간 변경(2026-10-05): `PATCH /api/reservations/{id}/reschedule` `{slotId}` — 예약한 본인만, PENDING/CONFIRMED + 아직 시작 전, 새 슬롯은 **같은 병원**(다른 병원은 취소 후 재예약, 400)·미래·AVAILABLE(아니면 409), 같은 슬롯이면 400. 한 트랜잭션에서 `newSlot.reserve()` + `oldSlot.release()` + `Reservation.reschedule()`(상태 PENDING으로 — 병원이 새 시간을 다시 확정, `reminderSent` 초기화). 취소 후 재예약하면 그 사이에 원래 자리를 뺏길 수 있어서 맞바꿈으로 처리. 새 슬롯을 동시에 노리는 예약·변경끼리는 Slot `@Version`으로 하나만 성공, 진 쪽은 409 + 롤백이라 기존 예약은 원래 슬롯 그대로. 병원 소유자에게 `RESERVATION_REQUESTED`("예약 시간 변경 요청"), 비워진 원래 슬롯은 `WaitlistService.notifyNextInLine()`. 테스트: `BusinessRuleTest`(규칙), `ReservationFlowTest`(변경 1 + 새 예약 4가 같은 슬롯 동시 요청 → 성공 1, 진 경우 원래 슬롯 유지)

## 리마인더/스케줄러
- `ReminderScheduler`(domain/notification, `@Scheduled(cron="0 0 9 * * *")`): 접종 예정일이 오늘~D-3 사이인 기록, 지금~내일 끝 사이에 시작하는 CONFIRMED 예약에 알림 생성(남은 일수/오늘·내일 문구는 실제 계산). `@Transactional` 필수(지연 로딩 엔티티를 세션 밖에서 접근하면 `LazyInitializationException` 남)
- 중복 방지: `Reservation.reminderSent`(boolean), `HealthRecord.remindedDueDate`(알림 보낸 예정일 — `nextDueDate`와 같으면 발송 완료, 예정일을 수정하면 값이 달라져 자동으로 다시 알림). 같은 날 여러 번 실행해도 한 번만 가고, 범위 매칭이라 09시에 서버가 꺼져 있었어도 다음 실행 때 따라잡음(이전엔 정확히 D-3/내일만 매칭해서 누락+중복 둘 다 있었음). 알림 설정을 끈 유저도 플래그는 세팅됨(다시 켜도 지난 리마인더는 안 옴)
- `POST /api/admin/reminders/run` (ADMIN 전용): 크론 기다리지 않고 수동으로 즉시 실행 (테스트/데모용)
- `GET /api/users/me/upcoming-vaccinations`: 마이페이지용 D-day 목록 — 소유 펫 + 공동보호자로 등록된 펫 모두 포함(`HealthRecordRepository.findAllAccessibleDueFrom`, OR-EXISTS)
- 접종 리마인더는 최초 등록자 + 공동보호자 전원에게 발송(일상 관리 권한 동등 원칙). 예약 리마인더는 예약한 사람(`Reservation.user`)에게만

## 실시간 알림 (SSE)
- `GET /api/notifications/subscribe` — `SseEmitter` 기반, WebSocket 대신 SSE 선택(알림은 서버→클라이언트 단방향이라 이걸로 충분, 구현도 훨씬 간단)
- 브라우저 네이티브 `EventSource`는 커스텀 헤더를 못 보내서, 이 경로에 한해 `?token=`쿼리파라미터로도 JWT 인증 허용(`JwtAuthenticationFilter`에서 경로 하드코딩 체크). 다른 엔드포인트는 여전히 Authorization 헤더만 허용
- `NotificationService.notify()`가 DB 저장 후 연결된 SSE 있으면 바로 push, 없으면 DB에만 남고 다음 폴링(`GET /api/notifications`)으로 확인 — 기존 흐름 안 깨짐
- `SseEmitterRepository`(domain/notification)가 유저별 활성 emitter를 메모리(ConcurrentHashMap)에 보관. ponytail: 서버 인스턴스 하나 기준이라 스케일아웃 시 다른 인스턴스에 붙은 클라이언트에겐 못 보냄 — 필요해지면 Redis pub/sub 등으로 인스턴스 간 브로드캐스트 추가
- Heartbeat: `SseEmitterRepository.sendHeartbeat()`(`@Scheduled(fixedRate=25초)`)가 SSE 주석(`:ping`)을 보냄 — 알림이 뜸하면 프록시/로드밸런서가 유휴 연결을 조용히 끊는 것 방지, 전송 실패한 emitter와 빈 유저 항목도 여기서 정리. `EventSource`는 주석을 무시해서 프론트 변경 없음
- 인덱스(`@Table(indexes=...)`): MySQL은 FK 컬럼에 인덱스를 자동 생성하므로 단일 FK 인덱스는 따로 안 만듦. 실제 쿼리에 맞춘 복합/비FK 인덱스만 — `slot(hospital_id, start_time)`, `notification(user_id, is_read)`, `notification(user_id, created_at)`, `health_record(next_due_date)`. `ddl-auto: update`가 없는 인덱스를 생성함
- 모든 엔티티는 `BaseEntity`(createdAt/updatedAt, JPA Auditing) 상속

## 컨벤션
- API 응답은 공통 `ApiResponse<T>`(success/data/message) 포맷 사용, 전부 `GlobalExceptionHandler`를 거침
- 예약 동시성 제어는 낙관적 락(@Version) 우선 적용 (Slot 기준, 충돌 시 409)
- 커밋 메시지: "타입: 설명" 형식 (예: feat: 회원가입 API 추가), 한국어
- **기존 코드를 수정하면 수정 지점에 이유 주석을 남길 것** (나중에 변경 이력/회고 글을 쓸 때 근거로 쓰기 위함). 형식: `// 변경(YYYY-MM-DD): 무엇을 어떻게 바꿨는지 — 왜 (이전: 기존 동작/문제)`. 한두 줄로 짧게, 여러 줄이 필요하면 이어서 `//`로. 새로 추가한 코드(새 메서드/클래스/엔드포인트)에는 붙이지 않고, 기존 동작이 바뀐 곳에만 붙임. 같은 목적의 수정이 여러 곳이면 각 지점마다 한 줄씩
- 엔티티: `@NoArgsConstructor(PROTECTED)` + `@Builder`가 붙은 private 생성자만 사용, public setter 없음. 상태 변경은 `update()`/`cancel()`/`reserve()`/`changeEmail()` 같은 의미 있는 메서드로만
- 소유권 검증: `엔티티.isOwnedBy(userId)`를 서비스 계층에서 체크, 위반 시 `ForbiddenException`(403)
- 예외 메시지는 응답 `message`로 사용자에게 그대로 노출됨(`NotFound`/`Forbidden`/`Conflict`/`BadRequest` 전부) — 사용자가 읽을 한국어 안내문으로 쓰고, 내부 id·SQL 같은 정보는 넣지 말 것. 예외: `@PreAuthorize` 거부(`AccessDeniedException`)와 낙관적 락 충돌은 Spring 기본 메시지 대신 공통 문구로 대체(`GlobalExceptionHandler`). 겪은 문제: 예전엔 403만 전부 "접근 권한이 없습니다."로 덮어써서 "정지된 계정입니다" 안내가 사용자에게 안 보였음
- 공통 예외(`global/exception`): `NotFoundException`(404), `ForbiddenException`(403), `ConflictException`(409) — 도메인별로 새 예외 클래스 만들지 않고 이 3개 재사용. 이메일 중복/로그인 실패만 전용 예외(`DuplicateEmailException`, `InvalidCredentialsException`) 사용
- 인증: JWT Bearer 토큰, stateless. 토큰의 subject는 이메일이라서 **이메일을 변경하면 기존 토큰이 즉시 무효화됨**(재로그인 필요) — 프론트에서 이메일 변경 후 자동 로그아웃 처리 필요
- Refresh Token: 로그인 시 accessToken(1시간)+refreshToken(14일, 랜덤 opaque 문자열)을 같이 발급. `RefreshToken` 엔티티는 유저당 1개(멀티 디바이스 미지원, 재로그인/재발급 시 기존 걸 교체). `POST /api/auth/reissue`로 재발급하며, 재발급마다 refreshToken도 회전(재사용 방지). `POST /api/auth/logout`(인증 필요)은 refreshToken을 DB에서 삭제만 함 — accessToken 자체는 stateless라 즉시 무효화 안 되고 최대 1시간 뒤 자연 만료됨(알려진 한계)
- 로그인 실패 제한(2026-10-02, Redis): `LoginAttemptService`가 이메일(소문자) 기준 실패 횟수를 `login:fail:{email}` 키로 저장, 5회 실패 시 마지막 실패 후 15분간 429(`TooManyRequestsException`, 올바른 비밀번호여도 차단), 성공하면 초기화. 없는 이메일도 실패로 셈(계정 존재 여부 노출 방지). **Redis 장애 시 fail-open**(제한 없이 로그인 허용, 타임아웃 1초) — 부가 보호 기능이 로그인 전체를 막지 않게. 알려진 한계: 키가 이메일만이라 남의 이메일로 실패를 쌓아 15분 잠글 수 있음
- `/api/auth/**` 전체를 permitAll 하면 안 됨 — `signup`/`login`/`reissue`만 열고 `logout`은 인증 필요(겪은 버그: 전체를 열어놔서 `logout`이 인증 없이 호출되던 문제)
- 비회원 공개 GET(2026-09-27, 프론트 랜딩·병원 둘러보기용): `SecurityConfig.PUBLIC_GET_PATHS` = `/api/hospitals`, `/api/hospitals/*`, `/api/hospitals/*/reviews`, `/api/hospitals/*/slots` (GET만). `/**`로 열지 않고 경로를 명시 — 같은 경로의 POST/PATCH/DELETE와 즐겨찾기는 계속 인증 필요. 공개 GET 핸들러에서 `@AuthenticationPrincipal`을 쓰면 **null일 수 있음**(ReviewController.getReviews가 처리). `AuthFlowTest`에 비회원 허용/차단 테스트 있음
- ADMIN 권한: `@PreAuthorize("hasRole('ADMIN')")` (병원 생성 등 플랫폼 전역 작업). 회원가입은 전부 USER로 생성되고 공개 ADMIN 가입 경로는 없음(의도적)
- 병원 소유자(HOSPITAL_OWNER): `Hospital.owner`로 병원 하나에 소유자 한 명 연결. `PATCH /api/admin/hospitals/{hospitalId}/owner`(ADMIN 전용)로 지정 — 지정 시 대상 유저가 USER면 자동으로 HOSPITAL_OWNER로 승격됨. 슬롯 생성(`POST /api/hospitals/{id}/slots`)과 예약 확정/거절/목록(`/api/admin/reservations/**`)은 `@PreAuthorize("hasRole('ADMIN') or hasRole('HOSPITAL_OWNER')")`로 게이트를 열어두고, 서비스 계층에서 `Hospital.isManagedBy(currentUser)`(ADMIN은 항상 true, HOSPITAL_OWNER는 본인 소유 병원만 true)로 세밀하게 재검증. 병원 생성 자체는 여전히 ADMIN 전용 유지 — 새 병원 등록 후 소유자를 배정하는 구조
- `PATCH /api/hospitals/{hospitalId}` — 병원 정보 수정(이름/주소/위경도/운영시간/진료과목), ADMIN 또는 소유 HOSPITAL_OWNER만. 필드 전체를 다시 받는 방식이라 일부 필드 생략하면 null로 덮어써짐 (Pet/HealthRecord 수정 API와 동일한 컨벤션)
- 슬롯 생성 시 그 병원을 찜한 유저들에게 `FAVORITE_HOSPITAL_NEW_SLOT` 알림 자동 발송 (`SlotService.notifyFavoriters`)
- 예약 생성 시 요청자뿐 아니라 병원 소유자(`Hospital.owner`, 있을 때만)에게도 `RESERVATION_REQUESTED` 알림 발송 — 확정/거절할 사람이 대시보드를 안 열어도 알 수 있게
- 슬롯/예약 시간 규칙(`Slot.hasStarted()` 기준): 슬롯 생성은 `@Future`(과거 400) + 같은 병원 겹치는 시간대 409(경계 맞닿음은 허용), 지난 슬롯은 예약·대기신청 409, 지난 예약은 취소 409, 노쇼는 시작 시간이 지난 뒤에만(시작 전 409), `WaitlistService.notifyNextInLine()`은 지난 슬롯이면 알림 생략
- 슬롯 일괄 생성 `POST /api/hospitals/{hospitalId}/slots/bulk`(기간×요일×하루 시간대를 간격으로 분할, 최대 31일·500개, 지난 시간/겹치는 칸은 건너뛰고 `{created, skipped}` 반환 — 기간 내 기존 슬롯을 한 번에 읽어 메모리에서 겹침 검사), 슬롯 삭제 `DELETE .../slots/{slotId}`(AVAILABLE + 예약 이력 없음만, 취소/거절 예약도 slot_id FK로 참조하므로 이력 있으면 409 — Pet 삭제 정책과 같은 이유). `GET .../slots`는 지난 슬롯 제외 + 기본 정렬 startTime 오름차순
- 응답 DTO: `ReservationResponse`/`WaitlistResponse`에 `hospitalId`/`hospitalName`/`startTime`/`endTime`(대기는 `petName`도) 포함 — 프론트가 슬롯/병원을 따로 조인하지 않게. `ReviewResponse.mine`은 요청자 본인 리뷰 여부(작성자 id는 노출 안 함, 비회원 조회면 전부 false)
- `PATCH /api/notifications/read-all` — 내 안읽은 알림 전체 읽음(벌크 update 쿼리, 처리 건수 반환)
- `application.yml`에 `hibernate.default_batch_fetch_size: 100` — fetch join 없이 지연 로딩 연관(리뷰 답글, 예약→펫 등)을 IN 쿼리로 묶어 N+1 완화
- `GET /api/hospitals`에 `&is24Hours=&hasParking=` 필터 추가 (Querydsl where절, null이면 무시)
- 요일별 진료 시간(2026-10-05): `PUT /api/hospitals/{hospitalId}/opening-hours` `{hours:[{dayOfWeek, openTime, closeTime}]}` 전체 교체(ADMIN·소유자, 병원 정보 PATCH와 분리 — 목록 편집이라 같이 보내면 실수로 지워지기 쉬움). 검증: close > open(자정 넘는 구간은 지원 안 함 → 24시간 플래그 안내, 400), 같은 요일 겹침 400, 요일당 3개(`HospitalService.MAX_HOURS_PER_DAY`), 최대 21개. `@CacheEvict`(병원 상세 캐시). `Hospital.isOpenAt(dateTime)`: 24시간이면 true, 미등록이면 null, 아니면 오늘 구간 [open, close)에 포함 여부. `GET /api/hospitals?openNow=true`는 조회 후 자바 필터(미등록 병원 제외). **응답에는 진료 중 여부를 넣지 않고 `weeklyHours`(월→일·시간순 — DB엔 요일이 문자열이라 SQL 정렬은 알파벳순이 돼서 DTO에서 정렬)만 내려주고 화면이 현재 시각으로 계산** — 병원 상세 응답이 10분 캐시라 서버가 계산하면 최대 10분 틀림. 테스트: `BusinessRuleTest`(종일·다른 요일·미등록·24시간 병원으로 openNow 필터, 캐시 무효화, 잘못된 시간 400, 일반 유저 403)
- 병원 프로필(2026-10-09): 생성·수정(`POST/PATCH /api/hospitals`)에 `phone`(`02-123-4567` 형식, 빈 값 허용), `description`(500자), `animals`, `amenities` 추가 — 다른 필드와 같이 **전체 교체**(생략하면 비워짐, `Hospital.updateProfile()`). 검색 `GET /api/hospitals?animal=CAT&amenity=GROOMING`(Querydsl `hospital.animals.contains()` → member of, 값이 비어 있는 병원은 필터에서 빠짐). 응답의 animals/amenities는 enum 선언 순서로 정렬(Set이라 순서가 매번 달라지지 않게). 주차는 기존 `hasParking`이 있어서 amenity에 안 넣음. **야간 진료는 컬럼이 아니라 프론트에서 `weeklyHours`로 계산**(어느 요일이든 21시 이후 진료, 24시간 병원 제외). 진료 동물 `EXOTIC`은 반려동물 종(`PetSpecies` DOG/CAT)에 없는 병원 전용 값
- 병원 상세 캐시(2026-10-02, Redis): `HospitalService.get()`에 `@Cacheable("hospital", key=hospitalId)`, TTL 10분(무효화 누락 대비 안전망). `global/config/CacheConfig` — JSON 직렬화(Boot ObjectMapper라 DTO 필드 변경돼도 기존 캐시 안 깨짐), `transactionAware`(커밋 후 무효화), `LoggingCacheErrorHandler`(Redis 장애 시 DB로 fail-open). **`HospitalResponse`에 들어가는 값(병원 필드, 평점/리뷰 수)을 바꾸는 코드를 새로 만들면 반드시 무효화 추가** — 현재 무효화 지점: 병원 수정/사진 업로드·삭제, 리뷰 작성·수정·삭제(`@CacheEvict`), 관리자 리뷰 숨김·해제(`hospitalService.evictCache()` — 파라미터에 hospitalId가 없어서). 소유자 지정·답글은 응답에 없어서 무효화 안 함. 검색(`GET /api/hospitals`)은 파라미터 조합이 많아 캐시 안 함

## 실시간 채팅 (1:1 문의)
- `ChatRoom`(고객 1명 - 병원 1개, 유니크), `ChatMessage`. `POST /api/chat-rooms`는 get-or-create(같은 고객+병원 조합이면 기존 방 반환)
- `GET /api/chat-rooms` — USER는 본인이 고객인 방, HOSPITAL_OWNER는 본인 병원 방
- `GET/POST /api/chat-rooms/{roomId}/messages` — 접근 권한은 `ChatRoom.canAccess()`(고객 본인이거나 `Hospital.isManagedBy()`) 재사용, ADMIN은 모든 방 접근 가능(중재 목적)
- **실시간 수신은 STOMP over WebSocket(2026-10-02)**, 알림은 기존 SSE 그대로("양방향 채팅은 WebSocket, 단방향 알림은 SSE"). 엔드포인트 `/api/ws`(운영 Caddy `/api/*`·Vite 프록시 `ws: true`로 그대로 통과, SockJS 없음), 구독 경로 `/topic/chat-rooms/{roomId}`, 인메모리 simple broker(`global/config/WebSocketConfig`, ponytail: 스케일아웃 시 Redis pub/sub로 인스턴스 간 브로드캐스트)
  - **전송은 REST(`POST .../messages`) 그대로** — 저장·검증·권한·에러 응답 재사용. `ChatService.sendMessage()`가 커밋 후(`afterCommit`) `SimpMessagingTemplate`으로 방 구독자에게 `ChatMessageResponse` push. 보낸 사람도 받으므로 프론트는 id로 중복 제거
  - 인증·인가는 `ChatStompInterceptor`(핸드셰이크 `/api/ws`는 permitAll): CONNECT 프레임의 `Authorization: Bearer` 검증+정지 계정 거부, SUBSCRIBE는 `/topic/chat-rooms/{id}`만 + `canAccess()` 재검증(`findWithHospitalById` — 트랜잭션 밖이라 hospital 같이 로딩), **SEND 프레임은 전부 거부**(안 막으면 `/topic`에 직접 보내 다른 사람 행세 가능). 인터셉터에서 `ChatService`를 쓰면 SimpMessagingTemplate↔WebSocket 설정 순환 의존이 생겨서 레포지토리 직접 사용
  - 받는 사람이 그 방을 구독 중이면(`SimpUserRegistry`, 유저 이름=이메일) `CHAT_MESSAGE_RECEIVED` 알림 생략 — 채팅방을 안 보고 있을 때만 알림. 이전엔 메시지마다 알림이 쌓였고, 채팅 알림을 끈 유저는 실시간 갱신이 안 됐음(알림 SSE로 재조회 트리거하던 방식의 버그)
  - 알려진 한계: 연결 후 accessToken이 만료돼도 기존 WebSocket 연결은 유지됨(재연결 때만 재검증, 정지도 재연결 시점부터 반영). 메시지 목록 조회는 오래된 순 100개까지만 가져옴(기존부터 있던 한계)
  - 안 읽은 메시지 수(2026-10-02): `ChatRoom.customerLastReadMessageId`/`hospitalLastReadMessageId`(양쪽이 마지막으로 읽은 메시지 id, null=안 읽음). `GET /api/chat-rooms` 응답 `unreadCount`(헤더 채팅 아이콘 배지는 합계 `GET /api/chat-rooms/unread-count`, 같은 기준) = 상대편이 보낸 메시지 중 내 쪽 읽음 id보다 큰 것(`ChatMessageRepository.countUnreadFor*`, 페이지 단위 group by 쿼리 한 번). `PATCH /api/chat-rooms/{roomId}/read`로 최신 메시지까지 읽음 — 프론트가 방 진입 시 + 열어둔 채 상대 메시지 수신 시 호출. 병원 측은 소유자만 읽음 처리, **ADMIN 열람은 읽음 처리 안 함**(중재 목적 열람으로 소유자의 안 읽음이 사라지면 안 됨)
  - 테스트: `ChatWebSocketTest`(RANDOM_PORT + 실제 STOMP 클라이언트 — 수신/구독 중 알림 생략, 타인 방 구독 거부, 토큰 없는 연결 거부, 안 읽은 수·관리자 열람 시 유지)
- `HospitalService.findHospital()`을 다른 도메인(chat)에서도 써야 해서 package-private → public으로 변경
- 관리자 부트스트랩: `AdminBootstrapRunner`(global/config, `ApplicationRunner`)가 앱 시작 시 `.env`의 `ADMIN_EMAIL`/`ADMIN_PASSWORD`로 최초 관리자를 자동 생성(없으면 생성, 있으면 ADMIN으로 승격) — 더 이상 DB 수동 UPDATE 불필요. 이후 관리자 추가는 `GET /api/admin/users` + `PATCH /api/admin/users/{userId}/role`로 기존 관리자가 승격 (본인 권한 변경은 막혀있음)
- MySQL 예약어 주의: 컬럼명으로 `read`, `order` 같은 예약어 쓰면 DDL이 조용히 깨짐(런타임에 "테이블 없음" 에러로 나타남) — 애매하면 `@Column(name=...)`로 명시적으로 피해갈 것
- 기존 테이블에 NOT NULL 컬럼 추가할 때 주의: MySQL이 strict mode가 아니면 DEFAULT 없이 `ALTER TABLE ... ADD COLUMN ... NOT NULL`이 에러 없이 성공하지만, 기존 행은 문자열 빈 값("")으로 채워짐(NULL도 아니고 원하는 기본값도 아님) — `Pet.species` 추가할 때 겪음. 기존 행 백필이 필요하면 컬럼 추가 후 `UPDATE ... SET col = '기본값' WHERE col = '' OR col IS NULL`을 수동으로 돌릴 것
- enum 컬럼은 전부 `@Column(columnDefinition = "varchar(N)")` 명시해서 VARCHAR로 매핑 (MySQL 네이티브 ENUM 쓰면 `ddl-auto: update`가 기존 컬럼에 새 enum 값을 반영 못 해서, enum에 값 추가할 때마다 "Data truncated" 런타임 에러남 — 겪은 버그). 새 enum 필드 추가할 때도 이 패턴 유지할 것
- 로컬 개발용 계정: `test-new@petcare.com`/`newpassword123`(USER), `admin@petcare.com`/`adminpass123`(ADMIN), `owner-test@petcare.com`/`ownerpass123`(HOSPITAL_OWNER, 병원 id=2 소유)
- CORS 허용 오리진: `http://localhost:5173`(Vite), `http://localhost:3000`(CRA) — 프론트 개발 서버 포트가 다르면 `SecurityConfig.corsConfigurationSource()`에 추가. 운영은 Caddy가 프론트와 API를 같은 오리진으로 서빙해서 CORS 설정 불필요(운영 도메인 추가하지 말 것)
- 배포 설정: `application.yml`의 `DB_URL`/`SHOW_SQL`은 환경변수(로컬 기본값 있음), `server.forward-headers-strategy: framework`로 Caddy의 X-Forwarded-* 신뢰(Swagger 서버 URL이 https로 생성됨). 운영 비밀값은 EC2 `~/petcare/.env`에만 있음(`../.env.deploy.example`에 키 목록). 컨테이너 시간대는 `Asia/Seoul` 고정(기본 UTC면 리마인더·슬롯 시간 검증이 9시간 어긋남)
- 장애 감시·백업(2026-10-05): 헬스체크 `GET /api/health`(actuator, `management.endpoints.web.base-path: /api`로 Caddy·Vite 기존 경로를 그대로 탐, health만 노출·상세 숨김, permitAll). DB가 죽으면 503 DOWN, **Redis는 fail-open이라 헬스 판정에서 제외**(`management.health.redis.enabled: false`, 오탐 방지). 외부 감시는 `.github/workflows/uptime.yml`(15분마다 호출, 실패 시 GitHub 메일 — 별도 모니터링 서비스 가입 없음). 백업은 compose `db-backup` 서비스(mysql:8 이미지 재사용, 하루 한 번 `mysqldump --single-transaction --no-tablespaces` + uploads 볼륨 tar → 서버 `~/petcare/backups` 7일 보관, 일반 DB 계정이라 `--no-tablespaces` 필요). 같은 디스크라 인스턴스 유실 대비는 EBS 스냅샷(수동 설정). 복구 절차·알림 설정은 `../docs/DEPLOY.md` 6·7절
- 운영 데모 데이터(2026-10-09): `global/demo/DemoDataSeeder`(`@ConditionalOnProperty(app.demo.enabled)`, 환경변수 `DEMO_SEED` — 로컬 기본 false, 운영 compose는 "true"). **실제 병원 크롤링은 약관·사칭 문제로 안 함** → 가상 병원 15곳(`DemoHospitals`: 동화 같은 이름, 주소는 "OO동 일대 (가상 주소)", 전화번호는 실제로 안 걸리는 `02-0000-xxxx`, 소개 끝에 "데모용 가상 병원" 문구, 서울 각 동네 대략 좌표, 진료 시간 패턴 5종 — 점심시간/종일/야간/24시간/토요일 오전). 커버 이미지는 `DemoImageGenerator`가 Java2D로 그린 PNG(컨테이너에 한글 폰트가 없어 글자 없이 도형만, 병원마다 색·모양 다름). 앱 시작 시 데모 병원이 하나도 없으면 한 번 생성(한 트랜잭션 — 중간에 죽으면 전부 롤백), 시작 시 + 매일 00:10에 앞으로 7일치 슬롯(진료 시간 안 정시마다 30분, 지난 시간·겹치는 칸 건너뜀). 리뷰는 로그인 불가 계정(`demo-reviewer-N@petcare.invalid`, 랜덤 비밀번호 + 정지)이 작성, 리뷰 자격 규칙에 맞게 지난 확정 예약도 같이 생성. 레포지토리로 직접 넣어서 찜 알림 등 부수 효과 없음. **ApplicationRunner라 "Started" 로그 뒤에 실행됨**(로컬 확인 시 바로 조회하면 아직 없음, 슬롯 생성까지 약 10초). 테스트: `DemoDataSeederTest`(별도 컨텍스트 — 15곳·이미지 파일·진료 시간·미래 슬롯·리뷰, 재실행 시 중복 없음, 리뷰 계정 로그인 불가)
- 운영 DB에 배포 검증용 계정 `deploy-check-1790777642@petcare.com`(펫 "배포검증")이 있음 — 필요 없으면 관리자 패널에서 정지
- 파일 업로드(반려동물 사진): 로컬 디스크 저장(`uploads/pets/`, `.gitignore` 처리됨), `global/file/FileStorageService`가 담당. 파일명은 클라이언트 값을 쓰지 않고 UUID로 새로 생성(경로 조작 방지), 업로드 시 jpg/png/webp만 허용, 5MB 제한. `/uploads/**`는 SecurityConfig에서 permitAll — 이미지는 공개로 서빙됨
- 리뷰 사진(2026-10-05): `POST /api/hospitals/{hospitalId}/reviews/{reviewId}/images`(multipart `file`, 한 장씩, 리뷰당 최대 3장 → 넘으면 409), `DELETE .../images/{fileName}`(서버가 만든 UUID 파일명 — 이 리뷰의 목록에 있는 것만 삭제, 없으면 404). 작성자 본인만(`getOwnedReview`, 남은 403). `FileStorageService.storeReviewImage`(`uploads/reviews/`, `app.upload.review-image-dir`, 기존 jpg/png/webp·5MB 규칙 그대로), `WebConfig`가 `/uploads/reviews/**` 서빙. 리뷰 삭제 시 파일도 삭제(DB 행은 값 컬렉션이라 자동). `ReviewResponse`/`MyReviewResponse`/`ManagedReviewResponse`에 `imageUrls`(관리 화면은 부적절한 사진 모더레이션용). 사진은 평점·리뷰 수와 무관해서 병원 상세 캐시 무효화 대상 아님. 숨김 리뷰의 사진 URL은 추측 불가한 UUID라 따로 막지 않음

## 반려동물 생활/건강 관련 API
- `Pet.species`(DOG/CAT) 추가 — breed는 원래도 자유 텍스트라 별도 검증/품종 목록 로직 없었음(고양이 대응 위해 고칠 게 없었음)
- `POST /api/pets/{petId}/feeding-calculator` — RER = 70×체중^0.75, DER = RER×활동계수. **활동계수는 자료 원본이 "중성화 여부" 기준(강아지 중성화O 1.6/중성화X 1.8/체중감량 1.4, 고양이 중성화O 1.2)인데 이 API 입력은 활동량(LOW/NORMAL/HIGH)이라 직접 매핑함**: 강아지 LOW/NORMAL/HIGH = 1.4/1.6/1.8, 고양이는 자료에 1.2(NORMAL) 하나뿐이라 같은 0.2 간격으로 LOW=1.0/HIGH=1.4 추정 — 상수는 `FeedingCalculatorService.DER_COEFFICIENTS`, 실사용 전 수의사 자문으로 재검증 필요. 사료 칼로리 밀도는 기본 350kcal/100g(건식 평균), 요청에서 override 가능. 습식+건식 혼합 급여, 간식 10% 할당 같은 건 이번 범위에서 뺌(엔드포인트 스펙에 없던 입력이라)
- `GET /api/health-check/questions`, `POST /api/health-check/submit` — 부위별 질문 8개(식욕/배변/구토/기력/피부/호흡/음수/체중) 고정 문항, 답변 점수 합산 후 LOW(0~3)/MEDIUM(4~9)/HIGH(10+)로 판정(`HealthCheckService` 상수). **품종/연령별 실제 평균치 통계는 없어서(허위 데이터를 만들기 싫어서) comparisonNote에 그 사실을 그대로 안내함** — 진단이 아니라 참고용 자가 문진이라는 disclaimer 항상 포함
- 문진 결과는 `saveRecord: true`로 제출하면 `HealthRecordType.HEALTH_CHECK`로 저장됨 (기존 HealthRecordService.create 재사용)
- 질문 데이터는 DB가 아니라 `HealthCheckQuestionBank`에 하드코딩 (ponytail: 문항 수 늘거나 운영진 편집 필요해지면 DB로 이전)

## 대기자 명단 (Waitlist)
- 이미 예약 마감(`RESERVED`)된 슬롯에만 등록 가능(`POST /api/waitlists`) — `AVAILABLE` 슬롯에 등록하려 하면 409(그냥 예약하면 되므로)
- `GET /api/waitlists`(내 대기 목록), `DELETE /api/waitlists/{waitlistId}`(대기 취소)
- 해당 슬롯의 예약이 취소·거절·시간 변경으로 다시 열리면 `WaitlistService.notifyNextInLine()`이 아직 차례를 안 받은 사람 중 맨 앞(`createdAt` 기준) 1명에게 `WAITLIST_SLOT_AVAILABLE` 알림 + `offeredAt` 기록(**차례 제안**, 항목은 안 지움). 예전에 차례를 받았던 항목은 이때 정리(이미 한 번 기회를 가짐). 한 번에 한 명에게만 알림(선착순 알림 스탬피드 방지)
- 차례 넘기기(2026-10-05): 차례를 받은 사람이 `WaitlistService.OFFER_MINUTES`(30분) 안에 예약하지 않으면 `WaitlistOfferScheduler`(`@Scheduled(fixedRate=60초)`)가 그 항목을 지우고 슬롯이 아직 비어 있고 시작 전이면 다음 사람에게 알림. 누가 그 슬롯을 예약하면(신규 예약·시간 변경 모두) `closeOffers()`로 차례 받은 항목 정리 → 이후 시간이 지나도 다음 사람에게 안 넘어감(남은 대기자는 계속 대기). **만료를 Redis 키 만료 이벤트가 아니라 DB(`offered_at`) + 주기 확인으로 처리** — 키 만료 이벤트는 그 순간 앱이 꺼져 있으면 유실되고 별도 Redis 설정이 필요해서. 서버가 꺼져 있었어도 다음 실행 때 따라잡음. ponytail: 서버 1대 기준(여러 대면 ShedLock 등 분산 락). `WaitlistResponse.offerExpiresAt`(차례 받았으면 예약 기한). 테스트: `BusinessRuleTest`(만료 → 2순위에게, 누가 예약하면 3순위에게 안 넘어가고 계속 대기)

## 비밀번호 재설정
- `POST /api/auth/password-reset/request`(이메일만 받음), `POST /api/auth/password-reset/confirm`(토큰+새 비밀번호) — 둘 다 `SecurityConfig` permitAll
- ponytail: 실제 이메일 발송 미구현. `PasswordResetService`가 재설정 링크를 SLF4J 로그로만 남김(`[비밀번호 재설정] ...`) — 실사용 전 이메일 발송 연동 필요
- 존재하지 않는 이메일로 요청해도 항상 200(계정 존재 여부 노출 방지), 토큰은 30분 유효 + 1회용(`isUsable()`), 만료/재사용 시 409

## 예약에 증상 메모·자가 문진 첨부
- 2026-10-05: `POST /api/reservations`에 `memo`(선택, 500자), `healthCheckRecordId`(선택) 추가 → `ReservationResponse.memo/healthCheckSummary/healthCheckDate`로 병원 예약 관리 화면과 내 예약에 표시
- **첨부는 링크(FK)가 아니라 복사본**: 예약 생성 시점의 문진 기록 `content`·`recordedAt`을 `Reservation.healthCheckSummary/healthCheckDate`에 복사 — 병원은 예약 당시 내용을 그대로 보고, 보호자가 원본 건강 기록을 지워도 FK 위반(500) 없음
- 첨부 조건: 같은 반려동물의 `HEALTH_CHECK` 기록 + 최근 14일 이내(`ReservationService.HEALTH_CHECK_ATTACH_DAYS`, 프론트 `ReservationNoteFields.ATTACH_DAYS`와 같은 값) — 아니면 400. 슬롯 `reserve()` 전에 검증
- 자가 문진 저장 내용에 이상 소견(점수 > 0인 답변)을 같이 기록: `"자가 문진 결과: 총점 5점 (위험도: MEDIUM) — 식욕: 거의 먹지 않는다, 배변: 무르거나 설사한다"`(없으면 "특이 소견 없음"). `HealthRecord.content`가 varchar(255)라 넘치면 자름(`ddl-auto: update`는 기존 컬럼 길이를 안 바꿔서 늘릴 수 없음)
- 프론트: 병원 상세 예약 폼의 `pages/hospital/ReservationNoteFields`(반려동물을 고르면 최근 14일 문진을 찾아 기본 체크, 없으면 "자가 문진 하기" 링크), 예약 관리 화면은 반려동물 칸 아래에 메모·문진 표시
- 테스트: `BusinessRuleTest`(다른 펫 문진 400, 오래된 문진 400, 정상 첨부 시 메모·이상 소견 요약이 병원 목록에 나옴)

## 진료 기록 (병원 작성)
- 2026-10-05: 진료 후 병원이 남기는 기록. **별도 테이블 없이 `HealthRecord`에 `reservation`을 연결해서 저장** — 보호자의 건강 기록 타임라인에 그대로 나오고, `nextDueDate`를 주면 기존 D-day 리마인더(`ReminderScheduler`)가 그대로 동작(새 스케줄러 없음)
- `GET/PUT /api/admin/reservations/{reservationId}/treatment` (`AdminReservationController`, ADMIN 또는 해당 병원 HOSPITAL_OWNER — `isManagedBy` 재검증). PUT은 작성/수정 겸용(예약당 1개, `reservation_id` 유니크), GET은 없으면 data null. `TreatmentRecordService`(domain/reservation)
- 규칙: CONFIRMED + 진료 시작 시간이 지난 예약만(노쇼와 같은 `hasStarted()` 기준, 아니면 409), type은 TREATMENT/VACCINATION만(400), `nextDueDate`는 진료일 다음 날부터(400), recordedAt은 진료일(슬롯 시작일) 고정. 처음 작성할 때만 예약자에게 `TREATMENT_RECORDED` 알림(카테고리 RESERVATION)
- 보호자는 조회만 — `HealthRecordService.getOwnedRecord()`(수정·삭제 경로)에서 `isWrittenByHospital()`이면 403. `HealthRecordResponse.hospitalName`(병원 작성이면 병원명, 아니면 null)으로 프론트가 "OO병원 작성" 배지 + 수정/삭제 버튼 숨김
- 리마인더 문구: VACCINATION만 "다음 접종 예정일", 그 외는 "다음 내원 예정일"
- 예약 상태는 진료 후에도 CONFIRMED 그대로(COMPLETED 상태를 추가하면 리뷰 작성 자격 등 CONFIRMED 기준 로직을 전부 손봐야 해서 의도적으로 안 함 — 진료 기록 존재 여부로 진료 완료를 판단)
- 테스트: `BusinessRuleTest`의 진료 기록 테스트(시간 전 409, 타입 400, 재저장 시 수정, 알림 1회, 보호자 수정·삭제 403)

## 건강 기록 통계
- `GET /api/pets/{petId}/health-records/summary` — 체중 기록(`WEIGHT` 타입)을 시간순으로 모은 `weightHistory`(그래프용), `latestWeight`, 타입별 기록 개수(`countByType`)를 한 번에 반환

## 리뷰 신고 / 모더레이션
- `POST /api/hospitals/{hospitalId}/reviews/{reviewId}/report` — 로그인 유저 아무나 신고 가능(리뷰 작성 자격과 무관), 같은 리뷰 중복 신고는 409
- `GET /api/admin/reviews/reports`, `PATCH /api/admin/reviews/{reviewId}/hide`, `PATCH /api/admin/reviews/{reviewId}/unhide` (`AdminReviewController`, ADMIN 또는 HOSPITAL_OWNER — 소유자는 본인 병원만: 목록은 `ReviewSearchCondition.managerId`, hide/unhide는 `isManagedBy`)
- `GET /api/admin/reviews` — 관리용 리뷰 목록(숨김 포함, 작성자 이메일·신고 수·답글). 리뷰/신고 목록 둘 다 필터 `hospitalId`, `author`(작성자 이메일 부분일치), `from`/`to`(날짜, 리뷰는 작성일·신고는 신고일, 양끝 포함), `hidden`, 신고는 `reporter`도. 정렬은 리뷰 `createdAt|rating`, 신고 `createdAt`만(화이트리스트). Querydsl `ReviewRepositoryImpl`/`ReviewReportRepositoryImpl` — 신고 쿼리는 `review.hospital.owner`가 Q타입 기본 초기화 깊이(2)를 넘어서 `join(reviewReport.review, review)` 별칭으로 씀(안 그러면 NPE로 500, 겪은 문제)
- `GET /api/users/me/reviews`(내가 쓴 리뷰, 병원명·숨김 여부·답글), `GET /api/users/me/hospitals`(내가 소유자로 지정된 병원, 병원 관리 콘솔용) — 목록 답글은 `ReviewService.repliesOf()`로 IN 쿼리 한 번
- `hidden=true`인 리뷰는 병원 리뷰 목록(`GET /api/hospitals/{hospitalId}/reviews`), 평균 평점/리뷰 수 집계(`HospitalService`, `AdminStatsService`, `HospitalRepositoryImpl`의 검색 결과)에서 전부 제외됨 — 신고 누적만으로 자동 숨김되진 않고 관리자가 직접 `hide` 호출해야 함(자동화 없음, 의도적으로 사람이 판단)

## 알림 카테고리 on/off
- `GET/PATCH /api/notifications/preferences` — `NotificationCategory`(RESERVATION/VACCINATION/FAVORITE/CHAT/WAITLIST) 단위로 on/off. GET은 설정 안 한 카테고리도 항상 5개 다 내려주고(기본 enabled=true), PATCH는 `{category, enabled}` 하나씩 upsert
- `NotificationService.notify()`가 알림 생성/SSE push 전에 `NotificationPreference`를 먼저 조회해서 꺼져있으면 DB 저장도 SSE push도 아예 안 함(꺼진 알림은 나중에 폴링해도 안 보임 — 완전히 발송 안 되는 것)

## 리뷰 답글 / 예약 노쇼 / 병원 사진 / 계정 정지
- `POST/PATCH/DELETE /api/hospitals/{hospitalId}/reviews/{reviewId}/reply` — ADMIN 또는 해당 병원 소유 HOSPITAL_OWNER만(`Hospital.isManagedBy()` 재검증), 리뷰 1개당 답글 1개(중복 작성 시 409). `GET .../reviews` 응답에 `reply` 필드로 같이 내려감(리뷰마다 답글 존재 여부 조회하는 N+1 방식 — ponytail: 목록이 커지면 답글 일괄 조회로 최적화 필요)
- `PATCH /api/admin/reservations/{id}/no-show` (ADMIN 또는 해당 병원 HOSPITAL_OWNER) — CONFIRMED 상태만 NO_SHOW로 전환 가능(PENDING/이미 NO_SHOW 등은 409). NO_SHOW는 취소 불가 상태(`isCancellable()`에 포함 안 됨)라 사용자가 되돌릴 수 없고, 리뷰 작성 자격 판단(CONFIRMED 기준)에서도 자동으로 제외됨. 슬롯은 릴리즈하지 않음(이미 지나간 시간이라 대기자 알림 대상 아님). `GET /api/admin/stats/summary`에 `noShowReservations` 집계 포함
- `POST/DELETE /api/hospitals/{hospitalId}/image` — Pet 사진 업로드와 동일 패턴(`FileStorageService`를 pet/hospital 공용으로 일반화, `uploads/hospitals/`, jpg/png/webp만, 5MB 제한). ADMIN 또는 소유 HOSPITAL_OWNER만
- `PATCH /api/admin/users/{userId}/suspend`, `PATCH /api/admin/users/{userId}/activate` (ADMIN 전용) — 정지된 계정은 로그인 시 403(`AuthService.login()`에서 체크). 본인 계정은 정지 불가(역할 변경과 동일한 자기 자신 보호 패턴). **정지는 즉시 반영**: `JwtAuthenticationFilter`가 이미 매 요청마다 유저를 DB에서 읽으므로(`loadUserByUsername`) 거기서 `suspended`면 인증을 세팅하지 않음 → 기존 accessToken으로도 바로 401. `AuthService.reissue()`도 정지 계정이면 403(겪은 버그: 예전엔 로그인만 막아서 refreshToken으로 14일간 계속 재발급 가능했음)

## 다중 보호자 (가족 공유 반려동물 계정)
- 최초 등록자(`Pet.user`)와 공동보호자(`PetGuardian`)는 프로필/건강기록/예약/사진 업로드 등 일상 관리 권한은 완전히 동등. **단, 보호자 초대/퇴출과 Pet 삭제는 최초 등록자만 가능**(민감한 "누가 접근 가능한가"를 결정하는 권한이라 별도 분리)
- `POST /api/pets/{petId}/guardians` `{email}` — 이미 가입된 유저의 이메일로 즉시 초대(수락 절차/알림 없음, ponytail: 필요해지면 `NotificationCategory`에 GUARDIAN 추가해서 알림 붙일 것). 본인(소유자) 초대 시 409, 이미 보호자면 409, 이메일 유저 없으면 404
- `GET /api/pets/{petId}/guardians` — 소유자+보호자 모두 조회 가능(공동보호자 목록만, 소유자 본인은 목록에 안 나옴)
- `DELETE /api/pets/{petId}/guardians/{userId}` — 소유자만 특정 보호자 퇴출
- `DELETE /api/pets/{petId}/guardians/me` — 보호자 본인이 자발적으로 나가기(소유자가 호출하면 403 — "삭제를 이용해주세요")
- **접근 권한 체크 확장**: `Pet.isOwnedBy(userId)` 자체는 안 바꾸고(소유자 전용 판단은 그대로), `pet.isOwnedBy(userId) || petGuardianRepository.existsByPetIdAndUserId(...)` 형태로 4곳에 OR 조건을 추가— `PetService`(공용 `getAccessiblePet()`), `HealthRecordService`, `ReservationService.create()`, `WaitlistService.join()`. 새 공용 추상화는 안 만들고 각 서비스에 1줄씩 추가(호출부가 4곳뿐이라 섣부른 추상화 방지)
- `GET /api/pets`는 `PetRepository.findAllAccessibleByUserId()`(소유 OR 공유 펫을 OR-EXISTS 서브쿼리 하나로 페이지네이션) 사용, 응답의 `PetResponse.role`(OWNER/GUARDIAN)로 요청자 기준 역할 표시
- `PetService.delete()`는 여전히 소유자 전용(`getOwnedPet()`, 공동보호자는 403)
- **Pet 삭제 정책**: `HealthRecord`/`Waitlist`/`PetGuardian`은 다른 곳에 부작용이 없어서 펫 삭제 시 같이 정리(cascade). 반면 `Reservation`은 `Slot.status`, 관리자 통계, 리뷰 작성 자격(CONFIRMED 이력)과 얽혀있어서 함부로 지우면 안 됨 — **예약 이력이 하나라도 있는 반려동물은 삭제 자체를 막고 409**("예약 이력이 있는 반려동물은 삭제할 수 없습니다.") 반환. 겪은 버그: 이 체크가 없던 시절엔 FK 제약 위반으로 500이 났음(다중 보호자 기능 검증 중 발견, 이후 수정 완료)

## 페이지네이션
- 대부분의 목록 API는 `Pageable`(쿼리파라미터 `page`, `size`, `sort`) 기반, 응답은 `ApiResponse<PageResponse<T>>` (`global/common/PageResponse`: content/page/size/totalElements/totalPages). 컨트롤러에 `@PageableDefault(size = 20)` 기본값
- 제외된 목록(의도적으로 페이지네이션 안 함): `GET /api/hospitals`(검색 — 거리 필터를 메모리에서 계산해서 DB 페이지네이션과 안 맞음), `GET /api/admin/stats/hospitals`(리포트성, 병원 수만큼만), `GET /api/users/me/upcoming-vaccinations`(개인용 소량 목록)
- 새 목록 API 만들 땐 이 패턴 따라갈 것: Repository는 `Page<Entity> findAllByXxx(..., Pageable)`, Service는 `PageResponse<Dto> method(..., Pageable)` 반환, Controller는 `Pageable pageable` 파라미터 받아서 그대로 전달

## 검증 방식
- 컴파일 성공만으로 끝내지 않고, 매 단계마다 실제로 `./gradlew bootRun`으로 띄운 뒤 curl로 정상 케이스 + 에러 케이스(권한 없음/중복/유효성 실패 등)까지 호출해서 확인
- MySQL은 Docker 컨테이너(`petcare-mysql`)로 로컬 상시 구동, `docker start petcare-mysql`로 재시작
- Redis도 로컬 컨테이너 `petcare-redis`(`redis:7-alpine`, 6379) — `docker start petcare-redis`. 운영은 compose의 `redis` 서비스(영속화 끔, maxmemory 64mb)

## 자동화 테스트
- `src/test`에 핵심 흐름 통합테스트 존재: `AuthFlowTest`(회원가입/로그인/중복/오답 비밀번호), `ReservationFlowTest`(예약 생성→PENDING→관리자 확정, 그리고 동시 예약 요청 시 하나만 성공하는지 — `@Version` 낙관적 락 검증), `BusinessRuleTest`(슬롯 시간 규칙, 타 병원 소유자 403, 공동보호자 삭제 403, 대기 1순위만 알림, 정지 즉시 반영)
- 과거 시간 슬롯은 API로 못 만들게 막혀 있어서, 지난 슬롯/지난 예약이 필요한 테스트는 `SlotRepository`/`ReservationRepository`로 직접 저장함
- Redis는 Testcontainers(`RedisTestConfig`, `@ServiceConnection`)로 테스트 중에만 컨테이너를 띄움 — **모든 `@SpringBootTest` 클래스에 `@Import(RedisTestConfig.class)`** 붙일 것(설정이 같아야 컨텍스트가 캐시돼 컨테이너가 한 번만 뜸). 로컬/CI 모두 Docker 필요. Testcontainers 버전을 `build.gradle`에서 1.21.4로 올려둠(Boot 3.4.1 기본 1.20.x는 Docker 29에서 실행 실패 — 겪은 문제)
- 테스트는 개발용 MySQL을 안 건드리고 별도 H2 인메모리 DB 사용 (`src/test/resources/application-test.yml`, `@ActiveProfiles("test")` 필요). `NON_KEYWORDS=USER` 빠뜨리면 H2에서 `user` 테이블명이 예약어라 DDL이 깨짐(겪은 문제)
- `@SpringBootTest` 클래스 내 테스트 메서드들은 스프링 컨텍스트(=DB)를 공유하므로, 유니크 제약 있는 데이터(이메일 등)는 테스트마다 고유한 값 써야 함(`System.nanoTime()` 등으로) — 안 그러면 두 번째 테스트의 `@BeforeEach`에서 충돌남(겪은 문제)
- 동시성 테스트는 멀티스레드로 같은 슬롯에 동시 요청 보내서 성공 횟수가 1인지 검증. 테스트 클래스에 `@Transactional`을 걸면 워커 스레드가 메인 스레드의 미커밋 데이터를 못 보게 되므로 걸지 말 것
- 실행: `./gradlew test` (또는 `./gradlew build`에 포함됨)

## 진행 상황
**완료**
- 1~4단계 로드맵(초기 세팅 → 인증 → 핵심 API → 심화 기능: 프로필/건강기록/알림) 전부 구현 및 실제 API 호출로 검증 완료
- 추가 기능 그룹 3개 전부 완료: 반려동물/병원 정보 강화(견종 크기, 사진 업로드, 즐겨찾기, 리뷰/평점), 검색/탐색+관리자 통계(Querydsl), 알림/리마인더(D-day, 스케줄러)
- Refresh Token, 관리자 가입 플로우 정식화(부트스트랩+승격 API) 완료
- 디테일 정비: Swagger Bearer 인증 설정, Slot 시간 검증, `.env.example`, 알림 안읽은 개수 API
- 예약 확정 대기(PENDING) 플로우 활성화, 병원 근처 검색(거리 기반), 대부분 목록 API 페이지네이션, 핵심 흐름 통합테스트(Auth/Reservation), 실시간 알림(SSE), 병원 자체 계정 시스템(HOSPITAL_OWNER), 찜한 병원 새 슬롯 알림, 병원 운영시간/진료과목+수정 API, 실시간 채팅(1:1 문의) 추가
- 반려동물 species(DOG/CAT) 추가, 생활기록(산책/식사/배변) 타입 추가, 사료 급여량 계산기, 비대면 건강 자가문진, 병원 24시간/주차/평균진료비 필드+필터 추가
- 대기자 명단(Waitlist), 비밀번호 재설정(이메일 발송은 미구현, 로그로 대체), 건강 기록 통계(체중 그래프/타입별 개수), 리뷰 신고·모더레이션(관리자 숨김/해제), 알림 카테고리별 on/off 설정 추가
- 리뷰 병원 답글, 예약 노쇼(No-show) 처리+통계 반영, 병원 사진 업로드, 관리자 유저 정지/차단 추가
- 다중 보호자(가족 공유) 반려동물 계정 추가 — 브레인스토밍으로 권한 모델(최초 등록자 vs 공동보호자) 설계 먼저 확정 후 구현
- 배포(2026-09-30): https://petcare-yongbin.duckdns.org — EC2 t3.micro 1대 + Docker Compose(web=Caddy+프론트 정적파일, backend, mysql) + GitHub Actions(test → GHCR 이미지 push → ssh `pull && up -d --no-build`), HTTPS는 DuckDNS+Caddy 자동 인증서. PR은 테스트만, main push는 테스트 통과 시에만 배포. 절차·롤백은 `../docs/DEPLOY.md`, 설계는 `../docs/superpowers/specs/2026-09-30-deploy-ci-design.md`
- Redis 도입(2026-10-02, PR #2~#4, 운영 배포 완료): 로그인 실패 횟수 제한(#2), 병원 상세 캐시(#3), 병원 거리 검색 위경도 범위 DB 필터(#4 — Redis 미사용, 같은 "병원 수 증가 대비" 묶음). 작업 방식: 기능별 브랜치 → PR(CI 테스트만) → 스쿼시 머지(main push 시 자동 배포). 운영 확인은 로그인 429까지 완료, 운영 DB에 병원 데이터가 없어 캐시는 로컬에서만 검증
- 배포 장애 기록(2026-10-02): deploy job이 `ssh: connect to host ... port 22: Connection timed out`으로 실패 → 원인은 EC2 인스턴스가 중지돼 있던 것(콘솔에서 안 보인 건 리전을 다르게 보고 있어서). 인스턴스 시작 후 **가장 최근 main 실행의 실패 job만** `gh run rerun <id> --failed`로 재실행해 배포(이전 실패 실행을 재실행하면 옛 커밋 이미지가 배포됨). 탄력적 IP라 재시작해도 `EC2_HOST` 그대로
- push 전략: 파이프라인은 push 때만 돌므로 문서만 바뀐 건 로컬 커밋으로 두고 다음 코드 PR에 같이 올림(`paths-ignore`는 필요해지면 추가)
- 2026-10-02~05 추가 작업(PR #5~#13): 채팅 WebSocket 전환·안 읽은 수(#5), 진료 기록(#6), 예약 메모·자가문진 첨부(#7), 예약 시간 변경(#8), 리뷰 사진(#9), 병원 기간 통계(#10), 대기자 차례 넘기기(#11), 요일별 진료 시간·지금 진료 중(#12), 헬스체크·uptime 감시·자동 백업(#13, 머지 대기). 각 기능 상세는 해당 섹션 참고

**남은 것**
- 소셜 로그인(구글/네이버) — 개발자 콘솔에서 클라이언트 ID/Secret 발급 필요, 아직 미시작
- 이메일 인증 회원가입 — 소셜 로그인 작업 이후로 순서 미룸(같이 인증/가입 플로우를 손대는 게 효율적이라 판단). 메일 발송 수단(Gmail SMTP/SES) 먼저 정해야 함, 인증 코드는 Redis TTL 사용 예정
- 푸시 알림(FCM) — 외부 서비스 설정 먼저 필요, 의도적으로 계속 미룸
- 병원 검색(`GET /api/hospitals`) 페이지네이션 — 응답 형식이 바뀌어 프론트 수정 필요, 병원 수가 수천 단위가 되면 진행
- 운영 데모 데이터 — 2026-10-09 가상 병원 방식으로 구현(PR #15, 상세는 "운영 데모 데이터" 항목)
- 지도 보기 — 카카오맵 JavaScript 키 발급 대기(localhost:5173, 운영 도메인 등록)
- EBS 스냅샷 자동화(AWS 콘솔, 사용자 설정)

**프론트엔드**: `../frontend`에 별도로 Vite+React 프로젝트 (자체 CLAUDE.md 있음). 인증·병원 탐색/상세·예약/대기·반려동물/건강기록·채팅·알림·마이페이지·병원 소유자 대시보드·관리자 화면·고객지원(FAQ/공지/약관)까지 구현됨.

**저장소**: `petcare-project`(backend+frontend 상위 폴더)를 모노레포로 GitHub(`CodeVins/PetCare-System`)에 push 완료.

## 진행 방식
- 한 번에 다 만들지 말고 단계별로 진행
- 각 단계 끝나면 무엇을 했는지 요약하고 다음 단계 진행 여부 확인
- 향후 확장 여지를 고려해 도메인 이름/패키지 구조는 "예약"에 국한되지 않게 설계
