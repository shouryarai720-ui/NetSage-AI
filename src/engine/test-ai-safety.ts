import {
  validateAiSchema,
  verifyEvidenceGrounding,
  validateAndSanitizeAiDiagnosis,
  DiagnosticAiResponse
} from './aiValidator.ts';
import { DiagnosticCase } from '../types.ts';

export interface AiSafetySuiteResult {
  passed: boolean;
  totalTests: number;
  passedTests: number;
  schemaPassedTests: number;
  groundingPassedTests: number;
  insufficientEvidencePassedTests: number;
  groundTruthIsolationPassedTests: number;
  errors: string[];
}

export interface DiagnosticPayloadInput {
  id?: string;
  case_id?: string;
  title?: string;
  symptom?: string;
  networkProblem?: string;
  topologyNote?: string;
  topology_note?: string;
  showOutputs?: string;
  show_outputs?: string;
  networkEvidence?: {
    showCommandOutput?: string;
  };
  conceptTag?: string;
  concept_tag?: string;
  category?: string;
  severity?: string;
  expectedOsiLayer?: string;
  osi_layer?: string;
  expectedFault?: string;
  expected_fault?: string;
  expectedNextCommand?: string;
  expected_next_command?: string;
  expectedFixSteps?: string[];
  expected_fix_steps?: string[];
  expectedRuleIds?: string | string[];
}

/**
 * Builds the exact payload structure sent to Gemini AI in server.ts
 * Strictly adhering to Ground-Truth Isolation.
 */
export function buildAiDiagnosticPayload(caseItem: DiagnosticPayloadInput, deterministicRuleResults: string[] = []): Record<string, any> {
  return {
    case_id: caseItem.id || caseItem.case_id || "",
    symptom: caseItem.symptom || caseItem.networkProblem || "",
    topology_note: caseItem.topologyNote || caseItem.topology_note || "N/A",
    show_outputs: caseItem.showOutputs || caseItem.show_outputs || caseItem.networkEvidence?.showCommandOutput || "",
    concept_tag: caseItem.conceptTag || caseItem.concept_tag || caseItem.category || "N/A",
    severity: caseItem.severity || "Medium",
    osi_layer: caseItem.expectedOsiLayer || caseItem.osi_layer || "N/A",
    deterministic_rule_results: deterministicRuleResults
  };
}

