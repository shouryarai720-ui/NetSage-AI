import { RuleCheckItem } from '../types';
import { RuleDefinition } from './types';
import { interfaceRules } from './rules/interfaceRules';
import { ipRules } from './rules/ipRules';
import { vlanRules } from './rules/vlanRules';
import { routingRules } from './rules/routingRules';
import { aclRules } from './rules/aclRules';
import { poolRules } from './rules/poolRules';

// Centralised Rule Registry containing all modular diagnostics
const allRules: RuleDefinition[] = [
  ...interfaceRules,
  ...ipRules,
  ...vlanRules,
  ...routingRules,
  ...aclRules,
  ...poolRules
];

/**
 * Deterministic Diagnostic & Compliance Rule Engine
 * Analyzes the raw Cisco IOS console outputs using structured regular expressions and text parsing.
 * Relies strictly on diagnostic evidence in the show commands, completely independent of Case ID.
 */
export function runDeterministicChecks(showOutput: string, caseId: string = "", title: string = "", category: string = ""): RuleCheckItem[] {
  const checks: RuleCheckItem[] = [];
  const text = showOutput || "";

  for (const rule of allRules) {
    const evaluation = rule.check(text);
    
    if (evaluation.triggered) {
      checks.push({
        id: rule.id,
        ruleName: rule.name,
        status: rule.id === "RC-09" ? "warn" : "fail", // RC-09 (ACL) is traditionally flagged as warn/fail
        category: rule.category,
        details: evaluation.details
      });
    } else {
      // Return a standard passing entry to show system compliance
      checks.push({
        id: rule.id,
        ruleName: rule.name,
        status: "pass",
        category: rule.category,
        details: rule.description.replace("Detects", "Verified:").replace("Checks", "Verified:").replace("Identifies", "Verified:").replace("Verifies", "Verified:")
      });
    }
  }

  return checks;
}
