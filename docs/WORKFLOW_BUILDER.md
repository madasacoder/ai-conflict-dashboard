# Workflow Builder Documentation

The AI Conflict Dashboard includes a powerful visual workflow builder that allows you to create complex AI processing pipelines using a drag-and-drop interface.

## Features

### Visual Node-Based Interface
- **Drag-and-drop nodes** from the palette to create workflows
- **Connect nodes** to define data flow
- **Real-time configuration** with live updates
- **Visual execution feedback** showing success/error states
- **Output previews** directly on nodes

### Node Types

#### 📥 Input Node
- **Text Input**: Direct text entry
- **File Upload**: Upload documents for processing
- **URL Input**: Fetch content from web URLs

#### 🧠 LLM Processor Node
- **Multi-model support**: GPT-4, Claude, Gemini, Grok, and Ollama
- **Custom prompts**: Define exactly how to process input
- **Temperature control**: Adjust creativity/determinism
- **Local model support**: Use Ollama for privacy-focused processing

#### 🔄 Compare Node
- **Find conflicts**: Identify disagreements between AI responses
- **Find consensus**: Discover common ground
- **Show all differences**: Complete comparison analysis

#### 📄 Summarize Node
- **Multiple lengths**: Short, medium, or detailed summaries
- **Style options**: Paragraph or bullet points

#### 📤 Output Node
- **Multiple formats**: Markdown, JSON, or plain text
- **Metadata inclusion**: Optional timestamps and statistics

## Getting Started

1. **Access the Workflow Builder**
   - Click "Workflow Builder" from the main dashboard
   - Or navigate directly to `/workflow-builder.html`

2. **Create Your First Workflow**
   - Drag an Input node from the palette
   - Add an LLM processor node
   - Connect them (click node outputs/inputs)
   - Configure each node by clicking on it
   - Click "Run" to execute

3. **View Results**
   - Results appear in a modal dialog
   - Successful nodes show green borders
   - Failed nodes show red borders
   - LLM outputs preview directly on nodes

## Example Workflows

### Translation Pipeline
```
Input (English text) → LLM (Translate to Chinese) → LLM (Translate to French) → Output
```

### Multi-Model Comparison
```
Input → LLM (GPT-4) ↘
                      → Compare → Output
Input → LLM (Claude) ↗
```

### Content Analysis
```
Input (Article) → LLM (Summarize) → LLM (Extract key points) → Output
```

## Technical Details

### Workflow Execution
- Workflows execute with topological sorting
- Parallel processing where possible
- Automatic error handling and recovery
- Results cached per node

### Data Format
Workflows are stored as JSON with:
- **Nodes**: Array of node definitions with positions and data
- **Edges**: Connections between nodes

### API Integration
- Uses the same backend API as the main dashboard
- Supports all authentication methods
- Respects rate limits and quotas

## Current Limitations

1. **Connection Creation**: Currently requires programmatic connection (drag-drop being improved)
2. **Visual Feedback**: Connection lines don't always show during creation
3. **Complex Workflows**: Large workflows may need manual positioning

## Troubleshooting

### Nodes Not Connecting
- Ensure output/input compatibility
- Try using the programmatic connection method
- Check browser console for errors

### Execution Not Working
- Verify backend is running on port 8000
- Check API keys are configured
- Look for errors in the results modal

### No Output Display
- Results now show in a modal (fixed in latest version)
- Check node configuration for proper prompts
- Ensure at least one model is selected in LLM nodes

## Future Enhancements

- Improved drag-and-drop connection creation
- Save/load workflow templates
- Conditional branching nodes
- Batch processing support
- Real-time streaming outputs
- Collaborative workflow editing

## Bug Reports

Found issues are tracked in [E2E_BUGS_FOUND.md](../frontend/docs/E2E_BUGS_FOUND.md). Current stats:
- **Total Bugs Found**: 20
- **Fixed**: 19
- **Pending**: 1

Please report new issues via GitHub Issues with:
- Browser and version
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable