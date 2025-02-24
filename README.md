# Urban Gardening Assistant

[![Build Status](github-actions-badge-url)](github-actions-badge-url)
[![Code Coverage](codecov-badge-url)](codecov-badge-url)
[![License](license-badge-url)](license-badge-url)
[![Version](version-badge-url)](version-badge-url)

A web application designed to help urban gardeners optimize their limited growing spaces through automated planning, intelligent maintenance scheduling, and AI-powered recommendations.

## Key Features

- Space optimization calculator for maximizing limited growing areas
- Crop planning and yield estimator for optimal harvest planning
- Intelligent maintenance schedule generator
- AI-powered gardening recommendations

## Architecture Overview

The Urban Gardening Assistant uses a modern microservices architecture built with React and Golang:

### Frontend (React v18.2+)
- Component-based UI with Redux state management
- Material-UI components for consistent design
- Real-time garden space calculations
- Interactive planning interface
- Responsive design for all devices

### Backend (Go v1.21+)
- Microservices architecture with RESTful APIs
- gRPC for internal service communication
- Efficient space calculation algorithms
- AI-powered recommendation engine
- Robust maintenance scheduling system

### Data Storage
- PostgreSQL 15+ for primary data storage
- Redis for caching and session management

## Prerequisites

- Node.js >= 16.0.0
- Go >= 1.21.0
- Docker >= 20.10.0
- PostgreSQL >= 15.0
- Redis >= 6.2.0

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/your-org/urban-gardening-assistant.git
cd urban-gardening-assistant
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Install dependencies:
```bash
# Frontend
cd frontend
npm install

# Backend
cd backend
go mod download
```

4. Initialize the database:
```bash
make db-init
```

5. Start development servers:
```bash
# Frontend
npm run dev

# Backend
go run cmd/main.go
```

## Project Structure

```
├── frontend/
│   ├── src/
│   ├── components/
│   ├── services/
│   └── utils/
├── backend/
│   ├── cmd/
│   ├── internal/
│   ├── pkg/
│   └── api/
├── kubernetes/
└── docker/
```

## API Documentation

Base URL: `/api/v1`

Authentication: JWT (Bearer token)
```
Authorization: Bearer <token>
```

### Endpoints

#### Garden Management
- `GET /garden` - List gardens
- `POST /garden` - Create garden
- `PUT /garden/{id}` - Update garden
- `DELETE /garden/{id}` - Delete garden

#### Crop Management
- `GET /crops` - List available crops
- `POST /crops` - Add crop to garden

#### Maintenance Scheduling
- `GET /schedule` - Get maintenance schedule
- `POST /schedule` - Create schedule
- `PUT /schedule/{id}` - Update schedule

## Development

### Coding Standards
- Frontend: TypeScript ESLint configuration
- Backend: Go standard formatting
- Commits: Conventional Commits specification

### Testing
- Frontend: Jest + React Testing Library
- Backend: Go testing package
- E2E: Cypress

### Git Workflow
- Branch naming: `feature/`, `bugfix/`, `hotfix/`
- Required PR reviews
- Automated CI checks

## Deployment

### Infrastructure
- Cloud: AWS
- Orchestration: Kubernetes (EKS)
- CI/CD: GitHub Actions
- Monitoring: Prometheus + Grafana

### Deployment Process
1. Build Docker images
2. Push to ECR
3. Deploy to EKS
4. Run migrations
5. Verify health checks

## Monitoring

### Metrics
- Application performance
- Resource utilization
- Error rates
- API latency

### Alerts
- High error rate
- Service unavailability
- Resource exhaustion
- Security incidents

## Contributing

Please read our [Contributing Guide](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) before submitting contributions.

### Security
Report security vulnerabilities to security@example.com

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### Third-Party Licenses
See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for third-party license information.