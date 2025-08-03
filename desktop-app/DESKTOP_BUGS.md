# Desktop App Bug Database

## Bug Documentation Format
Each bug must include:
- **Bug ID**: DESKTOP-XXX
- **Severity**: CRITICAL/HIGH/MEDIUM/LOW
- **Status**: OPEN/IN_PROGRESS/FIXED
- **Component**: Affected component/file
- **Discovered**: Date and how (test/user report)
- **Description**: Clear description of the issue
- **Impact**: What breaks/who is affected
- **Root Cause**: Why it happens
- **Fix**: How to fix it
- **Test**: Regression test created
- **Verified**: Date verified fixed

---

## Active Bugs

### DESKTOP-001: configModalNodeId is not defined
- **Severity**: CRITICAL
- **Status**: FIXED
- **Component**: Desktop App (WorkflowBuilder.tsx)
- **Discovered**: 2025-08-03 (unit tests)
- **Description**: ReferenceError: configModalNodeId is not defined in WorkflowBuilder
- **Impact**: Complete app crash, all tests fail
- **Root Cause**: Missing state variable declaration in WorkflowBuilderContent
- **Error Location**: WorkflowBuilder.tsx:266:8
- **Fix**: Added `const [configModalNodeId, setConfigModalNodeId] = useState<string | null>(null)` at line 61
- **Test**: Need to create regression test
- **Verified**: 2025-08-03

### DESKTOP-002: React Flow ResizeObserver Error
- **Severity**: HIGH
- **Status**: OPEN
- **Component**: Desktop App (React Flow integration)
- **Discovered**: 2025-08-03 (unit tests)
- **Description**: resizeObserverRef?.current?.disconnect is not a function
- **Impact**: React Flow components crash in test environment
- **Root Cause**: React Flow internal implementation expects ResizeObserver with specific methods
- **Test Failures**: Multiple component tests failing with ErrorBoundary
- **Fix Required**: Need to mock React Flow itself or provide more complete ResizeObserver mock

### DESKTOP-003: DataTransfer Not Defined in Tests
- **Severity**: HIGH
- **Status**: FIXED
- **Component**: Test Environment (jsdom)
- **Discovered**: 2025-08-03 (unit tests)
- **Description**: DataTransfer is not defined in drag-drop tests
- **Impact**: Cannot test drag-drop functionality
- **Root Cause**: jsdom doesn't provide DataTransfer API
- **Test Failures**: 11 tests in DragDropFix.test.tsx
- **Fix**: Added DataTransfer and DragEvent mocks to setup.ts
- **Test**: Drag-drop tests should now run
- **Verified**: 2025-08-03

### DESKTOP-004: Missing React Flow Type Definitions
- **Severity**: MEDIUM
- **Status**: OPEN
- **Component**: TypeScript configuration
- **Discovered**: 2025-08-03 (unit tests)
- **Description**: Type errors for React Flow components
- **Impact**: TypeScript compilation warnings
- **Root Cause**: Missing or incorrect React Flow type imports
- **Fix Required**: Update type imports and declarations

### DESKTOP-005: Critical Missing Features Found by Tests
- **Severity**: CRITICAL
- **Status**: OPEN
- **Component**: Multiple (core functionality)
- **Discovered**: 2025-08-03 (unit tests)
- **Description**: Tests reveal multiple critical missing features
- **Impact**: App is not production-ready
- **Missing Features**:
  - No actual workflow execution (executeWorkflow is mock)
  - No real API integration (all fetch calls fail)
  - No error boundaries (one error crashes everything)
  - No state persistence (localStorage not used properly)
  - No undo/redo functionality
  - No performance optimization for large workflows
  - No accessibility features
- **Root Cause**: MVP incomplete, tests expose gaps
- **Fix Required**: Implement core functionality

### DESKTOP-006: API Health Check Failures
- **Severity**: HIGH
- **Status**: OPEN
- **Component**: API integration
- **Discovered**: 2025-08-03 (unit tests)
- **Description**: API health checks failing with ECONNREFUSED
- **Impact**: App shows unhealthy state, integration tests fail
- **Root Cause**: Backend not running or connection issues
- **Test Failures**: Multiple integration tests
- **Fix Required**: Mock API calls in tests or ensure backend is running

### DESKTOP-007: Timeout Failures in Real-World Tests
- **Severity**: HIGH
- **Status**: OPEN
- **Component**: Test infrastructure
- **Discovered**: 2025-08-03 (unit tests)
- **Description**: Multiple tests timing out at 5000ms
- **Impact**: Cannot verify critical functionality
- **Test Failures**: Auto-save, loading states, security validation, performance tests
- **Root Cause**: Tests waiting for functionality that doesn't exist
- **Fix Required**: Implement missing functionality or update test expectations

### DESKTOP-008: React Flow Component Isolation Issue
- **Severity**: HIGH
- **Status**: OPEN
- **Component**: Test isolation 
- **Discovered**: 2025-08-03 (running tests)
- **Description**: React Flow ResizeObserver errors still causing test failures despite mocks
- **Impact**: Component tests fail with ErrorBoundary triggering
- **Root Cause**: React Flow internal implementation bypasses our mocks
- **Test Failures**: React component mounting tests showing "resizeObserverRef?.current?.disconnect is not a function"
- **Fix Required**: More comprehensive React Flow mocking or test environment setup

---

## Test Failure Summary
- **Total Test Files**: 15
- **Failed**: 11
- **Passed**: 4
- **Total Tests**: 99
- **Failed Tests**: 49 (49.5%) ↓ IMPROVED
- **Passed Tests**: 50 (50.5%) ↑ IMPROVED

## Improvement from Fixes
- Fixed DESKTOP-001: configModalNodeId - 4 test failures resolved
- Fixed DESKTOP-003: DataTransfer mocks - drag-drop tests now run
- Overall improvement: 53→49 failed tests (7.5% improvement)

## Critical Issues Found
1. Missing state variable causing app crash
2. React Flow browser API dependencies
3. Test environment missing browser APIs
4. Multiple timeout failures in real-world tests
5. State management tests failing