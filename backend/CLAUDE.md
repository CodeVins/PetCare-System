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
│   ├── admin (통계/유저관리/예약관리/병원소유자지정)
│   └── chat
└── global
    ├── config (WebConfig-정적리소스, QuerydslConfig)
    ├── security (JWT, SecurityConfig)
    ├── exception (GlobalExceptionHandler)
    ├── file (FileStorageService)
    └── common (ApiResponse, BaseEntity)

각 도메인 패키지 내부는 타입별이 아니라 도메인별로 뭉쳐서 배치: `Xxx.java`(엔티티), `XxxRepository`, `XxxService`, `XxxController`, `dto/`.

## 엔티티
- User: id, email, password, role(USER/HOSPITAL_OWNER/ADMIN)
- RefreshToken: id, user_id(FK, unique — 유저당 1개), token(unique), expires_at
- Pet: id, user_id(FK), name, breed, birth_date, size(SMALL/MEDIUM/LARGE, nullable), image_url(nullable)
- Hospital: id, name, address, latitude, longitude, opening_hours(nullable, 자유 텍스트), specialty(nullable, 자유 텍스트), owner_id(FK, nullable) (응답 시 averageRating/reviewCount를 Review 집계로 붙여서 내려줌, 컬럼은 아님)
- Slot: id, hospital_id(FK), start_time, end_time, status(AVAILABLE/RESERVED), version(낙관적 락)
- Reservation: id, slot_id(FK), pet_id(FK), user_id(FK), status(PENDING/CONFIRMED/REJECTED/CANCELLED) — 생성 시 PENDING, 관리자가 확정/거절
- HealthRecord: id, pet_id(FK), type(WEIGHT/VACCINATION/TREATMENT), recorded_at, content, weight, next_due_date(nullable — 다음 접종/진료 예정일)
- Notification: id, user_id(FK), type(RESERVATION_REQUESTED/CONFIRMED/REJECTED/CANCELLED, RESERVATION_REMINDER, VACCINATION_DUE_SOON, FAVORITE_HOSPITAL_NEW_SLOT), content, is_read
- Favorite: id, user_id(FK), hospital_id(FK), (user_id, hospital_id) 유니크
- Review: id, hospital_id(FK), user_id(FK), rating(1~5), content, (user_id, hospital_id) 유니크(병원당 리뷰 1개) — 작성 자격은 해당 병원 CONFIRMED 예약 이력 보유자만
- ChatRoom: id, customer_id(FK), hospital_id(FK), (customer_id, hospital_id) 유니크(고객-병원당 방 1개)
- ChatMessage: id, chat_room_id(FK), sender_id(FK), content

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

## 실시간 채팅 (1:1 문의)
- `ChatRoom`(고객 1명 - 병원 1개, 유니크), `ChatMessage`. `POST /api/chat-rooms`는 get-or-create(같은 고객+병원 조합이면 기존 방 반환)
- `GET /api/chat-rooms` — USER는 본인이 고객인 방, HOSPITAL_OWNER는 본인 병원 방
- `GET/POST /api/chat-rooms/{roomId}/messages` — 접근 권한은 `ChatRoom.canAccess()`(고객 본인이거나 `Hospital.isManagedBy()`) 재사용, ADMIN은 모든 방 접근 가능(중재 목적)
- **새 SSE 채널을 안 만들고 기존 알림 SSE 재사용**: 메시지 보내면 상대방에게 `CHAT_MESSAGE_RECEIVED` 알림을 보내고, 그게 기존 알림 SSE로 실시간 push됨 — 메시지 내용 자체는 SSE로 안 흘려보내고, 프론트가 알림 받으면 메시지 목록을 다시 조회하는 방식(범위를 좁게 유지)
- `HospitalService.findHospital()`을 다른 도메인(chat)에서도 써야 해서 package-private → public으로 변경
- 관리자 부트스트랩: `AdminBootstrapRunner`(global/config, `ApplicationRunner`)가 앱 시작 시 `.env`의 `ADMIN_EMAIL`/`ADMIN_PASSWORD`로 최초 관리자를 자동 생성(없으면 생성, 있으면 ADMIN으로 승격) — 더 이상 DB 수동 UPDATE 불필요. 이후 관리자 추가는 `GET /api/admin/users` + `PATCH /api/admin/users/{userId}/role`로 기존 관리자가 승격 (본인 권한 변경은 막혀있음)
- MySQL 예약어 주의: 컬럼명으로 `read`, `order` 같은 예약어 쓰면 DDL이 조용히 깨짐(런타임에 "테이블 없음" 에러로 나타남) — 애매하면 `@Column(name=...)`로 명시적으로 피해갈 것
- enum 컬럼은 전부 `@Column(columnDefinition = "varchar(N)")` 명시해서 VARCHAR로 매핑 (MySQL 네이티브 ENUM 쓰면 `ddl-auto: update`가 기존 컬럼에 새 enum 값을 반영 못 해서, enum에 값 추가할 때마다 "Data truncated" 런타임 에러남 — 겪은 버그). 새 enum 필드 추가할 때도 이 패턴 유지할 것
- 로컬 개발용 계정: `test-new@petcare.com`/`newpassword123`(USER), `admin@petcare.com`/`adminpass123`(ADMIN), `owner-test@petcare.com`/`ownerpass123`(HOSPITAL_OWNER, 병원 id=2 소유)
- CORS 허용 오리진: `http://localhost:5173`(Vite), `http://localhost:3000`(CRA) — 프론트 개발 서버 포트가 다르면 `SecurityConfig.corsConfigurationSource()`에 추가
- 파일 업로드(반려동물 사진): 로컬 디스크 저장(`uploads/pets/`, `.gitignore` 처리됨), `global/file/FileStorageService`가 담당. 파일명은 클라이언트 값을 쓰지 않고 UUID로 새로 생성(경로 조작 방지), 업로드 시 jpg/png/webp만 허용, 5MB 제한. `/uploads/**`는 SecurityConfig에서 permitAll — 이미지는 공개로 서빙됨

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

**남은 것**
- 소셜 로그인(구글/네이버) — 개발자 콘솔에서 클라이언트 ID/Secret 발급 필요, 아직 미시작
- 푸시 알림(FCM) — 외부 서비스 설정 먼저 필요, 의도적으로 계속 미룸

**프론트엔드**: `../frontend`에 별도로 Vite+React 프로젝트 진행 중 (자체 CLAUDE.md 있음). 회원가입 화면까지 구현됨.

**저장소**: `petcare-project`(backend+frontend 상위 폴더)를 모노레포로 GitHub(`CodeVins/PetCare-System`)에 push 완료.

## 진행 방식
- 한 번에 다 만들지 말고 단계별로 진행
- 각 단계 끝나면 무엇을 했는지 요약하고 다음 단계 진행 여부 확인
- 향후 확장 여지를 고려해 도메인 이름/패키지 구조는 "예약"에 국한되지 않게 설계
