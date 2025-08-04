# Test Quality Grading Rubric
## Industry-Standard Criteria for Test Excellence

---

# 🎯 Grade 'A' Test Requirements

An 'A' grade test must satisfy ALL criteria below. Missing even one drops it to 'B' or lower.

---

## 🏛️ F.I.R.S.T. Principles Compliance

### F - Fast (⏱️ < 100ms for unit, < 5s for integration)
```javascript
// ❌ Grade: D - Too slow
it('should process data', async () => {
  await sleep(5000); // Arbitrary wait
  expect(result).toBe(true);
});

// ✅ Grade: A - Fast
it('should process data', () => {
  const result = processDataSync(testData);
  expect(result.status).toBe('completed');
});
```

### I - Independent/Isolated
```javascript
// ❌ Grade: F - Depends on previous test
it('should update user', () => {
  // Assumes user was created in previous test
  updateUser(globalUserId, newData);
  expect(getUser(globalUserId).name).toBe(newData.name);
});

// ✅ Grade: A - Self-contained
it('should update user', () => {
  // Arrange - Create own test data
  const user = createTestUser();
  
  // Act
  const updated = updateUser(user.id, { name: 'New Name' });
  
  // Assert
  expect(updated.name).toBe('New Name');
  
  // Cleanup
  deleteTestUser(user.id);
});
```

### R - Repeatable
```javascript
// ❌ Grade: D - Non-deterministic
it('should generate unique ID', () => {
  const id = generateId();
  expect(id).toContain(Date.now()); // Fails if clock changes
});

// ✅ Grade: A - Deterministic
it('should generate unique ID with correct format', () => {
  const mockDate = new Date('2024-01-01T00:00:00Z');
  vi.setSystemTime(mockDate);
  
  const id = generateId();
  expect(id).toBe('id_1704067200000_abc123');
  
  vi.useRealTimers();
});
```

### S - Self-Validating
```javascript
// ❌ Grade: F - Requires manual verification
it('should log error', () => {
  processInvalidData();
  console.log('Check logs for error message'); // NO!
});

// ✅ Grade: A - Clear pass/fail
it('should log error for invalid data', () => {
  const consoleSpy = vi.spyOn(console, 'error');
  
  processInvalidData();
  
  expect(consoleSpy).toHaveBeenCalledWith(
    'Validation failed: Missing required field "email"'
  );
});
```

### T - Thorough/Timely
```javascript
// ❌ Grade: C - Only happy path
it('should divide numbers', () => {
  expect(divide(10, 2)).toBe(5);
});

// ✅ Grade: A - Thorough coverage
describe('divide function', () => {
  it('should divide positive numbers', () => {
    expect(divide(10, 2)).toBe(5);
  });
  
  it('should handle division by zero', () => {
    expect(() => divide(10, 0)).toThrow('Division by zero');
  });
  
  it('should handle negative numbers', () => {
    expect(divide(-10, 2)).toBe(-5);
  });
  
  it('should handle decimal results', () => {
    expect(divide(10, 3)).toBeCloseTo(3.333, 3);
  });
});
```

---

## ✅ Grade 'A' Criteria Checklist

### 1. Intent and Criticality

#### Tests Real Business Value
```javascript
// ❌ Grade: D - Tests implementation detail
it('should set internal flag to true', () => {
  const obj = new Calculator();
  obj._internalFlag = true;
  expect(obj._internalFlag).toBe(true);
});

// ✅ Grade: A - Tests business requirement
it('should calculate tax correctly for California residents', () => {
  const order = { subtotal: 100, state: 'CA' };
  const total = calculateTotal(order);
  expect(total).toBe(107.25); // 7.25% CA tax
});
```

#### Clear and Descriptive Name
```javascript
// ❌ Grade: D - Vague name
it('test1', () => {});
it('should work', () => {});

// ✅ Grade: A - Descriptive name
it('should reject file upload when size exceeds 10MB limit', () => {});
it('should return 401 when authentication token is expired', () => {});
```

### 2. Assertions and Validation

#### Meaningful Assertions
```javascript
// ❌ Grade: F - Meaningless
it('should create user', () => {
  const user = createUser(data);
  expect(user).toBeDefined();
  expect(true).toBe(true);
});

// ✅ Grade: A - Specific and meaningful
it('should create user with correct properties', () => {
  const user = createUser({
    email: 'test@example.com',
    role: 'admin'
  });
  
  expect(user.id).toMatch(/^usr_[a-z0-9]{10}$/);
  expect(user.email).toBe('test@example.com');
  expect(user.role).toBe('admin');
  expect(user.createdAt).toBeInstanceOf(Date);
  expect(user.isActive).toBe(true);
});
```

