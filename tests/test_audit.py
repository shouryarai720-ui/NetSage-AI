#!/usr/bin/env python3
"""
NetSage AI — Cryptographic Audit Trail & Tamper Verification Tests
(tests/test_audit.py)
"""

import unittest
import json
import tempfile
from pathlib import Path
import sys

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))
sys.path.insert(0, str(ROOT_DIR / "src"))

from engine import NetSageEngine


class TestAuditSecurityAndTampering(unittest.TestCase):
    """
    Tests for immutable cryptographic hash chaining:
    - Normal sequential record addition
    - Rejection requires mandatory reason
    - Tamper detection on modified payload
    - Tamper detection on broken hash link
    """

    def setUp(self):
        self.temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".json")
        self.temp_path = Path(self.temp_file.name)
        # Initialize with empty list
        with open(self.temp_path, "w") as f:
            json.dump([], f)
        self.engine = NetSageEngine(audit_file_path=self.temp_path)

    def tearDown(self):
        if self.temp_path.exists():
            self.temp_path.unlink()

    def test_record_human_decision_flow(self):
        """Tests sequential append-only logging of ACCEPTED, EDITED, and REJECTED decisions."""
        e1 = self.engine.record_human_decision("NET-001", "ACCEPTED", reviewer="Lead-NOC-01")
        self.assertEqual(e1["humanDecision"], "ACCEPTED")
        self.assertEqual(e1["previousHash"], "sha256:genesis_block_init")
        self.assertTrue(e1["integrityToken"].startswith("sha256:"))

        e2 = self.engine.record_human_decision(
            "NET-002",
            "EDITED",
            reviewer="Engineer-02",
            edited_commands=["interface Fa0/12", "speed 100", "duplex full"]
        )
        self.assertEqual(e2["humanDecision"], "EDITED")
        self.assertEqual(e2["previousHash"], e1["integrityToken"])

        e3 = self.engine.record_human_decision(
            "NET-003",
            "REJECTED",
            reviewer="Security-Officer",
            reason="Proposed command does not isolate rogue MAC address."
        )
        self.assertEqual(e3["humanDecision"], "REJECTED")
        self.assertEqual(e3["previousHash"], e2["integrityToken"])

        # Verify chain
        verify_res = self.engine.verify_audit_chain()
        self.assertTrue(verify_res["valid"], f"Audit chain verification failed: {verify_res}")
        self.assertEqual(verify_res["count"], 3)

    def test_rejection_without_reason_fails(self):
        """Rejections must enforce a non-empty explanation."""
        with self.assertRaises(ValueError):
            self.engine.record_human_decision("NET-004", "REJECTED", reason="")

    def test_tamper_detection_modified_payload(self):
        """Modifying a message or decision in an existing block must trigger cryptographic failure."""
        self.engine.record_human_decision("NET-001", "ACCEPTED", reviewer="Lead-NOC-01")
        self.engine.record_human_decision("NET-002", "ACCEPTED", reviewer="Lead-NOC-01")

        with open(self.temp_path, "r") as f:
            logs = json.load(f)

        logs[-1]["message"] = "MALICIOUSLY TAMPERED MESSAGE"

        with open(self.temp_path, "w") as f:
            json.dump(logs, f)

        verify_res = self.engine.verify_audit_chain()
        self.assertFalse(verify_res["valid"], "Tampered payload should fail hash verification")
        self.assertIn("tampered_index", verify_res)

    def test_tamper_detection_modified_timestamp(self):
        """Modifying a timestamp in an existing block must fail hash verification."""
        self.engine.record_human_decision("NET-001", "ACCEPTED", reviewer="Lead-NOC-01")
        self.engine.record_human_decision("NET-002", "ACCEPTED", reviewer="Lead-NOC-01")

        with open(self.temp_path, "r") as f:
            logs = json.load(f)

        logs[0]["timestamp"] = "1999-01-01 00:00:00"

        with open(self.temp_path, "w") as f:
            json.dump(logs, f)

        verify_res = self.engine.verify_audit_chain()
        self.assertFalse(verify_res["valid"], "Tampered timestamp should fail verification")

    def test_tamper_detection_modified_previous_hash(self):
        """Modifying a previousHash pointer must trigger chain validation failure."""
        self.engine.record_human_decision("NET-001", "ACCEPTED", reviewer="Lead-NOC-01")
        self.engine.record_human_decision("NET-002", "ACCEPTED", reviewer="Lead-NOC-01")

        with open(self.temp_path, "r") as f:
            logs = json.load(f)

        logs[0]["previousHash"] = "sha256:forged_pointer_123456789"

        with open(self.temp_path, "w") as f:
            json.dump(logs, f)

        verify_res = self.engine.verify_audit_chain()
        self.assertFalse(verify_res["valid"], "Tampered previousHash should fail verification")

    def test_tamper_detection_modified_remediation(self):
        """Modifying remediation commands must fail hash verification."""
        self.engine.record_human_decision(
            "NET-002",
            "EDITED",
            reviewer="Engineer-02",
            edited_commands=["interface Fa0/12", "speed 100"]
        )

        with open(self.temp_path, "r") as f:
            logs = json.load(f)

        logs[0]["editedCommands"] = ["interface Fa0/12", "shutdown"]

        with open(self.temp_path, "w") as f:
            json.dump(logs, f)

        verify_res = self.engine.verify_audit_chain()
        self.assertFalse(verify_res["valid"], "Tampered remediation command must fail verification")

    def test_tamper_detection_reordered_records(self):
        """Reordering records in the chain must break previousHash linkage."""
        self.engine.record_human_decision("NET-001", "ACCEPTED", reviewer="Lead-NOC-01")
        self.engine.record_human_decision("NET-002", "ACCEPTED", reviewer="Lead-NOC-01")
        self.engine.record_human_decision("NET-003", "ACCEPTED", reviewer="Lead-NOC-01")

        with open(self.temp_path, "r") as f:
            logs = json.load(f)

        # Reverse records (reordering)
        logs.reverse()

        with open(self.temp_path, "w") as f:
            json.dump(logs, f)

        verify_res = self.engine.verify_audit_chain()
        self.assertFalse(verify_res["valid"], "Reordered records must fail hash verification")

    def test_tamper_detection_deleted_records(self):
        """Deleting an intermediate record must break the chain link."""
        self.engine.record_human_decision("NET-001", "ACCEPTED", reviewer="Lead-NOC-01")
        self.engine.record_human_decision("NET-002", "ACCEPTED", reviewer="Lead-NOC-01")
        self.engine.record_human_decision("NET-003", "ACCEPTED", reviewer="Lead-NOC-01")

        with open(self.temp_path, "r") as f:
            logs = json.load(f)

        # Delete middle entry
        del logs[1]

        with open(self.temp_path, "w") as f:
            json.dump(logs, f)

        verify_res = self.engine.verify_audit_chain()
        self.assertFalse(verify_res["valid"], "Deleted intermediate record must fail verification")

    def test_tamper_detection_inserted_records(self):
        """Inserting a rogue record must break the chain link."""
        self.engine.record_human_decision("NET-001", "ACCEPTED", reviewer="Lead-NOC-01")
        self.engine.record_human_decision("NET-002", "ACCEPTED", reviewer="Lead-NOC-01")

        with open(self.temp_path, "r") as f:
            logs = json.load(f)

        fake_entry = {
            "timestamp": "2026-08-20 14:02:00",
            "caseId": "NET-FORGED",
            "actionType": "ROGUE INSERTION",
            "targetNode": "CORE-01",
            "message": "Injected record",
            "integrityToken": "sha256:fakehash",
            "previousHash": logs[-1]["integrityToken"],
            "safetyStatus": "BLOCKED",
            "reviewer": "Hacker",
            "humanDecision": "ACCEPTED",
            "reason": "Unjustified"
        }
        logs.insert(1, fake_entry)

        with open(self.temp_path, "w") as f:
            json.dump(logs, f)

        verify_res = self.engine.verify_audit_chain()
        self.assertFalse(verify_res["valid"], "Inserted rogue record must fail verification")


if __name__ == "__main__":
    unittest.main()
