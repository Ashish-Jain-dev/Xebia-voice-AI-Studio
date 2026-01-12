"""
Database migration to add avatar_id column to agents table
Run this after updating models.py
"""

from sqlalchemy import create_engine, text
import os

# Database URL
DATABASE_URL = "sqlite:///./xebia_voice_agents.db"
engine = create_engine(DATABASE_URL)

def migrate():
    """Add avatar_id column to agents table"""
    print("[+] Starting database migration...")
    
    with engine.connect() as conn:
        try:
            # Check if column already exists
            result = conn.execute(text("PRAGMA table_info(agents)"))
            columns = [row[1] for row in result]
            
            if 'avatar_id' in columns:
                print("[OK] Column 'avatar_id' already exists, skipping migration")
                return
            
            # Add avatar_id column
            print("[+] Adding 'avatar_id' column to agents table...")
            conn.execute(text("ALTER TABLE agents ADD COLUMN avatar_id VARCHAR"))
            conn.commit()
            
            print("[OK] Migration completed successfully!")
            print("     - Added: avatar_id column (VARCHAR, nullable)")
            
        except Exception as e:
            print(f"[ERROR] Migration failed: {e}")
            raise

if __name__ == "__main__":
    migrate()
