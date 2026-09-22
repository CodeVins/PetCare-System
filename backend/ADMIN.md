# Admin 기능 및 규칙

어드민(`ADMIN`)과 병원 오너(`HOSPITAL_OWNER`)가 플랫폼을 관리하기 위해 쓰는 API를 정리한 문서.
**새 어드민 기능을 추가할 때마다 이 문서도 같이 갱신할 것.**

## 권한 모델

- `ADMIN`: 플랫폼 전역 관리자. 공개 가입 경로 없음 — 최초 관리자는 `AdminBootstrapRunner`(앱 시작 시 `.env`의 `ADMIN_EMAIL`/`ADMIN_PASSWORD`로 자동 생성/승격)로 부트스트랩되고, 이후 추가 관리자는 기존 관리자가 `PATCH /api/admin/users/{userId}/role`로 승격.
- `HOSPITAL_OWNER`: 본인이 `Hospital.owner`로 지정된 병원에 한해서만 관리 권한을 가짐. `PATCH /api/admin/hospitals/{hospitalId}/owner`(ADMIN 전용)로 지정되며, 지정 시 대상이 `USER`면 자동 승격됨.
- **컨트롤러 게이트 + 서비스 재검증 패턴**: `HOSPITAL_OWNER`도 접근 가능한 엔드포인트는 `@PreAuthorize("hasRole('ADMIN') or hasRole('HOSPITAL_OWNER')")`로 열어두고, 서비스 계층에서 `Hospital.isManagedBy(currentUser)`(ADMIN은 항상 true, HOSPITAL_OWNER는 본인 소유 병원만 true)로 세밀하게 재검증한다. 컨트롤러 어노테이션만으로는 "내 병원인지"를 못 걸러내므로 반드시 서비스 계층 재검증이 함께 있어야 함.
- **자기 자신 보호 패턴**: 역할 변경, 계정 정지/해제처럼 자기 권한에 영향을 주는 API는 대상이 본인이면 항상 403(`ForbiddenException`)으로 막는다. 새 자기-자신 대상 관리 기능을 추가할 때도 이 패턴을 따를 것.
- 공통 예외(`NotFoundException`/`ForbiddenException`/`ConflictException`)만 재사용하고 도메인별 전용 예외는 만들지 않는다(프로젝트 전역 컨벤션과 동일).

## 현재 기능

### 유저 관리 (`AdminUserController`, ADMIN 전용)

| 기능 | 엔드포인트 | 비고 |
|---|---|---|
| 유저 목록 | `GET /api/admin/users` | 페이지네이션 |
| 유저 상세 통계 | `GET /api/admin/users/{userId}/stats` | 예약 횟수, 노쇼 횟수, 작성한 리뷰 답글 수, 등록(소유)한 펫 수, 내 펫에 붙은 공동보호자 distinct 수. 존재하지 않는 유저면 404 |
| 역할 변경 | `PATCH /api/admin/users/{userId}/role` | 본인 불가 |
| 계정 정지 | `PATCH /api/admin/users/{userId}/suspend` | 본인 불가. 이미 발급된 accessToken은 즉시 무효화 안 됨(최대 1시간 뒤 자연 만료, 알려진 한계) |
| 계정 정지 해제 | `PATCH /api/admin/users/{userId}/activate` | |

### 병원 관리

| 기능 | 엔드포인트 | 권한 | 비고 |
|---|---|---|---|
| 병원 생성 | `POST /api/hospitals` | ADMIN | `HospitalController`. 소유자 없이 생성 후 별도 배정 |
| 병원 정보 수정 | `PATCH /api/hospitals/{hospitalId}` | ADMIN 또는 소유 HOSPITAL_OWNER | 전체 필드 재입력 방식, 생략 필드는 null로 덮어써짐 |
| 병원 소유자 지정 | `PATCH /api/admin/hospitals/{hospitalId}/owner` | ADMIN | 대상이 USER면 HOSPITAL_OWNER로 자동 승격 |
| 슬롯 생성 | `POST /api/hospitals/{hospitalId}/slots` | ADMIN 또는 소유 HOSPITAL_OWNER | 생성 시 찜한 유저에게 `FAVORITE_HOSPITAL_NEW_SLOT` 알림 자동 발송 |
| 병원 사진 업로드/삭제 | `POST`/`DELETE /api/hospitals/{hospitalId}/image` | ADMIN 또는 소유 HOSPITAL_OWNER | |

