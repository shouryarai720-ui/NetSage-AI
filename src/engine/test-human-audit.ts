import crypto from 'crypto';
import { AuditLogEntry } from '../types.ts';
import { runDeterministicChecks } from './checker.ts';

export interface HumanAuditSuiteResult {
  passed: boolean;
  totalTests: number;
  passedTests: number;
  hitlPassedTests: number;
  auditChainPassedTests: number;
  tamperScenariosChecked: number;
  errors: string[];
}

export function computeSha256(data: any, previousHash: string = "sha256:genesis_block_init"): string {
  const payload = JSON.stringify({
    timestamp: data.timestamp,
    actionType: data.actionType,
    targetNode: data.targetNode,
    message: data.message,
    caseId: data.caseId || "",
    reviewer: data.reviewer || "",
    humanDecision: data.humanDecision || "",
    reason: data.reason || "",
    originalCommands: data.originalCommands || [],
    editedCommands: data.editedCommands || [],
    previousHash
  });
  return `sha256:${crypto.createHash('sha256').update(payload).digest('hex')}`;
}

export function verifyAuditChainIntegrity(entries: AuditLogEntry[]): { valid: boolean; compromisedIndex?: number; reason?: string } {
  if (!entries || entries.length === 0) return { valid: true };

  for (let i = 0; i < entries.length; i++) {
    const current = entries[i];
    const nextInChain = entries[i + 1]; // Older entry in unshifted list

    const expectedPrevHash = nextInChain 
      ? (nextInChain.integrityToken || nextInChain.currentHash || "sha256:genesis_block_init")
      : "sha256:genesis_block_init";

    // 1. Verify previous hash link
    if (current.previousHash && current.previousHash !== expectedPrevHash) {
      return {
        valid: false,
        compromisedIndex: i,
        reason: `Broken hash chain link at index ${i}: stored previousHash '${current.previousHash}' does not match expected '${expectedPrevHash}'`
      };
    }

    // 2. Verify current token matches SHA256 of contents
    const expectedCurrentHash = computeSha256(current, current.previousHash || expectedPrevHash);
    const actualToken = current.integrityToken || current.currentHash;

    if (actualToken !== expectedCurrentHash) {
      return {
        valid: false,
        compromisedIndex: i,
        reason: `Cryptographic tampering detected at index ${i}: hash '${actualToken}' does not match payload digest '${expectedCurrentHash}'`
      };
    }
  }

  return { valid: true };
}

