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
EXPOSE 8080
ENTRYPOINT ["java", "-Xmx320m", "-Duser.timezone=Asia/Seoul", "-jar", "app.jar"]
