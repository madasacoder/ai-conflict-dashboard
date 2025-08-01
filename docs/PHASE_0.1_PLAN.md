# Phase 0.1 Plan - Immediate Enhancements

Based on real Phase 0 usage, these are small but high-impact improvements that address immediate pain points without overengineering.

## 🎯 Priority Features (In Order)

### 1. Enhanced Comparison & Evaluation
**Why**: Core value - need to easily spot differences and consensus
- [ ] Diff highlighting algorithm (like GitHub)
- [ ] Consensus indicator (✅ when models agree)
- [ ] Conflict indicator (⚠️ when they disagree) 
- [ ] Side-by-side line numbered view
- [ ] Similarity percentage score
- [ ] Toggle: "Show all" vs "Show only differences"
- [ ] Highlight specific types: facts vs opinions vs code

### 2. Response History
**Why**: Reference previous comparisons, track AI behavior over time
- [ ] Local storage of last 50 comparisons
- [ ] Searchable history by date/content
- [ ] Quick re-run previous prompts
- [ ] Export history as JSON/markdown
- [ ] Clear history option
- [ ] Favorite/star important comparisons

### 3. File Upload
**Why**: Real documents are longer than 4000 chars
- [ ] Drag-and-drop file zone
- [ ] Support: .txt, .md, .py, .js, .json, .yaml, .csv
- [ ] File preview before sending
- [ ] Progress bar for large files
- [ ] Chunk large files automatically
- [ ] Remember last 10 uploaded files

### 4. Better UI/UX
**Why**: Current UI is functional but basic
- [ ] Resizable panes
- [ ] Dark mode
- [ ] Syntax highlighting for code
- [ ] Copy button for each response
- [ ] Full-screen mode
- [ ] Keyboard shortcuts (Cmd+Enter to analyze)

## 📋 Implementation Order

### Week 1: Comparison Engine
```javascript
// Core diff algorithm
function compareResponses(response1, response2) {
  // Line-by-line comparison
  // Highlight differences
  // Calculate consensus score
  // Mark conflicts
}
```

### Week 2: History & Persistence
```javascript
// History management
const history = {
  save: (prompt, responses, comparison) => localStorage,
  search: (query) => filteredResults,
  export: (format) => downloadFile
}
```

### Week 3: File Upload & UI Polish
- Implement file handling
- Enhance UI components
- Add keyboard shortcuts

## 🚫 Still NOT Doing in Phase 1
- User accounts
- Backend database
- Deployment
- Multiple users
- API authentication
- Advanced analytics

## 📊 Success Metrics
- Can compare responses 5x faster
- Can reference past comparisons
- Can analyze real documents (not just snippets)
- UI doesn't get in the way

## 💡 Technical Approach

### Comparison Algorithm Options
1. **Simple**: String diff (word by word)
2. **Better**: Sentence-level comparison
3. **Best**: Semantic similarity + visual diff

### Storage Strategy
- Use IndexedDB for history (better than localStorage for large data)
- Keep metadata in localStorage for quick access
- Maximum 50MB storage (about 1000 comparisons)

### File Upload Limits
- Phase 1: 100KB max file size
- Split into chunks of 3000 chars each
- Process chunks sequentially

## 🔄 Migration Path
- Phase 0 users just refresh the page
- History starts empty (no migration needed)
- API keys remain in localStorage

## ✅ Phase 1 Completion Checklist
- [ ] Can see exactly where AI responses differ
- [ ] Can access my last 50 comparisons
- [ ] Can upload and analyze full documents
- [ ] UI is pleasant to use daily
- [ ] Still loads in <2 seconds

## 🚀 Next Steps
1. Validate this plan with 1 week more of Phase 0 usage
2. Confirm these are the actual pain points
3. Start with comparison engine (highest value)
4. Ship incrementally (don't wait for all features)

---

Remember: Only build what's validated through real usage!