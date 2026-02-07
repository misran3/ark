#!/usr/bin/env python
"""
Seed all demo data (Nessie + DynamoDB) in one command.

Usage:
    export NESSIE_API_KEY="your_key"
    cd core && python scripts/seed_demo.py [--user USER]
"""

import subprocess
import sys
from pathlib import Path

SCRIPTS_DIR = Path(__file__).parent


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Seed all demo data")
    parser.add_argument("--user", choices=["maya", "james", "sofia", "all"], default="all")
    parser.add_argument("--skip-nessie", action="store_true", help="Skip Nessie seeding")
    parser.add_argument("--skip-dynamodb", action="store_true", help="Skip DynamoDB seeding")
    args = parser.parse_args()

    print("=" * 60)
    print("SNATCHED DEMO DATA SEEDER")
    print("=" * 60)

    if not args.skip_nessie:
        print("\n[1/2] Seeding Nessie sandbox...")
        result = subprocess.run(
            [sys.executable, str(SCRIPTS_DIR / "seed_nessie_demo.py"), "--user", args.user],
            cwd=SCRIPTS_DIR.parent,
        )
        if result.returncode != 0:
            print("ERROR: Nessie seeding failed")
            sys.exit(1)

    if not args.skip_dynamodb:
        print("\n[2/2] Seeding DynamoDB...")
        result = subprocess.run(
            [sys.executable, str(SCRIPTS_DIR / "seed_dynamodb_demo.py"), "--user", args.user],
            cwd=SCRIPTS_DIR.parent,
        )
        if result.returncode != 0:
            print("ERROR: DynamoDB seeding failed")
            sys.exit(1)

    print("\n" + "=" * 60)
    print("ALL DEMO DATA SEEDED SUCCESSFULLY!")
    print("=" * 60)
    print("\nTest with:")
    print("  curl -X POST $API_BASE_URL/captain/analyze -d '{\"user_id\": \"user_maya_torres\"}'")
    print("  curl -X POST $API_BASE_URL/captain/analyze -d '{\"user_id\": \"user_james_chen\"}'")
    print("  curl -X POST $API_BASE_URL/captain/analyze -d '{\"user_id\": \"user_sofia_ramirez\"}'")


if __name__ == "__main__":
    main()
