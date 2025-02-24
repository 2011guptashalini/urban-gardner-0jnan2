# Urban Gardening Assistant Backend Service

## Overview

The Urban Gardening Assistant backend service provides robust, scalable APIs for garden space optimization, crop planning, and maintenance scheduling. Built with Go and following enterprise-grade microservices architecture patterns.

Version: 1.0.0

## Table of Contents

- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Development Guidelines](#development-guidelines)
- [Deployment](#deployment)
- [Security](#security)

## Architecture

### Core Components

- **API Gateway** (Chi Router v5.0.8)
  - Request routing and middleware chain
  - Authentication and authorization
  - Rate limiting and compression
  - Metrics collection

- **Calculator Service**
  - Space optimization algorithms
  - Grow bag layout planning
  - Yield predictions

- **Database Layer**
  - PostgreSQL for persistent storage
  - GORM v1.25.0 for ORM
  - Automated migrations

- **Caching Layer**
  - Redis for performance optimization
  - Session management
  - Calculation results caching

### Technology Stack

- **Backend Framework**: Go 1.21+
- **Router**: Chi v5.0.8
- **Database**: PostgreSQL 15+
- **Cache**: Redis 6+
- **Metrics**: Prometheus
- **Logging**: ELK Stack
- **Authentication**: JWT with refresh tokens

## Getting Started

### Prerequisites

```bash
go version >= 1.21
postgresql >= 15.0
redis >= 6.0
```

### Environment Configuration

```bash
# Core Service
ENV=development
SERVICE_NAME=urban-gardening-assistant
VERSION=1.0.0

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_NAME=urban_gardening
DB_SSL_MODE=disable

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# API
API_PORT=8080
API_READ_TIMEOUT=15s
API_WRITE_TIMEOUT=15s
```

### Local Development Setup

1. Clone the repository:
```bash
git clone https://github.com/urban-gardening/backend.git
cd backend
```

2. Install dependencies:
```bash
go mod download
```

3. Start required services:
```bash
docker-compose up -d postgres redis
```

4. Run migrations:
```bash
go run cmd/migrate/main.go
```

5. Start the service:
```bash
go run cmd/api/main.go
```

## API Documentation

### Core Endpoints

#### Garden Management

```
POST /api/v1/gardens
GET /api/v1/gardens
GET /api/v1/gardens/{id}
PUT /api/v1/gardens/{id}
DELETE /api/v1/gardens/{id}
```

### Authentication

All API endpoints require JWT authentication:
```
Authorization: Bearer <token>
```

### Rate Limiting

- Create operations: 100 requests/hour
- Read operations: 1000 requests/hour

## Development Guidelines

### Code Organization

```
src/backend/
├── api/            # API handlers and routes
├── internal/       # Internal packages
│   ├── calculator/ # Space calculation logic
│   ├── models/     # Database models
│   └── utils/      # Shared utilities
├── pkg/            # Public packages
│   ├── constants/  # Shared constants
│   ├── dto/        # Data transfer objects
│   └── types/      # Common types
└── config/         # Configuration management
```

### Testing

Run the test suite:
```bash
go test ./... -v -race -cover
```

### Code Style

- Follow Go standard project layout
- Use gofmt for formatting
- Implement comprehensive error handling
- Add detailed logging
- Include unit tests

## Deployment

### Container Configuration

```dockerfile
FROM golang:1.21-alpine
WORKDIR /app
COPY . .
RUN go build -o main cmd/api/main.go
EXPOSE 8080
CMD ["./main"]
```

### Kubernetes Resources

```yaml
resources:
  requests:
    cpu: 500m
    memory: 512Mi
  limits:
    cpu: 1000m
    memory: 1Gi
```

### Health Checks

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 15
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 5
```

## Security

### Authentication Flow

1. JWT-based authentication
2. Token refresh mechanism
3. Role-based access control
4. Request rate limiting

### Data Protection

- TLS encryption in transit
- Password hashing using bcrypt
- Input validation and sanitization
- SQL injection prevention
- XSS protection

### Monitoring

- Prometheus metrics
- Grafana dashboards
- ELK stack for logging
- Jaeger for tracing

## License

Copyright © 2024 Urban Gardening Assistant. All rights reserved.