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
- Hospital: id, name, address, latitude, longitude, opening_hours(nullable, 자유 텍스트), specialty(nullable, 자유 텍스트), is_24_hours(nullable), has_parking(nullable), avg_treatment_price(nullable), image_url(nullable), owner_id(FK, nullable) (응답 시 averageRating/reviewCount를 Review 집계로 붙여서 내려줌, 컬럼은 아님)
- Slot: id, hospital_id(FK), start_time, end_time, status(AVAILABLE/RESERVED), version(낙관적 락)
- Reservation: id, slot_id(FK), pet_id(FK), user_id(FK), status(PENDING/CONFIRMED/REJECTED/CANCELLED/NO_SHOW) — 생성 시 PENDING, 관리자/병원이 확정/거절/노쇼 처리
- HealthRecord: id, pet_id(FK), type(WEIGHT/VACCINATION/TREATMENT/WALK/MEAL/EXCRETION/HEALTH_CHECK), recorded_at, content, weight, next_due_date(nullable — 다음 접종/진료 예정일)
- Notification: id, user_id(FK), type(RESERVATION_REQUESTED/CONFIRMED/REJECTED/CANCELLED/NO_SHOW, RESERVATION_REMINDER, VACCINATION_DUE_SOON, FAVORITE_HOSPITAL_NEW_SLOT, CHAT_MESSAGE_RECEIVED, WAITLIST_SLOT_AVAILABLE), content, is_read — `NotificationType.category()`로 `NotificationCategory`(RESERVATION/VACCINATION/FAVORITE/CHAT/WAITLIST) 그룹핑, 알림 on/off 설정에 사용
- NotificationPreference: id, user_id(FK), category(NotificationCategory), enabled — (user_id, category) 유니크, 행이 없으면 기본 enabled=true로 취급
- Favorite: id, user_id(FK), hospital_id(FK), (user_id, hospital_id) 유니크
- Review: id, hospital_id(FK), user_id(FK), rating(1~5), content, hidden(boolean, 기본 false) — (user_id, hospital_id) 유니크(병원당 리뷰 1개), 작성 자격은 해당 병원 CONFIRMED 예약 이력 보유자만
- ReviewReport: id, review_id(FK), reporter_id(FK), reason — (review_id, reporter_id) 유니크(같은 리뷰 중복 신고 불가)
- ReviewReply: id, review_id(FK, unique — 리뷰당 답글 1개), content — 병원 측(ADMIN 또는 해당 병원 HOSPITAL_OWNER)이 작성
- ChatRoom: id, customer_id(FK), hospital_id(FK), (customer_id, hospital_id) 유니크(고객-병원당 방 1개)
- ChatMessage: id, chat_room_id(FK), sender_id(FK), content
- Waitlist: id, slot_id(FK), pet_id(FK), user_id(FK) — (slot_id, user_id) 유니크, 슬롯이 이미 RESERVED일 때만 등록 가능
- PasswordResetToken: id, user_id(FK), token(unique), expires_at(발급 30분), used(boolean)

## 동적 쿼리 (Querydsl)
- `GET /api/hospitals?keyword=&minRating=&sort=NAME_ASC|RATING_DESC|REVIEW_COUNT_DESC` — Hospital-Review left join + groupBy로 평점 집계/필터/정렬을 쿼리 하나로 처리 (`HospitalRepositoryImpl`)
- 같은 엔드포인트에 `&lat=&lng=&radiusKm=` 추가하면 거리 기반 필터링(Haversine, `HospitalService` 내 순수 자바 계산 — 병원 수가 적어서 DB 함수 안 씀). 셋 다 줘야 동작, 좌표 없는 병원(latitude/longitude null)은 결과에서 제외. 응답의 `distanceKm`은 이 파라미터를 줬을 때만 채워짐
- Querydsl 커스텀 레포지토리 패턴: `XxxRepositoryCustom` 인터페이스 + `XxxRepositoryImpl`(반드시 이 이름, Spring Data가 자동 인식) + `XxxRepository extends JpaRepository<...>, XxxRepositoryCustom`
- `JPAQueryFactory` 빈은 `global/config/QuerydslConfig`에 등록
- `GET /api/admin/stats/summary`, `GET /api/admin/stats/hospitals` (ADMIN 전용) — 병원별/전체 예약·리뷰 집계

