# 🎯 Grade A Test Strategy - Finding Real Bugs

## Mission Statement

**Our goal is NOT to make tests pass. Our goal is to find and expose every bug in the codebase through rigorous, uncompromising testing.**

Every test we write should be designed to break the system, not to confirm it works. We assume the code is guilty until proven innocent.

---

## 🔍 Bug-Finding Philosophy

### The Adversarial Tester Mindset
1. **Assume Everything is Broken**: Start with the assumption that every function has bugs
2. **Test the Impossible**: Try inputs that "should never happen"
3. **Break Assumptions**: Challenge every implicit assumption in the code
4. **Stress Boundaries**: Push every limit until it breaks
5. **Question Success**: When a test passes easily, it's probably not thorough enough

### No Shortcuts Allowed ❌
- **NO** weakening assertions to make tests pass
- **NO** increasing timeouts to avoid failures
- **NO** catching exceptions that should fail
- **NO** mocking to avoid real problems
- **NO** skipping "difficult" test scenarios

---

## 🎭 Grade A Test Characteristics

### 1. Ruthlessly Thorough
```typescript
// ❌ BAD - Lazy test that assumes success
it('should create a node', () => {
  const node = createNode('test');
  expect(node).toBeDefined();
});

// ✅ GOOD - Thorough test that hunts for bugs
it('should handle all node creation edge cases', () => {
  // Test null input
  expect(() => createNode(null)).toThrow('Node type cannot be null');
  
  // Test undefined
  expect(() => createNode(undefined)).toThrow('Node type is required');
  
  // Test empty string
  expect(() => createNode('')).toThrow('Node type cannot be empty');
  
  // Test invalid type
  expect(() => createNode('invalid-type')).toThrow('Unknown node type: invalid-type');
  
  // Test SQL injection attempt
  expect(() => createNode("'; DROP TABLE nodes; --")).toThrow('Invalid characters in node type');
  
  // Test XSS attempt
  const xssAttempt = '<script>alert("xss")</script>';
  const node = createNode(xssAttempt);
  expect(node.type).not.toContain('<script>');
  
  // Test extremely long input
  const longInput = 'a'.repeat(10000);
  expect(() => createNode(longInput)).toThrow('Node type exceeds maximum length');
  
  // Test Unicode edge cases
  expect(() => createNode('👨‍👩‍👧‍👦')).toThrow('Node type must be ASCII');
  
  // Test concurrent creation
  const promises = Array(1000).fill(0).map(() => createNode('test'));
  const nodes = await Promise.all(promises);
  const uniqueIds = new Set(nodes.map(n => n.id));
  expect(uniqueIds.size).toBe(1000); // All IDs must be unique
  
  // Test memory leak
  const memBefore = process.memoryUsage().heapUsed;
  for (let i = 0; i < 10000; i++) {
    createNode('test');
  }
  global.gc(); // Force garbage collection
  const memAfter = process.memoryUsage().heapUsed;
  expect(memAfter - memBefore).toBeLessThan(50 * 1024 * 1024); // Less than 50MB growth
});
```

### 2. Business-Critical Focus
```typescript
// ✅ Tests that find real money-losing bugs
describe('Payment Processing - Finding Critical Bugs', () => {
  it('should prevent double-charging on network retry', async () => {
    const payment = { amount: 100, card: '4242424242424242' };
    
    // Simulate network timeout followed by retry
    const promise1 = processPayment(payment);
    const promise2 = processPayment(payment);
    
    const [result1, result2] = await Promise.all([promise1, promise2]);
    
    // Only one should succeed
    const successes = [result1, result2].filter(r => r.success).length;
    expect(successes).toBe(1);
    
    // Check audit log
    const charges = await getCharges(payment.card);
    expect(charges.length).toBe(1);
    expect(charges[0].amount).toBe(100);
  });
  
  it('should handle race condition in balance check', async () => {
    const account = { id: 'acc123', balance: 100 };
    
    // Attempt 100 concurrent $10 withdrawals
    const withdrawals = Array(100).fill(0).map(() => 
      withdraw(account.id, 10)
    );
    
    const results = await Promise.all(withdrawals);
    const successful = results.filter(r => r.success).length;
    
    // Should only allow 10 successful withdrawals
    expect(successful).toBe(10);
    
    // Balance should never go negative
    const finalBalance = await getBalance(account.id);
    expect(finalBalance).toBe(0);
    expect(finalBalance).toBeGreaterThanOrEqual(0);
  });
});
```

### 3. Security-First Testing
```typescript
describe('Security Vulnerabilities - Active Bug Hunting', () => {
  it('should prevent API key leakage in all scenarios', async () => {
    const apiKey = 'sk-secret-key-12345';
    
    // Test error messages
    try {
      await callAPI(apiKey, 'invalid-endpoint');
    } catch (error) {
      expect(error.message).not.toContain(apiKey);
      expect(error.stack).not.toContain(apiKey);
    }
    
    // Test logs
    const logs = await getLogs();
    expect(JSON.stringify(logs)).not.toContain(apiKey);
    
    // Test response headers
    const response = await fetch('/api/test', {
      headers: { 'X-API-Key': apiKey }
    });
    
    for (const [key, value] of response.headers) {
      expect(value).not.toContain(apiKey);
    }
    
    // Test HTML injection in error pages
    const errorResponse = await fetch('/api/error?key=' + apiKey);
    const html = await errorResponse.text();
    expect(html).not.toContain(apiKey);
  });
  
  it('should prevent prototype pollution attacks', () => {
    const maliciousInput = {
      '__proto__': { isAdmin: true },
      'constructor': { prototype: { isAdmin: true } }
    };
    
    processUserInput(maliciousInput);
    
    // Verify prototype wasn't polluted
    const newObj = {};
    expect(newObj.isAdmin).toBeUndefined();
    expect(({}).isAdmin).toBeUndefined();
  });
});
```

### 4. Performance Regression Detection
```typescript
describe('Performance Bugs - Finding Slowdowns', () => {
  it('should detect O(n²) algorithms that should be O(n)', () => {
    const sizes = [100, 1000, 10000];
    const times = [];
    
    for (const size of sizes) {
      const data = Array(size).fill(0).map((_, i) => i);
      const start = performance.now();
      processData(data);
      times.push(performance.now() - start);
    }
    
    // Check if time grows linearly (O(n)) not quadratically (O(n²))
    const ratio1 = times[1] / times[0]; // Should be ~10 for O(n)
    const ratio2 = times[2] / times[1]; // Should be ~10 for O(n)
    
    expect(ratio1).toBeLessThan(15); // Allow some variance
    expect(ratio2).toBeLessThan(15);
    
    // If ratios are ~100, we have O(n²) - a bug!
    expect(ratio1).toBeLessThan(50);
    expect(ratio2).toBeLessThan(50);
  });
  
  it('should detect memory leaks in component lifecycle', () => {
    const iterations = 1000;
    const measurements = [];
    
    for (let i = 0; i < 5; i++) {
      global.gc(); // Force GC
      const before = process.memoryUsage().heapUsed;
      
      // Create and destroy components
      for (let j = 0; j < iterations; j++) {
        const component = new WorkflowBuilder();
        component.mount();
        component.unmount();
      }
      
      global.gc(); // Force GC
      const after = process.memoryUsage().heapUsed;
      measurements.push(after - before);
    }
    
    // Memory usage should be stable, not growing
    const avgGrowth = measurements.reduce((a, b) => a + b) / measurements.length;
    expect(avgGrowth).toBeLessThan(1024 * 1024); // Less than 1MB growth
  });
});
```

### 5. Chaos Engineering Tests
```typescript
describe('Chaos Testing - Breaking Everything', () => {
  it('should survive random input fuzzing', () => {
    const fuzzInputs = [
      null,
      undefined,
      NaN,
      Infinity,
      -Infinity,
      '',
      ' ',
      '\n\r\t',
      '0',
      '-1',
      '999999999999999999999',
      [],
      {},
      () => {},
      Symbol('test'),
      new Date(),
      /regex/,
      new Map(),
      new Set(),
      new WeakMap(),
      new ArrayBuffer(8),
      new Proxy({}, {}),
      Object.create(null),
      '💣🔥👾',
      '\u0000',
      '\uFFFD',
      'A'.repeat(1000000),
      '<img src=x onerror=alert(1)>',
      '../../../../../../etc/passwd',
      'SELECT * FROM users WHERE 1=1',
      '${7*7}',
      '{{7*7}}',
      '%00',
      String.fromCharCode(0),
      String.fromCharCode(65535),
    ];
    
    for (const input of fuzzInputs) {
      // Function should handle all inputs gracefully
      expect(() => {
        const result = processInput(input);
        // If it doesn't throw, verify output is safe
        if (typeof result === 'string') {
          expect(result).not.toContain('<script>');
          expect(result).not.toMatch(/SELECT.*FROM/i);
        }
      }).not.toThrow(TypeError);
    }
  });
  
  it('should handle catastrophic network conditions', async () => {
    const scenarios = [
      { latency: 10000, packetLoss: 0.5 },    // Extreme latency
      { latency: 0, packetLoss: 0.9 },        // 90% packet loss
      { latency: 'random', jitter: 5000 },    // Unpredictable
      { disconnect: true, reconnectAfter: 1000 }, // Connection drops
      { bandwidth: '1kb/s' },                 // Dial-up speeds
    ];
    
    for (const scenario of scenarios) {
      mockNetwork(scenario);
      
      const result = await attemptOperation();
      
      // Should either succeed eventually or fail gracefully
      expect(result).toMatchObject({
        success: expect.any(Boolean),
        error: expect.any(String),
        retries: expect.any(Number)
      });
      
      // Should not corrupt data
      const data = await getData();
      expect(data).toMatchSchema(expectedSchema);
    }
  });
});
```

