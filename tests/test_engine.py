#!/usr/bin/env python3
"""
NetSage AI — End-to-End Engine Orchestration Tests
(tests/test_engine.py)
"""

import unittest
from pathlib import Path
import sys

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))
sys.path.insert(0, str(ROOT_DIR / "src"))

from engine import NetSageEngine


class TestNetSageEngine(unittest.TestCase):
    """
    End-to-end integration tests for NetSage AI diagnostic pipeline.
    """

    def setUp(self):
        self.engine = NetSageEngine()

    def test_full_pipeline_net001(self):
        """Tests complete diagnostic flow for primary scenario NET-001."""
        res = self.engine.process_case("NET-001")
        self.assertNotIn("error", res)
        self.assertEqual(res["case"]["case_id"], "NET-001")
        self.assertEqual(res["deterministic"]["status"], "ERRORS_DETECTED")
        self.assertEqual(res["deterministic"]["severity"], "Critical")
        self.assertTrue(any(r["id"] == "RC-01" for r in res["deterministic"]["rules_triggered"]))

        self.assertEqual(res["ai_diagnosis"]["osi_layer"], "Layer 3 (Network)")
        self.assertEqual(res["grounding"]["safety_status"], "GROUNDED")
        self.assertTrue(res["grounding"]["can_direct_approve"])

    def test_full_suite_dataset_processing(self):
        """Iterates through all 35 dataset cases to ensure 0 crashes or unhandled exceptions."""
        total = len(self.engine.cases)
        self.assertEqual(total, 35)

        for case in self.engine.cases:
            cid = case["case_id"]
            res = self.engine.process_case(cid)
            self.assertNotIn("error", res, f"Processing failed for case {cid}")
            self.assertIn("deterministic", res)
            self.assertIn("ai_diagnosis", res)
            self.assertIn("grounding", res)


if __name__ == "__main__":
    unittest.main()
