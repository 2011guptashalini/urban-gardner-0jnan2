# Urban Gardening Assistant Frontend

## Project Overview

The Urban Gardening Assistant frontend is a React-based web application designed to help urban gardeners optimize their growing spaces. Built with modern web technologies and best practices, it provides an intuitive interface for garden planning, crop management, and maintenance scheduling.

### Key Features
- Interactive garden space planning
- Crop selection and yield calculation
- AI-powered maintenance scheduling
- Responsive design for all devices
- Accessibility compliance (WCAG 2.1)

### Technology Stack
- React 18.2.0
- TypeScript 5.0.0
- Material-UI 5.14.0
- Redux Toolkit 1.9.0
- React Router 6.14.0

### Browser Support
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Getting Started

### Prerequisites
- Node.js >=16.0.0
- npm >=8.0.0
- 8GB RAM minimum
- 1GB free storage

### Installation
```bash
# Clone the repository
git clone [repository-url]

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Setup
Create a `.env` file in the project root:
```
VITE_API_URL=http://localhost:8080
VITE_AUTH_DOMAIN=auth-domain
VITE_AUTH_CLIENT_ID=client-id
VITE_SENTRY_DSN=sentry-dsn
```

## Development

### Available Scripts
```bash
# Development
npm run dev         # Start development server
npm run build      # Build for production
npm run preview    # Preview production build

# Testing
npm run test           # Run test suite
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report

# Code Quality
npm run lint       # Run ESLint
npm run lint:fix   # Fix ESLint issues
npm run format     # Format with Prettier
npm run typecheck  # TypeScript check
```

### Project Structure
```
src/
├── assets/         # Static assets
├── components/     # Reusable components
├── features/       # Feature-specific components
├── hooks/          # Custom React hooks
├── layouts/        # Layout components
├── pages/          # Route pages
├── services/       # API services
├── store/          # Redux store
├── styles/         # Global styles
├── types/          # TypeScript types
└── utils/          # Utility functions
```

### Code Style Guide
- Follow TypeScript best practices
- Use functional components with hooks
- Implement proper error boundaries
- Write unit tests for components
- Document complex logic
- Use proper semantic HTML
- Ensure accessibility compliance

### State Management
- Redux Toolkit for global state
- React Query for server state
- Local state with useState/useReducer
- Context API for theme/auth

### API Integration
- Axios for HTTP requests
- Request/response interceptors
- Error handling middleware
- Retry logic for failed requests
- Type-safe API responses

## Build and Deployment

### Production Build
```bash
# Create optimized production build
npm run build

# Preview production build
npm run preview
```

### Build Optimization
- Code splitting
- Tree shaking
- Asset optimization
- Lazy loading
- Service worker caching

### Environment-Specific Builds
- Development: Hot reloading, source maps
- Staging: Optimization disabled
- Production: Fully optimized

## Performance Guidelines

### Best Practices
- Implement code splitting
- Optimize images and assets
- Use proper caching strategies
- Minimize bundle size
- Implement lazy loading
- Monitor performance metrics

### Accessibility
- ARIA labels
- Keyboard navigation
- Screen reader support
- Color contrast compliance
- Focus management

## Troubleshooting

### Common Issues
1. Installation failures
   - Clear npm cache
   - Delete node_modules
   - Reinstall dependencies

2. Build errors
   - Check Node.js version
   - Verify environment variables
   - Clear build cache

3. Runtime errors
   - Check browser console
   - Verify API endpoints
   - Review error boundaries

### Debug Tools
- React Developer Tools
- Redux DevTools
- Network tab monitoring
- Performance profiling
- Lighthouse audits

## Support Resources
- [React Documentation](https://react.dev)
- [Material-UI Documentation](https://mui.com)
- [Redux Toolkit Guide](https://redux-toolkit.js.org)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Vite Guide](https://vitejs.dev/guide)

## Contributing
- Fork the repository
- Create feature branch
- Follow code style guide
- Write tests
- Submit pull request

## License
This project is proprietary and confidential.