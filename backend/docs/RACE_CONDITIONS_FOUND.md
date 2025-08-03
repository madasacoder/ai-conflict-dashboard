# Race Conditions and Thread Safety Issues Found

## Date: 2025-08-02

During investigation of flaky tests, we discovered several critical race conditions and thread safety issues in the circuit breaker implementation.

## Issues Found

### 1. **Thread-Unsafe Global Dictionary Access**

**Location**: `llm_providers.py`, lines 48-66

**Problem**: The `circuit_breakers` dictionary was accessed and modified without any synchronization:

```python
# BEFORE (NOT THREAD-SAFE):
if api_key not in circuit_breakers[provider]:
    # Race condition: Multiple threads could pass this check simultaneously
    circuit_breakers[provider][api_key] = breaker
```

**Risk**: 
- Multiple threads could check `if api_key not in circuit_breakers[provider]` simultaneously
- Both threads see the key is missing
- Both create and assign a new circuit breaker
- One circuit breaker gets lost/overwritten
- This leads to inconsistent state and flaky behavior

### 2. **Test State Pollution**

**Location**: Various test files

**Problem**: The global `circuit_breakers` dictionary persisted state between tests:
- Only some tests explicitly cleared circuit breakers
- Tests running in different orders would see different states
- This caused intermittent test failures

**Risk**:
- Tests become order-dependent
- Hard to reproduce failures
- Hidden bugs in production when similar state pollution occurs

### 3. **Dictionary Modification During Iteration**

**Potential Issue**: If any code iterates over `circuit_breakers` while another thread modifies it, it could cause `RuntimeError: dictionary changed size during iteration`

## Fixes Applied

### 1. **Added Thread Safety**

Added a threading lock to protect all access to the circuit_breakers dictionary:

```python
# AFTER (THREAD-SAFE):
_circuit_breaker_lock = threading.Lock()

def get_circuit_breaker(provider: str, api_key: str) -> CircuitBreaker:
    with _circuit_breaker_lock:
        if api_key not in circuit_breakers[provider]:
            circuit_breakers[provider][api_key] = breaker
        return circuit_breakers[provider][api_key]
```

### 2. **Improved Test Isolation**

Enhanced the `reset_circuit_breakers` fixture in `conftest.py`:
- Added thread-safe cleanup before AND after each test
- Ensures complete state reset between tests
- Marked as `autouse=True` for automatic execution

### 3. **Updated Requirements**

- Upgraded pybreaker from 1.2.0 to 1.4.0 to fix datetime deprecation warnings

## Lessons Learned

1. **Global Mutable State is Dangerous**: Any global dictionary or list that can be modified needs synchronization in a multi-threaded environment like FastAPI

2. **Test Isolation is Critical**: Tests must not share state. Always clean up global state before and after tests.

3. **Flaky Tests Indicate Real Problems**: Don't ignore intermittent test failures - they often reveal race conditions that will cause production issues

4. **FastAPI is Multi-threaded**: Even though Python has the GIL, FastAPI can handle multiple requests concurrently, requiring proper thread safety

## Recommendations

1. **Audit Other Global State**: Check for other global dictionaries or mutable state that might have similar issues

2. **Consider Using asyncio.Lock**: For async code, consider using asyncio.Lock instead of threading.Lock

3. **Add Load Testing**: These issues often only appear under concurrent load

4. **Monitor in Production**: Add metrics for circuit breaker state changes to detect issues early

## Testing the Fix

Run the previously flaky test multiple times:
```bash
for i in {1..20}; do 
    python -m pytest tests/test_integration.py::TestCircuitBreakerIntegration::test_circuit_breaker_opens_after_failures -xvs
done
```

All runs should now pass consistently.