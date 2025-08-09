# Drag-Drop Testing Solution for React Flow + Playwright

## Problem Statement
Playwright's native `dragTo()` method doesn't work with React Flow because React Flow requires specific DataTransfer properties that Playwright doesn't set correctly.

## Solution Overview
We implemented a custom drag-drop solution using browser-context event dispatching with proper DataTransfer setup.

## Implementation Details

### 1. Custom Drag-Drop Helper (`helpers/dragDrop.ts`)
```typescript
export async function dragNodeToCanvas(
  page: Page,
  nodeType: string,
  position: { x: number, y: number }
) {
  return page.evaluate(({ nodeLabel, nodeType, targetX, targetY }) => {
    // Create DataTransfer with React Flow requirements
    const dataTransfer = new DataTransfer()
    dataTransfer.setData('application/reactflow', nodeType)
    dataTransfer.effectAllowed = 'copy'
    
    // Dispatch proper event sequence
    // dragstart → dragover → drop → dragend
  })
}
```

### 2. Key Fixes Applied

#### Canvas Visibility
- **Problem**: Canvas had 0 height due to missing CSS
- **Solution**: Added `height: 100%` to workflow-builder-inner

#### Selector Conflicts
- **Problem**: Duplicate `.workflow-builder` classes caused strict mode violations
- **Solution**: Renamed inner class to `.workflow-builder-inner`

#### Config Panel Auto-Opening
- **Problem**: Config panel wasn't opening when nodes were created
- **Solution**: 
  - Fixed nodeId prop: `<ConfigPanel nodeId={selectedNode.id} />`
  - Simplified state management in workflowStore

#### Node Selection State
- **Problem**: Race conditions in selection state updates
- **Solution**: Removed timeout-based updates, use synchronous state changes

#### Validation Error Detection
- **Problem**: Tests looked for wrong toast library (react-toastify)
- **Solution**: Updated to use react-hot-toast selectors: `[aria-live="polite"]`

## Test Coverage Achieved

### ✅ All 9 Tests Passing (100%)
1. **Drag and drop an Input node** - Creates single node
2. **Drag and drop multiple nodes** - Creates 3 different nodes
3. **Create nodes at different positions** - Tests position accuracy
4. **Select newly created node** - Verifies selection state
5. **Open config panel when node is created** - Auto-opening verified
6. **Handle different node types** - Tests all 4 node types
7. **Maintain node selection state** - Only one selected at a time
8. **Show validation error for empty workflow** - Shows 3 distinct errors
9. **Allow execution with valid workflow** - Execute button works

## Quality Standards Applied

### Strict Assertions (No Shortcuts)
- ❌ **REMOVED**: `expect(isEventuallyVisible || true).toBe(true)` 
- ✅ **REPLACED WITH**: Actual visibility checks

### Proper Error Validation
- ❌ **REMOVED**: Calculating but not asserting `hasToast`
- ✅ **REPLACED WITH**: Verifying all 3 validation messages appear

### Specific State Testing
- ❌ **REMOVED**: "At least one node selected" weak assertion
- ✅ **REPLACED WITH**: Verify SECOND node is specifically selected

## Running the Tests

```bash
# Ensure dev server is running on port 3001
npm run dev

# Run drag-drop tests
npx playwright test drag-drop-working.spec.ts

# Expected output:
# 9 passed (2.1s)
```

## Key Learnings

1. **React Flow Requirements**: Must set `application/reactflow` in DataTransfer
2. **Event Sequence Matters**: dragstart → dragover → drop → dragend
3. **Strict Mode Benefits**: Reveals selector ambiguities and forces better test quality
4. **Real Assertions**: Never use `|| true` or similar shortcuts in tests
5. **Library Awareness**: Know which toast/UI library is actually in use

## Future Improvements

1. Add edge connection tests (node-to-node connections)
2. Test drag-drop with zoom/pan transformations
3. Add performance tests for large workflows
4. Test undo/redo with drag-drop operations

## References
- [React Flow Drag & Drop Docs](https://reactflow.dev/docs/examples/interaction/drag-and-drop/)
- [Playwright Custom Events](https://playwright.dev/docs/evaluating)
- [DataTransfer API](https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer)