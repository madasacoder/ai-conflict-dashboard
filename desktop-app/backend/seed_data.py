"""Seed data for AI Conflict Dashboard Desktop.

Provides helpful default workflows and example data to get users started.
Run this after initial database creation.
"""

import json
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from models import Workflow, WorkflowNode, AnalysisHistory, Preference


def create_default_workflows(session: Session) -> None:
    """Create default workflows that showcase the app's capabilities."""
    
    # 1. Code Review Workflow
    code_review = Workflow(
        name="Code Review Assistant",
        description="Get multiple AI perspectives on your code changes",
        icon="👨‍💻",
        tags="code, review, development",
        color="#e74c3c"
    )
    session.add(code_review)
    session.flush()  # Get the ID
    
    # Add nodes for code review
    analyze_node = WorkflowNode(
        workflow_id=code_review.id,
        node_type="llm_analysis",
        position_x=100,
        position_y=100,
        execution_order=1
    )
    analyze_node.set_config({
        "models": ["gpt-4", "claude-3", "gemini-pro"],
        "prompt": "Review this code for bugs, performance issues, and best practices:\n\n{input}",
        "temperature": 0.3
    })
    session.add(analyze_node)
    
    compare_node = WorkflowNode(
        workflow_id=code_review.id,
        node_type="comparison",
        parent_node_id=analyze_node.id,
        position_x=300,
        position_y=100,
        execution_order=2
    )
    compare_node.set_config({
        "comparison_type": "conflicts",
        "highlight_consensus": True
    })
    session.add(compare_node)
    
    # 2. Content Analysis Workflow
    content_analysis = Workflow(
        name="Content Analyzer",
        description="Analyze text for tone, accuracy, and potential issues",
        icon="📝",
        tags="content, analysis, writing",
        color="#3498db"
    )
    session.add(content_analysis)
    session.flush()
    
    tone_node = WorkflowNode(
        workflow_id=content_analysis.id,
        node_type="llm_analysis",
        position_x=100,
        position_y=100,
        execution_order=1
    )
    tone_node.set_config({
        "models": ["gpt-4", "claude-3"],
        "prompt": "Analyze the tone, style, and potential biases in this text:\n\n{input}",
        "temperature": 0.5
    })
    session.add(tone_node)
    
    fact_check_node = WorkflowNode(
        workflow_id=content_analysis.id,
        node_type="llm_analysis",
        position_x=100,
        position_y=250,
        execution_order=2
    )
    fact_check_node.set_config({
        "models": ["gemini-pro", "gpt-4"],
        "prompt": "Fact-check this content and identify any claims that need verification:\n\n{input}",
        "temperature": 0.2
    })
    session.add(fact_check_node)
    
    summary_node = WorkflowNode(
        workflow_id=content_analysis.id,
        node_type="summarize",
        parent_node_id=tone_node.id,
        position_x=300,
        position_y=175,
        execution_order=3
    )
    summary_node.set_config({
        "combine_analyses": True,
        "output_format": "markdown"
    })
    session.add(summary_node)
    
    # 3. Research Assistant Workflow
    research = Workflow(
        name="Research Assistant",
        description="Get comprehensive analysis from multiple AI models",
        icon="🔬",
        tags="research, analysis, comprehensive",
        color="#9b59b6"
    )
    session.add(research)
    session.flush()
    
    research_node = WorkflowNode(
        workflow_id=research.id,
        node_type="llm_analysis",
        position_x=100,
        position_y=100,
        execution_order=1
    )
    research_node.set_config({
        "models": ["gpt-4", "claude-3", "gemini-pro", "grok"],
        "prompt": "Provide a comprehensive analysis of: {input}\n\nInclude multiple perspectives, potential counterarguments, and areas for further research.",
        "temperature": 0.7,
        "max_tokens": 3000
    })
    session.add(research_node)
    
    # 4. Quick Consensus Workflow
    consensus = Workflow(
        name="Quick Consensus",
        description="Get fast consensus from top AI models",
        icon="🤝",
        tags="consensus, quick, simple",
        color="#2ecc71"
    )
    session.add(consensus)
    session.flush()
    
    consensus_node = WorkflowNode(
        workflow_id=consensus.id,
        node_type="llm_analysis",
        position_x=150,
        position_y=150,
        execution_order=1
    )
    consensus_node.set_config({
        "models": ["gpt-4", "claude-3", "gemini-pro"],
        "prompt": "{input}",
        "temperature": 0.5,
        "focus_on_consensus": True
    })
    session.add(consensus_node)


