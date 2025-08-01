
# 📗 Claude Project Instructions - AI Conflict Dashboard

This document defines explicit rules and instructions for AI coding assistants (Claude, Cursor) when contributing to the AI Conflict Dashboard.

---

## 🚀 Project Philosophy
The AI Conflict Dashboard transparently orchestrates multiple AI models, providing clear insights, consensus, and explicit conflict resolution, enabling informed editing decisions.

---

## ⚠️ Critical Rules (Must Follow)

### 1. No Duplicate or Temporary Files
- ❌ No file names with `_backup`, `_old`, numbered versions (`component_v2.tsx`, `api_fixed.py`)
- ✅ Modify existing files directly and use git for version control.

### 2. Temporary Files Handling
- Temporary files must be stored in `temporary_files/`.

### 3. Planning & Approval Required
1. Analyze clearly impacted files.
2. Plan your changes explicitly.
3. Confirm with project lead approval.
4. Implement only after explicit approval.

### 4. Strict Testing Policies
- Fix root causes, not tests.
- Add regression tests for bug fixes.
- Never skip or weaken tests.

---

## 💻 Technical Guidelines

### Frontend (React + TypeScript)
- Use functional components, TailwindCSS, Jest, Axios.
- Comprehensive component-level tests (minimum 85% coverage).

### Backend (FastAPI Python 3.11+)
- Modern type hints (`str | None`, `list[str]`).
- Use PyBreaker, structured logging (`structlog`), pytest for testing (minimum 90% coverage).
- Security validation for all inputs.

---

## 📐 Project File Structure
```
ai-conflict-dashboard/
├── docs/
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/
│       └── api/
├── backend/
│   ├── api/
│   ├── core/
│   └── plugins/
├── assets/
└── temporary_files/
```

---

## 🧪 Testing Standards
- Frontend: Jest and React Testing Library
- Backend: pytest (unit, integration, regression)
- Ensure comprehensive security checks and validations.

---

## 🔒 Security Standards
- Validate all inputs explicitly.
- No dynamic execution (`eval`, `exec`).
- SQL query whitelisting.
- Regular security scans with Bandit.

---

## 📖 Documentation Standards
- Google-style docstrings for Python.
- Inline documentation/comments.
- Markdown documents for architecture and technical details.

---

## 🚩 Git Workflow
- Atomic, descriptive commits.
- Explicit review and approval before merging.

---

## 🤖 AI Coding Assistance Workflow

### AI Prompt Template Example:
```
Generate a FastAPI endpoint that:
- Uses Python 3.11+ syntax.
- Detailed Google-style docstrings.
- Implements explicit security validation.
- Structured logging with structlog.
- Comprehensive pytest coverage.
```

### AI Code Checklist:
- ✅ Modern type hints.
- ✅ Security validation.
- ✅ Structured logging.
- ✅ Full pytest/Jest coverage.

---

## 🚫 Common Pitfalls to Avoid
- Creating duplicate/temporary files.
- Weakening or skipping tests.
- Ignoring explicit input validation.

---

## 📌 Quick Reference for Developers

| Area             | Tools and Standards                             |
|------------------|-------------------------------------------------|
| Frontend         | React, TypeScript, Jest, TailwindCSS, Axios     |
| Backend          | FastAPI, Python 3.11+, pytest, PyBreaker        |
| Security         | Bandit, explicit validation                     |
| Code Quality     | Black, Ruff, ESLint, Prettier                   |
| Documentation    | Google-style docstrings, clear inline comments  |
| CI/CD            | GitHub Actions                                  |

---

This document ensures that the AI Conflict Dashboard remains secure, maintainable, and aligned with the project's standards.

Happy coding! 🚀
