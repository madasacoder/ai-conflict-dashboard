# Contributing to AI Conflict Dashboard

Thank you for your interest in contributing to the AI Conflict Dashboard! This guide will help you get started with our contribution process and quality standards.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Quality Standards](#quality-standards)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)

## Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. Please read and follow our code of conduct:

- **Be respectful** and considerate in all interactions
- **Be collaborative** and help others learn and grow
- **Be professional** in all communications
- **Be patient** with new contributors and questions
- **Be constructive** when giving feedback

## Getting Started

### Prerequisites

Before contributing, ensure you have:
- Read the [README.md](README.md) for project overview
- Completed the [Development Setup](docs/DEVELOPMENT_SETUP.md)
- Reviewed the [Toolchain Documentation](TOOLCHAIN.md)
- Read the [AI Coding Guidelines](CLAUDE.md)

### Fork and Clone

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/yourusername/ai-conflict-dashboard.git
   cd ai-conflict-dashboard
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/original/ai-conflict-dashboard.git
   ```

### Setup Development Environment

```bash
# Complete setup
make install

# Verify toolchain
make quality
```

## Development Process

### 1. Create Feature Branch

```bash
# Update main branch
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name
# OR
git checkout -b fix/issue-number-description
```

### 2. Development Workflow

```bash
# Make changes
vim src/file.py

# Test frequently
make lint test

# Before committing
make quality
```

### 3. Commit Guidelines

#### Commit Message Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Types
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

#### Examples
```bash
git commit -m "feat(backend): add Ollama model support"
git commit -m "fix(frontend): resolve XSS vulnerability in workflow builder"
git commit -m "docs(toolchain): update pre-commit hook documentation"
```

### 4. Quality Requirements

All contributions must pass these checks:

#### Automated Checks (Pre-commit Hooks)
- ✅ Code formatting (Black, Prettier, rustfmt)
- ✅ Linting (Ruff, ESLint, Clippy)
- ✅ Security scanning (Bandit, npm audit)
- ✅ Type checking (MyPy where applicable)

#### Manual Verification
```bash
# Run all quality checks
make quality

# Expected output:
# ✅ All linting checks passed
# ✅ All formatting checks passed
# ✅ All tests passed
# ✅ All security checks passed
```

## Quality Standards

### Code Quality Requirements

#### Python Backend
- **Type Hints**: All functions must have type annotations
- **Documentation**: Google-style docstrings required
- **Testing**: 90%+ test coverage required
- **Security**: Zero Bandit security issues
- **Modern Syntax**: Use Python 3.11+ features (`str | None`, `list[str]`)

```python
def process_data(data: list[str], config: dict[str, str] | None = None) -> str:
    """Process data according to configuration.
    
    Args:
        data: List of strings to process
        config: Optional configuration dictionary
        
    Returns:
        Processed data as string
        
    Raises:
        ValueError: If data is empty
    """
    if not data:
        raise ValueError("Data cannot be empty")
    
    logger.info("Processing data", count=len(data))
    return " ".join(data)
```

#### JavaScript Frontend
- **ESLint**: Zero errors (warnings acceptable)
- **Security**: No XSS vulnerabilities, use DOMPurify
- **Testing**: 85%+ coverage target
- **Modern JS**: Use ES6+ features, avoid `var`
- **Logging**: Use structured logging, no `console.log`

```javascript
// ✅ Good
const processUserInput = (input) => {
  const sanitized = DOMPurify.sanitize(input);
  logger.info('user_input_processed', { length: input.length });
  return sanitized;
};

// ❌ Bad
function processUserInput(input) {
  console.log('Processing:', input);  // Use logger instead
  element.innerHTML = input;          // XSS vulnerability
  return input;
}
```

#### Rust Desktop App
- **Clippy**: Zero warnings with `-D warnings`
- **Formatting**: Use rustfmt with project config
- **Documentation**: Document public functions
- **Error Handling**: Use `Result<T, E>` for fallible operations

```rust
/// Process user configuration
pub fn process_config(config: &Config) -> Result<ProcessedConfig, ConfigError> {
    if config.is_empty() {
        return Err(ConfigError::Empty);
    }
    
    // Process configuration
    Ok(ProcessedConfig::new(config))
}
```

### Security Requirements

#### Critical Security Rules
1. **No hardcoded secrets** in code
2. **Sanitize all user inputs** (XSS prevention)
3. **Validate all API inputs** (injection prevention)
4. **Use secure dependencies** (no known vulnerabilities)
5. **Follow OWASP guidelines** for web security

#### Security Checklist
- [ ] All user inputs sanitized with DOMPurify
- [ ] No `eval()` or `exec()` usage
- [ ] API keys stored in environment variables
- [ ] Input validation on all endpoints
- [ ] CORS properly configured
- [ ] Dependencies regularly updated

### Testing Requirements

#### Test Categories
1. **Unit Tests**: Test individual functions/methods
2. **Integration Tests**: Test component interactions
3. **Security Tests**: Test security measures
4. **E2E Tests**: Test complete user workflows

#### Coverage Requirements
| Component | Coverage | Tool |
|-----------|----------|------|
| Backend | 90%+ | pytest-cov |
| Frontend | 85%+ | Vitest |
| Desktop | 80%+ | cargo test |

#### Test Examples

**Python Unit Test**
```python
def test_process_data_success():
    """Test successful data processing."""
    data = ["hello", "world"]
    result = process_data(data)
    assert result == "hello world"

def test_process_data_empty_raises():
    """Test that empty data raises ValueError."""
    with pytest.raises(ValueError, match="Data cannot be empty"):
        process_data([])
```

**JavaScript Unit Test**
```javascript
import { describe, it, expect } from 'vitest';
import { processUserInput } from './utils.js';

describe('processUserInput', () => {
  it('should sanitize XSS attempts', () => {
    const maliciousInput = '<script>alert("xss")</script>';
    const result = processUserInput(maliciousInput);
    expect(result).not.toContain('<script>');
  });
});
```

## Pull Request Process

### 1. Pre-submission Checklist

Before submitting a PR, ensure:
- [ ] All quality checks pass (`make quality`)
- [ ] Tests are added for new functionality
- [ ] Documentation is updated
- [ ] Security implications considered
- [ ] Breaking changes documented

### 2. Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Security
- [ ] No new security vulnerabilities
- [ ] Security best practices followed
- [ ] Sensitive data properly handled

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
```

### 3. Review Process

1. **Automated Checks**: CI/CD pipeline runs quality checks
2. **Security Review**: Automated security scanning
3. **Code Review**: Manual review by maintainers
4. **Testing**: Reviewer tests functionality
5. **Approval**: Maintainer approval required

### 4. Merge Requirements

- ✅ All CI checks pass
- ✅ At least one maintainer approval
- ✅ No merge conflicts
- ✅ Up-to-date with main branch

## Issue Guidelines

### Bug Reports

Use the bug report template:
```markdown
**Describe the bug**
A clear description of the bug

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. See error

**Expected behavior**
What you expected to happen

**Environment:**
- OS: [e.g. macOS]
- Browser: [e.g. Chrome]
- Version: [e.g. 1.0.0]

**Additional context**
Add any other context about the problem here.
```

### Feature Requests

Use the feature request template:
```markdown
**Is your feature request related to a problem?**
A clear description of the problem

**Describe the solution you'd like**
A clear description of what you want to happen

**Describe alternatives you've considered**
Other solutions you've considered

**Additional context**
Add any other context or screenshots about the feature request here.
```

### Security Issues

For security vulnerabilities:
1. **Do NOT** create a public issue
2. **Email** maintainers directly
3. **Include** detailed reproduction steps
4. **Wait** for confirmation before disclosure

## Recognition

Contributors are recognized in:
- README.md contributors section
- Release notes for significant contributions
- GitHub contributor graphs
- Special recognition for security fixes

## Questions and Support

- **Documentation**: Check [docs/](docs/) directory
- **Issues**: Search existing issues first
- **Discussions**: Use GitHub Discussions for questions
- **Discord**: Join our community Discord (link in README)

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (see [LICENSE](LICENSE) file).

---

Thank you for contributing to make AI Conflict Dashboard better! 🎉