### 예약 관리 (`AdminReservationController`)

| 기능 | 엔드포인트 | 권한 | 비고 |
|---|---|---|---|
| 예약 목록 | `GET /api/admin/reservations?status=` | ADMIN(전체) 또는 HOSPITAL_OWNER(본인 병원만) | 페이지네이션 |
| 예약 확정 | `PATCH .../{id}/confirm` | 동일 | PENDING만 가능 |
| 예약 거절 | `PATCH .../{id}/reject` | 동일 | PENDING만 가능, 슬롯 릴리즈 + 대기자 알림 |
| 노쇼 처리 | `PATCH .../{id}/no-show` | 동일 | CONFIRMED만 가능, 취소 불가 상태로 전환 |

### 리뷰 모더레이션 / 신고 관리 (`AdminReviewController`)

| 기능 | 엔드포인트 | 권한 | 비고 |
|---|---|---|---|
| 리뷰 신고 목록 | `GET /api/admin/reviews/reports` | ADMIN(전체) 또는 HOSPITAL_OWNER(본인 병원만) | 페이지네이션. HOSPITAL_OWNER는 `review.hospital.owner_id` 기준으로 필터링됨 |
| 리뷰 숨김 | `PATCH /api/admin/reviews/{reviewId}/hide` | ADMIN 또는 소유 HOSPITAL_OWNER | `Hospital.isManagedBy()`로 재검증, 다른 병원 리뷰면 403. `hidden=true`인 리뷰는 병원 리뷰 목록/평점 집계/통계에서 전부 제외 |
| 리뷰 숨김 해제 | `PATCH /api/admin/reviews/{reviewId}/unhide` | ADMIN 또는 소유 HOSPITAL_OWNER | 동일 재검증 |
| 리뷰 답글 작성/수정/삭제 | `POST`/`PATCH`/`DELETE /api/hospitals/{hospitalId}/reviews/{reviewId}/reply` | ADMIN 또는 소유 HOSPITAL_OWNER | `ReviewController`, 리뷰 1개당 답글 1개. `ReviewReply.author`에 작성자가 기록됨(유저 통계의 답글 수 집계에 사용) |
| 리뷰 신고 접수 | `POST /api/hospitals/{hospitalId}/reviews/{reviewId}/report` | 로그인 유저 전체(HOSPITAL_OWNER 포함) | 리뷰 작성 자격과 무관하게 아무나 신고 가능, 같은 리뷰 중복 신고는 409 |

### 통계 (`AdminStatsController`, ADMIN 전용)

| 기능 | 엔드포인트 | 비고 |
|---|---|---|
| 전체 요약 | `GET /api/admin/stats/summary` | 유저/펫/병원/예약 총수, 확정/취소/노쇼 건수 |
| 병원별 통계 | `GET /api/admin/stats/hospitals` | 병원별 확정예약수/리뷰수/평균평점 (페이지네이션 없음, 리포트성) |

### 리마인더 (`AdminReminderController`, ADMIN 전용)

| 기능 | 엔드포인트 | 비고 |
|---|---|---|
| 리마인더 수동 실행 | `POST /api/admin/reminders/run` | 크론(매일 09:00) 기다리지 않고 접종/예약 리마인더 즉시 실행. 중복 방지 없음(같은 날 여러 번 실행하면 중복 알림) |

## 추가 예정 / 진행 중

현재 없음. 새 어드민 기능이 필요해지면 여기에 먼저 적고 순서대로 진행할 것.
