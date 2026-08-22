#!/usr/bin/env python3
"""
NetSage AI — Independent Deterministic Rule & Compliance Engine
Top-Level Python Entry Point (checker.py)

Canonical implementation resides in src/checker.py.
This script acts as the top-level CLI entry point and re-exports all canonical rules and utilities.
"""

import sys
from pathlib import Path

# Add src/ to sys.path
src_dir = Path(__file__).resolve().parent / "src"
if str(src_dir) not in sys.path:
    sys.path.insert(0, str(src_dir))

# Re-export everything from canonical checker implementation
from checker import *
from checker import main

if __name__ == "__main__":
    main()
