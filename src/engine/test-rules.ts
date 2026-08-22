import { runDeterministicChecks } from './checker.ts';

export interface RuleUnitTest {
  ruleId: string;
  type: "positive" | "negative" | "edge-case" | "similar-valid" | "malformed";
  name: string;
  input: string;
  expectedTriggered: boolean;
}

export interface RuleSuiteResult {
  passed: boolean;
  totalTests: number;
  passedTests: number;
  positiveCount: number;
  negativeCount: number;
  edgeCount: number;
  caseIdIndependencePassed: boolean;
  errors: string[];
}

export const unitTests: RuleUnitTest[] = [
  // -------------------------------------------------------------
  // RC-01: Interface Administratively Shutdown
  // -------------------------------------------------------------
  {
    ruleId: "RC-01",
    type: "positive",
    name: "RC-01 Positive: Interface explicitly shutdown in config",
    input: "interface GigabitEthernet0/1\n shutdown\n",
    expectedTriggered: true
  },
  {
    ruleId: "RC-01",
    type: "positive",
    name: "RC-01 Positive: Interface administratively down in show ip int brief",
    input: "GigabitEthernet0/0.30  10.10.30.1  YES manual administratively down down",
    expectedTriggered: true
  },
  {
    ruleId: "RC-01",
    type: "negative",
    name: "RC-01 Negative: Interface explicitly active with no shutdown",
    input: "interface GigabitEthernet0/1\n no shutdown\n",
    expectedTriggered: false
  },
  {
    ruleId: "RC-01",
    type: "edge-case",
    name: "RC-01 Edge: Text refers to shutdown policy without interface shutdown",
    input: "The interface shutdown policy schedule is inactive.",
    expectedTriggered: false
  },
  {
    ruleId: "RC-01",
    type: "similar-valid",
    name: "RC-01 Similar-Valid: Interface with description containing shutdown word but enabled",
    input: "interface GigabitEthernet0/1\n description Planned-Shutdown-Port\n no shutdown",
    expectedTriggered: false
  },
  {
    ruleId: "RC-01",
    type: "malformed",
    name: "RC-01 Malformed: Truncated interface config with shutdown",
    input: "interface GigabitEthernet0/1\n shut",
    expectedTriggered: true
  },

  // -------------------------------------------------------------
  // RC-02: Line Protocol Down / Physical Link Down
  // -------------------------------------------------------------
  {
    ruleId: "RC-02",
    type: "positive",
    name: "RC-02 Positive: Interface down and line protocol down (notconnect)",
    input: "GigabitEthernet0/1 is down, line protocol is down (notconnect)",
    expectedTriggered: true
  },
  {
    ruleId: "RC-02",
    type: "negative",
    name: "RC-02 Negative: Interface up and line protocol up",
    input: "GigabitEthernet0/1 is up, line protocol is up",
    expectedTriggered: false
  },
  {
    ruleId: "RC-02",
    type: "edge-case",
    name: "RC-02 Edge: Administratively down line protocol (handled by RC-01, not RC-02)",
    input: "GigabitEthernet0/1 is administratively down, line protocol is down",
    expectedTriggered: false
  },
  {
    ruleId: "RC-02",
    type: "similar-valid",
    name: "RC-02 Similar-Valid: FastEthernet0/1 connected and operational",
    input: "FastEthernet0/1 is up, line protocol is up (connected)",
    expectedTriggered: false
  },

  // -------------------------------------------------------------
  // RC-03: Subnet Mask Mismatch / IP Subnet Conflict
  // -------------------------------------------------------------
  {
    ruleId: "RC-03",
    type: "positive",
    name: "RC-03 Positive: Conflicting subnet mask scopes (/30 vs /24)",
    input: "ip address 10.1.1.1 255.255.255.252 (Configured as 255.255.255.252, conflicting with 255.255.255.0)",
    expectedTriggered: true
  },
  {
    ruleId: "RC-03",
    type: "negative",
    name: "RC-03 Negative: Standard matching subnet mask",
    input: "ip address 10.1.1.1 255.255.255.0",
    expectedTriggered: false
  },
  {
    ruleId: "RC-03",
    type: "edge-case",
    name: "RC-03 Edge: Subnet mask in remark only",
    input: "remark Subnet mask 255.255.255.0 is standard corporate policy",
    expectedTriggered: false
  },
  {
    ruleId: "RC-03",
    type: "similar-valid",
    name: "RC-03 Similar-Valid: Consistent point-to-point /30 mask on both peers",
    input: "interface Gi0/1\n ip address 10.1.1.1 255.255.255.252\ninterface Gi0/2\n ip address 10.1.1.2 255.255.255.252",
    expectedTriggered: false
  },

  // -------------------------------------------------------------
  // RC-04: Default Gateway Validation
  // -------------------------------------------------------------
  {
    ruleId: "RC-04",
    type: "positive",
    name: "RC-04 Positive: Default Gateway mismatched or incorrect IP",
    input: "Default Gateway . . . . . : 10.10.10.254 (MISMATCHED - expected 10.10.10.1)",
    expectedTriggered: true
  },
  {
    ruleId: "RC-04",
    type: "negative",
    name: "RC-04 Negative: Default Gateway correctly configured",
    input: "Default Gateway . . . . . : 10.10.10.1",
    expectedTriggered: false
  },
  {
    ruleId: "RC-04",
    type: "edge-case",
    name: "RC-04 Edge: Gateway mentioned in documentation remark",
    input: "remark Primary default gateway router address is 10.10.10.1",
    expectedTriggered: false
  },
  {
    ruleId: "RC-04",
    type: "similar-valid",
    name: "RC-04 Similar-Valid: Host ipconfig with matching default gateway",
    input: "IPv4 Address. . . . . . . . . . . : 10.10.10.50\nSubnet Mask . . . . . . . . . . . : 255.255.255.0\nDefault Gateway . . . . . . . . . : 10.10.10.1",
    expectedTriggered: false
  },

  // -------------------------------------------------------------
  // RC-05: Duplicate IP Address Conflict
  // -------------------------------------------------------------
  {
    ruleId: "RC-05",
    type: "positive",
    name: "RC-05 Positive: Duplicate IP address alert in syslog",
    input: "%IP-4-DUPADDR: Duplicate IP address 10.10.10.1 on GigabitEthernet0/0, sourced by 0050.7966.6800",
    expectedTriggered: true
  },
  {
    ruleId: "RC-05",
    type: "negative",
    name: "RC-05 Negative: Clean ARP entry without duplicate address alert",
    input: "Internet  10.10.10.1            -   0050.7966.6800  ARPA   GigabitEthernet0/0",
    expectedTriggered: false
  },
  {
    ruleId: "RC-05",
    type: "edge-case",
    name: "RC-05 Edge: Duplicate packet suppression counters normal",
    input: "IP duplicate packet suppression active: 0 dropped",
    expectedTriggered: false
  },
  {
    ruleId: "RC-05",
    type: "similar-valid",
    name: "RC-05 Similar-Valid: Multiple unique IP addresses on distinct interfaces",
    input: "Internet 10.10.10.2 - 0050.7966.6801 ARPA Gi0/1\nInternet 10.10.20.2 - 0050.7966.6802 ARPA Gi0/2",
    expectedTriggered: false
  },

  // -------------------------------------------------------------
  // RC-06: VLAN Not in Local Database / VLAN Mapping
  // -------------------------------------------------------------
  {
    ruleId: "RC-06",
    type: "positive",
    name: "RC-06 Positive: VLAN missing from local switch database",
    input: "VLAN 20 is missing from local switch database",
    expectedTriggered: true
  },
  {
    ruleId: "RC-06",
    type: "negative",
    name: "RC-06 Negative: VLAN active in local switch database",
    input: "show vlan brief\n20   Marketing                        active    Fa0/1, Fa0/2\n30   Sales                            active    Fa0/3",
    expectedTriggered: false
  },
  {
    ruleId: "RC-06",
    type: "edge-case",
    name: "RC-06 Edge: VLAN mentioned in config banner",
    input: "! VLAN 20 is scheduled for creation next maintenance window",
    expectedTriggered: false
  },
  {
    ruleId: "RC-06",
    type: "similar-valid",
    name: "RC-06 Similar-Valid: Comprehensive VLAN brief table",
    input: "show vlan brief\n1    default                          active    Gi0/1, Gi0/2\n10   Engineering                      active    Fa0/1, Fa0/2\n20   Marketing                        active    Fa0/3\n30   Sales                            active    Fa0/4\n44   Accounting                       active    Fa0/5\n99   Staff-Wifi                       active    Gi0/24",
    expectedTriggered: false
  },

  // -------------------------------------------------------------
  // RC-07: Trunk Allowed VLAN Mismatch / Native VLAN Mismatch
  // -------------------------------------------------------------
  {
    ruleId: "RC-07",
    type: "positive",
    name: "RC-07 Positive: Trunk allowed VLAN missing required VLAN 80",
    input: "Port Gi0/24 Vlans allowed on trunk 1,10,20,30\n(WARNING: VLAN 80 is not in the allowed list on the trunk port!)",
    expectedTriggered: true
  },
  {
    ruleId: "RC-07",
    type: "positive",
    name: "RC-07 Positive: Native VLAN mismatch discovered via CDP",
    input: "%CDP-4-NATIVE_VLAN_MISMATCH: Native VLAN mismatch discovered on GigabitEthernet0/1 (99), with ACCESS-SWITCH-01 GigabitEthernet0/1 (1)",
    expectedTriggered: true
  },
  {
    ruleId: "RC-07",
    type: "negative",
    name: "RC-07 Negative: Trunk allowed VLAN permits all required VLANs",
    input: "Port Gi0/24 Vlans allowed on trunk 1-4094",
    expectedTriggered: false
  },
  {
    ruleId: "RC-07",
    type: "edge-case",
    name: "RC-07 Edge: Access port configuration",
    input: "switchport mode access\nswitchport access vlan 10",
    expectedTriggered: false
  },
  {
    ruleId: "RC-07",
    type: "similar-valid",
    name: "RC-07 Similar-Valid: Explicit trunk allow list covering all network VLANs",
    input: "switchport trunk allowed vlan 10,20,30,80,99\nswitchport trunk native vlan 99",
    expectedTriggered: false
  },

  // -------------------------------------------------------------
  // RC-08: Subnet Routing Integrity / Missing Route / OSPF
  // -------------------------------------------------------------
  {
    ruleId: "RC-08",
    type: "positive",
    name: "RC-08 Positive: OSPF missing default-information originate",
    input: "Router lacks default-information originate to advertise default route",
    expectedTriggered: true
  },
  {
    ruleId: "RC-08",
    type: "negative",
    name: "RC-08 Negative: Valid OSPF route present in routing table",
    input: "O 10.10.10.0/24 [110/2] via 192.168.1.1",
    expectedTriggered: false
  },
  {
    ruleId: "RC-08",
    type: "edge-case",
    name: "RC-08 Edge: Upstream BGP note",
    input: "Note: Default route configured via BGP upstream neighbor.",
    expectedTriggered: false
  },
  {
    ruleId: "RC-08",
    type: "similar-valid",
    name: "RC-08 Similar-Valid: Properly originated default route in OSPF",
    input: "ip route 0.0.0.0 0.0.0.0 203.0.113.1\nrouter ospf 1\n default-information originate",
    expectedTriggered: false
  },

  // -------------------------------------------------------------
  // RC-09: ACL Implicit or Explicit Deny Blocking Traffic
  // -------------------------------------------------------------
  {
    ruleId: "RC-09",
    type: "positive",
    name: "RC-09 Positive: ACL explicit deny blocking web and DNS traffic",
    input: "Extended IP access list 101\n 10 deny tcp any host 10.1.1.5 eq 80\n 20 deny udp any any eq 53",
    expectedTriggered: true
  },
  {
    ruleId: "RC-09",
    type: "negative",
    name: "RC-09 Negative: ACL permit all required traffic",
    input: "Extended IP access list 101\n 10 permit ip any any",
    expectedTriggered: false
  },
  {
    ruleId: "RC-09",
    type: "edge-case",
    name: "RC-09 Edge: Access list remark with deny keyword in comment",
    input: "remark Deny unauthorized access during off hours",
    expectedTriggered: false
  },
  {
    ruleId: "RC-09",
    type: "similar-valid",
    name: "RC-09 Similar-Valid: Access list explicitly permitting HTTP and DNS",
    input: "Extended IP access list 101\n 10 permit tcp any host 10.1.1.5 eq 80\n 20 permit udp any any eq 53",
    expectedTriggered: false
  },

  // -------------------------------------------------------------
  // RC-10: DHCP Lease Pool Capacity / Option 43
  // -------------------------------------------------------------
  {
    ruleId: "RC-10",
    type: "positive",
    name: "RC-10 Positive: DHCP Option 43 missing for WLC",
    input: "%CAPWAP-3-ERROR_HANDSHAKE: Failed to join WLC. DHCP Option 43 is missing from DHCP Pool.",
    expectedTriggered: true
  },
  {
    ruleId: "RC-10",
    type: "negative",
    name: "RC-10 Negative: DHCP Pool has healthy available lease capacity",
    input: "Pool LAN-POOL: Total addresses: 254, Leased addresses: 45",
    expectedTriggered: false
  },
  {
    ruleId: "RC-10",
    type: "edge-case",
    name: "RC-10 Edge: DHCP snooping enabled without exhaustion",
    input: "ip dhcp snooping vlan 10",
    expectedTriggered: false
  },
  {
    ruleId: "RC-10",
    type: "similar-valid",
    name: "RC-10 Similar-Valid: DHCP pool with valid Option 43 configured",
    input: "ip dhcp pool WLC-POOL\n network 192.168.10.0 255.255.255.0\n option 43 ip 192.168.1.50",
    expectedTriggered: false
  },

  // -------------------------------------------------------------
  // RC-11: DHCP Helper Address Validation
  // -------------------------------------------------------------
  {
    ruleId: "RC-11",
    type: "positive",
    name: "RC-11 Positive: Missing ip helper-address on router interface",
    input: "Router(config-if)# (ip helper-address is missing on interface GigabitEthernet0/0.10 for DHCP relay)",
    expectedTriggered: true
  },
  {
    ruleId: "RC-11",
    type: "negative",
    name: "RC-11 Negative: Valid ip helper-address configured on subinterface",
    input: "interface GigabitEthernet0/0.10\n ip helper-address 10.1.1.100",
    expectedTriggered: false
  },
  {
    ruleId: "RC-11",
    type: "edge-case",
    name: "RC-11 Edge: Helper word in interface description",
    input: "description DHCP server helper link",
    expectedTriggered: false
  },
  {
    ruleId: "RC-11",
    type: "similar-valid",
    name: "RC-11 Similar-Valid: Valid helper-address on multiple subinterfaces",
    input: "interface GigabitEthernet0/0.20\n ip helper-address 192.168.1.10\ninterface GigabitEthernet0/0.30\n ip helper-address 192.168.1.10",
    expectedTriggered: false
  },

  // -------------------------------------------------------------
  // RC-12: NAT Pool Capacity Verification
  // -------------------------------------------------------------
  {
    ruleId: "RC-12",
    type: "positive",
    name: "RC-12 Positive: Dynamic NAT pool exhausted with translation failures",
    input: "NAT: translation creation failures: 120 (NAT pool exhausted)",
    expectedTriggered: true
  },
  {
    ruleId: "RC-12",
    type: "negative",
    name: "RC-12 Negative: Active translations within pool capacity",
    input: "Total active translations: 14 (0 inside global, 14 inside local)",
    expectedTriggered: false
  },
  {
    ruleId: "RC-12",
    type: "edge-case",
    name: "RC-12 Edge: NAT translation count normal log",
    input: "IP NAT translations active: 14",
    expectedTriggered: false
  },
  {
    ruleId: "RC-12",
    type: "similar-valid",
    name: "RC-12 Similar-Valid: NAT pool with ample available addresses",
    input: "ip nat pool POOL1 203.0.113.10 203.0.113.20 netmask 255.255.255.0\nAllocated: 2/11",
    expectedTriggered: false
  },

  // -------------------------------------------------------------
  // RC-13: Port-Security Err-Disabled
  // -------------------------------------------------------------
  {
    ruleId: "RC-13",
    type: "positive",
    name: "RC-13 Positive: Interface err-disabled due to port-security violation",
    input: "GigabitEthernet0/1 is down, line protocol is down (err-disabled)\n%PM-4-ERR_DISABLE: psecure-violation error detected",
    expectedTriggered: true
  },
  {
    ruleId: "RC-13",
    type: "negative",
    name: "RC-13 Negative: Port security enabled with secure-up status",
    input: "Port Security: Enabled, Port Status: Secure-up, Violation Mode: Shutdown",
    expectedTriggered: false
  },
  {
    ruleId: "RC-13",
    type: "edge-case",
    name: "RC-13 Edge: Port security violation counter is 0",
    input: "Security Violation Count: 0",
    expectedTriggered: false
  },
  {
    ruleId: "RC-13",
    type: "similar-valid",
    name: "RC-13 Similar-Valid: Port security configured with restrict violation mode",
    input: "switchport port-security\nswitchport port-security maximum 2\nswitchport port-security violation restrict",
    expectedTriggered: false
  },

  // -------------------------------------------------------------
  // RC-14: NAT Configuration Check (Inside/Outside Declarations)
  // -------------------------------------------------------------
  {
    ruleId: "RC-14",
    type: "positive",
    name: "RC-14 Positive: Missing outside declaration on WAN interface",
    input: "interface Serial0/0/0\n (missing outside declaration for ip nat)",
    expectedTriggered: true
  },
  {
    ruleId: "RC-14",
    type: "negative",
    name: "RC-14 Negative: Correctly configured NAT inside and outside interfaces",
    input: "interface GigabitEthernet0/0\n ip nat inside\ninterface GigabitEthernet0/1\n ip nat outside",
    expectedTriggered: false
  },
  {
    ruleId: "RC-14",
    type: "edge-case",
    name: "RC-14 Edge: Description contains outside keyword",
    input: "description Outside internet link",
    expectedTriggered: false
  },
  {
    ruleId: "RC-14",
    type: "similar-valid",
    name: "RC-14 Similar-Valid: NAT inside LAN interface and outside Serial interface",
    input: "interface GigabitEthernet0/0\n ip nat inside\n!\ninterface Serial0/0/0\n ip nat outside",
    expectedTriggered: false
  },

  // -------------------------------------------------------------
  // RC-15: 802.1Q Encapsulation Verification
  // -------------------------------------------------------------
  {
    ruleId: "RC-15",
    type: "positive",
    name: "RC-15 Positive: Subinterface 0/0.10 configured with encapsulation dot1Q 20",
    input: "interface GigabitEthernet0/0.10\n encapsulation dot1Q 20\n ip address 10.10.10.1 255.255.255.0",
    expectedTriggered: true
  },
  {
    ruleId: "RC-15",
    type: "negative",
    name: "RC-15 Negative: Subinterface 0/0.10 matching encapsulation dot1Q 10",
    input: "interface GigabitEthernet0/0.10\n encapsulation dot1Q 10\n ip address 10.10.10.1 255.255.255.0",
    expectedTriggered: false
  },
  {
    ruleId: "RC-15",
    type: "edge-case",
    name: "RC-15 Edge: Native VLAN encapsulation on subinterface",
    input: "interface GigabitEthernet0/0.1\n encapsulation dot1Q 1 native",
    expectedTriggered: false
  },
  {
    ruleId: "RC-15",
    type: "similar-valid",
    name: "RC-15 Similar-Valid: Subinterface 0/0.30 matching encapsulation dot1Q 30",
    input: "interface GigabitEthernet0/0.30\n encapsulation dot1Q 30\n ip address 10.10.30.1 255.255.255.0",
    expectedTriggered: false
  }
];