export function runAiSafetyTests(): AiSafetySuiteResult {
  const errors: string[] = [];
  let passedTests = 0;
  let schemaPassedTests = 0;
  let groundingPassedTests = 0;
  let insufficientEvidencePassedTests = 0;
  let groundTruthIsolationPassedTests = 0;

  // =========================================================================
  // SECTION 1: AI Schema & Type Validation
  // =========================================================================
  const validAiResponse: DiagnosticAiResponse = {
    root_cause: "GigabitEthernet0/0.30 subinterface is administratively down in interface configuration.",
    osi_layer: "Layer 3 (Network)",
    confidence: "High",
    evidence: ["GigabitEthernet0/0.30 is administratively down, line protocol is down"],
    next_command: "show ip interface brief",
    fix_steps: [
      "configure terminal",
      "interface GigabitEthernet0/0.30",
      "no shutdown"
    ]
  };

  // 1.1 Valid AI response
  const vCheck = validateAiSchema(validAiResponse);
  if (vCheck.valid) {
    passedTests++;
    schemaPassedTests++;
  } else {
    errors.push(`Valid AI response was incorrectly marked invalid: ${vCheck.reason}`);
  }

  // 1.2 Reject Null / Non-object
  if (!validateAiSchema(null).valid && !validateAiSchema("string response").valid) {
    passedTests++;
    schemaPassedTests++;
  } else {
    errors.push("Failed to reject null or non-object response");
  }

  // 1.3 Reject missing / short root_cause
  const missingRootCause = { ...validAiResponse, root_cause: "" };
  if (!validateAiSchema(missingRootCause).valid) {
    passedTests++;
    schemaPassedTests++;
  } else {
    errors.push("Failed to reject missing root_cause");
  }

  // 1.4 Reject invalid osi_layer
  const invalidOsi = { ...validAiResponse, osi_layer: "Layer 9 (Quantum)" };
  if (!validateAiSchema(invalidOsi).valid) {
    passedTests++;
    schemaPassedTests++;
  } else {
    errors.push("Failed to reject invalid OSI layer");
  }

  // 1.5 Reject invalid confidence score
  const invalidConf = { ...validAiResponse, confidence: "Certain" as any };
  if (!validateAiSchema(invalidConf).valid) {
    passedTests++;
    schemaPassedTests++;
  } else {
    errors.push("Failed to reject invalid confidence score");
  }

  // 1.6 Reject empty evidence array
  const emptyEvidence = { ...validAiResponse, evidence: [] };
  if (!validateAiSchema(emptyEvidence).valid) {
    passedTests++;
    schemaPassedTests++;
  } else {
    errors.push("Failed to reject empty evidence list");
  }

  // 1.7 Reject evidence as non-array string
  const stringEvidence = { ...validAiResponse, evidence: "Single evidence line" as any };
  if (!validateAiSchema(stringEvidence).valid) {
    passedTests++;
    schemaPassedTests++;
  } else {
    errors.push("Failed to reject evidence formatted as string instead of array");
  }

  // 1.8 Reject empty next_command
  const missingNextCmd = { ...validAiResponse, next_command: "" };
  if (!validateAiSchema(missingNextCmd).valid) {
    passedTests++;
    schemaPassedTests++;
  } else {
    errors.push("Failed to reject empty next_command");
  }

  // 1.9 Reject empty fix_steps
  const missingFixSteps = { ...validAiResponse, fix_steps: [] };
  if (!validateAiSchema(missingFixSteps).valid) {
    passedTests++;
    schemaPassedTests++;
  } else {
    errors.push("Failed to reject empty fix_steps");
  }

  // 1.10 Reject fix_steps as non-array string
  const stringFixSteps = { ...validAiResponse, fix_steps: "configure terminal" as any };
  if (!validateAiSchema(stringFixSteps).valid) {
    passedTests++;
    schemaPassedTests++;
  } else {
    errors.push("Failed to reject fix_steps formatted as string instead of array");
  }

  // 1.11 Reject invalid types inside fix_steps
  const invalidStepTypes = { ...validAiResponse, fix_steps: [123, false] as any };
  if (!validateAiSchema(invalidStepTypes).valid) {
    passedTests++;
    schemaPassedTests++;
  } else {
    errors.push("Failed to reject invalid types in fix_steps array");
  }

  // =========================================================================
  // SECTION 2: AI Grounding & Hallucination Prevention
  // =========================================================================
  const showOutputNet001 = `
R1# show ip interface brief
Interface                  IP-Address      OK? Method Status                Protocol
GigabitEthernet0/0         10.10.10.1      YES manual up                    up
GigabitEthernet0/0.10      10.10.10.1      YES manual up                    up
GigabitEthernet0/0.20      10.10.20.1      YES manual up                    up
GigabitEthernet0/0.30      10.10.30.1      YES manual administratively down down
`;

  // 2.1 Grounded evidence check -> should pass
  const groundedEvidence = [
    "GigabitEthernet0/0.30 is administratively down",
    "IP-Address 10.10.30.1 configured on subinterface"
  ];
  const gCheck = verifyEvidenceGrounding(showOutputNet001, groundedEvidence);
  if (gCheck.grounded) {
    passedTests++;
    groundingPassedTests++;
  } else {
    errors.push(`Grounded evidence was incorrectly flagged as hallucination: ${gCheck.reason}`);
  }

  // 2.2 Hallucinated IP address & interface detection
  const hallucinatedEvidence = [
    "Route 10.99.99.0/24 is missing from routing table",
    "Interface GigabitEthernet0/99 is flapping with CRC errors",
    "VLAN 999 is missing from switch database"
  ];
  const hCheck = verifyEvidenceGrounding(showOutputNet001, hallucinatedEvidence);
  if (!hCheck.grounded && hCheck.ungroundedEvidence.length > 0) {
    passedTests++;
    groundingPassedTests++;
  } else {
    errors.push("Hallucination check failed: Did not detect hallucinated route 10.99.99.0/24 or interface GigabitEthernet0/99");
  }

  // 2.3 Legitimate generic Cisco commands should NOT be treated as hallucinated
  const genericFixSteps = [
    "configure terminal",
    "interface GigabitEthernet0/0.30",
    "no shutdown",
    "end",
    "write memory"
  ];
  const legitimateCheck = validateAndSanitizeAiDiagnosis({
    ...validAiResponse,
    fix_steps: genericFixSteps
  }, showOutputNet001);
  if (legitimateCheck.valid) {
    passedTests++;
    groundingPassedTests++;
  } else {
    errors.push("Standard Cisco generic configuration commands were incorrectly rejected");
  }

  // 2.4 End-to-end Sanitize & Grounding validation test with confidence downgrade
  const hallucinatedAiOutput: DiagnosticAiResponse = {
    root_cause: "BGP neighbor on interface GigabitEthernet0/99 failed",
    osi_layer: "Layer 3 (Network)",
    confidence: "High",
    evidence: ["Interface GigabitEthernet0/99 has line protocol down"],
    next_command: "show ip bgp summary",
    fix_steps: ["configure terminal", "interface GigabitEthernet0/99", "no shutdown"]
  };

  const sanitized = validateAndSanitizeAiDiagnosis(hallucinatedAiOutput, showOutputNet001);
  if (sanitized.hallucination_flag === true || sanitized.sanitizedResponse?.hallucination_flag === true) {
    if (sanitized.sanitizedResponse?.confidence === "Low") {
      passedTests++;
      groundingPassedTests++;
    } else {
      errors.push(`Sanitization failed: Confidence was not downgraded to Low on hallucination`);
    }
  } else {
    errors.push("Sanitization failed: Hallucination flag was not set on ungrounded response");
  }

  // =========================================================================
  // SECTION 3: Insufficient Evidence Handling
  // =========================================================================
  const blankShowOutput = "";
  const insufficientEvidenceCheck = verifyEvidenceGrounding(blankShowOutput, ["Interface Gi0/1 is down"]);
  if (!insufficientEvidenceCheck.grounded) {
    passedTests++;
    insufficientEvidencePassedTests++;
  } else {
    errors.push("Failed to reject evidence when show output is blank");
  }

  const fallbackSanitized = validateAndSanitizeAiDiagnosis({
    root_cause: "Unknown fault",
    osi_layer: "Layer 3 (Network)",
    confidence: "High",
    evidence: ["Interface Gi0/99 is down"],
    next_command: "show ip route",
    fix_steps: ["configure terminal"]
  }, blankShowOutput);

  if (fallbackSanitized.sanitizedResponse?.confidence === "Low") {
    passedTests++;
    insufficientEvidencePassedTests++;
  } else {
    errors.push("Fallback mechanism failed to downgrade confidence to Low when evidence is insufficient");
  }

  // =========================================================================
  // SECTION 4: Ground-Truth Isolation & Leakage Verification
  // =========================================================================
  const sampleCase: DiagnosticPayloadInput = {
    id: "NET-001",
    title: "Inter-VLAN routing sub-interface down" as any,
    symptom: "PC1 cannot reach Server1 in VLAN 30",
    topologyNote: "R1 Router-on-a-Stick connected to SW1 Trunk Gi0/1",
    showOutputs: showOutputNet001,
    expectedFault: "SECRET_GROUND_TRUTH_FAULT: GigabitEthernet0/0.30 administratively down",
    expectedOsiLayer: "Layer 3 (Network)",
    conceptTag: "VLAN",
    severity: "High",
    expectedNextCommand: "SECRET_NEXT_CMD: show ip interface brief",
    expectedFixSteps: ["SECRET_STEP_1: config t", "SECRET_STEP_2: int Gi0/0.30", "SECRET_STEP_3: no shut"],
    expectedRuleIds: ["RC-01"]
  };

  const aiPayload = buildAiDiagnosticPayload(sampleCase, ["RC-01 trigger warning"]);
  const payloadJson = JSON.stringify(aiPayload);

  // 4.1 Verify payload does NOT contain ground truth fields
  if (
    !payloadJson.includes("SECRET_GROUND_TRUTH_FAULT") &&
    !payloadJson.includes("SECRET_NEXT_CMD") &&
    !payloadJson.includes("SECRET_STEP_1") &&
    !payloadJson.includes("expectedFault") &&
    !payloadJson.includes("expected_fault") &&
    !payloadJson.includes("expectedFixSteps") &&
    !payloadJson.includes("expected_fix_steps")
  ) {
    passedTests++;
    groundTruthIsolationPassedTests++;
  } else {
    errors.push("Ground-Truth Leakage Alert: AI payload contains expected answer or evaluator-only metadata!");
  }

  // 4.2 Verify mutating expected_fault does NOT change generated payload
  const modifiedCase: DiagnosticPayloadInput = {
    ...sampleCase,
    expectedFault: "COMPLETELY_DIFFERENT_FAULTPATH_INVENTED_BY_EVALUATOR"
  };
  const payload1 = JSON.stringify(buildAiDiagnosticPayload(sampleCase));
  const payload2 = JSON.stringify(buildAiDiagnosticPayload(modifiedCase));

  if (payload1 === payload2) {
    passedTests++;
    groundTruthIsolationPassedTests++;
  } else {
    errors.push("Ground-Truth Isolation Failure: Modifying expected_fault mutated the AI input payload!");
  }

  const totalTests = 19;

  return {
    passed: errors.length === 0,
    totalTests,
    passedTests,
    schemaPassedTests,
    groundingPassedTests,
    insufficientEvidencePassedTests,
    groundTruthIsolationPassedTests,
    errors
  };
}