#### Single, Focused Responsibility
```javascript
// ❌ Grade: C - Tests too many things
it('should handle user workflow', () => {
  // Testing creation
  const user = createUser(data);
  expect(user.id).toBeDefined();
  
  // Testing update
  updateUser(user.id, { name: 'New' });
  expect(getUser(user.id).name).toBe('New');
  
  // Testing deletion
  deleteUser(user.id);
  expect(getUser(user.id)).toBeNull();
});

// ✅ Grade: A - Single responsibility
it('should create user with default role when not specified', () => {
  const user = createUser({ email: 'test@example.com' });
  expect(user.role).toBe('user');
});

it('should update user name', () => {
  const user = createUser({ name: 'Old' });
  const updated = updateUser(user.id, { name: 'New' });
  expect(updated.name).toBe('New');
});
```

#### Tests Both Success and Failure
```javascript
// ❌ Grade: C - Only happy path
describe('login', () => {
  it('should login with valid credentials', () => {
    const result = login('user@example.com', 'password123');
    expect(result.success).toBe(true);
  });
});

// ✅ Grade: A - Comprehensive coverage
describe('login', () => {
  it('should successfully login with valid credentials', () => {
    const result = login('user@example.com', 'password123');
    expect(result.success).toBe(true);
    expect(result.token).toMatch(/^jwt_/);
  });
  
  it('should reject login with incorrect password', () => {
    const result = login('user@example.com', 'wrongpassword');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid credentials');
  });
  
  it('should reject login with non-existent email', () => {
    const result = login('nobody@example.com', 'password123');
    expect(result.success).toBe(false);
    expect(result.error).toBe('User not found');
  });
  
  it('should lock account after 5 failed attempts', () => {
    for (let i = 0; i < 5; i++) {
      login('user@example.com', 'wrong');
    }
    const result = login('user@example.com', 'password123');
    expect(result.error).toBe('Account locked. Please reset password.');
  });
});
```

### 3. Implementation Quality

#### Avoids Unnecessary Mocks
```javascript
// ❌ Grade: C - Over-mocked
it('should calculate total', () => {
  const mockAdd = vi.fn().mockReturnValue(10);
  const mockMultiply = vi.fn().mockReturnValue(20);
  const calculator = new Calculator(mockAdd, mockMultiply);
  
  expect(calculator.total()).toBe(20);
});

// ✅ Grade: A - Real implementation where possible
it('should calculate order total with tax and shipping', () => {
  const order = {
    items: [
      { price: 10, quantity: 2 },
      { price: 15, quantity: 1 }
    ],
    state: 'CA'
  };
  
  const total = calculateTotal(order);
  
  expect(total).toBe(37.69); // (20+15) * 1.075 tax + 2 shipping
});
```

#### Clean and Readable (AAA Pattern)
```javascript
// ❌ Grade: D - Messy and unclear
it('test', () => {
  const u = { n: 'John', e: 'j@e.com' };
  const r = proc(u);
  if (r) expect(r.s).toBe(true);
  else expect(false).toBe(true);
});

// ✅ Grade: A - Clear AAA pattern
it('should process valid user registration', () => {
  // Arrange
  const newUser = {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'SecurePass123!'
  };
  
  // Act
  const result = registerUser(newUser);
  
  // Assert
  expect(result.success).toBe(true);
  expect(result.user.id).toBeDefined();
  expect(result.user.email).toBe('john@example.com');
  expect(result.user.passwordHash).not.toBe('SecurePass123!');
});
```

#### No Logic in Tests
```javascript
// ❌ Grade: D - Logic in test
it('should handle various inputs', () => {
  const inputs = [1, 2, 3, 4, 5];
  
  for (let input of inputs) {
    if (input % 2 === 0) {
      expect(isEven(input)).toBe(true);
    } else {
      expect(isEven(input)).toBe(false);
    }
  }
});

// ✅ Grade: A - No logic, use parameterized tests
describe('isEven function', () => {
  it.each([
    [2, true],
    [3, false],
    [4, true],
    [5, false],
    [0, true],
    [-2, true]
  ])('isEven(%i) should return %s', (input, expected) => {
    expect(isEven(input)).toBe(expected);
  });
});
```

