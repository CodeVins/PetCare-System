FROM eclipse-temurin:21-jdk AS build
WORKDIR /src
# 의존성 레이어 캐시: 빌드 스크립트만 먼저 복사해 받아둠
COPY gradlew settings.gradle build.gradle ./
COPY gradle gradle
RUN chmod +x gradlew && ./gradlew dependencies --no-daemon -q > /dev/null
COPY src src
# 테스트는 CI test job에서 이미 돌았으므로 여기선 생략
RUN ./gradlew bootJar -x test --no-daemon -q

FROM eclipse-temurin:21-jre
WORKDIR /app
ENV TZ=Asia/Seoul
COPY --from=build /src/build/libs/*-SNAPSHOT.jar app.jar
# 변경(2026-09-30): root 대신 전용 사용자(app)로 실행 — 앱이 뚫려도 컨테이너 root 권한은 없게 (이전: root 실행)
# 새 볼륨은 이미지의 /app/uploads 소유권을 물려받음. 기존 볼륨(root 소유)은 배포 스크립트가 chown으로 맞춤
RUN useradd --system --no-create-home app && mkdir -p /app/uploads && chown -R app:app /app/uploads
USER app
EXPOSE 8080
ENTRYPOINT ["java", "-Xmx320m", "-Duser.timezone=Asia/Seoul", "-jar", "app.jar"]