---

## 🐛 Bug Categories to Hunt

### 1. Race Conditions
```typescript
// Test for race conditions in state updates
it('should handle concurrent state mutations safely', async () => {
  const updates = Array(100).fill(0).map((_, i) => 
    updateState({ counter: i })
  );
  
  await Promise.all(updates);
  
  const state = getState();
  // State should be consistent, not corrupted
  expect(state.counter).toBeGreaterThanOrEqual(0);
  expect(state.counter).toBeLessThanOrEqual(99);
});
```

### 2. Memory Leaks
```typescript
// Test for memory leaks in event listeners
it('should clean up all event listeners on unmount', () => {
  const component = mount(<WorkflowBuilder />);
  const beforeListeners = getEventListeners(window).length;
  
  component.unmount();
  
  const afterListeners = getEventListeners(window).length;
  expect(afterListeners).toBe(beforeListeners);
});
```

### 3. Edge Cases
```typescript
// Test boundary conditions
it('should handle MAX_SAFE_INTEGER correctly', () => {
  const result = calculate(Number.MAX_SAFE_INTEGER);
  expect(result).not.toBe(Infinity);
  expect(result).not.toBeNaN();
});
```

### 4. Security Vulnerabilities
```typescript
// Test for injection attacks
it('should prevent NoSQL injection', () => {
  const maliciousInput = { $ne: null };
  const result = queryDatabase(maliciousInput);
  expect(result).not.toContainAllUsers();
});
```

### 5. Concurrency Issues
```typescript
// Test for deadlocks
it('should not deadlock under high concurrency', async () => {
  const timeout = new Promise((_, reject) => 
    setTimeout(() => reject('Deadlock detected'), 5000)
  );
  
  const operations = Array(1000).fill(0).map(() => 
    performConcurrentOperation()
  );
  
  await Promise.race([
    Promise.all(operations),
    timeout
  ]);
});
```

---

## 🧪 Test Implementation Guidelines

### 1. Never Trust Happy Path
```typescript
// ❌ BAD - Only tests success
it('should save workflow', async () => {
  const result = await saveWorkflow({ name: 'Test' });
  expect(result.success).toBe(true);
});

// ✅ GOOD - Tests all failure modes
it('should handle all workflow save scenarios', async () => {
  // Network failure
  mockNetwork({ offline: true });
  await expect(saveWorkflow({ name: 'Test' }))
    .rejects.toThrow('Network error');
  
  // Server error
  mockServer({ status: 500 });
  await expect(saveWorkflow({ name: 'Test' }))
    .rejects.toThrow('Server error');
  
  // Validation error
  await expect(saveWorkflow({ name: '' }))
    .rejects.toThrow('Name is required');
  
  // Concurrent saves
  const save1 = saveWorkflow({ name: 'Test' });
  const save2 = saveWorkflow({ name: 'Test' });
  const results = await Promise.allSettled([save1, save2]);
  // One should fail with conflict
  expect(results.filter(r => r.status === 'rejected')).toHaveLength(1);
});
```

### 2. Test Recovery Mechanisms
```typescript
it('should recover from circuit breaker trips', async () => {
  // Force circuit breaker to open
  for (let i = 0; i < 5; i++) {
    mockServer({ status: 500 });
    await callAPI().catch(() => {});
  }
  
  // Verify circuit is open
  await expect(callAPI()).rejects.toThrow('Circuit breaker is open');
  
  // Wait for half-open state
  await sleep(60000);
  
  // Should attempt recovery
  mockServer({ status: 200 });
  const result = await callAPI();
  expect(result.success).toBe(true);
});
```