## 예약 확정 플로우
- 예약 생성(`POST /api/reservations`) 시 바로 CONFIRMED가 아니라 PENDING으로 생성됨 (슬롯은 즉시 RESERVED로 잠금 — 동시 예약 방지는 그대로 유지)
- `GET /api/admin/reservations?status=`, `PATCH /api/admin/reservations/{id}/confirm`, `PATCH /api/admin/reservations/{id}/reject` (전부 ADMIN 전용) — PENDING만 확정/거절 가능
- 거절(REJECTED)과 취소(CANCELLED)는 의미가 달라서 별도 상태로 분리. 리뷰 작성 자격은 여전히 CONFIRMED 기준(PENDING/REJECTED 상태로는 리뷰 불가)
- 유저는 PENDING이든 CONFIRMED든 취소 가능(`PATCH /api/reservations/{id}/cancel`), REJECTED/CANCELLED는 재취소 불가(409)

## 리마인더/스케줄러
- `ReminderScheduler`(domain/notification, `@Scheduled(cron="0 0 9 * * *")`): 접종 예정일 D-3, 예약 전날에 알림 생성. `@Transactional` 필수(지연 로딩 엔티티를 세션 밖에서 접근하면 `LazyInitializationException` 남)
- ponytail: 정확히 해당 날짜에만 매칭하는 방식이라 그 시각에 서버가 꺼져있으면 알림이 누락됨. 중복방지 플래그 없음(같은 날 여러 번 실행하면 중복 알림 생성됨) — 필요해지면 `reminderSent` 플래그 추가
- `POST /api/admin/reminders/run` (ADMIN 전용): 크론 기다리지 않고 수동으로 즉시 실행 (테스트/데모용)
- `GET /api/users/me/upcoming-vaccinations`: 마이페이지용 D-day 목록

## 실시간 알림 (SSE)
- `GET /api/notifications/subscribe` — `SseEmitter` 기반, WebSocket 대신 SSE 선택(알림은 서버→클라이언트 단방향이라 이걸로 충분, 구현도 훨씬 간단)
- 브라우저 네이티브 `EventSource`는 커스텀 헤더를 못 보내서, 이 경로에 한해 `?token=`쿼리파라미터로도 JWT 인증 허용(`JwtAuthenticationFilter`에서 경로 하드코딩 체크). 다른 엔드포인트는 여전히 Authorization 헤더만 허용
- `NotificationService.notify()`가 DB 저장 후 연결된 SSE 있으면 바로 push, 없으면 DB에만 남고 다음 폴링(`GET /api/notifications`)으로 확인 — 기존 흐름 안 깨짐
- `SseEmitterRepository`(domain/notification)가 유저별 활성 emitter를 메모리(ConcurrentHashMap)에 보관. ponytail: 서버 인스턴스 하나 기준이라 스케일아웃 시 다른 인스턴스에 붙은 클라이언트에겐 못 보냄 — 필요해지면 Redis pub/sub 등으로 인스턴스 간 브로드캐스트 추가
- 모든 엔티티는 `BaseEntity`(createdAt/updatedAt, JPA Auditing) 상속

