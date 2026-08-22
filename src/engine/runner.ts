import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { validateDataset } from './test-dataset.ts';
import { runRuleEngineTests } from './test-rules.ts';
import { runFuzzTests } from './test-fuzz.ts';
import { runAiSafetyTests } from './test-ai-safety.ts';
import { runHumanAuditTests } from './test-human-audit.ts';
import { runFullDatasetExecution } from './test-full-dataset.ts';
import { runRealBuildAndTypeCheck } from './test-build-check.ts';
import { runReportingFailureModeTests } from './test-reporting.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function runMasterVerificationSuite(): boolean {
  console.log("================================================================================");
  console.log("             NETSAGE AI — INDEPENDENT VERIFICATION & QA RUNNER                  ");
  console.log("================================================================================\n");

  const startTime = Date.now();
  let totalTestsCount = 0;
  let totalPassCount = 0;
  let totalFailCount = 0;
  const suiteStatus: Record<string, "PASS" | "FAIL" | "NOT VERIFIED"> = {};

  // 1. DATASET VALIDATION
  console.log("--------------------------------------------------------------------------------");
  console.log(" 1. DATASET VALIDATION (data/cases.csv Schema, Uniqueness, Domain Coverage)");
  console.log("--------------------------------------------------------------------------------");
  const datasetResult = validateDataset();
  totalTestsCount += datasetResult.totalCases;
  if (datasetResult.passed) {
    totalPassCount += datasetResult.totalCases;
    suiteStatus["Dataset Validation"] = "PASS";
    console.log(`\x1b[32m✔ PASSED\x1b[0m: Authoritative dataset verified (${datasetResult.totalCases} cases).`);
    console.log(`  Domain Coverage: Wireless(${datasetResult.coverage.wireless}), VLAN(${datasetResult.coverage.vlan}), Gateway(${datasetResult.coverage.gateway}), DHCP(${datasetResult.coverage.dhcp}), DNS(${datasetResult.coverage.dns}), Routing(${datasetResult.coverage.routing}), ACL(${datasetResult.coverage.acl}), NAT(${datasetResult.coverage.nat})`);
  } else {
    totalFailCount += datasetResult.errors.length;
    suiteStatus["Dataset Validation"] = "FAIL";
    console.error(`\x1b[31m✘ FAILED\x1b[0m: Dataset validation errors:`);
    datasetResult.errors.forEach(e => console.error(`  - ${e}`));
  }
  console.log();

  // 2. DETERMINISTIC RULE ENGINE & NEGATIVE / EDGE / CASE-ID INDEPENDENCE TESTS
  console.log("--------------------------------------------------------------------------------");
  console.log(" 2. INDEPENDENT DETERMINISTIC RULE MATRIX (RC-01 to RC-15 & Case-ID Independence)");
  console.log("--------------------------------------------------------------------------------");
  const ruleResult = runRuleEngineTests();
  totalTestsCount += ruleResult.totalTests;
  totalPassCount += ruleResult.passedTests;
  totalFailCount += (ruleResult.totalTests - ruleResult.passedTests);

  const ruleEnginePass = ruleResult.positiveCount > 0 && ruleResult.errors.filter(e => e.includes("[positive]")).length === 0;
  const negativePass = ruleResult.negativeCount > 0 && ruleResult.errors.filter(e => e.includes("[negative]") || e.includes("[similar-valid]")).length === 0;
  const edgePass = ruleResult.edgeCount > 0 && ruleResult.errors.filter(e => e.includes("[edge-case]")).length === 0;

  suiteStatus["Rule Engine"] = ruleEnginePass ? "PASS" : "FAIL";
  suiteStatus["Negative Tests"] = negativePass ? "PASS" : "FAIL";
  suiteStatus["Edge Cases"] = edgePass ? "PASS" : "FAIL";

  if (ruleResult.passed) {
    console.log(`\x1b[32m✔ PASSED\x1b[0m: ${ruleResult.passedTests} / ${ruleResult.totalTests} rule matrix tests verified.`);
    console.log(`  - Positive Cases: ${ruleResult.positiveCount} Verified`);
    console.log(`  - Negative & Similar-Valid Cases: ${ruleResult.negativeCount} Verified`);
    console.log(`  - Edge Cases: ${ruleResult.edgeCount} Verified`);
    console.log(`  - Case-ID Independence: ${ruleResult.caseIdIndependencePassed ? "PASSED (Diagnosis strictly evidence-driven)" : "FAILED"}`);
  } else {
    console.error(`\x1b[31m✘ FAILED\x1b[0m: Rule matrix errors:`);
    ruleResult.errors.forEach(e => console.error(`  - ${e}`));
  }
  console.log();

  // 3. FUZZ & ROBUSTNESS ENGINE TESTS
  console.log("--------------------------------------------------------------------------------");
  console.log(" 3. FUZZ & ROBUSTNESS ENGINE TESTS (Malformed, Binary, Unicode, 10k Strings)");
  console.log("--------------------------------------------------------------------------------");
  const fuzzResult = runFuzzTests();
  totalTestsCount += fuzzResult.totalTests;
  totalPassCount += fuzzResult.passedTests;
  totalFailCount += (fuzzResult.totalTests - fuzzResult.passedTests);
  suiteStatus["Fuzz Tests"] = fuzzResult.passed ? "PASS" : "FAIL";

  if (fuzzResult.passed) {
    console.log(`\x1b[32m✔ PASSED\x1b[0m: All ${fuzzResult.passedTests} / ${fuzzResult.totalTests} fuzz stress tests handled safely.`);
  } else {
    console.error(`\x1b[31m✘ FAILED\x1b[0m: Fuzz errors:`);
    fuzzResult.errors.forEach(e => console.error(`  - ${e}`));
  }
  console.log();

  // 4. AI SAFETY, SCHEMA, GROUNDING, & GROUND-TRUTH ISOLATION
  console.log("--------------------------------------------------------------------------------");
  console.log(" 4. AI SAFETY, SCHEMA, HALLUCINATION GROUNDING & GROUND-TRUTH ISOLATION");
  console.log("--------------------------------------------------------------------------------");
  const aiSafetyResult = runAiSafetyTests();
  totalTestsCount += aiSafetyResult.totalTests;
  totalPassCount += aiSafetyResult.passedTests;
  totalFailCount += (aiSafetyResult.totalTests - aiSafetyResult.passedTests);

  suiteStatus["AI Safety"] = aiSafetyResult.schemaPassedTests > 0 && aiSafetyResult.errors.filter(e => e.toLowerCase().includes("schema") || e.toLowerCase().includes("reject")).length === 0 ? "PASS" : "FAIL";
  suiteStatus["AI Grounding"] = aiSafetyResult.groundingPassedTests > 0 && aiSafetyResult.errors.filter(e => e.toLowerCase().includes("grounding") || e.toLowerCase().includes("hallucination")).length === 0 ? "PASS" : "FAIL";
  suiteStatus["Ground Truth Isolation"] = aiSafetyResult.groundTruthIsolationPassedTests > 0 && aiSafetyResult.errors.filter(e => e.toLowerCase().includes("ground-truth")).length === 0 ? "PASS" : "FAIL";

  if (aiSafetyResult.passed) {
    console.log(`\x1b[32m✔ PASSED\x1b[0m: All ${aiSafetyResult.passedTests} / ${aiSafetyResult.totalTests} AI safety & grounding tests verified.`);
    console.log(`  - Schema Validation: ${aiSafetyResult.schemaPassedTests} Verified`);
    console.log(`  - Evidence Grounding & Hallucination Prevention: ${aiSafetyResult.groundingPassedTests} Verified`);
    console.log(`  - Insufficient Evidence Fallback Handling: ${aiSafetyResult.insufficientEvidencePassedTests} Verified`);
    console.log(`  - Ground-Truth Isolation & Leakage Prevention: ${aiSafetyResult.groundTruthIsolationPassedTests} Verified`);
  } else {
    console.error(`\x1b[31m✘ FAILED\x1b[0m: AI Safety errors:`);
    aiSafetyResult.errors.forEach(e => console.error(`  - ${e}`));
  }
  console.log();

  // 5. HUMAN-IN-THE-LOOP (HITL) & SHA-256 AUDIT TAMPERING
  console.log("--------------------------------------------------------------------------------");
  console.log(" 5. HUMAN-IN-THE-LOOP GATES & CRYPTOGRAPHIC SHA-256 AUDIT CHAIN TAMPER TESTS");
  console.log("--------------------------------------------------------------------------------");
  const humanAuditResult = runHumanAuditTests();
  totalTestsCount += humanAuditResult.totalTests;
  totalPassCount += humanAuditResult.passedTests;
  totalFailCount += (humanAuditResult.totalTests - humanAuditResult.passedTests);

  suiteStatus["HITL Gate"] = humanAuditResult.hitlPassedTests > 0 && humanAuditResult.errors.filter(e => e.toLowerCase().includes("human") || e.toLowerCase().includes("hitl") || e.toLowerCase().includes("rejection")).length === 0 ? "PASS" : "FAIL";
  suiteStatus["Audit Integrity"] = humanAuditResult.auditChainPassedTests > 0 && humanAuditResult.errors.filter(e => e.toLowerCase().includes("tamper") || e.toLowerCase().includes("integrity")).length === 0 ? "PASS" : "FAIL";

  if (humanAuditResult.passed) {
    console.log(`\x1b[32m✔ PASSED\x1b[0m: All ${humanAuditResult.passedTests} / ${humanAuditResult.totalTests} human review & audit chain tamper scenarios verified.`);
    console.log(`  - HITL State Transitions (Accepted, Edited, Rejected): Verified`);
    console.log(`  - Cryptographic Tamper Scenarios (10 Scenarios): ${humanAuditResult.tamperScenariosChecked} Checked & Blocked`);
  } else {
    console.error(`\x1b[31m✘ FAILED\x1b[0m: Human Audit errors:`);
    humanAuditResult.errors.forEach(e => console.error(`  - ${e}`));
  }
  console.log();

  // 6. FULL 35-CASE AUTHORITATIVE DATASET EVALUATION
  console.log("--------------------------------------------------------------------------------");
  console.log(" 6. AUTHORITATIVE DATASET FULL SUITE EVALUATION (All 35 Cases)");
  console.log("--------------------------------------------------------------------------------");
  const fullDatasetResult = runFullDatasetExecution();
  totalTestsCount += fullDatasetResult.totalCases;
  totalPassCount += fullDatasetResult.passedCases;
  totalFailCount += fullDatasetResult.failedCases;
  suiteStatus["Full Dataset"] = fullDatasetResult.passed ? "PASS" : "FAIL";

  if (fullDatasetResult.passed) {
    console.log(`\x1b[32m✔ PASSED\x1b[0m: All ${fullDatasetResult.passedCases} / ${fullDatasetResult.totalCases} cases verified across deterministic & AI validation pathways.`);
    console.log(`  - False Positives: ${fullDatasetResult.falsePositives}`);
    console.log(`  - False Negatives: ${fullDatasetResult.falseNegatives}`);
    console.log(`  - Machine-readable results saved to: test-results/full-dataset-results.json`);
  } else {
    console.error(`\x1b[31m✘ FAILED\x1b[0m: Dataset execution errors:`);
    fullDatasetResult.errors.forEach(e => console.error(`  - ${e}`));
  }
  console.log();

  // 7. REAL BUILD & TYPE CHECK DYNAMIC VERIFICATION (tsc --noEmit & vite build)
  console.log("--------------------------------------------------------------------------------");
  console.log(" 7. REAL BUILD & TYPE CHECK VERIFICATION (TypeScript Compiler & Production Build)");
  console.log("--------------------------------------------------------------------------------");
  const buildCheckResult = runRealBuildAndTypeCheck();
  totalTestsCount += buildCheckResult.totalChecks;
  totalPassCount += buildCheckResult.passedChecks;
  totalFailCount += (buildCheckResult.totalChecks - buildCheckResult.passedChecks);
  suiteStatus["Build/Type Check"] = buildCheckResult.status;

  if (buildCheckResult.passed) {
    console.log(`\x1b[32m✔ PASSED\x1b[0m: Real Build & Type Check succeeded in ${buildCheckResult.durationMs}ms.`);
    console.log(`  - TypeScript Compilation (tsc --noEmit): PASSED`);
    console.log(`  - Production Bundle (vite build & esbuild server.ts): PASSED`);
  } else if (buildCheckResult.status === "FAIL") {
    console.error(`\x1b[31m✘ FAILED\x1b[0m: Build/Type Check errors:`);
    buildCheckResult.errors.forEach(e => console.error(`  - ${e}`));
  } else {
    console.warn(`\x1b[33m? NOT VERIFIED\x1b[0m: Build/Type Check could not be executed.`);
  }
  console.log();

  // 8. VERIFICATION REPORTING & FAILURE-MODE INTEGRITY TESTS
  console.log("--------------------------------------------------------------------------------");
  console.log(" 8. VERIFICATION PIPELINE REPORTING & FAILURE-MODE INTEGRITY (Tests A-F)");
  console.log("--------------------------------------------------------------------------------");
  const reportingResult = runReportingFailureModeTests();
  totalTestsCount += reportingResult.totalTests;
  totalPassCount += reportingResult.passedTests;
  totalFailCount += (reportingResult.totalTests - reportingResult.passedTests);
  suiteStatus["Reporting Integrity"] = reportingResult.passed ? "PASS" : "FAIL";

  if (reportingResult.passed) {
    console.log(`\x1b[32m✔ PASSED\x1b[0m: All ${reportingResult.passedTests} / ${reportingResult.totalTests} reporting failure mode scenarios verified.`);
    console.log(`  - TEST A (Successful 35/35 execution): PASS`);
    console.log(`  - TEST B (Validation failure 34/35): FAIL without execution error`);
    console.log(`  - TEST C (Process execution failure / crash): 0 tests executed with execution_error=true`);
    console.log(`  - TEST D (Malformed output handling): 0 tests executed with execution_error=true`);
    console.log(`  - TEST E (Empty output handling): 0 tests executed with execution_error=true`);
    console.log(`  - TEST F (Truthful aggregate totals): Verified no unexecuted tests counted`);
  } else {
    console.error(`\x1b[31m✘ FAILED\x1b[0m: Reporting integrity errors:`);
    reportingResult.errors.forEach(e => console.error(`  - ${e}`));
  }
  console.log();

  // Query environment metadata
  let pythonVersion = "NOT AVAILABLE";
  try {
    pythonVersion = execSync("python3 --version", { stdio: "pipe" }).toString().trim();
  } catch {}

  let commitSha = "NOT AVAILABLE";
  try {
    commitSha = execSync("git rev-parse HEAD", { stdio: "pipe" }).toString().trim();
  } catch {}

  // Write Master Machine-Readable Verification Report JSON
  const resultsDir = path.resolve(__dirname, '../../test-results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  const durationMs = Date.now() - startTime;
  const isOverallPass = totalFailCount === 0 && suiteStatus["Build/Type Check"] === "PASS";

  const reportPayload = {
    test_run_timestamp: new Date().toISOString(),
    commit_sha: commitSha,
    node_version: process.version,
    python_version: pythonVersion,
    execution_duration_ms: durationMs,
    overall_status: isOverallPass ? "PASS" : "FAIL",
    summary: {
      total_tests: totalTestsCount,
      passed: totalPassCount,
      failed: totalFailCount,
      skipped: 0,
      not_verified: suiteStatus["Build/Type Check"] === "NOT VERIFIED" ? 1 : 0
    },
    suite_breakdown: {
      dataset_validation: { status: suiteStatus["Dataset Validation"], total_cases: datasetResult.totalCases, coverage: datasetResult.coverage },
      rule_engine: { status: suiteStatus["Rule Engine"], total_matrix_tests: ruleResult.totalTests, positive: ruleResult.positiveCount },
      negative_tests: { status: suiteStatus["Negative Tests"], total: ruleResult.negativeCount },
      edge_cases: { status: suiteStatus["Edge Cases"], total: ruleResult.edgeCount },
      fuzz_tests: { status: suiteStatus["Fuzz Tests"], total_stress_tests: fuzzResult.totalTests },
      ai_safety: { status: suiteStatus["AI Safety"], schema_tests: aiSafetyResult.schemaPassedTests },
      ai_grounding: { status: suiteStatus["AI Grounding"], grounding_tests: aiSafetyResult.groundingPassedTests },
      hitl_gate: { status: suiteStatus["HITL Gate"], hitl_tests: humanAuditResult.hitlPassedTests },
      audit_integrity: { status: suiteStatus["Audit Integrity"], tamper_scenarios_tested: humanAuditResult.tamperScenariosChecked },
      ground_truth_isolation: { status: suiteStatus["Ground Truth Isolation"], tests: aiSafetyResult.groundTruthIsolationPassedTests },
      full_dataset: { status: suiteStatus["Full Dataset"], total_cases: fullDatasetResult.totalCases, false_positives: fullDatasetResult.falsePositives, false_negatives: fullDatasetResult.falseNegatives },
      reporting_integrity: { status: suiteStatus["Reporting Integrity"], total_tests: reportingResult.totalTests, passed: reportingResult.passedTests },
      build_type_check: {
        status: suiteStatus["Build/Type Check"],
        typescript_typecheck: buildCheckResult.typeCheckPassed ? "PASS" : "FAIL",
        production_build: buildCheckResult.buildPassed ? "PASS" : "FAIL",
        duration_ms: buildCheckResult.durationMs
      }
    }
  };

  fs.writeFileSync(
    path.join(resultsDir, 'verification-report.json'),
    JSON.stringify(reportPayload, null, 2),
    'utf8'
  );

  // Print Authoritative Verification Suite Summary in Exact Required Format
  console.log("==================================================");
  console.log("NETSAGE AI — FINAL INDEPENDENT VERIFICATION");
  console.log("==================================================");
  console.log(`Dataset Validation       ${suiteStatus["Dataset Validation"]}`);
  console.log(`Rule Engine              ${suiteStatus["Rule Engine"]}`);
  console.log(`Negative Tests           ${suiteStatus["Negative Tests"]}`);
  console.log(`Edge Cases               ${suiteStatus["Edge Cases"]}`);
  console.log(`Fuzz Tests               ${suiteStatus["Fuzz Tests"]}`);
  console.log(`AI Safety                ${suiteStatus["AI Safety"]}`);
  console.log(`AI Grounding             ${suiteStatus["AI Grounding"]}`);
  console.log(`Ground Truth Isolation   ${suiteStatus["Ground Truth Isolation"]}`);
  console.log(`HITL Gate                ${suiteStatus["HITL Gate"]}`);
  console.log(`Audit Integrity          ${suiteStatus["Audit Integrity"]}`);
  console.log(`Full Dataset             ${suiteStatus["Full Dataset"]}`);
  console.log(`Build / Type Check       ${suiteStatus["Build/Type Check"]}`);
  console.log(`Reporting Integrity      ${suiteStatus["Reporting Integrity"]}`);
  console.log();
  console.log(`TOTAL EXECUTED: ${totalTestsCount}`);
  console.log(`PASSED: ${totalPassCount}`);
  console.log(`FAILED: ${totalFailCount}`);
  console.log(`SKIPPED: 0`);
  console.log(`NOT VERIFIED: ${suiteStatus["Build/Type Check"] === "NOT VERIFIED" ? 1 : 0}`);
  console.log();
  console.log(`OVERALL: ${isOverallPass ? "PASS" : "FAIL"}`);
  console.log("==================================================");

  if (!isOverallPass) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

// Automatically run when executed via CLI
if (process.argv[1] && process.argv[1].includes('runner')) {
  runMasterVerificationSuite();
}
