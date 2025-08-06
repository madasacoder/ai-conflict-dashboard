# BDD Specifications for Desktop App Features

## Purpose
These E2E tests are currently failing because features aren't implemented. 
Converting them to BDD specifications creates an actionable development checklist.

---

## Feature: Workflow Creation with Drag and Drop

### Scenario: Create a simple workflow by dragging nodes
```gherkin
Given I am on the workflow builder page
  And the node palette is visible on the left
  And the workflow canvas is visible in the center
When I drag an "Input" node from the palette
  And I drop it on the canvas at position (300, 200)
Then a new Input node should appear on the canvas
  And the node should have a unique ID starting with "rf__node-"
  And the node should be selectable
```

**Implementation Checklist:**
- [ ] Implement `.node-palette` container
- [ ] Add `.palette-node` draggable elements
- [ ] Implement drag event handlers with DataTransfer
- [ ] Add `.workflow-canvas` drop zone
- [ ] Create node on drop with React Flow addNodes()
- [ ] Assign unique IDs with "rf__node-" prefix

---

## Feature: Node Connection

### Scenario: Connect two workflow nodes
```gherkin
Given I have an Input node at position (200, 200)
  And I have an LLM node at position (400, 200)
When I drag from the Input node's output handle
  And I drop on the LLM node's input handle
Then a connection edge should be created
  And the edge should be visible on the canvas
  And the nodes should be linked in the workflow data
```

**Implementation Checklist:**
- [ ] Add output handles to nodes
- [ ] Add input handles to nodes
- [ ] Implement React Flow onConnect handler
- [ ] Validate connection compatibility
- [ ] Store edges in workflow state
- [ ] Render edge paths between nodes

---

## Feature: Workflow Validation

### Scenario: Validate an empty workflow
```gherkin
Given I am on the workflow builder page
  And no nodes have been added to the canvas
When I click the "Execute" button
Then validation should fail
  And an error message should appear: "Workflow must contain at least one node"
  And the error should be displayed in a validation panel
  And the Execute button should remain disabled
```

**Implementation Checklist:**
- [ ] Add Execute button to toolbar
- [ ] Implement workflow validation logic
- [ ] Create validation error UI component
- [ ] Add data-testid="validation-errors" container
- [ ] Display specific error messages
- [ ] Disable execution for invalid workflows

---

## Feature: Workflow Persistence

### Scenario: Save workflow with a custom name
```gherkin
Given I have created a workflow with 2 nodes
When I click the "Workflow" menu button
  And I click "Create New"
  And I enter "My Test Workflow" in the name field
  And I click the "Create" button
Then the workflow should be saved
  And a success message should appear
  And the workflow name should display in the header
  And the workflow should persist in localStorage
```

**Implementation Checklist:**
- [ ] Add Workflow menu dropdown
- [ ] Create workflow name input modal
- [ ] Implement save to localStorage
- [ ] Add success toast notification
- [ ] Display workflow name in UI
- [ ] Add workflow ID generation

---

## Feature: Dark Mode Toggle

### Scenario: Toggle between light and dark themes
```gherkin
Given I am using the application in light mode
When I click the dark mode toggle button
Then the theme should change to dark mode
  And all UI elements should use dark theme colors
  And the preference should be saved to localStorage
When I refresh the page
Then the dark mode should persist
```

**Implementation Checklist:**
- [x] Add theme toggle button (DONE)
- [x] Implement theme switching (DONE)
- [ ] Save preference to localStorage
- [ ] Load preference on startup
- [ ] Apply theme to all components

---

## Feature: API Configuration

### Scenario: Configure API keys for LLM providers
```gherkin
Given I am on the workflow builder page
When I open the Settings panel
  And I navigate to the API Keys section
  And I enter my OpenAI API key
  And I enter my Claude API key
  And I click "Save"
Then the keys should be stored securely in localStorage
  And a success message should appear
  And the LLM nodes should show as "configured"
```

**Implementation Checklist:**
- [ ] Create Settings panel UI
- [ ] Add API key input fields
- [ ] Implement secure localStorage storage
- [ ] Add key validation
- [ ] Update node status indicators
- [ ] Show configuration state in LLM nodes

---

## Feature: Workflow Execution

### Scenario: Execute a complete workflow
```gherkin
Given I have created a workflow with:
  | Node Type | Configuration |
  | Input | Text: "Translate to French" |
  | LLM | Model: GPT-4, Prompt: "{input}" |
  | Output | Format: Markdown |
  And I have configured my API keys
When I click the "Execute" button
Then the workflow should start executing
  And a progress indicator should appear
  And each node should show execution status
  And the LLM node should call the OpenAI API
  And the Output node should display the result
  And the execution time should be shown
```

**Implementation Checklist:**
- [ ] Implement WorkflowExecutor with real API calls
- [ ] Add execution progress UI
- [ ] Show node execution status (pending/running/complete/error)
- [ ] Connect to backend API endpoints
- [ ] Display results in Output nodes
- [ ] Track and display execution metrics

---

## Feature: Error Handling

### Scenario: Handle API errors gracefully
```gherkin
Given I have a workflow with an LLM node
  And my API key is invalid or expired
When I execute the workflow
Then the LLM node should show an error state
  And an error message should display: "API authentication failed"
  And the workflow should stop execution
  And other nodes should show as "cancelled"
  And I should be able to fix the issue and retry
```

**Implementation Checklist:**
- [ ] Implement error boundaries
- [ ] Add node error states
- [ ] Display specific error messages
- [ ] Implement retry mechanism
- [ ] Show error details in logs
- [ ] Allow workflow reset after error

---

## Priority Implementation Order

### Phase 1: Core UI (Enable basic E2E tests)
1. Node palette and drag-drop
2. Workflow canvas and node rendering
3. Basic validation

### Phase 2: Configuration (Enable API tests)
1. Settings panel
2. API key management
3. Model selection

### Phase 3: Execution (Enable workflow tests)
1. Real WorkflowExecutor
2. API integration
3. Result display

### Phase 4: Polish (Enable edge case tests)
1. Error handling
2. Persistence
3. Advanced features

---

## Success Metrics

When all features are implemented:
- 52/52 Playwright E2E tests should pass
- Users can create, configure, and execute workflows
- The desktop app will have feature parity with the web app

---

## Developer Notes

Each BDD specification above maps directly to failing Playwright tests. 
Use this document as a checklist for implementation. 
Mark items as complete when the corresponding E2E test passes.