/**
 * Verifies that rule evaluation is strictly driven by evidence text,
 * and is 100% independent of the case_id string.
 */
export function runCaseIdIndependenceTests(): { passed: boolean; errors: string[] } {
  const errors: string[] = [];

  // 1. Check NET-001 evidence with authentic ID vs FAKE-001 ID
  const net001Evidence = "GigabitEthernet0/0.30  10.10.30.1  YES manual administratively down down";
  const resRealId = runDeterministicChecks(net001Evidence, "NET-001", "Subinterface down", "Routing");
  const resFakeId = runDeterministicChecks(net001Evidence, "FAKE-001", "Subinterface down", "Routing");

  const realTriggered = resRealId.filter(r => r.status === "fail" || r.status === "warn").map(r => r.id);
  const fakeTriggered = resFakeId.filter(r => r.status === "fail" || r.status === "warn").map(r => r.id);

  if (realTriggered.join(',') !== fakeTriggered.join(',')) {
    errors.push(`Case-ID Independence Failure: Changing case ID from 'NET-001' to 'FAKE-001' changed rule triggers from [${realTriggered}] to [${fakeTriggered}]`);
  }

  // 2. Check synthetic case ID with NET-001 evidence
  const resSyntheticId = runDeterministicChecks(net001Evidence, "TEST-CUSTOM-999", "Synthetic test", "Routing");
  const syntheticTriggered = resSyntheticId.filter(r => r.status === "fail" || r.status === "warn").map(r => r.id);
  if (!syntheticTriggered.includes("RC-01")) {
    errors.push("Case-ID Independence Failure: Synthetic ID 'TEST-CUSTOM-999' failed to trigger RC-01 on administratively down evidence");
  }

  // 3. Test empty case ID
  const resEmptyId = runDeterministicChecks(net001Evidence, "", "", "");
  const emptyTriggered = resEmptyId.filter(r => r.status === "fail" || r.status === "warn").map(r => r.id);
  if (!emptyTriggered.includes("RC-01")) {
    errors.push("Case-ID Independence Failure: Empty case ID failed to trigger RC-01 on administratively down evidence");
  }

  return {
    passed: errors.length === 0,
    errors
  };
}

