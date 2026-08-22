#!/usr/bin/env python3
"""
NetSage AI — Python Diagnostic Engine Entry Point
(engine.py wrapper)
"""

import sys
from pathlib import Path

# Add src/ to sys.path
src_dir = Path(__file__).resolve().parent / "src"
if str(src_dir) not in sys.path:
    sys.path.insert(0, str(src_dir))

from engine import NetSageEngine

if __name__ == "__main__":
    engine = NetSageEngine()
    print("=================================================================")
    print(" NETSAGE AI PYTHON ORCHESTRATION ENGINE")
    print("=================================================================")

    # 1. Dataset check
    ds_res = engine.validate_dataset()
    status_str = "\033[92mPASS\033[0m" if ds_res['valid'] else "\033[91mFAIL\033[0m"
    print(f"Dataset Validation: {status_str} ({ds_res['total_cases']} cases)")
    for domain, count in ds_res["domain_coverage"].items():
        print(f"  - {domain:10s}: {count} cases")

    # 2. Test Primary Case NET-001
    print("\nExecuting Pipeline for NET-001 (Inter-VLAN Sub-Interface Down):")
    net1 = engine.process_case("NET-001")
    print(f"  Deterministic Status: {net1['deterministic']['status']} ({net1['deterministic']['severity']})")
    print(f"  AI Root Cause:        {net1['ai_diagnosis']['root_cause']}")
    print(f"  AI Grounding Status:   {net1['grounding']['safety_status']}")

    # 3. Audit Chain Verification
    audit_res = engine.verify_audit_chain()
    audit_str = "\033[92mVALID\033[0m" if audit_res['valid'] else "\033[91mCORRUPTED\033[0m"
    print(f"\nAudit Chain Verification: {audit_str} ({audit_res.get('count',0)} records)")
    print("=================================================================")
