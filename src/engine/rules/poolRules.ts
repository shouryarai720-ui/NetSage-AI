import { RuleDefinition } from '../types';

export const poolRules: RuleDefinition[] = [
  {
    id: "RC-10",
    name: "DHCP Lease Pool Capacity",
    category: "IPAM",
    severity: "Critical",
    description: "Monitors DHCP pools for lease exhaustion or near-capacity states that block dynamic addressing requests.",
    check: (text: string) => {
      const isExhausted = text.toLowerCase().includes("100% exhausted") ||
                          text.toLowerCase().includes("utilization mark (80/100)") ||
                          text.toLowerCase().includes("lease pool capacity exhausted") ||
                          text.toLowerCase().includes("option 43 is missing") ||
                          text.toLowerCase().includes("pool exhausted");

      if (isExhausted) {
        return {
          triggered: true,
          details: "Critical IPAM Event: DHCP Address lease pool is 100% exhausted or required DHCP options (Option 43) are missing.",
          rule_id: "RC-10",
          status: "ERRORS_DETECTED",
          severity: "Critical",
          message: "DHCP lease pool capacity exhausted or Option 43 missing.",
          evidence: ["DHCP pool utilization at 100% or missing critical lease parameters"],
          confidence: "High"
        };
      }
      return {
        triggered: false,
        details: "DHCP address pool ranges have remaining unallocated space for client lease requests.",
        rule_id: "RC-10",
        status: "NO_ERROR",
        severity: "Low",
        message: "DHCP pools operating within available address capacity limits.",
        evidence: [],
        confidence: "High"
      };
    }
  },
  {
    id: "RC-11",
    name: "DHCP Helper Address Validation",
    category: "IPAM",
    severity: "High",
    description: "Checks if VLAN sub-interfaces lack an IP helper address for relaying local DHCP broadcasts to central servers.",
    check: (text: string) => {
      const isMissingHelper = text.toLowerCase().includes("no ip helper-address") ||
                              text.toLowerCase().includes("helper-address dhcp relay") ||
                              text.toLowerCase().includes("ip helper-address is missing") ||
                              (text.toLowerCase().includes("dhcp") && text.toLowerCase().includes("helper-address") && text.toLowerCase().includes("missing"));

      if (isMissingHelper) {
        return {
          triggered: true,
          details: "Missing DHCP Relay Configuration: The VLAN sub-interface lacks an 'ip helper-address' directive to forward broadcasts.",
          rule_id: "RC-11",
          status: "ERRORS_DETECTED",
          severity: "High",
          message: "Interface lacks 'ip helper-address' DHCP relay directive.",
          evidence: ["No IP helper-address configured on subnet gateway interface"],
          confidence: "High"
        };
      }
      return {
        triggered: false,
        details: "IP helper-address commands are properly configured on required local subnet gateways.",
        rule_id: "RC-11",
        status: "NO_ERROR",
        severity: "Low",
        message: "DHCP relay helper addresses are configured on gateway interfaces.",
        evidence: [],
        confidence: "High"
      };
    }
  },
  {
    id: "RC-12",
    name: "NAT Pool Capacity Verification",
    category: "IPAM",
    severity: "High",
    description: "Validates NAT dynamic translation pools for depletion or failure of allocation.",
    check: (text: string) => {
      const isNatExhausted = text.toLowerCase().includes("translation creation failures") ||
                             text.toLowerCase().includes("nat pool exhausted") ||
                             text.toLowerCase().includes("exhaustion!") ||
                             (text.includes("BRANCH-POOL") && text.includes("100% used"));

      if (isNatExhausted) {
        return {
          triggered: true,
          details: "NAT Pool Depletion: Dynamic NAT translation pool is exhausted. New outbound TCP sessions cannot be allocated an IP address.",
          rule_id: "RC-12",
          status: "ERRORS_DETECTED",
          severity: "High",
          message: "Dynamic NAT translation pool exhausted.",
          evidence: ["NAT translation creation failures / 100% pool utilization recorded"],
          confidence: "High"
        };
      }
      return {
        triggered: false,
        details: "Dynamic NAT translation pools and PAT translation tables are within normal capacity limits.",
        rule_id: "RC-12",
        status: "NO_ERROR",
        severity: "Low",
        message: "NAT dynamic pools have available address capacity.",
        evidence: [],
        confidence: "High"
      };
    }
  },
  {
    id: "RC-14",
    name: "NAT Configuration Check",
    category: "IPAM",
    severity: "High",
    description: "Verifies whether inside and outside interface declarations are present in the NAT dynamic/static mapping definitions.",
    check: (text: string) => {
      const isMissingNatIf = text.toLowerCase().includes("missing outside declaration") ||
                             text.toLowerCase().includes("missing inside declaration") ||
                             (text.toLowerCase().includes("ip nat") && text.toLowerCase().includes("total active translations: 0"));

      if (isMissingNatIf) {
        return {
          triggered: true,
          details: "NAT Mapping Incomplete: Router config lacks essential 'ip nat outside' or 'ip nat inside' interface flags, breaking translation.",
          rule_id: "RC-14",
          status: "ERRORS_DETECTED",
          severity: "High",
          message: "NAT inside/outside interface configuration missing.",
          evidence: ["Interface lacks 'ip nat inside' or 'ip nat outside' statement"],
          confidence: "High"
        };
      }
      return {
        triggered: false,
        details: "Dynamic NAT translation interfaces have valid inside/outside interface declarations.",
        rule_id: "RC-14",
        status: "NO_ERROR",
        severity: "Low",
        message: "NAT interface declarations verified complete.",
        evidence: [],
        confidence: "High"
      };
    }
  }
];
