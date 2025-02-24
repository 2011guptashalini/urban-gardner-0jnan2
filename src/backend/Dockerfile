# Builder stage
FROM golang:1.21-alpine AS builder

# Install build dependencies
RUN apk add --no-cache \
    git \
    make \
    gcc \
    musl-dev \
    ca-certificates \
    curl

# Install security scanning tools
RUN curl -sfL https://raw.githubusercontent.com/securego/gosec/master/install.sh | sh -s -- -b /usr/local/bin

# Set working directory
WORKDIR /app

# Copy go mod files for dependency caching
COPY go.mod go.sum ./

# Download and verify dependencies
RUN go mod download && \
    go mod verify

# Set build flags for optimization and security
ENV CGO_ENABLED=0 \
    GOOS=linux \
    GOARCH=amd64 \
    GO111MODULE=on

# Enable build cache
ENV GOCACHE=/go-build-cache

# Copy source code with appropriate permissions
COPY . .
RUN chmod -R 755 /app

# Run security scan
RUN gosec ./...

# Build binaries with optimizations
RUN go build -ldflags="-w -s" -o /go/bin/calculator ./cmd/calculator && \
    go build -ldflags="-w -s" -o /go/bin/cropmanager ./cmd/cropmanager && \
    go build -ldflags="-w -s" -o /go/bin/scheduler ./cmd/scheduler

# Run tests
RUN go test -v ./...

# Calculator service stage
FROM alpine:3.18 AS calculator

# Install runtime dependencies and security updates
RUN apk add --no-cache \
    ca-certificates \
    tzdata \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -S calculator && \
    adduser -S -G calculator calculator

# Set working directory
WORKDIR /app

# Copy binary from builder
COPY --from=builder /go/bin/calculator .
RUN chown -R calculator:calculator /app

# Configure logging
RUN mkdir -p /app/logs && \
    chown -R calculator:calculator /app/logs

# Set security-related environment variables
ENV APP_ENV=production \
    LOG_LEVEL=info \
    METRICS_ENABLED=true

# Expose ports
EXPOSE 8080 9090

# Switch to non-root user
USER calculator

# Healthcheck configuration
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Run service
CMD ["./calculator"]

# Crop Manager service stage
FROM alpine:3.18 AS cropmanager

RUN apk add --no-cache \
    ca-certificates \
    tzdata \
    && rm -rf /var/cache/apk/*

RUN addgroup -S cropmanager && \
    adduser -S -G cropmanager cropmanager

WORKDIR /app

COPY --from=builder /go/bin/cropmanager .
RUN chown -R cropmanager:cropmanager /app

RUN mkdir -p /app/logs && \
    chown -R cropmanager:cropmanager /app/logs

ENV APP_ENV=production \
    LOG_LEVEL=info \
    METRICS_ENABLED=true

EXPOSE 8080 9090

USER cropmanager

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

CMD ["./cropmanager"]

# Scheduler service stage
FROM alpine:3.18 AS scheduler

RUN apk add --no-cache \
    ca-certificates \
    tzdata \
    && rm -rf /var/cache/apk/*

RUN addgroup -S scheduler && \
    adduser -S -G scheduler scheduler

WORKDIR /app

COPY --from=builder /go/bin/scheduler .
RUN chown -R scheduler:scheduler /app

RUN mkdir -p /app/logs && \
    chown -R scheduler:scheduler /app/logs

ENV APP_ENV=production \
    LOG_LEVEL=info \
    METRICS_ENABLED=true

EXPOSE 8080 9090

USER scheduler

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

CMD ["./scheduler"]

# Add metadata labels
LABEL maintainer="Urban Gardening Team" \
      version="1.0.0" \
      description="Urban Gardening Assistant Backend Service" \
      security.scan.status="verified"