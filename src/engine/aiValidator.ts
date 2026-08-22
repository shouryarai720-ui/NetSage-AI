/**
 * NetSage AI - AI Output Schema & Hallucination Grounding Validator
 * Ensures all AI diagnostic outputs are strictly structured and grounded in raw evidence.
 */

export interface ValidationResult {
  valid: boolean;
  reason?: string;
  grounded: boolean;
  hallucination_flag?: boolean;
  ungroundedEvidence: string[];
  sanitizedResponse?: DiagnosticAiResponse;
}

export interface DiagnosticAiResponse {
  root_cause: string;
  osi_layer: string;
  confidence: "High" | "Medium" | "Low";
  evidence: string[];
  next_command: string;
  fix_steps: string[];
  hallucination_flag?: boolean;
}

export const VALID_OSI_LAYERS = [
  "Layer 1 (Physical)",
  "Layer 2 (Data Link)",
  "Layer 3 (Network)",
  "Layer 4 (Transport)",
  "Layer 7 (Application)",
  "Physical",
  "Data Link",
  "Network",
  "Transport",
  "Application"
];

export const VALID_CONFIDENCE_LEVELS = ["High", "Medium", "Low"];

/**
 * Validates structural JSON schema and mandatory fields of AI response.
 */
export function validateAiSchema(response: any): { valid: boolean; reason?: string } {
  if (!response || typeof response !== 'object') {
    return { valid: false, reason: "Response must be a JSON object" };
  }

  // 1. root_cause
  if (!response.root_cause || typeof response.root_cause !== 'string' || response.root_cause.trim().length < 5) {
    return { valid: false, reason: "Missing or empty required field: root_cause" };
  }

  // 2. osi_layer
  if (!response.osi_layer || typeof response.osi_layer !== 'string') {
    return { valid: false, reason: "Missing required field: osi_layer" };
  }
  const hasValidLayer = VALID_OSI_LAYERS.some(l => response.osi_layer.toLowerCase().includes(l.toLowerCase()));
  if (!hasValidLayer) {
    return { valid: false, reason: `Invalid osi_layer '${response.osi_layer}'. Must be a recognized OSI layer.` };
  }

  // 3. confidence
  if (!response.confidence || !VALID_CONFIDENCE_LEVELS.includes(response.confidence)) {
    return { valid: false, reason: "Missing or invalid confidence: must be 'High', 'Medium', or 'Low'" };
  }

  // 4. evidence
  if (!Array.isArray(response.evidence) || response.evidence.length === 0) {
    return { valid: false, reason: "Missing or empty required field: evidence (must be array of strings)" };
  }
  for (const item of response.evidence) {
    if (typeof item !== 'string' || item.trim().length === 0) {
      return { valid: false, reason: "All evidence items must be non-empty strings" };
    }
  }

  // 5. next_command
  if (!response.next_command || typeof response.next_command !== 'string' || response.next_command.trim().length === 0) {
    return { valid: false, reason: "Missing or empty required field: next_command" };
  }

  // 6. fix_steps
  if (!Array.isArray(response.fix_steps) || response.fix_steps.length === 0) {
    return { valid: false, reason: "Missing or empty required field: fix_steps (must be array of CLI commands)" };
  }
  for (const step of response.fix_steps) {
    if (typeof step !== 'string' || step.trim().length === 0) {
      return { valid: false, reason: "All fix_steps must be non-empty command strings" };
    }
  }

  return { valid: true };
}

/**
 * Checks whether evidence statements are grounded in raw show command outputs or syslog text.
 * Prevents AI hallucinations (e.g. inventing routes, IPs, or interfaces not present in the case).
 */
