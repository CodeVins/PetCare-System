# 배포 + CI 설계 (AWS EC2 1대 + Docker Compose + GitHub Actions)

- 작성일: 2026-09-30
- 범위: 모노레포(`backend/`, `frontend/`) 전체를 HTTPS 도메인으로 공개 배포하고, 테스트 통과 시에만 자동 배포되는 파이프라인 구성

## 1. 목표 / 성공 기준

포트폴리오 목적 — 면접관이 링크로 직접 써볼 수 있고, "테스트 통과해야 배포된다"는 흐름을 설명할 수 있어야 함.

성공 기준 (전부 실제 도메인에서 확인):
1. `https://<name>.duckdns.org` 접속 시 프론트가 뜨고, 새로고침/직접 URL 진입(`/mypage/reviews` 등)에도 404 없음
2. 회원가입 → 로그인 → 반려동물 사진 업로드 → 예약까지 정상 동작
3. 실시간 알림(SSE)이 HTTPS 프록시를 거쳐도 수신됨
4. `docker compose restart` / 재배포 후에도 DB 데이터·업로드 사진·TLS 인증서 유지
5. PR → 테스트만 실행(배포 X). main push → 테스트 → 이미지 빌드 → 배포. 테스트 실패 시 배포 안 됨
6. 리마인더 스케줄러가 한국 시간 09:00에 동작 (컨테이너 기본 UTC 아님)

## 2. 결정 사항 (사용자 확정)