### 3. Property-Based Testing
```typescript
import fc from 'fast-check';

it('should maintain invariants for all inputs', () => {
  fc.assert(
    fc.property(
      fc.array(fc.integer()),
      (arr) => {
        const sorted = sortArray(arr);
        
        // Invariant 1: Length preserved
        expect(sorted.length).toBe(arr.length);
        
        // Invariant 2: Actually sorted
        for (let i = 1; i < sorted.length; i++) {
          expect(sorted[i]).toBeGreaterThanOrEqual(sorted[i-1]);
        }
        
        // Invariant 3: Same elements
        expect(sorted.sort()).toEqual(arr.sort());
      }
    )
  );
});
```

### 4. Mutation Testing Verification
```typescript
// Use Stryker or similar to verify test quality
// If changing < to <= doesn't break tests, tests aren't thorough enough
it('should detect boundary condition bugs', () => {
  // This test should fail if implementation uses <= instead of <
  const result = processRange(5, 5);
  expect(result).toEqual([]);  // Not [5]
});
```

---

## 📊 Bug Discovery Metrics

### Target Metrics
- **Bug Discovery Rate**: Find at least 1 bug per 10 tests written
- **Code Coverage**: 100% including error paths
- **Mutation Score**: > 90% (tests kill most mutations)
- **Edge Case Coverage**: Test 10+ edge cases per function
- **Security Tests**: 100% of inputs validated

### Bug Severity Classification
1. **Critical**: Data loss, security breach, payment errors
2. **High**: Functionality broken, performance degradation
3. **Medium**: UX issues, non-critical errors
4. **Low**: Minor inconsistencies

---

## 🎮 Advanced Testing Techniques

### 1. Snapshot Testing with Variations
```typescript
it('should render consistently across all states', () => {
  const states = generateAllPossibleStates();
  
  states.forEach((state, index) => {
    const component = render(<Component {...state} />);
    expect(component).toMatchSnapshot(`state-${index}`);
  });
});
```

### 2. Contract Testing
```typescript
it('should maintain API contract', async () => {
  const response = await fetch('/api/workflow');
  const data = await response.json();
  
  expect(data).toMatchSchema({
    type: 'object',
    required: ['id', 'name', 'nodes', 'edges'],
    properties: {
      id: { type: 'string', pattern: '^[a-z0-9-]+$' },
      name: { type: 'string', minLength: 1, maxLength: 100 },
      nodes: { type: 'array', items: nodeSchema },
      edges: { type: 'array', items: edgeSchema }
    }
  });
});
```

### 3. Time Travel Testing
```typescript
it('should handle date boundaries correctly', () => {
  const testDates = [
    new Date('1999-12-31T23:59:59Z'), // Y2K
    new Date('2038-01-19T03:14:07Z'), // Unix timestamp overflow
    new Date('2000-02-29T00:00:00Z'), // Leap year
    new Date('2100-02-28T00:00:00Z'), // Non-leap century
  ];
  
  testDates.forEach(date => {
    vi.setSystemTime(date);
    const result = processDate();
    expect(result).not.toThrow();
    expect(result).toBeValid();
  });
});
```

---

## 🚨 Zero Tolerance Policy

### What We Will NOT Do:
1. **Skip failing tests** - Fix the bug, not the test
2. **Increase timeouts** - Fix the performance issue
3. **Add try/catch** - Let it fail loudly
4. **Mock away problems** - Face the integration issues
5. **Weaken assertions** - Demand perfection
6. **Ignore flaky tests** - Fix the race condition

### What We WILL Do:
1. **Break the system** - Find its limits
2. **Question everything** - Trust nothing
3. **Test the impossible** - Expect the unexpected
4. **Automate everything** - Manual testing is a bug
5. **Measure everything** - If it's not measured, it's broken

---

## 🎯 Implementation Checklist

For each test you write, verify:

- [ ] Tests at least 10 edge cases
- [ ] Includes negative test cases
- [ ] Tests error recovery
- [ ] Validates security concerns
- [ ] Checks performance impact
- [ ] Tests concurrency scenarios
- [ ] Includes property-based tests
- [ ] Has meaningful assertions
- [ ] Runs in < 100ms (unit) or < 5s (integration)
- [ ] Would catch real production bugs

---

## 📈 Success Metrics

We know we've succeeded when:
1. **Every production bug was preventable** by our tests
2. **Mutation testing shows 95%+ score**
3. **No bug reports match untested scenarios**
4. **Tests find bugs before users do**
5. **Developers fear changing code without tests**

Remember: **Every bug that reaches production is a failure of our test suite.**

---

*"The goal of testing is not to prove that code works, but to prove that it doesn't."*

*Grade A Testing Strategy - Zero Compromise Edition*