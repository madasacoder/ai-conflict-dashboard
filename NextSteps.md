# Next Steps: A Strategic Plan for Frontend Unification

This document outlines the comprehensive, two-phase strategic plan to address the current frontend instability, fix the critical Ollama integration bug, and unify the web and desktop application codebases for long-term stability and maintainability.

---

### Phase 1: Stabilize the Legacy Web Frontend

**Objective:** To refactor the current vanilla JavaScript frontend to be modular, predictable, and free of race conditions. This will provide an immediate, high-quality fix and make the existing web interface maintainable.

*   **Task 1.1: Create a Centralized JavaScript Entry Point**
    *   **Prompt:** We will create a new file, `frontend/js/main.js`, to serve as the single, authoritative entry point for the application's JavaScript. This file will contain an event listener for `DOMContentLoaded` to ensure that no code runs until the entire page is loaded. This immediately solves the core problem of scripts executing in an unpredictable order.

*   **Task 1.2: Refactor `index.html` to Use the New Entry Point**
    *   **Prompt:** We will remove the large, problematic inline `<script>` block from `frontend/index.html`. We will also remove all the individual, scattered `<script>` tags at the bottom of the file. They will be replaced with a single, modern script tag: `<script type="module" src="js/main.js"></script>`. This cleans up the HTML and enforces a strict, predictable loading sequence controlled by our new entry point.

*   **Task 1.3: Modularize Core Logic and State**
    *   **Prompt:** All functions and state variables currently defined in the global scope (e.g., `analyzeText`, `displayResults`, `historyManager`, etc.) will be moved from the inline script into the `DOMContentLoaded` callback in `main.js`. This co-locates all the application logic, prevents global pollution, and makes the code's execution flow easy to follow and debug.

*   **Task 1.4: Convert Ancillary Scripts to ES Modules**
    *   **Prompt:** We will refactor the existing JavaScript files (`config.js`, `ollama-fix.js`, `ollama-diagnostic.js`, etc.) into proper ES modules. Instead of attaching functionality to the global `window` object (e.g., `window.API_CONFIG`), they will `export` their functions and constants. Our new `main.js` will then `import` this functionality, creating a clear and explicit dependency tree.

*   **Task 1.5: Remove Hardcoded URL Fallbacks and Defensively Code**
    *   **Prompt:** With a guaranteed script load order, the defensive fallback code in `ollama-fix.js` and `ollama-diagnostic.js` is no longer necessary and is, in fact, a source of bugs. We will remove the ternary logic that defaults to a hardcoded `http://` URL. The code will be refactored to rely exclusively on the imported `API_CONFIG` object, ensuring it always uses the correct, protocol-aware URL.

---

### Phase 2: Unify the Web and Desktop Codebases

**Objective:** To eliminate the legacy frontend entirely by migrating the web interface to the modern React, Vite, and TypeScript stack already in use by the `desktop-app`. This will create a single, unified codebase that is easier to maintain, test, and develop new features for.

*   **Task 2.1: Develop a Code Sharing and Unification Strategy**
    *   **Prompt:** We will create a new document, `docs/SHARED_CODE_STRATEGY.md`, to outline the plan for unification. This involves analyzing the `desktop-app` and the newly stabilized `frontend` to identify all reusable logic, including UI components (buttons, modals, input forms), state management (`workflowStore.ts`), API services (`workflowExecutor.ts`), and utility functions.

*   **Task 2.2: Set Up a New Vite Application for the Web Interface**
    *   **Prompt:** We will initialize a new, production-grade React + TypeScript project using Vite inside a new `web-app` directory. This will serve as the new home for the web interface and will provide a modern, fast, and reliable development environment with features like Hot Module Replacement (HMR) and optimized builds.

*   **Task 2.3: Systematically Migrate UI Components to React**
    *   **Prompt:** We will begin the process of re-implementing the UI from `frontend/index.html` as a series of modular React components within the new `web-app`. This will be done systematically, one feature at a time (e.g., Model Selection, Input Form, Results Display), allowing us to leverage the shared components identified in the unification strategy.

*   **Task 2.4: Integrate Shared Logic into the New React App**
    *   **Prompt:** We will replace the legacy vanilla JavaScript logic for state management and API calls with the robust solutions already built and tested for the `desktop-app`. The new web app will import and use `workflowStore.ts` and `workflowExecutor.ts`, ensuring that both the web and desktop applications behave identically and share the same core logic.

*   **Task 2.5: Decommission the Legacy Frontend**
    *   **Prompt:** Once the new React-based web app has reached feature parity with the legacy `frontend` and has been thoroughly tested, we will decommission the old codebase. This involves archiving the `frontend` directory, updating all startup scripts (`run_app.sh`, etc.) to point to the new `web-app`, and updating all documentation to reflect the unified architecture. This final step will leave us with a single, modern, and maintainable frontend codebase.