| 항목 | 결정 |
|---|---|
| 배포 대상 | AWS EC2 t3.micro(프리티어) 1대, Docker Compose |
| 주소 | DuckDNS 무료 서브도메인 + Caddy 자동 HTTPS(Let's Encrypt) |
| 배포 방식 | 방식 A — Actions에서 테스트·이미지 빌드 → GHCR push → SSH로 EC2에서 `pull && up -d` |

## 3. 아키텍처

```
GitHub (CodeVins/PetCare-System)
  ├─ PR           → ci: backend test + frontend lint/build
  └─ push main    → ci 통과 → 이미지 2개 빌드·GHCR push → ssh deploy

EC2 t3.micro (Ubuntu, Docker, 2GB swap)  ~/petcare/
  ├─ web      (caddy + 프론트 dist 내장)  :80, :443 공개
  │     /api/*, /uploads/*, /swagger-ui/*, /v3/api-docs* → backend:8080
  │     그 외 → /srv 정적 파일, 없으면 index.html (SPA)
  ├─ backend  (Spring Boot jar)           내부망만, uploads 볼륨
  └─ mysql    (mysql:8)                   내부망만, 데이터 볼륨
```

컨테이너 3개, 이미지는 2개(`web`, `backend`) — 프론트 정적 파일을 Caddy 이미지에 구워 넣어 nginx 컨테이너를 따로 두지 않음.

**같은 오리진 구성**: 브라우저는 항상 `https://도메인` 하나에만 요청 → CORS·혼합 콘텐츠 문제 자체가 없음. 그래서 백엔드 CORS 설정은 **건드리지 않음**(로컬 개발용 그대로).

## 4. 컴포넌트별 설계

### 4.1 backend 이미지 — `backend/Dockerfile`
- 멀티스테이지: `eclipse-temurin:21-jdk`에서 `./gradlew bootJar -x test`(테스트는 CI 별도 단계에서 이미 실행) → `eclipse-temurin:21-jre`로 jar만 복사
- `ENV TZ=Asia/Seoul`, JVM `-Xmx320m` (1GB 서버에 MySQL과 공존)
- `.dockerignore`: `build/`, `.gradle/`, `uploads/`, `.env`, `.idea/`

### 4.2 web 이미지 — `frontend/Dockerfile` + `frontend/Caddyfile`
- 멀티스테이지: `node:24-slim`에서 `npm ci && npm run build` → `caddy:2`의 `/srv`로 `dist` 복사
- Caddyfile (도메인은 env `DOMAIN`):
  ```
  {$DOMAIN} {
    encode gzip
    @backend path /api/* /uploads/* /swagger-ui* /v3/api-docs*
    handle @backend { reverse_proxy backend:8080 }
    handle { root * /srv; try_files {path} /index.html; file_server }
  }
  ```
- SSE: Caddy `reverse_proxy`는 `text/event-stream` 응답을 즉시 flush 하므로 추가 설정 불필요(구현 시 실제 수신 확인)
- 업로드 5MB: Caddy는 기본 body 크기 제한 없음 → Spring의 5MB 제한이 그대로 적용
- `.dockerignore`: `node_modules/`, `dist/`, `petcare-ui-source/`

### 4.3 코드 변경 (기존 코드 수정 → `// 변경(...)` 주석 규칙 적용)
- **프론트 `axiosInstance.ts`**: `BASE_URL = ''`(상대 경로). 사용처(이미지 src, EventSource, reissue) 전부 `${BASE_URL}...` 형태라 한 줄로 해결
- **`vite.config.ts`**: `server.proxy`로 `/api`, `/uploads`를 `http://localhost:8080`에 프록시. 기존 "휴대폰에서 LAN IP로 접속" 용도도 프록시가 개발 PC에서 돌기 때문에 그대로 동작(`server.host: true` 필요 여부 구현 시 확인)
- **`application.yml`**: 환경변수 + 로컬 기본값으로 변경 (프로필 파일 추가 안 함)
  - `datasource.url: ${DB_URL:jdbc:mysql://localhost:3306/petcare}`
  - `show-sql: ${SHOW_SQL:true}`, `format_sql`도 동일 — 운영에서 false
  - `server.forward-headers-strategy: framework` — Caddy의 X-Forwarded-Proto를 신뢰해 HTTPS 뒤에서 Swagger 서버 URL이 https로 생성되게
- 프론트 `api/CLAUDE.md`, 백엔드/프론트 `CLAUDE.md`에 배포 구조와 `BASE_URL` 변경 반영

### 4.4 `docker-compose.yml` (레포 루트, 운영용)
- `mysql`: `mysql:8`, `TZ=Asia/Seoul`, 볼륨 `mysql_data`, 메모리 절약 옵션(`--performance-schema=OFF`, `--innodb-buffer-pool-size=128M`), healthcheck(`mysqladmin ping`)
- `backend`: `ghcr.io/codevins/petcare-backend:latest`, `env_file: .env`, `DB_URL=jdbc:mysql://mysql:3306/petcare?allowPublicKeyRetrieval=true&useSSL=false`(MySQL 8 컨테이너 첫 접속 에러 방지), `SHOW_SQL=false`, 볼륨 `uploads:/app/uploads`, `depends_on: mysql (service_healthy)`, `restart: unless-stopped`
- `web`: `ghcr.io/codevins/petcare-web:latest`, 포트 `80:80`, `443:443`, 볼륨 `caddy_data`(인증서 — 날아가면 Let's Encrypt 발급 한도에 걸릴 수 있음), `caddy_config`
- `backend`/`web`에 `image:`와 `build:`(로컬 빌드용, context `./backend`, `./frontend`)를 같이 지정. 서버는 `pull` 후 `up -d`만 하므로 빌드 안 함
- 이미지 태그: push 시 `latest` + `sha-<커밋>` 둘 다. compose의 이미지는 `:${TAG:-latest}` — 롤백은 서버 `.env`에 `TAG=sha-xxxx` 넣고 `pull && up -d`(문서에 명령어만 기록, 자동화 안 함)

### 4.5 서버 `.env` (EC2에만 존재, git 미포함)
`DOMAIN`, `DB_USERNAME`, `DB_PASSWORD`, `MYSQL_ROOT_PASSWORD`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`. 루트에 `.env.deploy.example`로 키 목록만 커밋.

### 4.6 GitHub Actions — `.github/workflows/ci-cd.yml`
- `test` job (PR + main push): JDK 21(`actions/setup-java`, gradle 캐시) → `backend/./gradlew test`; Node 24 → `frontend/npm ci && npm run lint && npm run build`
- `build-push` job (main push만, `needs: test`): `docker/login-action`(GHCR, `GITHUB_TOKEN`) → `docker/build-push-action`으로 이미지 2개
- `deploy` job (`needs: build-push`): `docker-compose.yml`을 scp로 서버에 복사 → ssh로 `cd ~/petcare && docker compose pull && docker compose up -d --no-build && docker image prune -f`
- GitHub Secrets: `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY`
- GHCR 패키지는 public으로 전환 → EC2에서 로그인 없이 pull (레포도 public이라 노출될 비밀 없음 — 비밀값은 전부 서버 `.env`)

### 4.7 EC2 초기 세팅 (1회, 수동 — 사용자가 직접 수행, 단계별 가이드 제공)
1. EC2 t3.micro Ubuntu 생성, 보안그룹: 22(내 IP만), 80, 443
2. Elastic IP 연결 (퍼블릭 IPv4는 프리티어 12개월 750시간 포함, 이후 과금)
3. DuckDNS 서브도메인 생성 → Elastic IP 지정
4. Docker + compose 플러그인 설치, 2GB swap 생성
5. `~/petcare/.env` 작성
6. GitHub Secrets 등록 → main push로 첫 배포

## 5. 에러/운영 고려

- **메모리**: 1GB + swap 2GB. JVM 320m, MySQL buffer pool 128M. 첫 배포 후 `docker stats`로 실측, 부족하면 JVM 값 조정
- **시간대**: 컨테이너 기본 UTC → `TZ=Asia/Seoul`을 backend·mysql 둘 다 설정. 스케줄러 09:00, `LocalDateTime.now()` 기반 슬롯 검증이 한국 시간 기준이어야 함. temurin 이미지가 `TZ`를 반영하는지 구현 시 확인(안 되면 `-Duser.timezone=Asia/Seoul`)
- **배포 중 다운타임**: `up -d`로 backend 재생성 시 수 초 끊김 — 허용
- **DB 스키마**: `ddl-auto: update` 유지. CLAUDE.md의 "NOT NULL 컬럼 추가 시 백필" 주의사항은 운영 DB에도 동일하게 적용
- **최초 관리자**: 기존 `AdminBootstrapRunner`가 서버 `.env`의 `ADMIN_EMAIL`/`ADMIN_PASSWORD`로 생성 — 추가 작업 없음
- **SSH 키**: 배포 전용 키페어 사용(개인 키 재사용 X)

## 6. 범위에서 뺀 것 (필요해지면 추가)

- RDS / S3 — 비용. 볼륨으로 충분, 나중에 옮기기 쉬움
- DB 자동 백업 — 필요 시 cron + `mysqldump` 한 줄
- 무중단(블루그린) 배포, 롤백 자동화
- Flyway 등 스키마 마이그레이션 도구
- 모니터링/로그 수집 — `docker compose logs`로 대체
- staging 환경

## 7. 검증 방법

- 로컬: 같은 `docker-compose.yml`로 `docker compose up --build`(각 서비스에 `build:`도 지정돼 있어 로컬 빌드) → `DOMAIN=http://localhost`(로컬은 HTTP만) → 성공 기준 1~4 확인
- CI: 일부러 실패하는 테스트로 PR 올려 deploy가 안 도는지 확인 후 되돌림
- 운영: 성공 기준 1~6을 실제 도메인에서 확인, 결과를 PROGRESS/CLAUDE.md에 기록