## 컨벤션
- API 응답은 공통 `ApiResponse<T>`(success/data/message) 포맷 사용, 전부 `GlobalExceptionHandler`를 거침
- 예약 동시성 제어는 낙관적 락(@Version) 우선 적용 (Slot 기준, 충돌 시 409)
- 커밋 메시지: "타입: 설명" 형식 (예: feat: 회원가입 API 추가), 한국어
- 엔티티: `@NoArgsConstructor(PROTECTED)` + `@Builder`가 붙은 private 생성자만 사용, public setter 없음. 상태 변경은 `update()`/`cancel()`/`reserve()`/`changeEmail()` 같은 의미 있는 메서드로만
- 소유권 검증: `엔티티.isOwnedBy(userId)`를 서비스 계층에서 체크, 위반 시 `ForbiddenException`(403)
- 공통 예외(`global/exception`): `NotFoundException`(404), `ForbiddenException`(403), `ConflictException`(409) — 도메인별로 새 예외 클래스 만들지 않고 이 3개 재사용. 이메일 중복/로그인 실패만 전용 예외(`DuplicateEmailException`, `InvalidCredentialsException`) 사용
- 인증: JWT Bearer 토큰, stateless. 토큰의 subject는 이메일이라서 **이메일을 변경하면 기존 토큰이 즉시 무효화됨**(재로그인 필요) — 프론트에서 이메일 변경 후 자동 로그아웃 처리 필요
- Refresh Token: 로그인 시 accessToken(1시간)+refreshToken(14일, 랜덤 opaque 문자열)을 같이 발급. `RefreshToken` 엔티티는 유저당 1개(멀티 디바이스 미지원, 재로그인/재발급 시 기존 걸 교체). `POST /api/auth/reissue`로 재발급하며, 재발급마다 refreshToken도 회전(재사용 방지). `POST /api/auth/logout`(인증 필요)은 refreshToken을 DB에서 삭제만 함 — accessToken 자체는 stateless라 즉시 무효화 안 되고 최대 1시간 뒤 자연 만료됨(알려진 한계)
- `/api/auth/**` 전체를 permitAll 하면 안 됨 — `signup`/`login`/`reissue`만 열고 `logout`은 인증 필요(겪은 버그: 전체를 열어놔서 `logout`이 인증 없이 호출되던 문제)
- ADMIN 권한: `@PreAuthorize("hasRole('ADMIN')")` (병원 생성 등 플랫폼 전역 작업). 회원가입은 전부 USER로 생성되고 공개 ADMIN 가입 경로는 없음(의도적)
- 병원 소유자(HOSPITAL_OWNER): `Hospital.owner`로 병원 하나에 소유자 한 명 연결. `PATCH /api/admin/hospitals/{hospitalId}/owner`(ADMIN 전용)로 지정 — 지정 시 대상 유저가 USER면 자동으로 HOSPITAL_OWNER로 승격됨. 슬롯 생성(`POST /api/hospitals/{id}/slots`)과 예약 확정/거절/목록(`/api/admin/reservations/**`)은 `@PreAuthorize("hasRole('ADMIN') or hasRole('HOSPITAL_OWNER')")`로 게이트를 열어두고, 서비스 계층에서 `Hospital.isManagedBy(currentUser)`(ADMIN은 항상 true, HOSPITAL_OWNER는 본인 소유 병원만 true)로 세밀하게 재검증. 병원 생성 자체는 여전히 ADMIN 전용 유지 — 새 병원 등록 후 소유자를 배정하는 구조
- `PATCH /api/hospitals/{hospitalId}` — 병원 정보 수정(이름/주소/위경도/운영시간/진료과목), ADMIN 또는 소유 HOSPITAL_OWNER만. 필드 전체를 다시 받는 방식이라 일부 필드 생략하면 null로 덮어써짐 (Pet/HealthRecord 수정 API와 동일한 컨벤션)
- 슬롯 생성 시 그 병원을 찜한 유저들에게 `FAVORITE_HOSPITAL_NEW_SLOT` 알림 자동 발송 (`SlotService.notifyFavoriters`)
- `GET /api/hospitals`에 `&is24Hours=&hasParking=` 필터 추가 (Querydsl where절, null이면 무시)

