# PetCare System

반려견 케어 시스템 — 병원 예약, 반려동물 프로필/건강 기록, 리뷰, 알림 등을 제공하는 풀스택 포트폴리오 프로젝트입니다.

## 구조

```
petcare-project
├── backend   # Spring Boot REST API
└── frontend  # React (Vite)
```

## 기술 스택

**Backend**
- Java 21, Spring Boot 3, Gradle
- Spring Data JPA, Querydsl
- Spring Security + JWT
- MySQL (로컬 개발은 Docker)
- springdoc-openapi (Swagger)

**Frontend**
- React, Vite

## 실행 방법

### Backend

```bash
cd backend
docker run --name petcare-mysql -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=petcare \
  -e MYSQL_USER=petcare -e MYSQL_PASSWORD=petcare1234 -p 3306:3306 -d mysql:8.0

# backend/.env 파일 생성 (DB_USERNAME, DB_PASSWORD, JWT_SECRET)

./gradlew bootRun
```

API 문서: `http://localhost:8080/swagger-ui/index.html`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

자세한 백엔드 설계/컨벤션은 [`backend/CLAUDE.md`](backend/CLAUDE.md) 참고.
