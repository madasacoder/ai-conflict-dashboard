"""Tests for database operations.

Ensures all database operations complete in < 100ms as required.
"""

import pytest
import time
from pathlib import Path
import tempfile
import shutil

from db_utils import DatabaseManager
from models import Workflow, WorkflowNode, AnalysisHistory, Preference
from seed_data import seed_database


@pytest.fixture
def temp_db():
    """Create a temporary database for testing."""
    temp_dir = tempfile.mkdtemp()
    db_path = Path(temp_dir) / "test.db"
    backup_dir = Path(temp_dir) / "backups"
    
    db = DatabaseManager(str(db_path), str(backup_dir))
    db.initialize()
    
    yield db
    
    # Cleanup
    shutil.rmtree(temp_dir)


def test_database_initialization(temp_db):
    """Test database initialization is fast."""
    start = time.time()
    temp_db.initialize()  # Should be idempotent
    duration = time.time() - start
    
    assert duration < 0.1  # Must be < 100ms
    
    # Check tables exist
    with temp_db.session() as session:
        # Should have default workflows from seed data
        workflows = session.query(Workflow).count()
        assert workflows > 0


def test_workflow_operations(temp_db):
    """Test workflow CRUD operations are fast."""
    with temp_db.session() as session:
        # Create
        start = time.time()
        workflow = Workflow(
            name="Test Workflow",
            description="Test Description",
            icon="🧪",
            tags="test, automated"
        )
        session.add(workflow)
        session.commit()
        duration = time.time() - start
        assert duration < 0.1
        
        # Read
        start = time.time()
        found = session.query(Workflow).filter_by(name="Test Workflow").first()
        duration = time.time() - start
        assert duration < 0.1
        assert found is not None
        assert found.icon == "🧪"
        
        # Update
        start = time.time()
        found.increment_execution()
        session.commit()
        duration = time.time() - start
        assert duration < 0.1
        assert found.execution_count == 1


def test_analysis_history(temp_db):
    """Test analysis history operations."""
    with temp_db.session() as session:
        # Create analysis
        start = time.time()
        analysis = AnalysisHistory(
            input_text="Test input",
            workflow_name="Test Workflow"
        )
        analysis.set_results({
            "openai": {"response": "Test response 1"},
            "claude": {"response": "Test response 2"}
        })
        analysis.consensus = "Both models agree on the test"
        analysis.execution_time_ms = 1234
        
        session.add(analysis)
        session.commit()
        duration = time.time() - start
        assert duration < 0.1
        
        # Query recent analyses
        start = time.time()
        recent = session.query(AnalysisHistory).order_by(
            AnalysisHistory.created_at.desc()
        ).limit(10).all()
        duration = time.time() - start
        assert duration < 0.1
        assert len(recent) > 0


def test_preferences(temp_db):
    """Test preference operations."""
    with temp_db.session() as session:
        # Set preference
        start = time.time()
        Preference.set_value(session, "test_key", "test_value")
        session.commit()
        duration = time.time() - start
        assert duration < 0.1
        
        # Get preference
        start = time.time()
        value = session.query(Preference).filter_by(key="test_key").first()
        duration = time.time() - start
        assert duration < 0.1
        assert value.value == "test_value"
        
        # Test helper methods
        assert Preference.get_bool(session, "auto_save", default=False) == True
        assert Preference.get_int(session, "backup_retention_days", default=0) == 7


def test_backup_restore(temp_db):
    """Test backup and restore operations."""
    with temp_db.session() as session:
        # Add some test data
        workflow = Workflow(name="Backup Test", description="Testing backup")
        session.add(workflow)
        session.commit()
    
    # Create backup
    start = time.time()
    backup_file = temp_db.backup("Test backup")
    duration = time.time() - start
    assert duration < 0.5  # Backup can take a bit longer
    assert Path(backup_file).exists()
    
    # List backups
    start = time.time()
    backups = temp_db.list_backups()
    duration = time.time() - start
    assert duration < 0.1
    assert len(backups) > 0
    
    # Get stats
    start = time.time()
    stats = temp_db.get_stats()
    duration = time.time() - start
    assert duration < 0.1
    assert "workflows_count" in stats
    assert stats["backup_count"] > 0


def test_database_performance(temp_db):
    """Test database performance with realistic data."""
    with temp_db.session() as session:
        # Add 100 analyses
        start = time.time()
        for i in range(100):
            analysis = AnalysisHistory(
                input_text=f"Test input {i}",
                workflow_name=f"Workflow {i % 5}"
            )
            analysis.set_results({"model": f"Response {i}"})
            session.add(analysis)
        session.commit()
        duration = time.time() - start
        assert duration < 1.0  # Should handle 100 inserts in < 1 second
        
        # Query with filters
        start = time.time()
        starred = session.query(AnalysisHistory).filter_by(starred=False).limit(20).all()
        duration = time.time() - start
        assert duration < 0.1  # Queries must be fast
        
        # Complex query
        start = time.time()
        recent_starred = session.query(AnalysisHistory).filter(
            AnalysisHistory.starred == False
        ).order_by(
            AnalysisHistory.created_at.desc()
        ).limit(10).all()
        duration = time.time() - start
        assert duration < 0.1


if __name__ == "__main__":
    pytest.main([__file__, "-v"])