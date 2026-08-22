import { DiagnosticCase } from './types';

export const INITIAL_CASES: DiagnosticCase[] = [
  {
    id: "NET-001",
    title: "Inter-VLAN routing sub-interface administratively down",
    severity: "High",
    status: "Pending Review",
    category: "Inter-VLAN Routing",
    timestamp: "2026-08-20 08:35:00",
    operator: "J. Doe",
    networkProblem: "PC1 cannot reach Server1 in VLAN 30. Router-on-a-stick configuration seems broken on GigabitEthernet0/0.30.",
    networkEvidence: {
      hostname: "CORE-ROUTER-01",
      showCommandOutput: `CORE-ROUTER-01# show ip interface brief
Interface              IP-Address      OK? Method Status                Protocol
GigabitEthernet0/0     unassigned      YES unset  up                    up
GigabitEthernet0/0.10  10.10.10.1      YES manual up                    up
GigabitEthernet0/0.30  10.30.30.1      YES manual administratively down down
GigabitEthernet0/1     172.16.1.1      YES manual up                    up`,
      commandHistory: ["show ip interface brief", "show interfaces summary"]
    },
    ruleChecks: [
      { id: "RC-01", ruleName: "Administratively Down Interface", status: "fail", category: "Routing", details: "GigabitEthernet0/0.30 SVI/Sub-interface is administratively down (shutdown config detected)." },
      { id: "RC-02", ruleName: "Physical Line Protocol Check", status: "pass", category: "Security", details: "VLAN 30 encapsulation correctly bound to GigabitEthernet0/0.30." }
    ],
    groundTruth: {
      expectedFault: "Sub-interface GigabitEthernet0/0.30 is administratively down.",
      expectedOsiLayer: "Layer 3 (Network)",
      expectedNextCommand: "show ip interface brief",
      expectedFixSteps: [
        "configure terminal",
        "interface GigabitEthernet0/0.30",
        "no shutdown"
      ],
      expectedRuleIds: "RC-01"
    },
    aiDiagnosis: {
      rootCause: "The sub-interface GigabitEthernet0/0.30 is administratively disabled, which prevents routing gateway operations for VLAN 30 clients.",
      osiLayer: "Layer 3 (Network)",
      confidence: 97,
      confidenceLevel: "High",
      evidenceHighlight: "GigabitEthernet0/0.30 is administratively down, line protocol is down.",
      nextCommand: "show running-config interface GigabitEthernet0/0.30",
      fixSteps: [
        "configure terminal",
        "interface GigabitEthernet0/0.30",
        "no shutdown"
      ],
      hallucinationFlag: false,
      groundingStatus: "GROUNDED",
      evaluationAgainstGroundTruth: "CORRECT",
      evaluationNotes: "Validated against dataset benchmark ground truth."
    },
    topology: {
      nodes: [
        { id: "pc1", name: "User-PC-01", type: "PC", ip: "10.10.10.15", vlan: "VLAN 10", status: "active", x: 100, y: 320, interfaces: ["Fa0/1"] },
        { id: "sw1", name: "ACCESS-SWITCH-01", type: "Switch", ip: "10.10.10.2", status: "active", x: 300, y: 180, interfaces: ["Gi0/1", "Gi0/2"] },
        { id: "r1", name: "CORE-ROUTER-01", type: "Router", ip: "10.10.10.1", status: "warning", x: 500, y: 180, interfaces: ["Gi0/0.10", "Gi0/0.30"] },
        { id: "srv1", name: "Auth-Server-01", type: "Server", ip: "10.30.30.50", vlan: "VLAN 30", status: "failed", x: 700, y: 320, interfaces: ["Gi1/1"] }
      ],
      links: [
        { source: "pc1", target: "sw1", status: "active", bandwidth: "100 Mbps" },
        { source: "sw1", target: "r1", status: "active", bandwidth: "1 Gbps" },
        { source: "r1", target: "srv1", status: "failed", bandwidth: "1 Gbps (Sub-if Down)" }
      ]
    }
  }
];

export const RESPONSIBLE_AI_CASES = [
  {
    id: "NET-014",
    caseName: "ACL Filtering vs DHCP Relay Misdirection",
    description: "AI diagnosed the symptom as DHCP pool exhaustion and proposed 'ip dhcp pool VLAN20', overlooking the active access-list.",
    caughtBy: "Deterministic Rule RC-09 & Human Review",
    correction: "Operator verified access-list 101 denied UDP port 67/68 traffic to DHCP server. Substituted ACL permit for bootps instead of pool recreation.",
    safetyRating: "100% Corrected"
  },
  {
    id: "NET-018",
    caseName: "Wildcard Route Permissive Over-extension",
    description: "AI proposed a wide-open remediation 'access-list 100 permit ip any any' violating zero-trust isolation policies.",
    caughtBy: "Safety Gate Interception",
    correction: "Safety engine blocked the rule and human operator scoped the permit specifically to 'permit tcp host 10.10.10.15 host 10.30.30.50 eq 22'.",
    safetyRating: "100% Intercepted"
  },
  {
    id: "NET-022",
    caseName: "OSPF MTU Mismatch vs Router-ID Conflict",
    description: "AI misidentified neighbor adjacency failure as duplicate Router-ID 1.1.1.1 across neighbor adjacency.",
    caughtBy: "Human Operator Review (CCIE #54210)",
    correction: "Operator verified MTU 1500 vs 1492 on serial link. DBD packets were stuck in EXSTART due to MTU size disparity, not OSPF ID.",
    safetyRating: "100% Corrected"
  },
  {
    id: "NET-027",
    caseName: "ACL DNS UDP 53 Port-Level Refinement",
    description: "AI proposed flushing the entire branch access-list to restore DNS lookup functionality.",
    caughtBy: "Human Review Gate",
    correction: "Operator preserved zero-trust security policy by editing fix steps to permit UDP domain port 53 specifically.",
    safetyRating: "100% Corrected"
  },
  {
    id: "NET-031",
    caseName: "Wireless DHCP Relay Helper-Address Omission",
    description: "AI identified AP association failure but proposed client WLAN remapping without configuring the mandatory DHCP relay.",
    caughtBy: "Deterministic Rule RC-11 & Operator",
    correction: "Operator added 'ip helper-address 192.168.1.100' on the router subinterface to enable CAPWAP wireless clients to obtain dynamic IPs.",
    safetyRating: "100% Corrected"
  }
];
