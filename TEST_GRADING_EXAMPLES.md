# Test Grading Examples Using the Rubric

## Real Tests from Your Codebase Graded

---

## Test 1: `test_token_utils.py::TestChunkText::test_basic_chunking`

```python
def test_basic_chunking(self):
    """Test basic text chunking."""
    # Create text with clear paragraph breaks
    text = "First paragraph. " * 100 + "\n\n" + "Second paragraph. " * 100
    chunks = chunk_text(text, max_tokens=200)

    assert len(chunks) > 1
    assert all(estimate_tokens(c["text"]) <= 250 for c in chunks)
    assert chunks[0]["chunk_index"] == 1
    assert chunks[-1]["chunk_index"] == len(chunks)
```

### Grade: B+ (85%)

#### F.I.R.S.T. Analysis:
- **Fast**: ✅ Runs quickly, no I/O
- **Independent**: ✅ Self-contained
- **Repeatable**: ✅ Deterministic results
- **Self-Validating**: ✅ Clear assertions
- **Thorough**: ⚠️ Tests main case but not edge cases

#### Detailed Grading:
- **Business Value**: ✅ Text chunking is critical for API limits
- **Name**: ⚠️ "basic_chunking" is okay but could be more specific
- **Assertions**: ✅ Good - checks chunk count, size limits, indexing
- **Single Responsibility**: ✅ Tests one concept
- **Clean**: ✅ Follows AAA pattern
- **No Logic**: ✅ Simple assertions

**Why not Grade A**: Missing edge cases (empty text, single word, special characters)

---

## Test 2: `AllBugsRegression.test.tsx::BUG-046`

```typescript
it('should have auto-save functionality with debouncing', () => {
  const saveSpy = vi.fn()
  const mockStore = {
    nodes: [],
    edges: [],
    autoSave: true,
    saveWorkflow: saveSpy
  }
  
  const triggerAutoSave = () => {
    if (mockStore.autoSave) {
      setTimeout(() => saveSpy(), 1000)
    }
  }
  
  triggerAutoSave()
  expect(mockStore.autoSave).toBe(true)
})
```

### Grade: F (0%)

#### F.I.R.S.T. Analysis:
- **Fast**: ❌ Has setTimeout but doesn't use fake timers
- **Independent**: ✅ Self-contained
- **Repeatable**: ❌ Timing-dependent
- **Self-Validating**: ❌ Only checks a hardcoded boolean
- **Thorough**: ❌ Doesn't test actual functionality

#### Detailed Grading:
- **Business Value**: ❌ Tests nothing real
- **Name**: ⚠️ Name promises more than test delivers
- **Assertions**: ❌ `expect(mockStore.autoSave).toBe(true)` is meaningless
- **Single Responsibility**: ❌ Creates function but doesn't test it
- **Clean**: ❌ Misleading test structure
- **Logic in Test**: ❌ Has if statement

**Why Grade F**: This is a fake test that provides no value

---

## Test 3: `test_security_comprehensive.py::test_xss_prevention`

```python
async def test_xss_prevention(self):
    """Test XSS attack prevention in user inputs."""
    xss_payload = "<script>alert('XSS')</script>"
    
    response = client.post(
        "/api/analyze",
        json={
            "text": xss_payload,
            "models": ["gpt-3.5-turbo"]
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    
    # Check response doesn't contain unescaped script
    assert "<script>" not in json.dumps(data)
    assert "&lt;script&gt;" in json.dumps(data) or "script" not in json.dumps(data).lower()
    
    # Verify sanitization in logs
    with open("logs/app.log", "r") as f:
        logs = f.read()
        assert "<script>" not in logs
```

### Grade: A- (92%)

#### F.I.R.S.T. Analysis:
- **Fast**: ✅ Quick API test
- **Independent**: ✅ Self-contained
- **Repeatable**: ✅ Same result each time
- **Self-Validating**: ✅ Clear pass/fail
- **Thorough**: ✅ Tests actual security concern

#### Detailed Grading:
- **Business Value**: ✅ XSS is critical security issue
- **Name**: ✅ Clear and specific
- **Assertions**: ✅ Checks both response and logs
- **Single Responsibility**: ✅ Tests XSS prevention
- **Clean**: ✅ Clear structure
- **No Logic**: ✅ Simple assertions