export function verifyEvidenceGrounding(
  showOutputs: string,
  evidenceList: string[],
  ruleContextText: string = ""
): { grounded: boolean; ungroundedEvidence: string[]; reason?: string } {
  if (!showOutputs && !ruleContextText) {
    return { grounded: false, ungroundedEvidence: evidenceList, reason: "No show command outputs or context provided for verification." };
  }

  const combinedContext = `${showOutputs}\n${ruleContextText}`.toLowerCase();
  const ungrounded: string[] = [];

  for (const item of evidenceList) {
    const itemLower = item.toLowerCase();
    
    // Extract IP addresses with optional CIDR or wildcard
    const ipMatches = item.match(/\b(?:\d{1,3}\.){3}\d{1,3}(?:\/\d{1,2})?\b/g) || [];
    let ipGrounded = true;
    for (const ip of ipMatches) {
      // Check base IP in context
      const baseIp = ip.split('/')[0];
      if (!combinedContext.includes(baseIp.toLowerCase())) {
        ipGrounded = false;
        break;
      }
    }

    // Extract interface identifiers (e.g., GigabitEthernet0/1, Gi0/0.30, Fa0/1, Po1)
    const ifMatches = item.match(/\b(?:gigabitethernet|fastethernet|ethernet|gi|fa|po|vlan)\s*\d+(?:\/\d+)*(?:\.\d+)?\b/gi) || [];
    let ifGrounded = true;
    for (const iface of ifMatches) {
      const normalizedIf = iface.toLowerCase().replace(/\s+/g, '');
      const normalizedContext = combinedContext.replace(/\s+/g, '');
      if (!normalizedContext.includes(normalizedIf)) {
        // Also try short/long forms
        const isShort = /^(gi|fa|po)/i.test(iface);
        const altName = isShort 
          ? iface.toLowerCase().replace(/^gi/, 'gigabitethernet').replace(/^fa/, 'fastethernet').replace(/^po/, 'port-channel')
          : iface.toLowerCase().replace(/^gigabitethernet/, 'gi').replace(/^fastethernet/, 'fa').replace(/^port-channel/, 'po');
        const normalizedAlt = altName.replace(/\s+/g, '');
        if (!normalizedContext.includes(normalizedAlt)) {
          ifGrounded = false;
          break;
        }
      }
    }

    // Extract explicit VLAN IDs mentioned in evidence
    const vlanMatches = item.match(/\bvlan\s+(\d+)\b/gi) || [];
    let vlanGrounded = true;
    for (const vlanStr of vlanMatches) {
      const vlanId = vlanStr.toLowerCase().replace(/\s+/g, ' ');
      if (!combinedContext.includes(vlanId) && !combinedContext.includes(`vlan:${vlanStr.split(' ')[1]}`)) {
        vlanGrounded = false;
        break;
      }
    }

    // Direct substring or fuzzy token overlap check
    const itemWords = itemLower.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 3);
    const matchedWords = itemWords.filter(w => combinedContext.includes(w));
    const tokenOverlapRatio = itemWords.length > 0 ? (matchedWords.length / itemWords.length) : 1;

    if (!ipGrounded || !ifGrounded || (!vlanGrounded && tokenOverlapRatio < 0.4)) {
      ungrounded.push(item);
    }
  }

  if (ungrounded.length > 0) {
    return {
      grounded: false,
      ungroundedEvidence: ungrounded,
      reason: `Detected ${ungrounded.length} ungrounded or hallucinated evidence item(s) not found in raw show output.`
    };
  }

  return { grounded: true, ungroundedEvidence: [] };
}

/**
 * End-to-end validator combining schema checks and hallucination grounding.
 */
export function validateAndSanitizeAiDiagnosis(
  rawResponse: any,
  showOutputs: string,
  ruleContextText: string = ""
): ValidationResult {
  const schemaCheck = validateAiSchema(rawResponse);
  if (!schemaCheck.valid) {
    return {
      valid: false,
      reason: schemaCheck.reason,
      grounded: false,
      ungroundedEvidence: [],
      sanitizedResponse: {
        root_cause: `DIAGNOSIS REQUIRES HUMAN INVESTIGATION: ${schemaCheck.reason}`,
        osi_layer: rawResponse?.osi_layer || "Layer 3 (Network)",
        confidence: "Low",
        evidence: ["Output failed AI safety schema validation"],
        next_command: "show running-config",
        fix_steps: ["! Manual inspection required by NOC operator"],
        hallucination_flag: false
      }
    };
  }

  const groundingCheck = verifyEvidenceGrounding(showOutputs, rawResponse.evidence, ruleContextText);
  if (!groundingCheck.grounded) {
    return {
      valid: true,
      grounded: false,
      ungroundedEvidence: groundingCheck.ungroundedEvidence,
      reason: groundingCheck.reason,
      sanitizedResponse: {
        root_cause: `[UNSUPPORTED EVIDENCE DETECTED] ${rawResponse.root_cause}`,
        osi_layer: rawResponse.osi_layer,
        confidence: "Low", // Downgraded due to ungrounded evidence
        evidence: rawResponse.evidence.map((e: string) => 
          groundingCheck.ungroundedEvidence.includes(e) ? `[UNSUPPORTED] ${e}` : e
        ),
        next_command: rawResponse.next_command,
        fix_steps: rawResponse.fix_steps,
        hallucination_flag: true
      }
    };
  }

  return {
    valid: true,
    grounded: true,
    ungroundedEvidence: [],
    sanitizedResponse: {
      root_cause: rawResponse.root_cause,
      osi_layer: rawResponse.osi_layer,
      confidence: rawResponse.confidence,
      evidence: rawResponse.evidence,
      next_command: rawResponse.next_command,
      fix_steps: rawResponse.fix_steps,
      hallucination_flag: false
    }
  };
}

