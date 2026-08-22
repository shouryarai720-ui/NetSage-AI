#!/usr/bin/env python3
"""
NetSage AI — AI Grounding, Safety Gate & Hallucination Tests
(tests/test_ai_grounding.py)
"""

import unittest
from pathlib import Path
import sys

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))
sys.path.insert(0, str(ROOT_DIR / "src"))

from engine import NetSageEngine


class TestAiGroundingAndSafety(unittest.TestCase):
    """
    Tests for AI evidence grounding and hallucination prevention:
    - Ungrounded IP address detection
    - Unsupported citation identification
    - Strict schema verification
    """

    def setUp(self):
        self.engine = NetSageEngine()

    def test_grounded_ai_response_passes(self):
        show_output = """
        CORE-ROUTER-01# show ip interface brief
        GigabitEthernet0/0.30  10.30.30.1  YES manual administratively down down
        """
        grounded_ai = {
            "root_cause": "The sub-interface GigabitEthernet0/0.30 is administratively disabled.",
            "osi_layer": "Layer 3 (Network)",
            "confidence": "High",
            "evidence": ["GigabitEthernet0/0.30 is administratively down down"],
            "next_command": "show running-config interface GigabitEthernet0/0.30",
            "fix_steps": ["configure terminal", "interface GigabitEthernet0/0.30", "no shutdown"]
        }
        res = self.engine.validate_ai_grounding(show_output, grounded_ai)
        self.assertTrue(res["is_grounded"])
        self.assertEqual(res["safety_status"], "GROUNDED")
        self.assertTrue(res["can_direct_approve"])

    def test_hallucinated_ip_is_blocked(self):
        show_output = """
        CORE-ROUTER-01# show ip interface brief
        GigabitEthernet0/0.10  10.10.10.1  YES manual up up
        """
        hallucinated_ai = {
            "root_cause": "Server at 192.168.99.99 is unreachable due to routing failure.",
            "osi_layer": "Layer 3 (Network)",
            "confidence": "High",
            "evidence": ["Host 192.168.99.99 is down"],
            "next_command": "show ip route",
            "fix_steps": ["ip route 192.168.99.0 255.255.255.0 10.10.10.2"]
        }
        res = self.engine.validate_ai_grounding(show_output, hallucinated_ai)
        self.assertFalse(res["is_grounded"])
        self.assertEqual(res["safety_status"], "UNSAFE / UNGROUNDED")
        self.assertFalse(res["can_direct_approve"])
        self.assertTrue(any("192.168.99.99" in err for err in res["unsupported_claims"]))

    def test_unsupported_citation_is_blocked(self):
        show_output = "Interface FastEthernet0/1 is up, line protocol is up"
        hallucinated_ai = {
            "root_cause": "BGP peer 172.16.50.1 session is flapping",
            "osi_layer": "Layer 3 (Network)",
            "confidence": "Low",
            "evidence": ["BGP neighbor 172.16.50.1 state is active instead of established"],
            "next_command": "show ip bgp summary",
            "fix_steps": ["router bgp 65000", "neighbor 172.16.50.1 remote-as 65001"]
        }
        res = self.engine.validate_ai_grounding(show_output, hallucinated_ai)
        self.assertFalse(res["is_grounded"])
        self.assertEqual(res["safety_status"], "UNSAFE / UNGROUNDED")


if __name__ == "__main__":
    unittest.main()