## 실시간 채팅 (1:1 문의)
- `ChatRoom`(고객 1명 - 병원 1개, 유니크), `ChatMessage`. `POST /api/chat-rooms`는 get-or-create(같은 고객+병원 조합이면 기존 방 반환)
- `GET /api/chat-rooms` — USER는 본인이 고객인 방, HOSPITAL_OWNER는 본인 병원 방
- `GET/POST /api/chat-rooms/{roomId}/messages` — 접근 권한은 `ChatRoom.canAccess()`(고객 본인이거나 `Hospital.isManagedBy()`) 재사용, ADMIN은 모든 방 접근 가능(중재 목적)
- **새 SSE 채널을 안 만들고 기존 알림 SSE 재사용**: 메시지 보내면 상대방에게 `CHAT_MESSAGE_RECEIVED` 알림을 보내고, 그게 기존 알림 SSE로 실시간 push됨 — 메시지 내용 자체는 SSE로 안 흘려보내고, 프론트가 알림 받으면 메시지 목록을 다시 조회하는 방식(범위를 좁게 유지)
- `HospitalService.findHospital()`을 다른 도메인(chat)에서도 써야 해서 package-private → public으로 변경
- 관리자 부트스트랩: `AdminBootstrapRunner`(global/config, `ApplicationRunner`)가 앱 시작 시 `.env`의 `ADMIN_EMAIL`/`ADMIN_PASSWORD`로 최초 관리자를 자동 생성(없으면 생성, 있으면 ADMIN으로 승격) — 더 이상 DB 수동 UPDATE 불필요. 이후 관리자 추가는 `GET /api/admin/users` + `PATCH /api/admin/users/{userId}/role`로 기존 관리자가 승격 (본인 권한 변경은 막혀있음)
- MySQL 예약어 주의: 컬럼명으로 `read`, `order` 같은 예약어 쓰면 DDL이 조용히 깨짐(런타임에 "테이블 없음" 에러로 나타남) — 애매하면 `@Column(name=...)`로 명시적으로 피해갈 것
- 기존 테이블에 NOT NULL 컬럼 추가할 때 주의: MySQL이 strict mode가 아니면 DEFAULT 없이 `ALTER TABLE ... ADD COLUMN ... NOT NULL`이 에러 없이 성공하지만, 기존 행은 문자열 빈 값("")으로 채워짐(NULL도 아니고 원하는 기본값도 아님) — `Pet.species` 추가할 때 겪음. 기존 행 백필이 필요하면 컬럼 추가 후 `UPDATE ... SET col = '기본값' WHERE col = '' OR col IS NULL`을 수동으로 돌릴 것
- enum 컬럼은 전부 `@Column(columnDefinition = "varchar(N)")` 명시해서 VARCHAR로 매핑 (MySQL 네이티브 ENUM 쓰면 `ddl-auto: update`가 기존 컬럼에 새 enum 값을 반영 못 해서, enum에 값 추가할 때마다 "Data truncated" 런타임 에러남 — 겪은 버그). 새 enum 필드 추가할 때도 이 패턴 유지할 것
- 로컬 개발용 계정: `test-new@petcare.com`/`newpassword123`(USER), `admin@petcare.com`/`adminpass123`(ADMIN), `owner-test@petcare.com`/`ownerpass123`(HOSPITAL_OWNER, 병원 id=2 소유)
- CORS 허용 오리진: `http://localhost:5173`(Vite), `http://localhost:3000`(CRA) — 프론트 개발 서버 포트가 다르면 `SecurityConfig.corsConfigurationSource()`에 추가
- 파일 업로드(반려동물 사진): 로컬 디스크 저장(`uploads/pets/`, `.gitignore` 처리됨), `global/file/FileStorageService`가 담당. 파일명은 클라이언트 값을 쓰지 않고 UUID로 새로 생성(경로 조작 방지), 업로드 시 jpg/png/webp만 허용, 5MB 제한. `/uploads/**`는 SecurityConfig에서 permitAll — 이미지는 공개로 서빙됨

## 반려동물 생활/건강 관련 API
- `Pet.species`(DOG/CAT) 추가 — breed는 원래도 자유 텍스트라 별도 검증/품종 목록 로직 없었음(고양이 대응 위해 고칠 게 없었음)
- `POST /api/pets/{petId}/feeding-calculator` — RER = 70×체중^0.75, DER = RER×활동계수. **활동계수는 자료 원본이 "중성화 여부" 기준(강아지 중성화O 1.6/중성화X 1.8/체중감량 1.4, 고양이 중성화O 1.2)인데 이 API 입력은 활동량(LOW/NORMAL/HIGH)이라 직접 매핑함**: 강아지 LOW/NORMAL/HIGH = 1.4/1.6/1.8, 고양이는 자료에 1.2(NORMAL) 하나뿐이라 같은 0.2 간격으로 LOW=1.0/HIGH=1.4 추정 — 상수는 `FeedingCalculatorService.DER_COEFFICIENTS`, 실사용 전 수의사 자문으로 재검증 필요. 사료 칼로리 밀도는 기본 350kcal/100g(건식 평균), 요청에서 override 가능. 습식+건식 혼합 급여, 간식 10% 할당 같은 건 이번 범위에서 뺌(엔드포인트 스펙에 없던 입력이라)
- `GET /api/health-check/questions`, `POST /api/health-check/submit` — 부위별 질문 8개(식욕/배변/구토/기력/피부/호흡/음수/체중) 고정 문항, 답변 점수 합산 후 LOW(0~3)/MEDIUM(4~9)/HIGH(10+)로 판정(`HealthCheckService` 상수). **품종/연령별 실제 평균치 통계는 없어서(허위 데이터를 만들기 싫어서) comparisonNote에 그 사실을 그대로 안내함** — 진단이 아니라 참고용 자가 문진이라는 disclaimer 항상 포함
- 문진 결과는 `saveRecord: true`로 제출하면 `HealthRecordType.HEALTH_CHECK`로 저장됨 (기존 HealthRecordService.create 재사용)
- 질문 데이터는 DB가 아니라 `HealthCheckQuestionBank`에 하드코딩 (ponytail: 문항 수 늘거나 운영진 편집 필요해지면 DB로 이전)

