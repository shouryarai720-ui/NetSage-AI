#!/usr/bin/env python3
"""
NetSage AI — Independent Verification & Reporting Failure Modes Unit Tests
(tests/test_reporting_failure_modes.py)

Tests the 4 fundamental execution and reporting pathways:
  TEST A: checker succeeds with 35/35 (PASS, 35 total, 35 passed, 0 failed, execution_error=False)
  TEST B: checker executes but reports validation failure (FAIL, 35 total, 34 passed, 1 failed, execution_error=False)
  TEST C: checker cannot execute (FAIL, 0 total, 0 passed, 0 failed, execution_error=True)
  TEST D: checker returns malformed output (FAIL, 0 total, 0 passed, 0 failed, execution_error=True)
"""

import unittest
import re
from typing import Dict, Any


def parse_python_checker_output(output: str) -> Dict[str, Any]:
    """
    Python reference parser matching TypeScript's parsePythonCheckerOutput.
    Extracts authoritative execution summary with strict invariant checks.
    """
    clean = re.sub(r'\x1b\[[0-9;]*m', '', output)
    total_match = re.search(r'Total Cases Executed:\s*(-?\d+)', clean, re.IGNORECASE)
    passed_match = re.search(r'Passed Validations:\s*(-?\d+)', clean, re.IGNORECASE)
    failed_match = re.search(r'Failed Validations:\s*(-?\d+)', clean, re.IGNORECASE)

    if total_match and passed_match and failed_match:
        total = int(total_match.group(1))
        passed = int(passed_match.group(1))
        failed = int(failed_match.group(1))

        is_non_negative = total >= 0 and passed >= 0 and failed >= 0
        is_sum_consistent = (passed + failed) == total

        if is_non_negative and is_sum_consistent:
            all_passed = total > 0 and failed == 0 and passed == total
            return {
                "executed": True,
                "total_cases": total,
                "passed_validations": passed,
                "failed_validations": failed,
                "passed": all_passed,
                "execution_error": False,
                "status": "PASS" if all_passed else "FAIL"
            }

    return {
        "executed": False,
        "total_cases": 0,
        "passed_validations": 0,
        "failed_validations": 0,
        "passed": False,
        "execution_error": True,
        "status": "FAIL",
        "error_message": "Failed to parse authoritative summary from Python dataset checker output or invariant violation detected."
    }


