"""
Add avatar_id column to existing agents table
"""
import sqlite3
import os

# Use the correct database file that's actually being used
db_path = "xebia_voice_ai.db"

if not os.path.exists(db_path):
    print(f"[ERROR] Database not found at: {db_path}")
    print("Please make sure you're running this from the backend directory")
    exit(1)

print(f"[+] Connecting to database: {db_path}")
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    # Check if column already exists
    cursor.execute("PRAGMA table_info(agents)")
    columns = [row[1] for row in cursor.fetchall()]
    
    if 'avatar_id' in columns:
        print("[OK] Column 'avatar_id' already exists!")
    else:
        print("[+] Adding 'avatar_id' column to agents table...")
        cursor.execute("ALTER TABLE agents ADD COLUMN avatar_id VARCHAR")
        conn.commit()
        print("[OK] Successfully added 'avatar_id' column!")
    
    # Verify
    cursor.execute("PRAGMA table_info(agents)")
    columns = [row[1] for row in cursor.fetchall()]
    print(f"\n[INFO] Current agents table columns:")
    for col in columns:
        print(f"  - {col}")
    
    print("\n[OK] Migration complete!")
    
except Exception as e:
    print(f"[ERROR] Migration failed: {e}")
    conn.rollback()
finally:
    conn.close()
