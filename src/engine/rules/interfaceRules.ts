import { RuleDefinition } from '../types';

export const interfaceRules: RuleDefinition[] = [
  {
    id: "RC-01",
    name: "Administratively Down Interface",
    category: "Routing",
    severity: "Critical",
    description: "Detects when a network interface has been manually disabled with a shutdown directive.",
    check: (text: string) => {
      const lower = text.toLowerCase();
      let isDown = false;
      let ifName = "Interface";

      // 1. Check for standard syslog / interface brief status
      if (lower.includes("administratively down")) {
        isDown = true;
        const match = text.match(/([A-Za-z0-9\/\.\-]+)\s+is administratively down/i) || 
                      text.match(/([A-Za-z0-9\/\.\-]+)\s+(?:\d{1,3}\.){3}\d{1,3}\s+YES\s+manual\s+administratively down/i) ||
                      text.match(/([A-Za-z0-9\/\.\-]+)\s+.*administratively down/i);
        if (match) {
          ifName = match[1];
        }
      }

      // 2. Check for Cisco configuration block "interface <name>" with a "shutdown" line but NO "no shutdown" line
      if (!isDown) {
        // Split by interface keyword to isolate interface config blocks
        const blocks = text.split(/(?=interface\s)/i);
        for (const block of blocks) {
          if (/^interface\s+(\S+)/i.test(block)) {
            const ifMatch = block.match(/^interface\s+(\S+)/i);
            const blockIfName = ifMatch ? ifMatch[1] : "Interface";
            
            // Look for a line containing exactly "shutdown" or ending with "shutdown" (like " shutdown")
            // Ensure we don't match "no shutdown"
            const lines = block.split(/\r?\n/);
            let hasShutdown = false;
            let hasNoShutdown = false;
            
            for (const line of lines) {
              const trimmed = line.trim().toLowerCase();
              if (trimmed === "shutdown" || trimmed === "shut") {
                hasShutdown = true;
              } else if (trimmed === "no shutdown" || trimmed === "no shut") {
                hasNoShutdown = true;
              }
            }
            
            if (hasShutdown && !hasNoShutdown) {
              isDown = true;
              ifName = blockIfName;
              break;
            }
          }
        }
      }

      // 3. Fallback for simple inputs like raw "shutdown" (without interface block) while rejecting "no shutdown"
      if (!isDown && text.trim().toLowerCase() === "shutdown") {
        isDown = true;
        ifName = "Interface";
      }

      if (isDown) {
        return {
          triggered: true,
          details: `Critical vulnerability detected: ${ifName} is administratively disabled (shutdown directive active).`,
          rule_id: "RC-01",
          status: "ERRORS_DETECTED",
          severity: "Critical",
          message: `${ifName} is administratively down (shutdown directive active).`,
          evidence: [`Interface ${ifName} status is administratively down / shutdown`],
          confidence: "High"
        };
      }
      return {
        triggered: false,
        details: "No administratively disabled interfaces identified in the configuration log.",
        rule_id: "RC-01",
        status: "NO_ERROR",
        severity: "Low",
        message: "All monitored interfaces are enabled (no shutdown).",
        evidence: [],
        confidence: "High"
      };
    }
  },
  {
    id: "RC-02",
    name: "Physical Line Protocol Check",
    category: "Security",
    severity: "High",
    description: "Checks if physical carrier signal or line protocol is down, indicating layer 1/2 hardware failure.",
    check: (text: string) => {
      const isDown = (text.toLowerCase().includes("line protocol is down") || 
                      text.toLowerCase().includes("notconnect") || 
                      /fastethernet\s*\d+\/\d+\s+is\s+down/i.test(text) ||
                      /\s+down\s+down\b/i.test(text)) &&
                     !text.toLowerCase().includes("administratively down");
      if (isDown) {
        const match = text.match(/(\S+)\s+is down,\s+line protocol is down/i) || 
                      text.match(/(\S+)\s+.*down\s+down/i) ||
                      text.match(/(\S+)\s+is\s+down/i);
        const ifName = match ? match[1] : "Interface";
        return {
          triggered: true,
          details: `Physical link protocol is DOWN on ${ifName} (status: notconnect/down). Check cabling or transceiver.`,
          rule_id: "RC-02",
          status: "ERRORS_DETECTED",
          severity: "High",
          message: `Physical line protocol is down on ${ifName}.`,
          evidence: [`Line protocol is down / notconnect on ${ifName}`],
          confidence: "High"
        };
      }
      return {
        triggered: false,
        details: "Physical line protocols are fully synchronized and reporting logical up/up.",
        rule_id: "RC-02",
        status: "NO_ERROR",
        severity: "Low",
        message: "Physical interfaces report up/up state.",
        evidence: [],
        confidence: "High"
      };
    }
  },
  {
    id: "RC-13",
    name: "Port-Security err-disabled Check",
    category: "Security",
    severity: "High",
    description: "Identifies interfaces placed in error-disabled state due to security policy violations.",
    check: (text: string) => {
      const isErrDisabled = text.toLowerCase().includes("err-disabled") || 
                            text.toLowerCase().includes("secure-shutdown");
      if (isErrDisabled) {
        const match = text.match(/(\S+)\s+is\s+err-disabled/i) || 
                      text.match(/(\S+)\s+.*err-disabled/i);
        const ifName = match ? match[1] : "Interface";
        return {
          triggered: true,
          details: `Port security violation triggered err-disabled / secure-shutdown status on ${ifName}.`,
          rule_id: "RC-13",
          status: "ERRORS_DETECTED",
          severity: "High",
          message: `Port-security errdisable condition on ${ifName}.`,
          evidence: [`Interface ${ifName} is in err-disabled state due to port-security`],
          confidence: "High"
        };
      }
      return {
        triggered: false,
        details: "Port security states are operating within safe parameters.",
        rule_id: "RC-13",
        status: "NO_ERROR",
        severity: "Low",
        message: "No port-security violations or err-disabled interfaces.",
        evidence: [],
        confidence: "High"
      };
    }
  },
  {
    id: "RC-15",
    name: "802.1Q Encapsulation Verification",
    category: "Routing",
    severity: "High",
    description: "Validates sub-interface 802.1Q VLAN binding encapsulation tags against the logical sub-interface assignment.",
    check: (text: string) => {
      const lower = text.toLowerCase();
      const hasEncapWarning = lower.includes("mismatched encapsulation") || 
                              lower.includes("misconfigured encapsulation") ||
                              lower.includes("wrong encapsulation") ||
                              /encapsulation\s+dot1q\s+(\d+)/i.test(text);
      
      if (hasEncapWarning) {
        // Find sub-interfaces and their dot1q encapsulation tags
        const subIfBlocks = text.split(/(?=interface\s+[^\n\.]+\.\d+)/i);
        for (const block of subIfBlocks) {
          const subMatch = block.match(/interface\s+([^\n\s\.]+)\.(\d+)/i);
          const encapMatch = block.match(/encapsulation\s+dot1q\s+(\d+)/i);
          if (subMatch && encapMatch) {
            const subId = subMatch[2];
            const encapId = encapMatch[1];
            if (subId !== encapId) {
              return {
                triggered: true,
                details: `Mismatched sub-interface VLAN encapsulation detected: Sub-interface ${subMatch[1]}.${subId} is configured for VLAN ${encapId} instead of ${subId}.`,
                rule_id: "RC-15",
                status: "ERRORS_DETECTED",
                severity: "High",
                message: `802.1Q encapsulation tag mismatch on ${subMatch[1]}.${subId}.`,
                evidence: [`Sub-interface ${subId} tagged with dot1Q ${encapId}`],
                confidence: "High"
              };
            }
          }
        }

        // Generic mismatch phrasing
        const mismatchMatch = text.match(/encapsulation\s+dot1q\s+(\d+)\s+instead\s+of\s+(\d+)/i) ||
                              text.match(/configured\s+for\s+vlan\s+(\d+)\s+instead\s+of\s+(\d+)/i);
        if (mismatchMatch) {
          return {
            triggered: true,
            details: `Mismatched sub-interface VLAN encapsulation detected: Interface is configured for VLAN ${mismatchMatch[1]} instead of ${mismatchMatch[2]}.`,
            rule_id: "RC-15",
            status: "ERRORS_DETECTED",
            severity: "High",
            message: `Mismatched dot1Q encapsulation: configured VLAN ${mismatchMatch[1]} vs expected VLAN ${mismatchMatch[2]}.`,
            evidence: [`Encapsulation dot1Q ${mismatchMatch[1]} configured instead of ${mismatchMatch[2]}`],
            confidence: "High"
          };
        }
      }
      return {
        triggered: false,
        details: "Sub-interface 802.1Q VLAN tagging matches active subnet parameters.",
        rule_id: "RC-15",
        status: "NO_ERROR",
        severity: "Low",
        message: "802.1Q VLAN encapsulation tags match sub-interface IDs.",
        evidence: [],
        confidence: "High"
      };
    }
  }
];