/**
 * Compares an AI Diagnosis against the authoritative Ground Truth benchmark.
 * Provides transparent separation and comparative evaluation between model diagnosis and expected fault.
 */
export function evaluateAiAgainstGroundTruth(
  aiDiagnosis: {
    rootCause?: string;
    osiLayer?: string;
    nextCommand?: string;
    fixSteps?: string[];
  } | undefined,
  groundTruth: {
    expectedFault?: string;
    expectedOsiLayer?: string;
    expectedNextCommand?: string;
    expectedFixSteps?: string[];
  } | undefined
): {
  status: 'CORRECT' | 'PARTIALLY_CORRECT' | 'INCORRECT' | 'UNVERIFIED';
  notes: string;
  osiMatch: boolean;
  conceptMatch: boolean;
} {
  if (!aiDiagnosis || !groundTruth || !groundTruth.expectedFault) {
    return {
      status: 'UNVERIFIED',
      notes: 'No AI diagnosis or ground truth benchmark available for comparative evaluation.',
      osiMatch: false,
      conceptMatch: false
    };
  }

  const aiRc = (aiDiagnosis.rootCause || '').toLowerCase();
  const gtRc = (groundTruth.expectedFault || '').toLowerCase();

  const aiOsi = (aiDiagnosis.osiLayer || '').toLowerCase();
  const gtOsi = (groundTruth.expectedOsiLayer || '').toLowerCase();

  // OSI Layer Comparison
  const osiMatch = aiOsi.includes(gtOsi) || gtOsi.includes(aiOsi) || 
    (aiOsi.includes('3') && gtOsi.includes('3')) ||
    (aiOsi.includes('2') && gtOsi.includes('2')) ||
    (aiOsi.includes('1') && gtOsi.includes('1')) ||
    (aiOsi.includes('4') && gtOsi.includes('4')) ||
    (aiOsi.includes('7') && gtOsi.includes('7'));

  // Key networking keywords extraction
  const gtKeywords = gtRc
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !['with', 'from', 'that', 'this', 'have', 'been', 'interface', 'router', 'switch'].includes(w));

  let matchedKeywords = 0;
  for (const kw of gtKeywords) {
    if (aiRc.includes(kw)) {
      matchedKeywords++;
    }
  }

  const keywordRatio = gtKeywords.length > 0 ? (matchedKeywords / gtKeywords.length) : 0;
  const conceptMatch = keywordRatio >= 0.35 || aiRc.includes(gtRc) || gtRc.includes(aiRc);

  // Command overlap check
  const aiCmds = (aiDiagnosis.fixSteps || []).map(s => s.toLowerCase().trim());
  const gtCmds = (groundTruth.expectedFixSteps || []).map(s => s.toLowerCase().trim());
  const cmdOverlap = gtCmds.filter(gc => aiCmds.some(ac => ac.includes(gc) || gc.includes(ac)));

  if (conceptMatch && osiMatch) {
    return {
      status: 'CORRECT',
      notes: `AI root cause aligns with Ground Truth fault benchmark (${matchedKeywords}/${gtKeywords.length} key fault tokens matched). OSI Layer match confirmed.`,
      osiMatch: true,
      conceptMatch: true
    };
  } else if (conceptMatch || osiMatch || cmdOverlap.length > 0) {
    return {
      status: 'PARTIALLY_CORRECT',
      notes: `Partial alignment with Ground Truth: OSI match=${osiMatch}, Fault token match=${matchedKeywords}/${gtKeywords.length}, Remediation overlap=${cmdOverlap.length}/${gtCmds.length}.`,
      osiMatch,
      conceptMatch
    };
  } else {
    return {
      status: 'INCORRECT',
      notes: `AI diagnosis diverges from Ground Truth benchmark. Operator review and correction recommended.`,
      osiMatch,
      conceptMatch: false
    };
  }
}

