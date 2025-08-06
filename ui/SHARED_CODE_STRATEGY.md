# Shared Code Strategy: Unifying Web and Desktop

## 1. Goals and Objectives

The primary goal of this initiative is to unify the `frontend` (legacy web) and `desktop-app` codebases into a single, modern, and maintainable application. This will be achieved by leveraging the existing modern stack of the `desktop-app` (React, Vite, TypeScript) and migrating the legacy web interface to it.

**Key Objectives:**

*   **Single Codebase:** Eliminate code duplication and maintain a single source of truth for all UI components, business logic, and API interactions.
*   **Improved Developer Experience:** Provide a consistent and modern development environment for both web and desktop platforms.
*   **Enhanced Performance and Stability:** Leverage the performance benefits of a modern React stack and the stability of a strongly-typed TypeScript codebase.
*   **Faster Feature Development:** Accelerate feature development by allowing new components and features to be built once and deployed to both platforms simultaneously.
*   **Simplified Maintenance:** Reduce the overhead of maintaining two separate codebases, making bug fixes and updates more efficient.

## 2. Technical Approach

The unification will be based on the following technical stack:

*   **Framework:** React 18+
*   **Build Tool:** Vite
*   **Language:** TypeScript
*   **Styling:** A component-based styling solution (e.g., Styled Components, Emotion, or CSS Modules) to be determined.
*   **State Management:** Zustand, leveraging the existing implementation in the `desktop-app`.
*   **API Layer:** A shared API client using `fetch` with `async/await`, abstracting away the details of HTTP requests.

## 3. Proposed Directory Structure

We will adopt a monorepo-like structure within the existing `ai-conflict-dashboard` repository. The `desktop-app` directory will be renamed to `ui`, signifying that it is the heart of the user interface for all platforms.

```
ai-conflict-dashboard/
├── ui/
│   ├── src/
│   │   ├── components/       # Shared React components
│   │   │   ├── common/       # Buttons, Inputs, Modals, etc.
│   │   │   └── features/     # Feature-specific components
│   │   ├── hooks/            # Shared custom hooks
│   │   ├── services/         # API clients, etc.
│   │   ├── state/            # Zustand state management
│   │   ├── styles/           # Global styles and themes
│   │   ├── types/            # TypeScript types and interfaces
│   │   ├── utils/            # Shared utility functions
│   │   ├── main.tsx          # Web entry point
│   │   └── App.tsx           # Root React component
│   ├── src-tauri/          # Tauri-specific desktop code
│   ├── public/
│   ├── index.html            # Main HTML file for the web app
│   ├── package.json
│   └── vite.config.ts
├── backend/
└── ...
```

The legacy `frontend` directory will be decommissioned and removed once the migration is complete.

## 4. Component Migration Plan

The migration will be performed in a phased approach to minimize disruption and allow for iterative testing.

*   **Phase 1: Foundation (Current)**
    *   Set up the new `ui` directory structure.
    *   Create a basic Vite-powered web application that renders the root `App` component.
    *   Establish the shared styling and themeing solution.

*   **Phase 2: Core Components**
    *   Migrate the most fundamental UI components from the legacy `frontend` to the `ui/components/common` directory. This includes buttons, inputs, dropdowns, etc.
    *   Create Storybook stories for each new component to ensure they are well-documented and testable in isolation.

*   **Phase 3: Feature-by-Feature Migration**
    *   Migrate the application feature by feature, starting with the main analysis interface.
    *   For each feature, create new feature components in `ui/components/features` and integrate them into the main `App` component.

*   **Phase 4: Decommissioning**
    *   Once all features have been migrated, the legacy `frontend` directory will be removed.

## 5. State Management Strategy

We will use the existing Zustand implementation from the `desktop-app` as the single source of truth for application state. The existing `workflowStore` will be enhanced to accommodate any additional state required by the web interface.

## 6. API Layer Consolidation

A new, shared API service will be created in `ui/services/api.ts`. This service will encapsulate all `fetch` calls to the backend and will be used by both web and desktop components. This will ensure that all API interactions are consistent and easy to manage.

## 7. Build and Deployment

*   **Web:** A new CI/CD pipeline will be created to build the web application using `vite build` and deploy the static assets to a suitable hosting provider.
*   **Desktop:** The existing Tauri build process will be adapted to work with the new `ui` directory structure.

This strategy provides a clear path forward for unifying our codebases and creating a more robust and maintainable application. The next step is to begin the implementation of Phase 1 of the migration plan.
