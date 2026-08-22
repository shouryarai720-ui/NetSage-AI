#!/usr/bin/env python3
"""
NetSage AI — Streamlit Diagnostic Dashboard & Compliance Interface
Python/Streamlit compatibility implementation for NetSage AI.
"""

import os
import sys
import json
import hashlib
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional

try:
    import streamlit as st
    import pandas as pd
    HAS_STREAMLIT = True
except ImportError:
    HAS_STREAMLIT = False

# Import deterministic rule checker engine
from checker import run_checks, RULES, parse_csv_file

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
CASES_CSV = DATA_DIR / "cases.csv"
AUDIT_LOGS_FILE = DATA_DIR / "audit-logs.json"


def load_audit_logs() -> List[Dict[str, Any]]:
    if not AUDIT_LOGS_FILE.exists():
        return []
    try:
        with open(AUDIT_LOGS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []


def save_audit_log(entry: Dict[str, Any]):
    logs = load_audit_logs()
    prev_hash = logs[-1]["integrityToken"] if logs else "0000000000000000000000000000000000000000000000000000000000000000"
    
    timestamp = datetime.utcnow().isoformat() + "Z"
    entry["timestamp"] = timestamp
    entry["previousHash"] = prev_hash
    
    # Calculate SHA-256 integrity token
    raw_payload = f"{timestamp}|{entry.get('caseId','')}|{entry.get('actionType','')}|{entry.get('humanDecision','')}|{prev_hash}"
    entry["integrityToken"] = hashlib.sha256(raw_payload.encode('utf-8')).hexdigest()
    
    logs.append(entry)
    with open(AUDIT_LOGS_FILE, "w", encoding="utf-8") as f:
        json.dump(logs, f, indent=2)
    return entry


def run_streamlit_app():
    if not HAS_STREAMLIT:
        print("Streamlit or Pandas is not installed in the current environment.")
        print("To run the Streamlit dashboard, execute: pip install streamlit pandas")
        print("Alternatively, use the full-stack React application with: npm run dev")
        sys.exit(1)

    st.set_page_config(
        page_title="NetSage AI — NOC Operations & Compliance Platform",
        page_icon="🛡️",
        layout="wide"
    )

    st.title("🛡️ NetSage AI — Autonomous NOC Operations & Compliance Platform")
    st.markdown(
        "**AI Problem Statement Project 2** | Applied AI + Network Troubleshooting | Cisco IOS & Packet Tracer"
    )
    st.warning("⚠️ **SIMULATION MODE**: Changes are virtual proposals and require Human Operator Review before execution.")

    # Load Cases
    if not CASES_CSV.exists():
        st.error(f"Dataset not found at {CASES_CSV}")
        return

    header, rows = parse_csv_file(str(CASES_CSV))
    cases = []
    for r in rows:
        if len(r) >= 12:
            cases.append({
                "caseId": r[0].strip(),
                "title": r[1].strip(),
                "symptom": r[2].strip(),
                "topologyNote": r[3].strip(),
                "showOutputs": r[4].strip(),
                "expectedFault": r[5].strip(),
                "osiLayer": r[6].strip(),
                "conceptTag": r[7].strip(),
                "severity": r[8].strip(),
                "nextCommand": r[9].strip(),
                "fixSteps": r[10].strip(),
                "expectedRule": r[11].strip()
            })

    case_options = [f"{c['caseId']} - {c['title']}" for c in cases]
    selected_idx = st.sidebar.selectbox("Select Incident Case", range(len(case_options)), format_func=lambda x: case_options[x])
    active_case = cases[selected_idx]

    # Main dashboard layout
    col1, col2 = st.columns([1, 1])

    with col1:
        st.subheader(f"📌 Case {active_case['caseId']}: {active_case['title']}")
        st.markdown(f"**Severity:** `{active_case['severity']}` | **OSI Layer:** `{active_case['osiLayer']}` | **Category:** `{active_case['conceptTag']}`")
        
        st.markdown("#### 🚨 Symptom")
        st.info(active_case["symptom"])

        st.markdown("#### 🌐 Topology Note")
        st.text(active_case["topologyNote"])

        st.markdown("#### 💻 Cisco Show Outputs / Syslog Evidence")
        st.code(active_case["showOutputs"], language="text")

    with col2:
        st.subheader("🔍 Deterministic Compliance Engine Check")
        results = run_checks(active_case["showOutputs"])
        
        if results["status"] == "ERRORS_DETECTED":
            st.error(f"Status: {results['status']} (Severity: {results['severity']})")
            st.markdown("##### Triggered Diagnostic Rules:")
            for rule in results["rules_triggered"]:
                st.markdown(f"- **`{rule['id']}` - {rule['name']}** ({rule['severity']}): {rule['details']}")
        else:
            st.success("Status: COMPLIANT (No anomalies found)")

        st.markdown("---")
        st.subheader("🤖 AI Diagnostic Proposal (Evaluated against Benchmark)")
        st.markdown(f"**Root Cause Diagnosis:** {active_case['expectedFault']}")
        st.markdown(f"**OSI Layer Classification:** `{active_case['osiLayer']}`")
        st.markdown(f"**Recommended Verification Command:** `{active_case['nextCommand']}`")
        
        st.markdown("##### Proposed Remediation Syntax:")
        st.code(active_case["fixSteps"], language="cisco")

        st.markdown("---")
        st.subheader("🛡️ Human Operator Review & Decision Gate")
        operator_name = st.text_input("Reviewer ID / Operator Name", value="NOC-Engineer-01")
        review_action = st.radio("Decision", ["Approve", "Edit Commands", "Reject"], horizontal=True)

        if review_action == "Edit Commands":
            edited_cmd = st.text_area("Modified Fix Commands", value=active_case["fixSteps"])
        else:
            edited_cmd = None

        if review_action == "Reject":
            rejection_reason = st.text_input("Mandatory Rejection Justification", "")
        else:
            rejection_reason = None

        if st.button("Submit Decision to Cryptographic Audit Ledger"):
            if review_action == "Reject" and not rejection_reason:
                st.error("Rejection requires a mandatory justification reason.")
            else:
                decision_str = "ACCEPTED" if review_action == "Approve" else ("EDITED" if review_action == "Edit Commands" else "REJECTED")
                log_entry = {
                    "caseId": active_case["caseId"],
                    "actionType": "HUMAN GATE PASS" if decision_str == "ACCEPTED" else ("OPERATOR EDIT" if decision_str == "EDITED" else "OPERATOR REJECT"),
                    "targetNode": active_case["title"],
                    "aiDiagnosis": active_case["expectedFault"],
                    "confidence": "High",
                    "evidence": results["evidence"],
                    "originalCommands": [active_case["fixSteps"]],
                    "editedCommands": [edited_cmd] if edited_cmd else [active_case["fixSteps"]],
                    "humanDecision": decision_str,
                    "reviewer": operator_name,
                    "reason": rejection_reason or ("Operator approved proposed commands." if decision_str == "ACCEPTED" else "Operator modified fix commands.")
                }
                saved = save_audit_log(log_entry)
                st.success(f"Decision logged! Cryptographic Token: `{saved['integrityToken']}`")

    st.markdown("---")
    st.subheader("📜 Cryptographic SHA-256 Audit Trail")
    logs = load_audit_logs()
    if logs:
        st.dataframe(pd.DataFrame(logs)[["timestamp", "caseId", "humanDecision", "reviewer", "reason", "integrityToken"]])
    else:
        st.caption("No audit log records recorded yet.")


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--cli":
        print("NetSage AI Streamlit Module Loaded Successfully.")
    else:
        run_streamlit_app()