## 대기자 명단 (Waitlist)
- 이미 예약 마감(`RESERVED`)된 슬롯에만 등록 가능(`POST /api/waitlists`) — `AVAILABLE` 슬롯에 등록하려 하면 409(그냥 예약하면 되므로)
- `GET /api/waitlists`(내 대기 목록), `DELETE /api/waitlists/{waitlistId}`(대기 취소)
- 해당 슬롯의 예약이 취소(`cancel`)되거나 거절(`reject`)되어 슬롯이 다시 열리면(`ReservationService`), `WaitlistService.notifyNextInLine()`이 대기열 맨 앞(`createdAt` 기준)인 사람 1명에게만 `WAITLIST_SLOT_AVAILABLE` 알림을 보내고 그 사람의 대기 항목을 삭제함. ponytail: 선착순 알림 스탬피드 방지를 위해 전체 대기자가 아니라 1명에게만 통지 — 그 사람이 안 잡으면 다음 사람에게 안 넘어감(슬롯이 다시 RESERVED 되는 사건이 없으면 트리거 안 됨), 필요해지면 "확정 안 하면 N분 뒤 다음 순번" 로직 추가

## 비밀번호 재설정
- `POST /api/auth/password-reset/request`(이메일만 받음), `POST /api/auth/password-reset/confirm`(토큰+새 비밀번호) — 둘 다 `SecurityConfig` permitAll
- ponytail: 실제 이메일 발송 미구현. `PasswordResetService`가 재설정 링크를 SLF4J 로그로만 남김(`[비밀번호 재설정] ...`) — 실사용 전 이메일 발송 연동 필요
- 존재하지 않는 이메일로 요청해도 항상 200(계정 존재 여부 노출 방지), 토큰은 30분 유효 + 1회용(`isUsable()`), 만료/재사용 시 409

## 건강 기록 통계
- `GET /api/pets/{petId}/health-records/summary` — 체중 기록(`WEIGHT` 타입)을 시간순으로 모은 `weightHistory`(그래프용), `latestWeight`, 타입별 기록 개수(`countByType`)를 한 번에 반환

## 리뷰 신고 / 모더레이션
- `POST /api/hospitals/{hospitalId}/reviews/{reviewId}/report` — 로그인 유저 아무나 신고 가능(리뷰 작성 자격과 무관), 같은 리뷰 중복 신고는 409
- `GET /api/admin/reviews/reports`, `PATCH /api/admin/reviews/{reviewId}/hide`, `PATCH /api/admin/reviews/{reviewId}/unhide` (전부 ADMIN 전용, `AdminReviewController`)
- `hidden=true`인 리뷰는 병원 리뷰 목록(`GET /api/hospitals/{hospitalId}/reviews`), 평균 평점/리뷰 수 집계(`HospitalService`, `AdminStatsService`, `HospitalRepositoryImpl`의 검색 결과)에서 전부 제외됨 — 신고 누적만으로 자동 숨김되진 않고 관리자가 직접 `hide` 호출해야 함(자동화 없음, 의도적으로 사람이 판단)

