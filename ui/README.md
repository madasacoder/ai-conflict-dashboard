# AI Conflict Dashboard - Frontend

A React-based frontend for the AI Conflict Dashboard with testing in development.

## 🚧 Test Suite Status (latest local run)

- Type-check (strict): failing with numerous errors across services/state/tests
- Vitest: blocked by type errors and strict constraints
- Playwright: tests start but fail early (cannot find "Launch Workflow Builder" button)
- Integration with backend requires live API or MSW alignment

### Running Tests (May Have Issues)
```bash
npm ci --no-audit --no-fund
npm run type-check
npm test -- --run
npx playwright install
npx playwright test --reporter=line
```

### Frontend Bugs Being Addressed
- **BUG-081**: Desktop App Missing React Flow Instance 🚧 (test exists, needs verification)
- **BUG-082**: Drag and Drop Completely Broken 🚧 (test exists, needs verification)

## Features

### Core Functionality
- **Visual Workflow Builder**: Drag-and-drop interface using React Flow
- **Multi-Model Comparison**: Side-by-side comparison of AI model responses
- **Real-time Execution**: Live monitoring of workflow execution
- **Result Visualization**: Syntax highlighting and structured display
- **State Management**: Centralized state with Zustand

### Security & Reliability
- **Error Boundaries**: Graceful error handling and recovery
- **XSS Protection**: DOMPurify integration for safe content rendering
- **Input Sanitization**: Comprehensive input validation and sanitization
- **Memory Management**: Automatic cleanup and memory leak detection

### Testing & Quality (In Development)
- **Regression Tests**: Test suite in progress
- **Unit Tests**: Some component-level testing with React Testing Library
- **Integration Tests**: Basic component interaction testing
- **E2E Tests**: Some user scenario testing with Playwright
- **Goal**: Working towards comprehensive test coverage

## Technology Stack

- **React 18**: Modern React with hooks and concurrent features
- **TypeScript**: Type safety and better developer experience
- **Vite**: Fast build tool and development server
- **React Flow**: Visual workflow builder
- **Zustand**: Lightweight state management
- **Vitest**: Fast unit testing framework
- **React Testing Library**: Component testing utilities
- **Playwright**: E2E testing framework

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Testing

### GRADE A Critical Bug Regression Tests
```bash
# Use Playwright suites under playwright-tests/ (expect failures until app flow is aligned)
npx playwright test
```

### Regular Test Suites
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run E2E tests
npm run test:e2e
```

### Test Categories

#### 1. Unit Tests
- Component behavior testing
- Hook testing
- Utility function testing
- State management testing

#### 2. Integration Tests
- Component interaction testing
- API integration testing
- Workflow execution testing
- Error handling testing

#### 3. E2E Tests
- Real user scenario testing
- Cross-browser testing
- Performance testing
- Accessibility testing

#### 4. GRADE A Regression Tests
- Critical bug prevention testing
- Edge case testing
- Security vulnerability testing
- Memory leak detection

## Project Structure

```
src/
├── components/          # React components
│   ├── common/         # Shared components
│   ├── features/       # Feature-specific components
│   ├── nodes/          # Workflow node components
│   └── ui/             # UI components
├── hooks/              # Custom React hooks
├── services/           # API services
├── state/              # State management
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── __tests__/          # Test files
    ├── e2e/            # E2E tests
    │   └── CriticalBugRegressionTests.test.tsx  # GRADE A tests
    ├── integration/    # Integration tests
    └── unit/           # Unit tests
```

## Development

### Code Quality
- **ESLint**: JavaScript/TypeScript linting
- **Prettier**: Code formatting
- **TypeScript**: Type safety
- **Husky**: Git hooks for quality checks

### Testing Strategy
- **TDD Approach**: Write tests first
- **Comprehensive Coverage**: 100% critical path coverage
- **Edge Case Testing**: All boundary conditions tested
- **Security Testing**: All inputs validated
- **Performance Testing**: Memory and speed monitored

### Contributing
1. Fork the repository
2. Create a feature branch
3. Write tests first (TDD approach)
4. Implement the feature
5. Run all test suites
6. Submit a pull request

## Critical Bug Prevention

### BUG-081: React Flow Instance
- **Tests**: React Flow initialization and functionality
- **Coverage**: Component lifecycle, error boundaries, viewport management
- **Prevention**: Comprehensive initialization testing and error recovery

### BUG-082: Drag and Drop
- **Tests**: Drag and drop operations with edge cases
- **Coverage**: Event handling, data transfer, drop zone detection
- **Prevention**: Fallback mechanisms and comprehensive edge case testing

## Performance Monitoring

### Memory Management
- Automatic memory usage monitoring
- Memory leak detection in tests
- Component cleanup verification
- Resource disposal testing

### Performance Testing
- Response time monitoring
- Component rendering performance
- Workflow execution speed
- User interaction responsiveness

## Security Features

### Input Sanitization
- XSS prevention with DOMPurify
- Input validation and sanitization
- Safe content rendering
- Malicious input detection

### Error Handling
- Graceful error boundaries
- User-friendly error messages
- Error recovery mechanisms
- Security-conscious error reporting

## Documentation

- [GRADE A Regression Test Documentation](../GRADE_A_REGRESSION_TEST_DOCUMENTATION.md)
- [Testing Guide](../docs/TESTING_GUIDE.md)
- [Bug Database](../docs/BUGS.md)
- [API Documentation](../docs/API_DOCUMENTATION.md)

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

---

**Mission**: Every bug that reaches production is a failure of our test suite.