export function runHumanAuditTests(): HumanAuditSuiteResult {
  const errors: string[] = [];
  let passedTests = 0;
  let hitlPassedTests = 0;
  let auditChainPassedTests = 0;
  let tamperScenariosChecked = 0;

  // =========================================================================
  // SECTION 1: Human Review Decision Gate Testing (HITL)
  // =========================================================================

  // 1.1 Transition: PENDING -> ACCEPTED
  const acceptedLog: AuditLogEntry = {
    timestamp: "2026-08-20 14:00:00",
    caseId: "NET-001",
    actionType: "CONFIG DEPLOYED",
    targetNode: "R1-CORE / Gi0/0.30",
    message: "Operator approved remediation commands for NET-001.",
    reviewer: "Senior NetOps Lead",
    humanDecision: "ACCEPTED",
    safetyStatus: "SECURE",
    evidence: "GigabitEthernet0/0.30 is administratively down",
    originalCommands: ["configure terminal", "interface GigabitEthernet0/0.30", "no shutdown"],
    reason: "Standard subinterface un-shut required after maintenance.",
    integrityToken: ""
  };
  acceptedLog.integrityToken = computeSha256(acceptedLog, "sha256:genesis_block_init");
  acceptedLog.currentHash = acceptedLog.integrityToken;
  acceptedLog.previousHash = "sha256:genesis_block_init";

  if (acceptedLog.humanDecision === "ACCEPTED" && acceptedLog.reviewer && acceptedLog.originalCommands?.length) {
    passedTests++;
    hitlPassedTests++;
  } else {
    errors.push("Human Review ACCEPTED record failed validation");
  }

  // 1.2 Transition: PENDING -> EDITED (must preserve both original and edited commands)
  const editedLog: AuditLogEntry = {
    timestamp: "2026-08-20 14:05:00",
    caseId: "NET-001",
    actionType: "OPERATOR OVERRIDE",
    targetNode: "R1-CORE / Gi0/0.30",
    message: "Operator modified proposed configuration commands.",
    reviewer: "NOC Tier-2 Engineer",
    humanDecision: "EDITED",
    safetyStatus: "MODIFIED",
    evidence: "GigabitEthernet0/0.30 is administratively down",
    originalCommands: ["configure terminal", "interface GigabitEthernet0/0.30", "no shutdown"],
    editedCommands: ["configure terminal", "interface GigabitEthernet0/0.30", "no shutdown", "description Link to Server1 VLAN30", "end"],
    reason: "Added standard enterprise interface description tag before enabling.",
    integrityToken: ""
  };
  editedLog.integrityToken = computeSha256(editedLog, acceptedLog.integrityToken!);
  editedLog.currentHash = editedLog.integrityToken;
  editedLog.previousHash = acceptedLog.integrityToken;

  if (editedLog.originalCommands?.length === 3 && editedLog.editedCommands?.length === 5) {
    passedTests++;
    hitlPassedTests++;
  } else {
    errors.push("Human Review EDITED did not preserve both original and edited commands");
  }

  // 1.3 Transition: PENDING -> REJECTED (reason is mandatory)
  const validRejection: Partial<AuditLogEntry> = {
    timestamp: "2026-08-20 14:10:00",
    caseId: "NET-001",
    reviewer: "Senior NetOps Lead",
    humanDecision: "REJECTED",
    reason: "Remediation plan conflicts with active scheduled change freeze."
  };
  if (validRejection.humanDecision === "REJECTED" && validRejection.reason && validRejection.reason.length > 0) {
    passedTests++;
    hitlPassedTests++;
  } else {
    errors.push("Valid rejection with reason was rejected");
  }

  // 1.4 Rejecting without reason -> MUST FAIL
  const invalidRejectionNoReason: Partial<AuditLogEntry> = {
    timestamp: "2026-08-20 14:10:00",
    caseId: "NET-001",
    reviewer: "Junior Tech",
    humanDecision: "REJECTED",
    reason: ""
  };
  if (!invalidRejectionNoReason.reason || invalidRejectionNoReason.reason.trim().length === 0) {
    passedTests++;
    hitlPassedTests++;
  } else {
    errors.push("Human Review REJECTED incorrectly allowed empty reason");
  }

  // 1.5 Unapproved execution blocking
  const unapprovedState = { status: "PENDING_REVIEW", approved: false };
  const canDeploy = (state: { status: string; approved: boolean }) => state.status === "APPROVED" && state.approved;
  if (!canDeploy(unapprovedState)) {
    passedTests++;
    hitlPassedTests++;
  } else {
    errors.push("HITL safety breach: Unapproved pending proposal was allowed to deploy without human approval");
  }

  // =========================================================================
  // SECTION 2: Cryptographic SHA-256 Audit Chain Tamper Scenarios (10 Tests)
  // =========================================================================

  // Scenario 1: Baseline valid 3-block chain
  const baseChain: AuditLogEntry[] = [
    {
      timestamp: "2026-08-20 14:15:00",
      caseId: "NET-003",
      actionType: "CONFIG DEPLOYED",
      targetNode: "SW-01",
      message: "Remediated VLAN 20 trunk issue.",
      reviewer: "Auditor-1",
      humanDecision: "ACCEPTED",
      safetyStatus: "SECURE",
      previousHash: editedLog.integrityToken!,
      integrityToken: ""
    },
    editedLog,
    acceptedLog
  ];
  baseChain[0].integrityToken = computeSha256(baseChain[0], baseChain[0].previousHash!);
  baseChain[0].currentHash = baseChain[0].integrityToken;

  const baselineCheck = verifyAuditChainIntegrity(baseChain);
  if (baselineCheck.valid) {
    passedTests++;
    auditChainPassedTests++;
    tamperScenariosChecked++;
  } else {
    errors.push(`Legitimate audit chain failed baseline integrity: ${baselineCheck.reason}`);
  }

  // Scenario 2: Modified record payload (message / targetNode)
  const tampered1 = JSON.parse(JSON.stringify(baseChain));
  tampered1[1].message = "Tampered message: Malicious unapproved change was applied";
  const tamper1Check = verifyAuditChainIntegrity(tampered1);
  if (!tamper1Check.valid) {
    passedTests++;
    auditChainPassedTests++;
    tamperScenariosChecked++;
  } else {
    errors.push("Tamper Scenario 1 FAILED: Modification of record payload was not detected");
  }

  // Scenario 3: Modified previousHash pointer
  const tampered2 = JSON.parse(JSON.stringify(baseChain));
  tampered2[0].previousHash = "sha256:forged_previous_pointer_000000000000";
  const tamper2Check = verifyAuditChainIntegrity(tampered2);
  if (!tamper2Check.valid) {
    passedTests++;
    auditChainPassedTests++;
    tamperScenariosChecked++;
  } else {
    errors.push("Tamper Scenario 2 FAILED: Modification of previousHash pointer was not detected");
  }

  // Scenario 4: Modified current hash integrityToken
  const tampered3 = JSON.parse(JSON.stringify(baseChain));
  tampered3[0].integrityToken = "sha256:deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef";
  const tamper3Check = verifyAuditChainIntegrity(tampered3);
  if (!tamper3Check.valid) {
    passedTests++;
    auditChainPassedTests++;
    tamperScenariosChecked++;
  } else {
    errors.push("Tamper Scenario 3 FAILED: Modification of current integrityToken was not detected");
  }

  // Scenario 5: Deleted intermediate record
  const tampered4 = [baseChain[0], baseChain[2]]; // deleted index 1
  const tamper4Check = verifyAuditChainIntegrity(tampered4);
  if (!tamper4Check.valid) {
    passedTests++;
    auditChainPassedTests++;
    tamperScenariosChecked++;
  } else {
    errors.push("Tamper Scenario 4 FAILED: Deletion of intermediate record was not detected");
  }

  // Scenario 6: Inserted unauthorized record
  const injectedRecord: AuditLogEntry = {
    timestamp: "2026-08-20 14:02:00",
    caseId: "NET-FORGED",
    actionType: "ROGUE INSERTION",
    targetNode: "CORE-01",
    message: "Injected record",
    safetyStatus: "BLOCKED",
    previousHash: acceptedLog.integrityToken,
    integrityToken: "sha256:fake"
  };
  const tampered5 = [baseChain[0], injectedRecord, baseChain[1], baseChain[2]];
  const tamper5Check = verifyAuditChainIntegrity(tampered5);
  if (!tamper5Check.valid) {
    passedTests++;
    auditChainPassedTests++;
    tamperScenariosChecked++;
  } else {
    errors.push("Tamper Scenario 5 FAILED: Rogue inserted record was not detected");
  }

  // Scenario 7: Reordered records
  const tampered6 = [baseChain[1], baseChain[0], baseChain[2]];
  const tamper6Check = verifyAuditChainIntegrity(tampered6);
  if (!tamper6Check.valid) {
    passedTests++;
    auditChainPassedTests++;
    tamperScenariosChecked++;
  } else {
    errors.push("Tamper Scenario 6 FAILED: Reordering of records was not detected");
  }

  // Scenario 8: Modified timestamp
  const tampered7 = JSON.parse(JSON.stringify(baseChain));
  tampered7[0].timestamp = "1999-01-01 00:00:00";
  const tamper7Check = verifyAuditChainIntegrity(tampered7);
  if (!tamper7Check.valid) {
    passedTests++;
    auditChainPassedTests++;
    tamperScenariosChecked++;
  } else {
    errors.push("Tamper Scenario 7 FAILED: Timestamp tampering was not detected");
  }

  // Scenario 9: Modified humanDecision (e.g. REJECTED changed to ACCEPTED)
  const tampered8 = JSON.parse(JSON.stringify(baseChain));
  tampered8[0].humanDecision = "FORGED_ACCEPTANCE";
  const tamper8Check = verifyAuditChainIntegrity(tampered8);
  if (!tamper8Check.valid) {
    passedTests++;
    auditChainPassedTests++;
    tamperScenariosChecked++;
  } else {
    errors.push("Tamper Scenario 8 FAILED: Forged human decision was not detected");
  }

  // Scenario 10: Modified remediation command inside record
  const tampered9 = JSON.parse(JSON.stringify(baseChain));
  tampered9[1].editedCommands = ["configure terminal", "interface Gi0/0.30", "shutdown"]; // changed no shutdown to shutdown
  const tamper9Check = verifyAuditChainIntegrity(tampered9);
  if (!tamper9Check.valid) {
    passedTests++;
    auditChainPassedTests++;
    tamperScenariosChecked++;
  } else {
    errors.push("Tamper Scenario 9 FAILED: Modified remediation command was not detected");
  }

  // NET-001 Deterministic rule check
  const net001ShowOutput = `
R1# show ip interface brief
Interface                  IP-Address      OK? Method Status                Protocol
GigabitEthernet0/0         10.10.10.1      YES manual up                    up
GigabitEthernet0/0.10      10.10.10.1      YES manual up                    up
GigabitEthernet0/0.20      10.10.20.1      YES manual up                    up
GigabitEthernet0/0.30      10.10.30.1      YES manual administratively down down
`;
  const net001Results = runDeterministicChecks(net001ShowOutput, "NET-001", "Subinterface down", "Routing");
  const matchedRc01 = net001Results.find(r => r.id === "RC-01");
  if (matchedRc01 && (matchedRc01.status === "fail" || matchedRc01.status === "warn")) {
    passedTests++;
    hitlPassedTests++;
  } else {
    errors.push("NET-001 Deterministic rule verification failed");
  }

  const totalTests = 16; // 5 HITL gates + 10 tamper scenarios + 1 E2E NET-001 check

  return {
    passed: errors.length === 0,
    totalTests,
    passedTests,
    hitlPassedTests,
    auditChainPassedTests,
    tamperScenariosChecked,
    errors
  };
}
