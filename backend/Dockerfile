# Build stage with Maven and OpenJDK 25
FROM maven:3.9-eclipse-temurin-25 AS builder
WORKDIR /build

# Pre-download dependencies to leverage Docker layer caching
COPY pom.xml .
RUN mvn dependency:go-offline -B || true

# Copy source code and build application jar
COPY src ./src
RUN mvn clean package -DskipTests

# Runtime stage with Eclipse Temurin JDK 25
FROM eclipse-temurin:25-jdk
WORKDIR /app

# Non-root user for security best practices
RUN groupadd -r raggroup && useradd -r -g raggroup raguser

COPY --from=builder /build/target/*.jar /app/app.jar
RUN chown -R raguser:raggroup /app

USER raguser
EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "/app/app.jar"]

