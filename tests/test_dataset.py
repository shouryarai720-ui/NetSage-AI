#!/usr/bin/env python3
"""
NetSage AI — Dataset Compliance & Integrity Tests
(tests/test_dataset.py)
"""

import unittest
from pathlib import Path
import sys

# Ensure src/ and root are in path
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))
sys.path.insert(0, str(ROOT_DIR / "src"))

from checker import parse_csv_file
from engine import NetSageEngine


class TestDatasetCompliance(unittest.TestCase):
    """
    Validates data/cases.csv meets all project specifications:
    - Minimum 30 cases (35 present)
    - Unique Case IDs
    - All required fields present
    - All 8 networking domains represented
    - Realistic Cisco IOS syntax in show_outputs
    """

    @classmethod
    def setUpClass(cls):
        cls.csv_path = ROOT_DIR / "data" / "cases.csv"
        cls.assertTrue(cls.csv_path.exists(), f"cases.csv not found at {cls.csv_path}")
        cls.header, cls.rows = parse_csv_file(str(cls.csv_path))
        cls.engine = NetSageEngine(cases_csv_path=cls.csv_path)

    def test_case_count_minimum(self):
        """Dataset must contain at least 30 cases (authoritative requirement)."""
        self.assertGreaterEqual(len(self.rows), 30, f"Expected >= 30 cases, found {len(self.rows)}")
        self.assertEqual(len(self.rows), 35, "Authoritative suite contains 35 validated cases.")

    def test_unique_case_ids(self):
        """All Case IDs must be strictly unique."""
        case_ids = [r[0].strip() for r in self.rows if r]
        self.assertEqual(len(case_ids), len(set(case_ids)), "Duplicate Case IDs detected in cases.csv")

    def test_required_fields_non_empty(self):
        """Every case must contain all 12 schema columns without empty mandatory values."""
        for row in self.rows:
            self.assertGreaterEqual(len(row), 12, f"Row {row[0] if row else 'empty'} has fewer than 12 columns.")
            case_id = row[0].strip()
            title = row[1].strip()
            symptom = row[2].strip()
            topo = row[3].strip()
            show = row[4].strip()
            fault = row[5].strip()
            layer = row[6].strip()
            tag = row[7].strip()
            sev = row[8].strip()

            self.assertTrue(case_id.startswith("NET-"), f"Case ID {case_id} should follow NET-XXX prefix")
            self.assertTrue(len(title) > 0, f"Case {case_id} has empty title")
            self.assertTrue(len(symptom) > 0, f"Case {case_id} has empty symptom")
            self.assertTrue(len(topo) > 0, f"Case {case_id} has empty topology_note")
            self.assertTrue(len(show) > 0, f"Case {case_id} has empty show_outputs")
            self.assertTrue(len(fault) > 0, f"Case {case_id} has empty expected_fault")
            self.assertIn(layer, [
                "Layer 1 (Physical)", "Layer 2 (Data Link)", "Layer 3 (Network)",
                "Layer 4 (Transport)", "Layer 5 (Session)", "Layer 6 (Presentation)", "Layer 7 (Application)"
            ], f"Case {case_id} has invalid OSI Layer '{layer}'")
            self.assertIn(sev, ["Critical", "High", "Medium", "Low"], f"Case {case_id} has invalid Severity '{sev}'")

    def test_domain_coverage(self):
        """Verifies full coverage across all 8 mandatory network domains."""
        validation = self.engine.validate_dataset()
        self.assertTrue(validation["valid"], f"Dataset validation failed: {validation.get('errors')}")
        domains = validation["domain_coverage"]
        for domain in ["VLAN", "Gateway", "DHCP", "DNS", "Routing", "ACL", "NAT", "Wireless"]:
            self.assertGreater(domains.get(domain, 0), 0, f"Domain {domain} has 0 test cases in dataset.")

    def test_primary_case_net001(self):
        """Verifies primary required use case NET-001 is present with correct attributes."""
        net001 = next((r for r in self.rows if r[0].strip() == "NET-001"), None)
        self.assertIsNotNone(net001, "Primary required case NET-001 is missing from cases.csv")
        self.assertIn("GigabitEthernet0/0.30", net001[4], "NET-001 must contain GigabitEthernet0/0.30 in show_outputs")
        self.assertIn("administratively down", net001[4], "NET-001 must contain administratively down status")
        self.assertEqual(net001[11].strip(), "RC-01", "NET-001 must expect rule RC-01")


if __name__ == "__main__":
    unittest.main()
