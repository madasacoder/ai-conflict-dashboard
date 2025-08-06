"""Database utilities for AI Conflict Dashboard Desktop.

Provides simple backup/restore functionality and database management.
All operations designed to be < 100ms for instant user experience.
"""

import os
import shutil
import sqlite3
import json
import gzip
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, List, Dict, Any
from contextlib import contextmanager

from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.engine import Engine
from models import Base, SchemaVersion, Preference


class DatabaseManager:
    """Manage the SQLite database with backup/restore capabilities."""
    
    def __init__(self, db_path: str = "data/app.db", backup_dir: str = "data/backups"):
        self.db_path = Path(db_path)
        self.backup_dir = Path(backup_dir)
        self.db_url = f"sqlite:///{self.db_path}"
        
        # Ensure directories exist
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.backup_dir.mkdir(parents=True, exist_ok=True)
        
        # Create engine with optimizations
        self.engine = create_engine(
            self.db_url,
            connect_args={
                'check_same_thread': False,
                'timeout': 5.0,  # 5 second timeout
            },
            pool_pre_ping=True,
            echo=False
        )
        
        # Enable SQLite optimizations
        self._configure_sqlite()
        
        # Create session factory
        self.Session = sessionmaker(bind=self.engine)
    
    def _configure_sqlite(self) -> None:
        """Configure SQLite for optimal performance."""
        @event.listens_for(Engine, "connect")
        def set_sqlite_pragma(dbapi_connection, connection_record):
            cursor = dbapi_connection.cursor()
            # Enable foreign keys
            cursor.execute("PRAGMA foreign_keys=ON")
            # Performance optimizations
            cursor.execute("PRAGMA journal_mode=WAL")  # Write-Ahead Logging
            cursor.execute("PRAGMA synchronous=NORMAL")  # Faster writes
            cursor.execute("PRAGMA cache_size=10000")  # 10MB cache
            cursor.execute("PRAGMA temp_store=MEMORY")  # Use memory for temp tables
            cursor.close()
    
    def initialize(self) -> None:
        """Initialize the database, creating tables if needed."""
        # Create all tables
        Base.metadata.create_all(self.engine)
        
        # Check and update schema version
        with self.session() as session:
            current_version = session.query(SchemaVersion).order_by(
                SchemaVersion.version.desc()
            ).first()
            
            if not current_version:
                # First time setup
                session.add(SchemaVersion(version=1))
                session.commit()
                
                # Seed initial data
                from seed_data import seed_database
                seed_database(session)
    
    @contextmanager
    def session(self) -> Session:
        """Create a database session with automatic cleanup."""
        session = self.Session()
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()
    
    def backup(self, description: str = "") -> str:
        """Create a compressed backup of the database.
        
        Returns the backup file path.
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_name = f"backup_{timestamp}"
        if description:
            # Sanitize description for filename
            safe_desc = "".join(c for c in description if c.isalnum() or c in " -_")[:50]
            backup_name += f"_{safe_desc}"
        
        backup_file = self.backup_dir / f"{backup_name}.db.gz"
        
        # Create backup - simple file copy approach
        with open(self.db_path, 'rb') as source:
            with gzip.open(backup_file, 'wb') as f:
                # Write metadata
                metadata = {
                    "timestamp": timestamp,
                    "description": description,
                    "version": self._get_schema_version(),
                    "size": self.db_path.stat().st_size
                }
                f.write(json.dumps(metadata).encode() + b'\n')
                
                # Copy the database file
                f.write(source.read())
        
        # Clean old backups based on retention policy
        self._clean_old_backups()
        
        return str(backup_file)
    
    def restore(self, backup_file: str) -> None:
        """Restore database from a backup file."""
        backup_path = Path(backup_file)
        if not backup_path.exists():
            raise FileNotFoundError(f"Backup file not found: {backup_file}")
        
        # Create a temporary backup of current database
        temp_backup = self.backup("pre_restore_backup")
        
        try:
            with gzip.open(backup_path, 'rb') as f:
                # Read metadata
                metadata_line = f.readline()
                metadata = json.loads(metadata_line.decode())
                
                # Check version compatibility
                if metadata.get('version', 1) > self._get_schema_version():
                    raise ValueError(
                        f"Backup version {metadata['version']} is newer than current schema"
                    )
                
                # Restore the database file
                self.db_path.unlink(missing_ok=True)
                with open(self.db_path, 'wb') as target:
                    target.write(f.read())
            
            # Reinitialize the connection
            self.__init__(str(self.db_path), str(self.backup_dir))
            
        except Exception as e:
            # Restore failed, revert to temp backup
            if temp_backup and Path(temp_backup).exists():
                self.restore(temp_backup)
            raise e
    
    def list_backups(self) -> List[Dict[str, Any]]:
        """List all available backups with metadata."""
        backups = []
        
        for backup_file in self.backup_dir.glob("backup_*.db.gz"):
            try:
                with gzip.open(backup_file, 'rb') as f:
                    metadata = json.loads(f.readline().decode())
                    metadata['file'] = str(backup_file)
                    metadata['size_mb'] = backup_file.stat().st_size / 1024 / 1024
                    backups.append(metadata)
            except Exception:
                # Skip corrupted backups
                continue
        
        # Sort by timestamp, newest first
        backups.sort(key=lambda x: x['timestamp'], reverse=True)
        return backups
    
    def vacuum(self) -> None:
        """Optimize the database by running VACUUM."""
        with self.engine.connect() as conn:
            conn.execute(text("VACUUM"))
            conn.commit()
    
    def get_stats(self) -> Dict[str, Any]:
        """Get database statistics."""
        stats = {}
        
        with self.session() as session:
            # Get table counts
            for table in Base.metadata.tables:
                count = session.execute(
                    text(f"SELECT COUNT(*) FROM {table}")
                ).scalar()
                stats[f"{table}_count"] = count
            
            # Get database size
            stats['size_mb'] = self.db_path.stat().st_size / 1024 / 1024
            
            # Get backup info
            backups = self.list_backups()
            stats['backup_count'] = len(backups)
            stats['latest_backup'] = backups[0]['timestamp'] if backups else None
        
        return stats
    
    def _get_schema_version(self) -> int:
        """Get current schema version."""
        with self.session() as session:
            version = session.query(SchemaVersion).order_by(
                SchemaVersion.version.desc()
            ).first()
            return version.version if version else 1
    
    def _clean_old_backups(self) -> None:
        """Remove backups older than retention period."""
        with self.session() as session:
            retention_days = Preference.get_int(
                session, 'backup_retention_days', default=7
            )
        
        if retention_days <= 0:
            return  # No cleanup if retention is disabled
        
        cutoff_date = datetime.now() - timedelta(days=retention_days)
        
        for backup_file in self.backup_dir.glob("backup_*.db.gz"):
            # Parse timestamp from filename
            try:
                timestamp_str = backup_file.stem.split('_')[1]
                file_date = datetime.strptime(timestamp_str, "%Y%m%d")
                
                if file_date < cutoff_date:
                    backup_file.unlink()
            except (IndexError, ValueError):
                # Skip files with unexpected names
                continue


# Convenience functions
def quick_backup(description: str = "") -> str:
    """Quick backup function for one-off use."""
    db = DatabaseManager()
    return db.backup(description)


def quick_restore(backup_file: str) -> None:
    """Quick restore function for one-off use."""
    db = DatabaseManager()
    db.restore(backup_file)


def get_session() -> Session:
    """Get a database session for one-off queries."""
    db = DatabaseManager()
    return db.Session()


if __name__ == "__main__":
    # Test the database utilities
    db = DatabaseManager()
    db.initialize()
    
    print("Database initialized!")
    print("\nDatabase stats:")
    for key, value in db.get_stats().items():
        print(f"  {key}: {value}")
    
    # Test backup
    backup_file = db.backup("Test backup")
    print(f"\nCreated backup: {backup_file}")
    
    # List backups
    print("\nAvailable backups:")
    for backup in db.list_backups():
        print(f"  - {backup['timestamp']}: {backup.get('description', 'No description')} ({backup['size_mb']:.2f} MB)")