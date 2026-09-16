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
│   └── admin (통계 API)
└── global
    ├── config (WebConfig-정적리소스, QuerydslConfig)
    ├── security (JWT, SecurityConfig)
    ├── exception (GlobalExceptionHandler)
    ├── file (FileStorageService)
    └── common (ApiResponse, BaseEntity)

각 도메인 패키지 내부는 타입별이 아니라 도메인별로 뭉쳐서 배치: `Xxx.java`(엔티티), `XxxRepository`, `XxxService`, `XxxController`, `dto/`.

## 엔티티
- User: id, email, password, role(USER/ADMIN)
- Pet: id, user_id(FK), name, breed, birth_date, size(SMALL/MEDIUM/LARGE, nullable), image_url(nullable)
- Hospital: id, name, address, latitude, longitude (응답 시 averageRating/reviewCount를 Review 집계로 붙여서 내려줌, 컬럼은 아님)
- Slot: id, hospital_id(FK), start_time, end_time, status(AVAILABLE/RESERVED), version(낙관적 락)
- Reservation: id, slot_id(FK), pet_id(FK), user_id(FK), status(PENDING/CONFIRMED/CANCELLED)
- HealthRecord: id, pet_id(FK), type(WEIGHT/VACCINATION/TREATMENT), recorded_at, content, weight, next_due_date(nullable — 다음 접종/진료 예정일)
- Notification: id, user_id(FK), type(RESERVATION_CONFIRMED/RESERVATION_CANCELLED/RESERVATION_REMINDER/VACCINATION_DUE_SOON), content, is_read
- Favorite: id, user_id(FK), hospital_id(FK), (user_id, hospital_id) 유니크
- Review: id, hospital_id(FK), user_id(FK), rating(1~5), content, (user_id, hospital_id) 유니크(병원당 리뷰 1개) — 작성 자격은 해당 병원 CONFIRMED 예약 이력 보유자만

## 동적 쿼리 (Querydsl)
- `GET /api/hospitals?keyword=&minRating=&sort=NAME_ASC|RATING_DESC|REVIEW_COUNT_DESC` — Hospital-Review left join + groupBy로 평점 집계/필터/정렬을 쿼리 하나로 처리 (`HospitalRepositoryImpl`)
- Querydsl 커스텀 레포지토리 패턴: `XxxRepositoryCustom` 인터페이스 + `XxxRepositoryImpl`(반드시 이 이름, Spring Data가 자동 인식) + `XxxRepository extends JpaRepository<...>, XxxRepositoryCustom`
- `JPAQueryFactory` 빈은 `global/config/QuerydslConfig`에 등록
- `GET /api/admin/stats/summary`, `GET /api/admin/stats/hospitals` (ADMIN 전용) — 병원별/전체 예약·리뷰 집계

## 리마인더/스케줄러
- `ReminderScheduler`(domain/notification, `@Scheduled(cron="0 0 9 * * *")`): 접종 예정일 D-3, 예약 전날에 알림 생성. `@Transactional` 필수(지연 로딩 엔티티를 세션 밖에서 접근하면 `LazyInitializationException` 남)
- ponytail: 정확히 해당 날짜에만 매칭하는 방식이라 그 시각에 서버가 꺼져있으면 알림이 누락됨. 중복방지 플래그 없음(같은 날 여러 번 실행하면 중복 알림 생성됨) — 필요해지면 `reminderSent` 플래그 추가
- `POST /api/admin/reminders/run` (ADMIN 전용): 크론 기다리지 않고 수동으로 즉시 실행 (테스트/데모용)
- `GET /api/users/me/upcoming-vaccinations`: 마이페이지용 D-day 목록
- 모든 엔티티는 `BaseEntity`(createdAt/updatedAt, JPA Auditing) 상속

