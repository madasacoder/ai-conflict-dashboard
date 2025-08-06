"""SQLAlchemy models for AI Conflict Dashboard Desktop.

Simple, user-focused models that map to our SQLite schema.
Designed for ease of use and quick queries.
"""

import json
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy import (
    create_engine, Column, String, Text, Integer, Float, 
    Boolean, DateTime, ForeignKey, Index, UniqueConstraint
)
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
from sqlalchemy.sql import func
import uuid

Base = declarative_base()


def generate_uuid() -> str:
    """Generate a lowercase UUID string."""
    return str(uuid.uuid4()).lower()


class Workflow(Base):
    """User-created analysis workflows."""
    __tablename__ = 'workflows'
    
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    description = Column(Text)
    icon = Column(String, default='🔄')
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    execution_count = Column(Integer, default=0)
    last_executed_at = Column(DateTime)
    tags = Column(Text)  # Comma-separated
    color = Column(String, default='#3498db')
    
    # Relationships
    nodes = relationship("WorkflowNode", back_populates="workflow", cascade="all, delete-orphan")
    analyses = relationship("AnalysisHistory", back_populates="workflow")
    
    def get_tags(self) -> List[str]:
        """Get tags as a list."""
        return [tag.strip() for tag in self.tags.split(',')] if self.tags else []
    
    def set_tags(self, tags: List[str]) -> None:
        """Set tags from a list."""
        self.tags = ', '.join(tags) if tags else None
    
    def increment_execution(self) -> None:
        """Increment execution count and update last executed time."""
        self.execution_count += 1
        self.last_executed_at = datetime.utcnow()


class WorkflowNode(Base):
    """Individual nodes/steps in a workflow."""
    __tablename__ = 'workflow_nodes'
    
    id = Column(String, primary_key=True, default=generate_uuid)
    workflow_id = Column(String, ForeignKey('workflows.id'), nullable=False)
    node_type = Column(String, nullable=False)  # 'llm_analysis', 'comparison', etc.
    position_x = Column(Float, default=0)
    position_y = Column(Float, default=0)
    config = Column(Text, nullable=False, default='{}')  # JSON configuration
    parent_node_id = Column(String, ForeignKey('workflow_nodes.id'))
    execution_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    workflow = relationship("Workflow", back_populates="nodes")
    parent_node = relationship("WorkflowNode", remote_side=[id])
    
    def get_config(self) -> Dict[str, Any]:
        """Get configuration as dictionary."""
        return json.loads(self.config) if self.config else {}
    
    def set_config(self, config: Dict[str, Any]) -> None:
        """Set configuration from dictionary."""
        self.config = json.dumps(config)


class AnalysisHistory(Base):
    """History of all analyses performed."""
    __tablename__ = 'analysis_history'
    
    id = Column(String, primary_key=True, default=generate_uuid)
    workflow_id = Column(String, ForeignKey('workflows.id'))
    workflow_name = Column(String)  # Denormalized for quick access
    input_text = Column(Text, nullable=False)
    input_files = Column(Text)  # JSON array
    results = Column(Text, nullable=False)  # JSON
    consensus = Column(Text)
    conflicts = Column(Text)  # JSON
    execution_time_ms = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    starred = Column(Boolean, default=False)
    notes = Column(Text)
    tags = Column(Text)
    
    # Relationships
    workflow = relationship("Workflow", back_populates="analyses")
    
    def get_input_files(self) -> List[str]:
        """Get input files as list."""
        return json.loads(self.input_files) if self.input_files else []
    
    def set_input_files(self, files: List[str]) -> None:
        """Set input files from list."""
        self.input_files = json.dumps(files) if files else None
    
    def get_results(self) -> Dict[str, Any]:
        """Get results as dictionary."""
        return json.loads(self.results) if self.results else {}
    
    def set_results(self, results: Dict[str, Any]) -> None:
        """Set results from dictionary."""
        self.results = json.dumps(results)
    
    def get_conflicts(self) -> List[Dict[str, Any]]:
        """Get conflicts as list."""
        return json.loads(self.conflicts) if self.conflicts else []
    
    def set_conflicts(self, conflicts: List[Dict[str, Any]]) -> None:
        """Set conflicts from list."""
        self.conflicts = json.dumps(conflicts) if conflicts else None


class APIKey(Base):
    """Encrypted API key storage."""
    __tablename__ = 'api_keys'
    
    id = Column(String, primary_key=True, default=generate_uuid)
    provider = Column(String, nullable=False, unique=True)
    encrypted_key = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True)
    last_used_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Preference(Base):
    """User preferences and settings."""
    __tablename__ = 'preferences'
    
    key = Column(String, primary_key=True)
    value = Column(Text, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    @classmethod
    def get_bool(cls, session, key: str, default: bool = False) -> bool:
        """Get a boolean preference."""
        pref = session.query(cls).filter_by(key=key).first()
        if pref:
            return pref.value.lower() in ('true', '1', 'yes', 'on')
        return default
    
    @classmethod
    def get_int(cls, session, key: str, default: int = 0) -> int:
        """Get an integer preference."""
        pref = session.query(cls).filter_by(key=key).first()
        if pref:
            try:
                return int(pref.value)
            except ValueError:
                pass
        return default
    
    @classmethod
    def set_value(cls, session, key: str, value: Any) -> None:
        """Set a preference value."""
        pref = session.query(cls).filter_by(key=key).first()
        if pref:
            pref.value = str(value)
        else:
            session.add(cls(key=key, value=str(value)))


class RecentItem(Base):
    """Recently accessed items for quick access."""
    __tablename__ = 'recent_items'
    
    id = Column(String, primary_key=True, default=generate_uuid)
    item_type = Column(String, nullable=False)  # 'workflow', 'analysis', 'file'
    item_id = Column(String, nullable=False)
    item_name = Column(String, nullable=False)
    accessed_at = Column(DateTime, default=datetime.utcnow)
    access_count = Column(Integer, default=1)
    
    __table_args__ = (
        UniqueConstraint('item_type', 'item_id'),
        Index('idx_recent_items_accessed', 'accessed_at'),
    )
    
    @classmethod
    def record_access(cls, session, item_type: str, item_id: str, item_name: str) -> None:
        """Record access to an item."""
        item = session.query(cls).filter_by(item_type=item_type, item_id=item_id).first()
        if item:
            item.access_count += 1
            item.accessed_at = datetime.utcnow()
            item.item_name = item_name  # Update name in case it changed
        else:
            session.add(cls(
                item_type=item_type,
                item_id=item_id,
                item_name=item_name
            ))


class SchemaVersion(Base):
    """Track database schema version."""
    __tablename__ = 'schema_version'
    
    version = Column(Integer, primary_key=True)
    applied_at = Column(DateTime, default=datetime.utcnow)


# Create indexes as defined in schema.sql
Index('idx_workflows_active', Workflow.is_active, Workflow.updated_at.desc())
Index('idx_workflow_nodes_workflow', WorkflowNode.workflow_id, WorkflowNode.execution_order)
Index('idx_analysis_history_created', AnalysisHistory.created_at.desc())
Index('idx_analysis_history_starred', AnalysisHistory.starred, AnalysisHistory.created_at.desc())