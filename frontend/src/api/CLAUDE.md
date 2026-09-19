# src/api 컨벤션

이 폴더 작업할 때만 참고 (루트 CLAUDE.md는 항상 로드되지만 이건 아님).

- 모든 함수는 `axiosInstance`(이 폴더의 `axiosInstance.js`)를 통해 호출. 새 API 파일도
  이 패턴 유지 — `fetch`나 새 axios 인스턴스 만들지 말 것.
- `axiosInstance.js`가 자동 처리하는 것: 요청 시 localStorage의 accessToken을
  Authorization 헤더에 첨부, 401 응답 시 refreshToken으로 자동 reissue(동시 요청은
  하나의 reissue로 묶임) 후 재시도, reissue까지 실패하면 토큰 삭제 + /login 이동.
  이 로직을 개별 api 함수에서 다시 구현하지 말 것.
- `BASE_URL`을 `axiosInstance.js`에서 export함 — 이미지 등 정적 리소스 URL 만들 때
  (`${BASE_URL}${imageUrl}`) 재사용. 하드코딩 금지.
- 목록 API는 대부분 페이지네이션(`{ content, page, size, totalElements, totalPages }`)
  응답이라 호출부에서 `res.data.data.content`로 꺼내야 함. 예외(배열 그대로): 병원
  검색, 관리자 통계, D-day 목록 — 상세는 API_MAP.md 참고.
- 파일당 하나의 도메인, 함수는 죄다 named export. 도메인이 겹치면(has 반려동물+
  보호자처럼) 기존 파일에 추가하지 말고 `petGuardianApi.js`처럼 하위 리소스 단위로
  새 파일 분리하는 걸 우선 — 지금까지 이 프로젝트가 쭉 그렇게 해왔음.
- multipart 업로드(이미지)는 `FormData`로 감싸서 axiosInstance에 그대로 넘김 (Content-
  Type 헤더 직접 지정 안 함 — axios가 boundary 포함해서 자동 처리).