## 컨벤션
- API 응답은 공통 `ApiResponse<T>`(success/data/message) 포맷 사용, 전부 `GlobalExceptionHandler`를 거침
- 예약 동시성 제어는 낙관적 락(@Version) 우선 적용 (Slot 기준, 충돌 시 409)
- 커밋 메시지: "타입: 설명" 형식 (예: feat: 회원가입 API 추가), 한국어
- 엔티티: `@NoArgsConstructor(PROTECTED)` + `@Builder`가 붙은 private 생성자만 사용, public setter 없음. 상태 변경은 `update()`/`cancel()`/`reserve()`/`changeEmail()` 같은 의미 있는 메서드로만
- 소유권 검증: `엔티티.isOwnedBy(userId)`를 서비스 계층에서 체크, 위반 시 `ForbiddenException`(403)
- 공통 예외(`global/exception`): `NotFoundException`(404), `ForbiddenException`(403), `ConflictException`(409) — 도메인별로 새 예외 클래스 만들지 않고 이 3개 재사용. 이메일 중복/로그인 실패만 전용 예외(`DuplicateEmailException`, `InvalidCredentialsException`) 사용
- 인증: JWT Bearer 토큰, stateless. 토큰의 subject는 이메일이라서 **이메일을 변경하면 기존 토큰이 즉시 무효화됨**(재로그인 필요) — 프론트에서 이메일 변경 후 자동 로그아웃 처리 필요
- ADMIN 권한: `@PreAuthorize("hasRole('ADMIN')")` (Hospital/Slot 생성 등). 회원가입은 전부 USER로 생성되고 ADMIN 가입 경로는 없음 — 필요하면 DB에서 `UPDATE user SET role='ADMIN' WHERE email=...`로 수동 승격
- MySQL 예약어 주의: 컬럼명으로 `read`, `order` 같은 예약어 쓰면 DDL이 조용히 깨짐(런타임에 "테이블 없음" 에러로 나타남) — 애매하면 `@Column(name=...)`로 명시적으로 피해갈 것
- enum 컬럼은 전부 `@Column(columnDefinition = "varchar(N)")` 명시해서 VARCHAR로 매핑 (MySQL 네이티브 ENUM 쓰면 `ddl-auto: update`가 기존 컬럼에 새 enum 값을 반영 못 해서, enum에 값 추가할 때마다 "Data truncated" 런타임 에러남 — 겪은 버그). 새 enum 필드 추가할 때도 이 패턴 유지할 것
- 로컬 개발용 계정: `test-new@petcare.com`/`newpassword123`(USER), `admin@petcare.com`/`adminpass123`(ADMIN)
- CORS 허용 오리진: `http://localhost:5173`(Vite), `http://localhost:3000`(CRA) — 프론트 개발 서버 포트가 다르면 `SecurityConfig.corsConfigurationSource()`에 추가
- 파일 업로드(반려동물 사진): 로컬 디스크 저장(`uploads/pets/`, `.gitignore` 처리됨), `global/file/FileStorageService`가 담당. 파일명은 클라이언트 값을 쓰지 않고 UUID로 새로 생성(경로 조작 방지), 업로드 시 jpg/png/webp만 허용, 5MB 제한. `/uploads/**`는 SecurityConfig에서 permitAll — 이미지는 공개로 서빙됨

## 검증 방식
- 컴파일 성공만으로 끝내지 않고, 매 단계마다 실제로 `./gradlew bootRun`으로 띄운 뒤 curl로 정상 케이스 + 에러 케이스(권한 없음/중복/유효성 실패 등)까지 호출해서 확인
- MySQL은 Docker 컨테이너(`petcare-mysql`)로 로컬 상시 구동, `docker start petcare-mysql`로 재시작

## 진행 상황
**완료**
- 1~4단계 로드맵(초기 세팅 → 인증 → 핵심 API → 심화 기능: 프로필/건강기록/알림) 전부 구현 및 실제 API 호출로 검증 완료
- 이후 추가 기능도 그룹 단위로 진행, 전부 완료:
  - 반려동물/병원 정보 강화: 견종 크기 분류, 반려동물 사진 업로드, 병원 즐겨찾기, 병원 리뷰/평점
  - 검색/탐색 + 관리자 통계: 병원 검색·필터·정렬(Querydsl), 관리자용 통계 API
  - 알림/리마인더 강화: 예방접종 D-day 조회, 예방접종/예약 리마인더 스케줄러

**남은 것**
- 인증/계정 강화: 소셜 로그인(구글/네이버), Refresh Token 도입, 관리자 가입 플로우 정식화 — 아직 시작 안 함
- 푸시 알림(FCM): 모든 그룹에서 의도적으로 제외됨 — 외부 서비스 설정(FCM 프로젝트) 먼저 필요

**프론트엔드**: `../frontend`에 별도로 Vite+React 프로젝트 진행 중 (자체 CLAUDE.md 있음). 회원가입 화면까지 구현됨.

**저장소**: `petcare-project`(backend+frontend 상위 폴더)를 모노레포 하나로 GitHub에 올릴 예정, 아직 git 초기화 전.

## 진행 방식
- 한 번에 다 만들지 말고 단계별로 진행
- 각 단계 끝나면 무엇을 했는지 요약하고 다음 단계 진행 여부 확인
- 향후 확장 여지를 고려해 도메인 이름/패키지 구조는 "예약"에 국한되지 않게 설계
