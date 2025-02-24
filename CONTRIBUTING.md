# Contributing to Urban Gardening Assistant

## Table of Contents
- [Introduction](#introduction)
- [Development Setup](#development-setup)
- [Architecture Overview](#architecture-overview)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [CI/CD Pipeline](#cicd-pipeline)
- [Documentation](#documentation)
- [Issue Guidelines](#issue-guidelines)

## Introduction

Urban Gardening Assistant is a microservices-based web application designed to help urban gardeners optimize their growing spaces. The project uses React for the frontend and Golang for the backend services.

### Project Architecture
- Frontend: React 18.2+ with TypeScript
- Backend: Golang 1.21+ microservices
- Database: PostgreSQL 15+
- Cache: Redis
- Infrastructure: AWS EKS, Terraform

### Quality Standards
- Code Coverage: Minimum 80%
- Test Pass Rate: 100%
- SonarQube Quality Gate: Must Pass
- Security: No High/Critical Vulnerabilities

## Development Setup

### Prerequisites
- Node.js 18+
- Go 1.21+
- Docker 24+
- kubectl
- helm
- AWS CLI
- Terraform 1.5+

### Local Environment Setup
1. Clone the repository:
```bash
git clone https://github.com/your-org/urban-gardening-assistant
cd urban-gardening-assistant
```

2. Frontend setup:
```bash
cd frontend
npm install
npm run dev
```

3. Backend setup:
```bash
cd backend
go mod download
go run main.go
```

4. Local infrastructure:
```bash
docker-compose up -d
```

### IDE Configuration
Recommended VSCode extensions:
- ESLint
- Prettier
- Go
- Docker
- Kubernetes
- GitLens

## Architecture Overview

### Component Architecture
- Frontend: React with Redux Toolkit
- Backend Services:
  - Space Calculator Service
  - Crop Manager Service
  - Maintenance Scheduler Service
  - AI Advisor Service
- Infrastructure: AWS EKS, RDS, ElastiCache

### Data Flow
- RESTful APIs for external communication
- gRPC for internal service communication
- Event-driven architecture for notifications
- Redis for caching and session management

### Security Architecture
- JWT-based authentication
- Role-based access control
- API Gateway for request validation
- SSL/TLS encryption

## Development Workflow

### Git Strategy
Branch naming convention:
- `feature/feature-name`
- `bugfix/bug-description`
- `hotfix/urgent-fix`
- `release/version`

Commit message format:
```
type(scope): description

[optional body]

[optional footer]
```

### Code Review
- Two approvals required
- All CI checks must pass
- No high/critical security issues
- Code coverage maintained

### Release Process
Version format: `MAJOR.MINOR.PATCH`
- MAJOR: Breaking changes
- MINOR: New features
- PATCH: Bug fixes

## Code Standards

### React/TypeScript
- Use functional components with hooks
- Implement strict TypeScript checks
- Follow React best practices
- Use Material-UI components
- Implement proper error boundaries

### Golang
- Follow Go standard project layout
- Use interfaces for abstraction
- Implement proper error handling
- Use context for cancellation
- Follow Go idioms and conventions

### Security
- Input validation on all endpoints
- Proper error handling
- Secure password hashing
- Rate limiting implementation
- Regular dependency updates

## Testing Requirements

### Unit Testing
Frontend:
- Jest + React Testing Library
- 80% code coverage minimum
- Snapshot testing for components
- Redux state testing

Backend:
- Go testing package
- 80% code coverage minimum
- Table-driven tests
- Mock external dependencies

### Integration Testing
- API endpoint testing
- End-to-end testing with Cypress
- Performance testing with k6
- Contract testing with Pact

### Quality Gates
SonarQube metrics:
- Maintainability: A
- Reliability: A
- Security: A
- Coverage: ≥80%
- Duplication: ≤3%

## Pull Request Process

### PR Template
```markdown
## Description
[Description of changes]

## Testing
- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual testing

## Screenshots
[If applicable]

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No security vulnerabilities
- [ ] Code follows standards
```

### Review Process
1. Create PR with template
2. Pass CI/CD checks
3. Code review by 2 maintainers
4. Address feedback
5. Final approval
6. Merge

### CI/CD Checks
- Build validation
- Unit tests
- Integration tests
- Security scanning
- Code quality analysis

## CI/CD Pipeline

### GitHub Actions
Workflows:
- `backend.yml`: Go services
- `frontend.yml`: React application
- `infrastructure.yml`: Terraform

### Quality Gates
- SonarQube analysis
- Security scanning
- Test coverage
- Performance benchmarks

### Deployment
Environments:
- Development: Automatic
- Staging: Manual approval
- Production: Manual approval

## Documentation

### Code Documentation
React/TypeScript:
- JSDoc comments
- Component documentation
- Type definitions
- State management

Golang:
- GoDoc format
- Package documentation
- Interface documentation
- Error documentation

### API Documentation
- OpenAPI/Swagger specs
- Endpoint documentation
- Error responses
- Authentication details

### Technical Documentation
- Architecture diagrams
- Deployment guides
- Monitoring setup
- Troubleshooting guides

## Issue Guidelines

### Bug Reports
Required information:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment details
- Screenshots/logs

### Feature Requests
Required information:
- Problem statement
- Proposed solution
- Acceptance criteria
- Technical considerations

### Issue Labels
Categories:
- Type: bug, feature, enhancement
- Priority: low, medium, high, critical
- Status: backlog, in-progress, review
- Component: frontend, backend, infra