export function runRuleEngineTests(): RuleSuiteResult {
  const errors: string[] = [];
  let passedTests = 0;
  let positiveCount = 0;
  let negativeCount = 0;
  let edgeCount = 0;

  for (const t of unitTests) {
    if (t.type === "positive") positiveCount++;
    else if (t.type === "negative" || t.type === "similar-valid") negativeCount++;
    else if (t.type === "edge-case") edgeCount++;

    const checks = runDeterministicChecks(t.input, "UNIT-TEST", t.name, "UNIT");
    const triggered = checks.some(c => c.id === t.ruleId && (c.status === "fail" || c.status === "warn"));

    if (triggered === t.expectedTriggered) {
      passedTests++;
    } else {
      errors.push(`${t.ruleId} [${t.type}] "${t.name}" -> Expected triggered=${t.expectedTriggered}, got ${triggered}`);
    }
  }

  const caseIdCheck = runCaseIdIndependenceTests();
  if (!caseIdCheck.passed) {
    errors.push(...caseIdCheck.errors);
  }

  return {
    passed: errors.length === 0 && caseIdCheck.passed,
    totalTests: unitTests.length + 3, // unit tests + 3 case-ID checks
    passedTests: passedTests + (caseIdCheck.passed ? 3 : 0),
    positiveCount,
    negativeCount,
    edgeCount,
    caseIdIndependencePassed: caseIdCheck.passed,
    errors
  };
}