class TestReportingFailureModes(unittest.TestCase):
    """
    Comprehensive test suite for dataset checker failure-mode reporting logic.
    """

    def test_scenario_a_successful_execution(self):
        """TEST A: Checker executes and all 35 cases pass."""
        mock_output = """
=====================================================================
 PYTHON AUTOMATED COMPLIANCE REPORT
=====================================================================
  Total Cases Executed:      35
  Passed Validations:        35
  Failed Validations:        0
  Rule Integrity Coverage:   100.0%
=====================================================================
SUCCESS: Independent Python validation successfully verified all 35 rule cases!
"""
        res = parse_python_checker_output(mock_output)
        self.assertTrue(res["executed"])
        self.assertEqual(res["total_cases"], 35)
        self.assertEqual(res["passed_validations"], 35)
        self.assertEqual(res["failed_validations"], 0)
        self.assertFalse(res["execution_error"])
        self.assertTrue(res["passed"])
        self.assertEqual(res["status"], "PASS")

    def test_scenario_b_validation_failure(self):
        """TEST B: Checker executes but reports 34 passed and 1 failed case."""
        mock_output = """
=====================================================================
 PYTHON AUTOMATED COMPLIANCE REPORT
=====================================================================
  Total Cases Executed:      35
  Passed Validations:        34
  Failed Validations:        1
  Rule Integrity Coverage:   97.1%
=====================================================================
FAIL: Independent Python validation discovered non-compliant rule cases.
"""
        res = parse_python_checker_output(mock_output)
        self.assertTrue(res["executed"])
        self.assertEqual(res["total_cases"], 35)
        self.assertEqual(res["passed_validations"], 34)
        self.assertEqual(res["failed_validations"], 1)
        self.assertFalse(res["execution_error"])
        self.assertFalse(res["passed"])
        self.assertEqual(res["status"], "FAIL")

    def test_scenario_c_execution_failure_missing_file_or_process_crash(self):
        """TEST C: Checker process crashes or cannot start (no summary table produced)."""
        mock_error_output = """
Traceback (most recent call last):
  File "checker.py", line 811, in main
    FileNotFoundError: [Errno 2] No such file or directory: 'data/cases.csv'
"""
        res = parse_python_checker_output(mock_error_output)
        self.assertFalse(res["executed"])
        self.assertEqual(res["total_cases"], 0)
        self.assertEqual(res["passed_validations"], 0)
        self.assertEqual(res["failed_validations"], 0)
        self.assertTrue(res["execution_error"])
        self.assertFalse(res["passed"])
        self.assertEqual(res["status"], "FAIL")

    def test_scenario_c_execution_failure_empty_output(self):
        """TEST C2: Subprocess terminated with zero output."""
        res = parse_python_checker_output("")
        self.assertFalse(res["executed"])
        self.assertEqual(res["total_cases"], 0)
        self.assertEqual(res["passed_validations"], 0)
        self.assertEqual(res["failed_validations"], 0)
        self.assertTrue(res["execution_error"])
        self.assertEqual(res["status"], "FAIL")

    def test_scenario_d_malformed_output_truncated_fields(self):
        """TEST D: Checker produces incomplete or corrupt summary output."""
        mock_malformed = """
=====================================================================
 PYTHON AUTOMATED COMPLIANCE REPORT
=====================================================================
  Total Cases Executed:      35
  Passed Validations:        
=====================================================================
"""
        res = parse_python_checker_output(mock_malformed)
        self.assertFalse(res["executed"])
        self.assertEqual(res["total_cases"], 0)
        self.assertEqual(res["passed_validations"], 0)
        self.assertEqual(res["failed_validations"], 0)
        self.assertTrue(res["execution_error"])
        self.assertEqual(res["status"], "FAIL")

    def test_scenario_g_negative_counts(self):
        """TEST G: Negative numbers in summary report are rejected."""
        mock_output = """
=====================================================================
 PYTHON AUTOMATED COMPLIANCE REPORT
=====================================================================
  Total Cases Executed:      -5
  Passed Validations:        -5
  Failed Validations:        0
=====================================================================
"""
        res = parse_python_checker_output(mock_output)
        self.assertFalse(res["executed"])
        self.assertTrue(res["execution_error"])
        self.assertFalse(res["passed"])

    def test_scenario_h_inconsistent_sum(self):
        """TEST H: Passed + failed != total is rejected as corrupt."""
        mock_output = """
=====================================================================
 PYTHON AUTOMATED COMPLIANCE REPORT
=====================================================================
  Total Cases Executed:      35
  Passed Validations:        30
  Failed Validations:        0
=====================================================================
"""
        res = parse_python_checker_output(mock_output)
        self.assertFalse(res["executed"])
        self.assertTrue(res["execution_error"])
        self.assertFalse(res["passed"])

    def test_scenario_i_passed_overflow(self):
        """TEST I: Passed > total is rejected."""
        mock_output = """
=====================================================================
 PYTHON AUTOMATED COMPLIANCE REPORT
=====================================================================
  Total Cases Executed:      35
  Passed Validations:        40
  Failed Validations:        0
=====================================================================
"""
        res = parse_python_checker_output(mock_output)
        self.assertFalse(res["executed"])
        self.assertTrue(res["execution_error"])
        self.assertFalse(res["passed"])

    def test_scenario_j_failed_overflow(self):
        """TEST J: Failed > total is rejected."""
        mock_output = """
=====================================================================
 PYTHON AUTOMATED COMPLIANCE REPORT
=====================================================================
  Total Cases Executed:      35
  Passed Validations:        0
  Failed Validations:        40
=====================================================================
"""
        res = parse_python_checker_output(mock_output)
        self.assertFalse(res["executed"])
        self.assertTrue(res["execution_error"])
        self.assertFalse(res["passed"])

    def test_aggregate_truthfulness_no_invented_counts(self):
        """Verify that an execution failure does not add 35 to aggregate totals."""
        scenario_c = parse_python_checker_output("Fatal syntax error in module")
        # Simulate pipeline aggregator
        ts_passed = 189
        ts_total = 189
        py_unit_passed = 36
        py_unit_total = 36

        # Aggregation with scenario C
        total_executed = ts_total + py_unit_total + scenario_c["total_cases"]
        total_passed = ts_passed + py_unit_passed + scenario_c["passed_validations"]
        total_failed = (ts_total - ts_passed) + (py_unit_total - py_unit_passed) + scenario_c["failed_validations"]

        self.assertEqual(total_executed, 225)
        self.assertEqual(total_passed, 225)
        self.assertEqual(total_failed, 0)
        self.assertTrue(scenario_c["execution_error"])
        # Overall verification must still be FAIL because a required step failed
        overall_pass = (ts_passed == ts_total) and (py_unit_passed == py_unit_total) and scenario_c["passed"]
        self.assertFalse(overall_pass)


if __name__ == "__main__":
    unittest.main()