## 알림 카테고리 on/off
- `GET/PATCH /api/notifications/preferences` — `NotificationCategory`(RESERVATION/VACCINATION/FAVORITE/CHAT/WAITLIST) 단위로 on/off. GET은 설정 안 한 카테고리도 항상 5개 다 내려주고(기본 enabled=true), PATCH는 `{category, enabled}` 하나씩 upsert
- `NotificationService.notify()`가 알림 생성/SSE push 전에 `NotificationPreference`를 먼저 조회해서 꺼져있으면 DB 저장도 SSE push도 아예 안 함(꺼진 알림은 나중에 폴링해도 안 보임 — 완전히 발송 안 되는 것)

## 리뷰 답글 / 예약 노쇼 / 병원 사진 / 계정 정지
- `POST/PATCH/DELETE /api/hospitals/{hospitalId}/reviews/{reviewId}/reply` — ADMIN 또는 해당 병원 소유 HOSPITAL_OWNER만(`Hospital.isManagedBy()` 재검증), 리뷰 1개당 답글 1개(중복 작성 시 409). `GET .../reviews` 응답에 `reply` 필드로 같이 내려감(리뷰마다 답글 존재 여부 조회하는 N+1 방식 — ponytail: 목록이 커지면 답글 일괄 조회로 최적화 필요)
- `PATCH /api/admin/reservations/{id}/no-show` (ADMIN 또는 해당 병원 HOSPITAL_OWNER) — CONFIRMED 상태만 NO_SHOW로 전환 가능(PENDING/이미 NO_SHOW 등은 409). NO_SHOW는 취소 불가 상태(`isCancellable()`에 포함 안 됨)라 사용자가 되돌릴 수 없고, 리뷰 작성 자격 판단(CONFIRMED 기준)에서도 자동으로 제외됨. 슬롯은 릴리즈하지 않음(이미 지나간 시간이라 대기자 알림 대상 아님). `GET /api/admin/stats/summary`에 `noShowReservations` 집계 포함
- `POST/DELETE /api/hospitals/{hospitalId}/image` — Pet 사진 업로드와 동일 패턴(`FileStorageService`를 pet/hospital 공용으로 일반화, `uploads/hospitals/`, jpg/png/webp만, 5MB 제한). ADMIN 또는 소유 HOSPITAL_OWNER만
- `PATCH /api/admin/users/{userId}/suspend`, `PATCH /api/admin/users/{userId}/activate` (ADMIN 전용) — 정지된 계정은 로그인 시 403(`AuthService.login()`에서 체크). 본인 계정은 정지 불가(역할 변경과 동일한 자기 자신 보호 패턴). **알려진 한계**: JWT가 stateless라 이미 발급된 accessToken은 정지해도 즉시 무효화되지 않고 최대 1시간 뒤 자연 만료(이메일 변경 때와 동일한 제약) — 즉시 차단이 필요하면 매 요청마다 DB 조회가 필요한데 지금은 로그인 시점에만 체크

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

## 자동화 테스트
- `src/test`에 핵심 흐름 통합테스트 존재: `AuthFlowTest`(회원가입/로그인/중복/오답 비밀번호), `ReservationFlowTest`(예약 생성→PENDING→관리자 확정, 그리고 동시 예약 요청 시 하나만 성공하는지 — `@Version` 낙관적 락 검증)
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

**남은 것**
- 소셜 로그인(구글/네이버) — 개발자 콘솔에서 클라이언트 ID/Secret 발급 필요, 아직 미시작
- 이메일 인증 회원가입 — 소셜 로그인 작업 이후로 순서 미룸(같이 인증/가입 플로우를 손대는 게 효율적이라 판단)
- 푸시 알림(FCM) — 외부 서비스 설정 먼저 필요, 의도적으로 계속 미룸

**프론트엔드**: `../frontend`에 별도로 Vite+React 프로젝트 진행 중 (자체 CLAUDE.md 있음). 회원가입 화면까지 구현됨.

**저장소**: `petcare-project`(backend+frontend 상위 폴더)를 모노레포로 GitHub(`CodeVins/PetCare-System`)에 push 완료.

## 진행 방식
- 한 번에 다 만들지 말고 단계별로 진행
- 각 단계 끝나면 무엇을 했는지 요약하고 다음 단계 진행 여부 확인
- 향후 확장 여지를 고려해 도메인 이름/패키지 구조는 "예약"에 국한되지 않게 설계
