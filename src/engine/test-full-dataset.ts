import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { runDeterministicChecks } from './checker.ts';
import { parseCsvRows } from './test-dataset.ts';
import { validateAndSanitizeAiDiagnosis, DiagnosticAiResponse } from './aiValidator.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface CaseExecutionResult {
  case_id: string;
  title: string;
  concept_tag: string;
  severity: string;
  osi_layer: string;
  expected_rule_ids: string[];
  triggered_rule_ids: string[];
  deterministic_status: "PASS" | "FAIL";
  ai_schema_status: "PASS" | "FAIL";
  ai_grounding_status: "PASS" | "FAIL";
  passed: boolean;
  failure_reasons: string[];
}

export interface FullDatasetSuiteResult {
  passed: boolean;
  totalCases: number;
  passedCases: number;
  failedCases: number;
  falsePositives: number;
  falseNegatives: number;
  caseResults: CaseExecutionResult[];
  resultsFilePath: string;
  errors: string[];
}

export function runFullDatasetExecution(): FullDatasetSuiteResult {
  const casesCsvPath = path.resolve(__dirname, '../../data/cases.csv');
  const errors: string[] = [];

  if (!fs.existsSync(casesCsvPath)) {
    return {
      passed: false,
      totalCases: 0,
      passedCases: 0,
      failedCases: 0,
      falsePositives: 0,
      falseNegatives: 0,
      caseResults: [],
      resultsFilePath: "",
      errors: [`Dataset file not found at ${casesCsvPath}`]
    };
  }

  const csvContent = fs.readFileSync(casesCsvPath, 'utf8');
  const rows = parseCsvRows(csvContent).slice(1);

  let passedCases = 0;
  let falsePositives = 0;
  let falseNegatives = 0;
  const caseResults: CaseExecutionResult[] = [];

  for (const row of rows) {
    const caseId = row[0]?.trim() || "UNKNOWN";
    const title = row[1]?.trim() || "";
    const symptom = row[2]?.trim() || "";
    const topologyNote = row[3]?.trim() || "";
    const showOutputs = row[4]?.trim() || "";
    const expectedFault = row[5]?.trim() || "";
    const expectedOsiLayer = row[6]?.trim() || "";
    const conceptTag = row[7]?.trim() || "";
    const severity = row[8]?.trim() || "Medium";
    const expectedNextCmd = row[9]?.trim() || "";
    const expectedFixStepsStr = row[10]?.trim() || "";
    const expectedRuleIdsStr = row[11]?.trim() || "";

    const expectedRuleIds = expectedRuleIdsStr.split(',').map(s => s.trim()).filter(Boolean);
    const expectedFixSteps = expectedFixStepsStr.split(';').map(s => s.trim()).filter(Boolean);
    const caseFailures: string[] = [];

    // 1. Run Deterministic Checker
    const checks = runDeterministicChecks(showOutputs, caseId, title, conceptTag);
    const triggeredFailed = checks.filter(c => c.status === "fail" || c.status === "warn").map(c => c.id);

    // Evaluate False Negatives (Missing expected rule)
    const missingRules = expectedRuleIds.filter(id => !triggeredFailed.includes(id));
    if (missingRules.length > 0) {
      falseNegatives++;
      caseFailures.push(`False Negative: Missing expected rule(s) [${missingRules.join(', ')}]`);
    }

    // Evaluate False Positives (Unexpected rule triggered)
    const unexpectedRules = triggeredFailed.filter(id => !expectedRuleIds.includes(id));
    if (unexpectedRules.length > 0) {
      falsePositives++;
      caseFailures.push(`False Positive: Unexpected rule(s) [${unexpectedRules.join(', ')}] triggered`);
    }

    const deterministicStatus = (missingRules.length === 0 && unexpectedRules.length === 0) ? "PASS" : "FAIL";

    // 2. Validate Diagnostic Path & AI Schema/Grounding
    const syntheticAiOutput: DiagnosticAiResponse = {
      root_cause: expectedFault,
      osi_layer: expectedOsiLayer,
      confidence: "High",
      evidence: [showOutputs.split('\n')[1] || showOutputs.substring(0, 40) || symptom],
      next_command: expectedNextCmd,
      fix_steps: expectedFixSteps.length > 0 ? expectedFixSteps : ["configure terminal", "end"]
    };

    const aiValidation = validateAndSanitizeAiDiagnosis(
      syntheticAiOutput,
      showOutputs,
      checks.map(c => `${c.id}: ${c.details}`).join('\n')
    );

    const schemaStatus = aiValidation.valid ? "PASS" : "FAIL";
    const groundingStatus = aiValidation.grounded ? "PASS" : "FAIL";

    if (!aiValidation.valid) {
      caseFailures.push(`AI Schema Failure: ${aiValidation.reason}`);
    }

    const isCasePassed = deterministicStatus === "PASS" && schemaStatus === "PASS";
    if (isCasePassed) {
      passedCases++;
    } else {
      errors.push(`Case ${caseId} (${title}) FAILED: ${caseFailures.join('; ')}`);
    }

    caseResults.push({
      case_id: caseId,
      title,
      concept_tag: conceptTag,
      severity,
      osi_layer: expectedOsiLayer,
      expected_rule_ids: expectedRuleIds,
      triggered_rule_ids: triggeredFailed,
      deterministic_status: deterministicStatus,
      ai_schema_status: schemaStatus,
      ai_grounding_status: groundingStatus,
      passed: isCasePassed,
      failure_reasons: caseFailures
    });
  }

  // Ensure test-results directory exists
  const resultsDir = path.resolve(__dirname, '../../test-results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  const resultsFilePath = path.join(resultsDir, 'full-dataset-results.json');
  fs.writeFileSync(
    resultsFilePath,
    JSON.stringify({
      timestamp: new Date().toISOString(),
      dataset_file: "data/cases.csv",
      total_cases: rows.length,
      passed_cases: passedCases,
      failed_cases: rows.length - passedCases,
      false_positives: falsePositives,
      false_negatives: falseNegatives,
      cases: caseResults
    }, null, 2),
    'utf8'
  );

  return {
    passed: passedCases === rows.length && falsePositives === 0 && falseNegatives === 0,
    totalCases: rows.length,
    passedCases,
    failedCases: rows.length - passedCases,
    falsePositives,
    falseNegatives,
    caseResults,
    resultsFilePath,
    errors
  };
}