---

## 📊 Grading Scale

### Grade A (90-100%)
- Satisfies ALL F.I.R.S.T. principles
- Tests critical business logic
- Has descriptive names
- Uses specific, meaningful assertions  
- Single responsibility per test
- Tests success AND failure cases
- Minimal mocking
- Clean AAA/GWT structure
- No logic in tests

### Grade B (80-89%)
- Satisfies MOST F.I.R.S.T. principles
- Tests important functionality
- Good assertions but could be more specific
- Minor issues with clarity or structure
- Good coverage but missing some edge cases

### Grade C (70-79%)
- Basic test that works
- Some F.I.R.S.T. violations (e.g., slow, some dependencies)
- Tests mostly happy path
- Assertions are present but generic
- Some unnecessary mocking

### Grade D (60-69%)
- Test runs but has significant issues
- Multiple F.I.R.S.T. violations
- Poor naming or unclear intent
- Weak assertions (not null, toBeDefined)
- Heavy mocking without justification

### Grade F (Below 60%)
- Fake test (expect(true).toBe(true))
- Non-deterministic/flaky
- Tests implementation details not behavior
- No meaningful assertions
- Requires manual verification
- Has logic bugs in the test itself

---

## 🎯 Example: Grading a Real Test

```javascript
// Test to be graded:
it('should handle payment processing', async () => {
  const payment = { amount: 100, currency: 'USD' };
  const result = await processPayment(payment);
  expect(result).not.toBeNull();
});
```

### Grading Analysis:
- **Fast**: ❌ Async without clear need (might be slow)
- **Independent**: ❓ Can't tell without context
- **Repeatable**: ❓ Depends on external payment service?
- **Self-Validating**: ❌ Weak assertion (not null)
- **Thorough**: ❌ No error cases tested
- **Business Value**: ✅ Payment processing is critical
- **Name**: ⚠️ Too generic
- **Assertions**: ❌ Not specific enough
- **Single Responsibility**: ✅ Tests one thing
- **Clean**: ⚠️ Could use AAA pattern

**Grade: D (65%)**

### Improved to Grade A:
```javascript
describe('Payment Processing', () => {
  it('should successfully process valid USD payment and return transaction ID', () => {
    // Arrange
    const validPayment = {
      amount: 100.00,
      currency: 'USD',
      cardNumber: '4111111111111111',
      cvv: '123',
      expiry: '12/25'
    };
    
    // Act
    const result = processPayment(validPayment);
    
    // Assert
    expect(result.success).toBe(true);
    expect(result.transactionId).toMatch(/^txn_[A-Z0-9]{10}$/);
    expect(result.amount).toBe(100.00);
    expect(result.currency).toBe('USD');
    expect(result.timestamp).toBeInstanceOf(Date);
  });
  
  it('should reject payment when amount exceeds card limit', () => {
    const overlimitPayment = {
      amount: 100000.00,
      currency: 'USD',
      cardNumber: '4111111111111111'
    };
    
    expect(() => processPayment(overlimitPayment))
      .toThrow('Payment amount exceeds card limit');
  });
  
  it('should reject payment with invalid card number', () => {
    const invalidCardPayment = {
      amount: 100.00,
      currency: 'USD',
      cardNumber: '0000000000000000'
    };
    
    expect(() => processPayment(invalidCardPayment))
      .toThrow('Invalid card number');
  });
});
```

**Grade: A (95%)**

---

## 🚀 How to Use This Rubric

1. **For Developers**: Use as a checklist when writing tests
2. **For Code Reviews**: Objectively evaluate test quality
3. **For AI Tools**: Provide this rubric for consistent grading
4. **For Teams**: Establish minimum grade requirements (e.g., all tests must be B or higher)

---

## 📝 Quick Reference Card

```
✅ Grade A Test Checklist:
□ Runs in < 100ms (unit) or < 5s (integration)
□ No dependencies on other tests
□ Same result every time
□ Clear pass/fail without manual checking
□ Tests edge cases and errors, not just happy path
□ Tests real user value, not implementation details
□ Name describes: what + when + expected result
□ Specific assertions (not just "not null")
□ One concept per test
□ Minimal mocking
□ Follows AAA/GWT pattern
□ No if/else, loops, or try/catch in test
```