def create_example_analyses(session: Session) -> None:
    """Create example analysis history entries."""
    
    # Get the code review workflow
    code_review = session.query(Workflow).filter_by(name="Code Review Assistant").first()
    
    if code_review:
        # Example code review analysis
        example_analysis = AnalysisHistory(
            workflow_id=code_review.id,
            workflow_name=code_review.name,
            input_text="""def calculate_average(numbers):
    total = 0
    for n in numbers:
        total += n
    return total / len(numbers)""",
            execution_time_ms=2340,
            starred=True,
            notes="Initial review of the averaging function",
            tags="python, functions"
        )
        
        example_analysis.set_results({
            "gpt-4": {
                "response": "The function has a potential division by zero error when the list is empty. Consider adding a check:\n\n```python\nif not numbers:\n    return 0  # or raise ValueError('Cannot calculate average of empty list')\n```",
                "model": "gpt-4"
            },
            "claude-3": {
                "response": "Good basic implementation. Suggestions:\n1. Add type hints: `def calculate_average(numbers: list[float]) -> float:`\n2. Handle empty list case\n3. Consider using `sum()` built-in: `return sum(numbers) / len(numbers)`",
                "model": "claude-3-opus"
            },
            "gemini-pro": {
                "response": "The function works but could be improved:\n- Use Python's built-in `sum()` function\n- Add error handling for empty lists\n- Consider using `statistics.mean()` for more robust handling",
                "model": "gemini-pro"
            }
        })
        
        example_analysis.consensus = "All models agree: Handle empty list case and consider using built-in functions."
        example_analysis.set_conflicts([
            {
                "topic": "Error handling approach",
                "models": {
                    "gpt-4": "Return 0 or raise ValueError",
                    "gemini-pro": "Use statistics.mean() which handles edge cases"
                }
            }
        ])
        
        session.add(example_analysis)
        code_review.increment_execution()


def create_default_preferences(session: Session) -> None:
    """Ensure all default preferences exist."""
    defaults = {
        'theme': 'dark',
        'auto_save': 'true',
        'analysis_timeout_seconds': '30',
        'max_tokens_per_model': '2000',
        'enable_telemetry': 'false',
        'backup_enabled': 'true',
        'backup_retention_days': '7',
        'default_temperature': '0.5',
        'show_raw_responses': 'false',
        'auto_detect_conflicts': 'true',
        'workflow_auto_save': 'true',
        'recent_items_limit': '10'
    }
    
    for key, value in defaults.items():
        Preference.set_value(session, key, value)


def seed_database(session: Session) -> None:
    """Main function to seed the database with initial data."""
    # Check if we already have data
    existing_workflows = session.query(Workflow).count()
    if existing_workflows > 0:
        print("Database already contains data. Skipping seed.")
        return
    
    print("Seeding database with default data...")
    
    # Create workflows
    create_default_workflows(session)
    print("✅ Created default workflows")
    
    # Create example analyses
    create_example_analyses(session)
    print("✅ Created example analyses")
    
    # Create preferences
    create_default_preferences(session)
    print("✅ Created default preferences")
    
    session.commit()
    print("✅ Database seeding complete!")


if __name__ == "__main__":
    # For testing
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from models import Base
    
    engine = create_engine('sqlite:///data/app.db')
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        seed_database(session)
    finally:
        session.close()