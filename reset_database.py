"""
Database Reset Script for Demo
Cleans all existing agents, sessions, and ChromaDB collections
"""

import os
import shutil
from pathlib import Path

print("=" * 80)
print("🧹 RESETTING DATABASE FOR DEMO")
print("=" * 80)
print()

# 1. Delete SQLite database
db_path = Path("backend/xebia_voice_ai.db")
if db_path.exists():
    os.remove(db_path)
    print("✓ Deleted SQLite database (xebia_voice_ai.db)")
else:
    print("ℹ Database file not found (will be created fresh)")

# 2. Delete ChromaDB folder
chroma_path = Path("backend/chroma_db")
if chroma_path.exists():
    shutil.rmtree(chroma_path)
    print("✓ Deleted ChromaDB folder (chroma_db/)")
else:
    print("ℹ ChromaDB folder not found (will be created fresh)")

# 3. Delete any uploaded documents (if folder exists)
uploads_path = Path("backend/uploads")
if uploads_path.exists():
    shutil.rmtree(uploads_path)
    print("✓ Deleted uploads folder")
else:
    print("ℹ Uploads folder not found")

print()
print("=" * 80)
print("✅ DATABASE RESET COMPLETE")
print("=" * 80)
print()
print("Next steps:")
print("1. Start backend: uvicorn main:app --reload (in backend folder)")
print("2. Database will be recreated automatically")
print("3. Create your 3 demo agents via the UI")
print()
