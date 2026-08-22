import { RuleDefinition } from '../types';

export const aclRules: RuleDefinition[] = [
  {
    id: "RC-09",
    name: "Access Control List Audit",
    category: "Security",
    severity: "High",
    description: "Inspects access lists for implicit or explicit deny blocks on standard application ports (e.g. 22, 53, 80) or security policy violations.",
    check: (text: string) => {
      const lower = text.toLowerCase();
      
      // Determine if there is actual evidence of an ACL error, drop, or guest isolation failure
      const hasDenySsh = /deny\s+tcp\s+.*\b(22|eq\s+22|eq\s+ssh)\b/i.test(text) || 
                         (lower.includes("deny tcp") && lower.includes(" 22"));
      const hasDenyDns = /deny\s+(?:udp|tcp)\s+.*\b(53|eq\s+53|eq\s+domain|domain)\b/i.test(text) ||
                         (lower.includes("deny udp") && (lower.includes(" 53") || lower.includes("domain")));
      const hasDenyWeb = /deny\s+tcp\s+.*\b(80|443|eq\s+80|eq\s+443|eq\s+www)\b/i.test(text) ||
                         (lower.includes("deny tcp") && (lower.includes(" 80") || lower.includes("www") || lower.includes(" 443")));
      const hasDenyIp = /deny\s+ip\s+/i.test(text);
      const hasGuestViolation = (lower.includes("guest") && lower.includes("permit ip any any")) ||
                                (lower.includes("guest-acl") && lower.includes("permit ip any any")) ||
                                lower.includes("permits guest access to corporate") ||
                                lower.includes("guest wireless isolation failure");
      const hasAclDropWarning = lower.includes("access-list") && (
                                lower.includes("blocking") || 
                                lower.includes("dropping") || 
                                lower.includes("packet drop") ||
                                lower.includes("denies") ||
                                lower.includes("denying")
                              );

      if (hasDenySsh) {
        return {
          triggered: true,
          details: "Security policy audit: Access Control List denies essential TCP port 22 traffic (SSH), blocking remote management.",
          rule_id: "RC-09",
          status: "ERRORS_DETECTED",
          severity: "High",
          message: "Access Control List denies essential SSH port 22 management traffic.",
          evidence: ["ACL statement explicitly denies TCP port 22 / SSH"],
          confidence: "High"
        };
      }

      if (hasDenyDns) {
        return {
          triggered: true,
          details: "Security policy audit: Access Control List denies TCP/UDP port 53 traffic (DNS), blocking domain name resolution.",
          rule_id: "RC-09",
          status: "ERRORS_DETECTED",
          severity: "High",
          message: "Access Control List blocks DNS port 53 queries.",
          evidence: ["ACL statement explicitly denies UDP/TCP port 53 / domain traffic"],
          confidence: "High"
        };
      }

      if (hasDenyWeb) {
        return {
          triggered: true,
          details: "Security policy audit: Access Control List denies standard HTTP/HTTPS web ports, blocking web traffic.",
          rule_id: "RC-09",
          status: "ERRORS_DETECTED",
          severity: "High",
          message: "Access Control List denies HTTP/HTTPS transit traffic.",
          evidence: ["ACL statement explicitly blocks HTTP port 80 / WWW / 443"],
          confidence: "High"
        };
      }

      if (hasGuestViolation) {
        return {
          triggered: true,
          details: "Security policy audit: Guest wireless access list permits unrestricted access to internal corporate subnets without proper isolation rules.",
          rule_id: "RC-09",
          status: "ERRORS_DETECTED",
          severity: "High",
          message: "Guest wireless network lacks network isolation ACL filters.",
          evidence: ["Guest ACL contains 'permit ip any any' permitting internal corporate access"],
          confidence: "High"
        };
      }

      const hasStandardDeny = /\bdeny\s+\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/i.test(text);
      const hasExplicitAclDeny = (lower.includes("access-list") || lower.includes("access list")) && (lower.includes("deny ") || /\bdeny\s+/i.test(text));

      if (hasAclDropWarning || hasStandardDeny || hasExplicitAclDeny || (hasDenyIp && (lower.includes("block") || lower.includes("drop") || lower.includes("fail") || lower.includes("reject")))) {
        return {
          triggered: true,
          details: "Access Control List contains explicit filter statements that are actively dropping requested transit packets.",
          rule_id: "RC-09",
          status: "ERRORS_DETECTED",
          severity: "High",
          message: "Explicit ACL filter drops active traffic.",
          evidence: ["ACL contains active deny statements matching requested packet stream"],
          confidence: "High"
        };
      }

      return {
        triggered: false,
        details: "Access Control List filters are permissive or configured with appropriate secure permit clauses.",
        rule_id: "RC-09",
        status: "NO_ERROR",
        severity: "Low",
        message: "No adverse ACL blocking policies identified.",
        evidence: [],
        confidence: "High"
      };
    }
  }
];
