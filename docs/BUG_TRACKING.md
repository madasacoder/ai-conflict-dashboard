# Bug Tracking Guide

This document describes how we track and manage bugs for the AI Conflict Dashboard project.

## Bug Tracking System

We use **GitHub Issues** as our bug database. It's free, integrated with our code, and provides excellent tracking capabilities.

## How to Report a Bug

1. Go to: https://github.com/madasacoder/ai-conflict-dashboard/issues
2. Click "New Issue"
3. Select "Bug Report" template
4. Fill in all sections
5. Submit

## Bug Report Requirements

### Must Include:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, browser, versions)
- Relevant logs (use our logging system!)
- Request ID if available

### Nice to Have:
- Screenshots or screen recordings
- Suggested fixes
- Related issues

## Bug Workflow

### 1. Triage (Labels)
- `bug` - Confirmed bug
- `needs-triage` - Needs investigation
- `cannot-reproduce` - Need more info
- `duplicate` - Already reported

### 2. Priority Labels
- `P0-critical` - Breaks core functionality
- `P1-high` - Major feature broken
- `P2-medium` - Minor feature issue  
- `P3-low` - Cosmetic or edge case

### 3. Phase Labels
- `phase-0` - Core MVP bugs
- `phase-0.1` - Current phase bugs
- `phase-1` - Future phase bugs

### 4. Status Labels
- `in-progress` - Being worked on
- `blocked` - Waiting on something
- `ready-for-test` - Fix implemented
- `verified` - Fix confirmed

## Bug Lifecycle

```
New Issue → Triage → Assigned → In Progress → Fixed → Verified → Closed
```

## Using Logs for Bug Reports

Our logging system makes bug tracking easier:

### Frontend Logs
```javascript
// Get logs for bug report
JSON.stringify(JSON.parse(localStorage.getItem('appLogs')), null, 2)
```

### Backend Logs
```bash
# Get recent errors
grep ERROR backend.log | tail -20

# Get specific request
grep "request-id-here" backend.log
```

## Creating Bug Reports from Code

When you encounter a bug while developing:

```javascript
// Frontend
logger.error('Bug encountered', {
    bugDescription: 'What went wrong',
    expectedBehavior: 'What should happen',
    actualBehavior: 'What actually happened',
    steps: ['Step 1', 'Step 2'],
    // This creates a trackable log entry
});

// Then create GitHub issue with log data
```

```python
# Backend
logger.error("Bug encountered", extra={
    "bug_description": "What went wrong",
    "request_id": request_id,
    "error_type": type(e).__name__,
    "stack_trace": traceback.format_exc()
})
```

## Quick Bug Creation

### From Terminal
```bash
# Using GitHub CLI
gh issue create --title "[BUG] Brief description" --label "bug,needs-triage"

# List recent bugs
gh issue list --label bug

# View specific bug
gh issue view 123
```

### Bug Report Template
```markdown
## Bug: [Brief Description]

**Request ID**: xxx-xxx-xxx
**Time**: 2024-01-15 10:30:45
**Phase**: 0.1

### Steps:
1. Did this
2. Then this
3. Bug happened

### Logs:
[paste relevant logs]

### Environment:
- Browser: Chrome 120
- OS: macOS 14
```

## Common Bug Categories

### 1. API Issues
- Rate limiting (429 errors)
- Authentication failures (401)
- Timeout issues
- CORS problems

### 2. UI Issues
- Layout problems
- Responsive design
- Dark mode issues
- Loading states

### 3. Data Issues
- Response parsing
- Character encoding
- Large text handling
- History corruption

### 4. Integration Issues
- Model API changes
- Version incompatibilities
- Network issues

## Debugging Workflow

1. **Reproduce** - Can you make it happen again?
2. **Isolate** - Which component is failing?
3. **Log Analysis** - Check request IDs in both frontend/backend
4. **Fix** - Implement solution
5. **Verify** - Test the fix
6. **Document** - Update issue with resolution

## Metrics to Track

- **Bug Discovery Rate**: New bugs per week
- **Resolution Time**: Time from report to fix
- **Bug Categories**: Which types are most common
- **Regression Rate**: Bugs that come back

## Integration with Development

### Pre-commit Check
```bash
# Check for known issues before committing
gh issue list --label "P0-critical" --state open
```

### In Code Comments
```javascript
// TODO: Fix bug #123 - Response timeout on large texts
// BUG: Issue #456 - Dark mode colors incorrect
// FIXME: Issue #789 - Memory leak in history
```

## Best Practices

1. **One Bug = One Issue** - Don't combine multiple bugs
2. **Search First** - Check if already reported
3. **Be Specific** - Vague reports can't be fixed
4. **Include Logs** - Our logging system is there for a reason
5. **Follow Up** - Respond to questions quickly
6. **Close Loops** - Verify fixes and close issues

## Monthly Bug Review

Every month:
1. Review all open bugs
2. Re-prioritize based on impact
3. Close outdated issues
4. Identify patterns
5. Update this document

## Remember

- **No bug is too small** - Cosmetic issues matter too
- **Details save time** - Better reports = faster fixes
- **Logs are gold** - Always include relevant logs
- **Users find bugs** - External reports are valuable