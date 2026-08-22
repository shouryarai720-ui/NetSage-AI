#!/usr/bin/env python3
"""
NetSage AI — Deterministic Rule Checker Unit Tests
(tests/test_checker.py)
"""

import unittest
from pathlib import Path
import sys

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))
sys.path.insert(0, str(ROOT_DIR / "src"))

from checker import (
    run_checks,
    check_rc01_admin_down,
    check_rc02_protocol_down,
    check_rc03_subnet_mask_mismatch,
    check_rc04_gateway_mismatch,
    check_rc05_duplicate_ip,
    check_rc06_missing_vlan,
    check_rc07_native_vlan_mismatch,
    check_rc08_missing_route,
    check_rc09_acl_block,
    check_rc10_dhcp_exhaustion,
    check_rc11_dhcp_relay,
    check_rc12_nat_pool_exhaustion,
    check_rc13_port_security,
    check_rc14_nat_inside_outside,
    check_rc15_dot1q_encapsulation
)


class TestDeterministicRules(unittest.TestCase):
    """
    Unit tests for deterministic rules RC-01 through RC-15.
    Evaluates positive, negative, and edge cases.
    """

    # --- RC-01: Admin Down ---
    def test_rc01_positive(self):
        sample = "GigabitEthernet0/0.30 is administratively down, line protocol is down"
        res = check_rc01_admin_down(sample)
        self.assertIsNotNone(res)
        self.assertEqual(res["id"], "RC-01")
        self.assertEqual(res["severity"], "Critical")

    def test_rc01_table_format(self):
        sample = "GigabitEthernet0/0.30  10.30.30.1      YES manual administratively down down"
        res = check_rc01_admin_down(sample)
        self.assertIsNotNone(res)
        self.assertEqual(res["id"], "RC-01")

    def test_rc01_negative(self):
        sample = "GigabitEthernet0/0.10 is up, line protocol is up"
        res = check_rc01_admin_down(sample)
        self.assertIsNone(res)

    # --- RC-02: Protocol Down ---
    def test_rc02_positive(self):
        sample = "FastEthernet0/12 is down, line protocol is down (notconnect)"
        res = check_rc02_protocol_down(sample)
        self.assertIsNotNone(res)
        self.assertEqual(res["id"], "RC-02")

    def test_rc02_negative_when_admin_down(self):
        sample = "GigabitEthernet0/0.30 is administratively down, line protocol is down"
        res = check_rc02_protocol_down(sample)
        self.assertIsNone(res, "Protocol down should not trigger if interface is administratively down")

    # --- RC-03: Subnet Mask Mismatch ---
    def test_rc03_positive(self):
        sample = "ip address 192.168.12.1 255.255.255.248\nip address 192.168.12.2 255.255.255.0"
        res = check_rc03_subnet_mask_mismatch(sample)
        self.assertIsNotNone(res)
        self.assertEqual(res["id"], "RC-03")

    # --- RC-04: Gateway Mismatch ---
    def test_rc04_positive(self):
        sample = "IP-Config: PC01 IP: 10.10.10.15 Default-Gateway: 10.10.10.254"
        res = check_rc04_gateway_mismatch(sample)
        self.assertIsNotNone(res)
        self.assertEqual(res["id"], "RC-04")

    # --- RC-05: Duplicate IP ---
    def test_rc05_positive(self):
        sample = "%IP-4-DUPADDR: Duplicate IP address 10.30.30.50 on GigabitEthernet1/1, sourced by mac 0019.55aa.bbcc"
        res = check_rc05_duplicate_ip(sample)
        self.assertIsNotNone(res)
        self.assertEqual(res["id"], "RC-05")

    # --- RC-06: Missing VLAN ---
    def test_rc06_positive(self):
        sample = "switchport access vlan 20\nshow vlan brief\n1 default active\n10 Management active"
        res = check_rc06_missing_vlan(sample)
        self.assertIsNotNone(res)
        self.assertEqual(res["id"], "RC-06")

    # --- RC-07: Native VLAN Mismatch ---
    def test_rc07_positive(self):
        sample = "%CDP-4-NATIVE_VLAN_MISMATCH: Native VLAN mismatch discovered on GigabitEthernet0/1 (99), with Switch02 GigabitEthernet0/1 (1)."
        res = check_rc07_native_vlan_mismatch(sample)
        self.assertIsNotNone(res)
        self.assertEqual(res["id"], "RC-07")

    # --- RC-08: Missing Route ---
    def test_rc08_positive(self):
        sample = "Gateway of last resort is not set\nC 10.10.10.0/24 is directly connected, Vlan10"
        res = check_rc08_missing_route(sample)
        self.assertIsNotNone(res)
        self.assertEqual(res["id"], "RC-08")

    # --- RC-09: ACL Block ---
    def test_rc09_positive(self):
        sample = "access-list 101 deny tcp any any eq www\naccess-list 101 permit ip any any"
        res = check_rc09_acl_block(sample)
        self.assertIsNotNone(res)
        self.assertEqual(res["id"], "RC-09")

    # --- RC-10: DHCP Exhaustion ---
    def test_rc10_positive(self):
        sample = "Total leases : 254\nAddress pool is empty"
        res = check_rc10_dhcp_exhaustion(sample)
        self.assertIsNotNone(res)
        self.assertEqual(res["id"], "RC-10")

    # --- RC-11: DHCP Relay ---
    def test_rc11_positive(self):
        sample = "interface Vlan10\n ip address 10.10.10.1 255.255.255.0\n missing ip helper-address"
        res = check_rc11_dhcp_relay(sample)
        self.assertIsNotNone(res)
        self.assertEqual(res["id"], "RC-11")

    # --- RC-12: NAT Pool Exhaustion ---
    def test_rc12_positive(self):
        sample = "NAT translation failed: pool exhausted"
        res = check_rc12_nat_pool_exhaustion(sample)
        self.assertIsNotNone(res)
        self.assertEqual(res["id"], "RC-12")

    # --- RC-13: Port Security ---
    def test_rc13_positive(self):
        sample = "%PM-4-ERR_DISABLE: psecure-violation error detected on Fa0/1, putting Fa0/1 in err-disable state"
        res = check_rc13_port_security(sample)
        self.assertIsNotNone(res)
        self.assertEqual(res["id"], "RC-13")

    # --- RC-14: NAT Inside/Outside ---
    def test_rc14_positive(self):
        sample = "ip nat inside source list 1 interface Gi0/0 overload\nmissing ip nat outside"
        res = check_rc14_nat_inside_outside(sample)
        self.assertIsNotNone(res)
        self.assertEqual(res["id"], "RC-14")

    # --- RC-15: 802.1Q Encapsulation ---
    def test_rc15_positive(self):
        sample = "interface GigabitEthernet0/0.20\n encapsulation dot1Q 10\n ip address 10.20.20.1 255.255.255.0"
        res = check_rc15_dot1q_encapsulation(sample)
        self.assertIsNotNone(res)
        self.assertEqual(res["id"], "RC-15")

    def test_clean_config_compliant(self):
        """A healthy Cisco configuration should return COMPLIANT with 0 errors."""
        healthy_log = """
        CORE-01# show ip interface brief
        Interface              IP-Address      OK? Method Status                Protocol
        GigabitEthernet0/0     192.168.1.1     YES manual up                    up
        GigabitEthernet0/1     10.10.10.1      YES manual up                    up
        Loopback0              1.1.1.1         YES manual up                    up
        """
        res = run_checks(healthy_log)
        self.assertEqual(res["status"], "COMPLIANT")
        self.assertEqual(len(res["rules_triggered"]), 0)


if __name__ == "__main__":
    unittest.main()
