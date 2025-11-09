#!/usr/bin/env python3
"""
Database migration runner for AI Travel Planner
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from app.config import Config
from supabase import create_client


def run_migration(sql_file: str):
    """Execute a SQL migration file"""
    # Initialize Supabase client with service key
    supabase = create_client(Config.SUPABASE_URL, Config.SUPABASE_SERVICE_KEY)

    # Read SQL file
    migration_path = Path(__file__).parent / sql_file
    with open(migration_path, "r", encoding="utf-8") as f:
        sql_content = f.read()

    print(f"Running migration: {sql_file}")
    print(f"SQL content:\n{sql_content}\n")

    try:
        # Execute SQL using RPC (PostgREST doesn't directly support DDL, so we use rpc)
        # Note: This requires a function in Supabase that can execute raw SQL
        # Alternative: Use psycopg2 or execute via Supabase SQL editor

        print("⚠️  Please execute this SQL manually in Supabase SQL Editor:")
        print("=" * 70)
        print(sql_content)
        print("=" * 70)
        print("\nSteps:")
        print("1. Go to your Supabase project dashboard")
        print("2. Navigate to SQL Editor")
        print("3. Create a new query")
        print("4. Paste the above SQL")
        print("5. Click 'Run'")

        # For now, we'll just display the SQL for manual execution
        # In production, you'd want to use psycopg2 or a proper migration tool

    except Exception as e:
        print(f"❌ Migration failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    run_migration("add_expense_fields.sql")