**Why not perfect A**: Log file reading could be mocked for speed

---

## Test 4: Playwright E2E Test

```typescript
test('should create a simple workflow with drag and drop', async ({ page }) => {
  await expect(page.locator('.node-palette')).toBeVisible()
  await expect(page.locator('.workflow-canvas')).toBeVisible()
  
  const inputNode = page.locator('.palette-node:has-text("Input")')
  await expect(inputNode).toBeVisible()
  
  const canvas = page.locator('.workflow-canvas')
  await inputNode.dragTo(canvas, {
    targetPosition: { x: 300, y: 200 }
  })
  
  await page.waitForTimeout(500)
  
  const createdNode = page.locator('[data-testid^="rf__node-"]').first()
  await expect(createdNode).toBeVisible()
})
```

### Grade: B- (80%)

#### F.I.R.S.T. Analysis:
- **Fast**: ⚠️ Has arbitrary 500ms wait
- **Independent**: ✅ Self-contained
- **Repeatable**: ⚠️ Depends on UI timing
- **Self-Validating**: ✅ Clear assertions
- **Thorough**: ⚠️ Only tests happy path

#### Detailed Grading:
- **Business Value**: ✅ Core user workflow
- **Name**: ✅ Descriptive
- **Assertions**: ✅ Checks visibility and creation
- **Single Responsibility**: ✅ Tests drag-drop workflow
- **Clean**: ✅ Clear steps
- **No Logic**: ✅ Linear flow

**Issues**: 
- `waitForTimeout(500)` is a code smell - should wait for specific condition
- No error case testing

---

## Test 5: Perfect Grade A Example

```python
def test_api_key_sanitization_in_logs(self):
    """Test that API keys are never exposed in application logs."""
    # Arrange
    sensitive_api_key = "sk-abc123def456ghi789"
    log_message = f"Calling OpenAI with key: {sensitive_api_key}"
    
    # Act
    sanitized = sanitize_for_logging(log_message)
    
    # Assert - Specific business requirements
    assert "sk-abc123def456ghi789" not in sanitized
    assert "sk-***" in sanitized
    assert "Calling OpenAI with key:" in sanitized
    
    # Assert - Pattern matching for any API key format
    assert not re.search(r'sk-[a-zA-Z0-9]{48}', sanitized)
    assert re.search(r'sk-\*{3}', sanitized)
```

### Grade: A (100%)

#### F.I.R.S.T. Analysis:
- **Fast**: ✅ Pure function test, instant
- **Independent**: ✅ No external dependencies
- **Repeatable**: ✅ Deterministic
- **Self-Validating**: ✅ Clear assertions
- **Thorough**: ✅ Tests exact requirements and patterns

#### Detailed Grading:
- **Business Value**: ✅ Security is critical
- **Name**: ✅ Perfectly descriptive
- **Assertions**: ✅ Specific and comprehensive
- **Single Responsibility**: ✅ One function, one test
- **Clean**: ✅ Perfect AAA structure
- **No Logic**: ✅ Pure assertions

**Why Grade A**: This test will catch real security issues and runs instantly

---

## Summary of Grades

| Test | Grade | Key Issue |
|------|-------|-----------|
| test_basic_chunking | B+ | Missing edge cases |
| auto-save test | F | Fake test, no value |
| XSS prevention | A- | Minor: reads real log file |
| Playwright drag-drop | B- | Arbitrary waits, no error cases |
| API key sanitization | A | Perfect example |

---

## Key Takeaways

### What Makes an 'A' Grade:
1. **Tests real business value** (security, money, user workflows)
2. **Fast** (milliseconds not seconds)
3. **Specific assertions** (not just "not null")
4. **Tests the edges** (not just happy path)
5. **No test logic** (no if/else in tests)
6. **Clear names** (what + when + expected)
7. **Independent** (order doesn't matter)

### Common Issues Preventing 'A' Grade:
1. **Arbitrary waits** instead of waiting for conditions
2. **Generic assertions** (toBeDefined, not null)
3. **Missing edge cases** (only happy path)
4. **Over-mocking** (testing mocks not code)
5. **Test logic** (if/else, loops in tests)
6. **Poor names** (test1, should work)