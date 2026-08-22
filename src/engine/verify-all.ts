import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { parsePythonCheckerOutput, stripAnsi, PythonCheckerSummary } from './parse-checker.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = process.cwd();
const RESULTS_DIR = path.join(ROOT_DIR, 'test-results');

export interface StepResult {
  command: string;
  name: string;
  passed: boolean;
  durationMs: number;
  testCount: number;
  passCount: number;
  failCount: number;
  output: string;
  executionError: boolean;
  errorMessage?: string;
}

export function runAuthoritativeVerification(): boolean {
  console.log("================================================================================");
  console.log("             NETSAGE AI — INDEPENDENT VERIFICATION & QA RUNNER                  ");
  console.log("================================================================================\n");

  const overallStartTime = Date.now();
  const testRunTimestamp = new Date().toISOString();

  // Phase 5: Ensure test-results directory exists and purge/mark stale reports before execution
  if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
  }

  const reportPath = path.join(RESULTS_DIR, 'verification-report.json');
  // Write in-progress marker so a previous successful report is never mistaken for current execution
  fs.writeFileSync(
    reportPath,
    JSON.stringify({
      verification_type: "fresh_runtime_execution",
      status: "IN_PROGRESS",
      started_at: testRunTimestamp,
      message: "Verification is actively running. Final report will be generated upon completion."
    }, null, 2),
    'utf8'
  );

  // Phase 1 & 6: Collect environment and revision metadata
  let commitSha = "NOT AVAILABLE";
  try {
    commitSha = execSync("git rev-parse HEAD", { cwd: ROOT_DIR, stdio: "pipe" }).toString().trim();
  } catch (err: any) {
    try {
      execSync("git init && git add -A && git commit -m 'chore: baseline'", { cwd: ROOT_DIR, stdio: "pipe" });
      commitSha = execSync("git rev-parse HEAD", { cwd: ROOT_DIR, stdio: "pipe" }).toString().trim();
    } catch {}
  }

  let branch = "master";
  try {
    branch = execSync("git rev-parse --abbrev-ref HEAD", { cwd: ROOT_DIR, stdio: "pipe" }).toString().trim();
  } catch {}

  let nodeVersion = process.version;
  let npmVersion = "NOT AVAILABLE";
  try {
    npmVersion = execSync("npm -v", { cwd: ROOT_DIR, stdio: "pipe" }).toString().trim();
  } catch {}

  let pythonVersion = "NOT AVAILABLE";
  try {
    pythonVersion = execSync("python3 --version", { cwd: ROOT_DIR, stdio: "pipe" }).toString().trim();
  } catch {}

  const platform = `${process.platform} ${process.arch}`;

  console.log(`[VERIFICATION RUNTIME METADATA]`);
  console.log(`  • Commit SHA:       ${commitSha}`);
  console.log(`  • Branch:           ${branch}`);
  console.log(`  • Timestamp:        ${testRunTimestamp}`);
  console.log(`  • Node Version:     ${nodeVersion}`);
  console.log(`  • npm Version:      ${npmVersion}`);
  console.log(`  • Python Version:   ${pythonVersion}`);
  console.log(`  • OS / Platform:    ${platform}`);
  console.log("--------------------------------------------------------------------------------\n");

  const executedCommands: string[] = [];
  const stepResults: StepResult[] = [];

  // 1. Step 1: TypeScript Static Type Checking
  console.log("--------------------------------------------------------------------------------");
  console.log(" 1. STATIC TYPE CHECKING (tsc --noEmit)");
  console.log("--------------------------------------------------------------------------------");
  const lintCmd = "npm run lint";
  executedCommands.push(lintCmd);
  const lintStart = Date.now();
  let lintPassed = false;
  let lintOutput = "";
  try {
    lintOutput = execSync(lintCmd, { cwd: ROOT_DIR, stdio: "pipe" }).toString();
    lintPassed = true;
    console.log(`\x1b[32m✔ PASSED\x1b[0m: TypeScript compilation check (tsc --noEmit) completed cleanly.`);
  } catch (err: any) {
    lintOutput = (err.stdout ? err.stdout.toString() : '') + (err.stderr ? err.stderr.toString() : '') || err.message;
    console.error(`\x1b[31m✘ FAILED\x1b[0m: TypeScript compilation errors found:\n${lintOutput}`);
  }
  stepResults.push({
    command: lintCmd,
    name: "TypeScript Static Type Check",
    passed: lintPassed,
    durationMs: Date.now() - lintStart,
    testCount: 1,
    passCount: lintPassed ? 1 : 0,
    failCount: lintPassed ? 0 : 1,
    output: lintOutput,
    executionError: false
  });
  console.log();

  // 2. Step 2: Master TypeScript Verification Suite
  console.log("--------------------------------------------------------------------------------");
  console.log(" 2. CORE TYPESCRIPT VERIFICATION SUITE (Dataset, Rules, AI Safety, HITL, Audit)");
  console.log("--------------------------------------------------------------------------------");
  const testCmd = "npm run test";
  executedCommands.push(testCmd);
  const testStart = Date.now();
  let testPassed = false;
  let testOutput = "";
  let tsTestCount = 0;
  let tsPassCount = 0;
  let tsFailCount = 0;
  let tsExecutionError = false;
  let tsErrorMessage: string | undefined = undefined;

  try {
    testOutput = execSync(testCmd, { cwd: ROOT_DIR, stdio: "pipe" }).toString();
    console.log(testOutput);

    const cleanOutput = stripAnsi(testOutput);
    const totalExecBlockMatch = cleanOutput.match(/TOTAL EXECUTED:\s*(\d+)\s*PASSED:\s*(\d+)\s*FAILED:\s*(\d+)/i);
    const totalBlockMatch = cleanOutput.match(/TOTAL:\s*PASSED:\s*(\d+)\s*FAILED:\s*(\d+)/i);
    if (totalExecBlockMatch) {
      tsTestCount = parseInt(totalExecBlockMatch[1], 10);
      tsPassCount = parseInt(totalExecBlockMatch[2], 10);
      tsFailCount = parseInt(totalExecBlockMatch[3], 10);
      testPassed = tsFailCount === 0 && tsTestCount > 0;
    } else if (totalBlockMatch) {
      tsPassCount = parseInt(totalBlockMatch[1], 10);
      tsFailCount = parseInt(totalBlockMatch[2], 10);
      tsTestCount = tsPassCount + tsFailCount;
      testPassed = tsFailCount === 0 && tsTestCount > 0;
    } else {
      const matchSummaryPassed = cleanOutput.match(/\nPASSED:\s*(\d+)\s*\nFAILED:\s*(\d+)/i);
      if (matchSummaryPassed) {
        tsPassCount = parseInt(matchSummaryPassed[1], 10);
        tsFailCount = parseInt(matchSummaryPassed[2], 10);
        tsTestCount = tsPassCount + tsFailCount;
        testPassed = tsFailCount === 0 && tsTestCount > 0;
      } else {
        tsTestCount = 0;
        tsPassCount = 0;
        tsFailCount = 0;
        testPassed = false;
        tsExecutionError = true;
        tsErrorMessage = "Malformed TypeScript test runner output.";
      }
    }
  } catch (err: any) {
    testOutput = (err.stdout ? err.stdout.toString() : '') + (err.stderr ? err.stderr.toString() : '') || err.message;
    console.log(testOutput);
    const cleanOutput = stripAnsi(testOutput);
    const totalExecBlockMatch = cleanOutput.match(/TOTAL EXECUTED:\s*(\d+)\s*PASSED:\s*(\d+)\s*FAILED:\s*(\d+)/i);
    const totalBlockMatch = cleanOutput.match(/TOTAL:\s*PASSED:\s*(\d+)\s*FAILED:\s*(\d+)/i);
    if (totalExecBlockMatch) {
      tsTestCount = parseInt(totalExecBlockMatch[1], 10);
      tsPassCount = parseInt(totalExecBlockMatch[2], 10);
      tsFailCount = parseInt(totalExecBlockMatch[3], 10);
      testPassed = false;
      tsExecutionError = false;
    } else if (totalBlockMatch) {
      tsPassCount = parseInt(totalBlockMatch[1], 10);
      tsFailCount = parseInt(totalBlockMatch[2], 10);
      tsTestCount = tsPassCount + tsFailCount;
      testPassed = false;
      tsExecutionError = false;
    } else {
      const matchPassed = cleanOutput.match(/PASSED:\s*(\d+)/i);
      const matchFailed = cleanOutput.match(/FAILED:\s*(\d+)/i);
      if (matchPassed || matchFailed) {
        tsPassCount = matchPassed ? parseInt(matchPassed[1], 10) : 0;
        tsFailCount = matchFailed ? parseInt(matchFailed[1], 10) : 1;
        tsTestCount = tsPassCount + tsFailCount;
        testPassed = false;
        tsExecutionError = false;
      } else {
        tsTestCount = 0;
        tsPassCount = 0;
        tsFailCount = 0;
        testPassed = false;
        tsExecutionError = true;
        tsErrorMessage = (err.message || 'TypeScript test runner execution failed').trim();
      }
    }
    console.error(`\x1b[31m✘ FAILED\x1b[0m: Core TypeScript test suite encountered failures.`);
  }
  stepResults.push({
    command: testCmd,
    name: "Master TypeScript Verification Suite",
    passed: testPassed,
    durationMs: Date.now() - testStart,
    testCount: tsTestCount,
    passCount: tsPassCount,
    failCount: tsFailCount,
    output: testOutput,
    executionError: tsExecutionError,
    errorMessage: tsErrorMessage
  });
  console.log();

  // 3. Step 3: Python Unit Tests (tests/ directory)
  console.log("--------------------------------------------------------------------------------");
  console.log(" 3. PYTHON REFERENCE UNIT TESTS (python3 -m unittest discover tests)");
  console.log("--------------------------------------------------------------------------------");
  const pyUnitCmd = "python3 -m unittest discover tests";
  executedCommands.push(pyUnitCmd);
  const pyUnitStart = Date.now();
  let pyUnitPassed = false;
  let pyUnitOutput = "";
  let pyUnitTestCount = 0;
  let pyUnitPassCount = 0;
  let pyUnitFailCount = 0;
  let pyUnitExecutionError = false;
  let pyUnitErrorMessage: string | undefined = undefined;

  try {
    // Note: Python unittest sends summary to stderr, so redirect 2>&1
    pyUnitOutput = execSync(`${pyUnitCmd} 2>&1`, { cwd: ROOT_DIR, stdio: "pipe" }).toString();
    const cleanPyUnit = stripAnsi(pyUnitOutput);
    console.log(pyUnitOutput);

    const ranMatch = cleanPyUnit.match(/Ran\s+(\d+)\s+tests/i);
    if (ranMatch) {
      pyUnitTestCount = parseInt(ranMatch[1], 10);
      const hasFailed = cleanPyUnit.includes("FAILED") || cleanPyUnit.includes("ERROR");
      pyUnitPassed = cleanPyUnit.includes("OK") && !hasFailed;

      if (pyUnitPassed) {
        pyUnitPassCount = pyUnitTestCount;
        pyUnitFailCount = 0;
        console.log(`\x1b[32m✔ PASSED\x1b[0m: Python unittest suite executed (${pyUnitPassCount}/${pyUnitTestCount} tests passed).`);
      } else {
        const failMatch = cleanPyUnit.match(/failures=(\d+)/i);
        const errMatch = cleanPyUnit.match(/errors=(\d+)/i);
        pyUnitFailCount = (failMatch ? parseInt(failMatch[1], 10) : 0) + (errMatch ? parseInt(errMatch[1], 10) : 0) || 1;
        pyUnitPassCount = Math.max(0, pyUnitTestCount - pyUnitFailCount);
        console.error(`\x1b[31m✘ FAILED\x1b[0m: Python unittest suite failed (${pyUnitPassCount}/${pyUnitTestCount} passed, ${pyUnitFailCount} failed).`);
      }
    } else {
      pyUnitTestCount = 0;
      pyUnitPassCount = 0;
      pyUnitFailCount = 0;
      pyUnitPassed = false;
      pyUnitExecutionError = true;
      pyUnitErrorMessage = "Malformed unittest output (missing 'Ran X tests').";
      console.error(`\x1b[31m✘ FAILED\x1b[0m: Python unittest suite returned unexpected output.`);
    }
  } catch (err: any) {
    pyUnitOutput = (err.stdout ? err.stdout.toString() : '') + (err.stderr ? err.stderr.toString() : '') || err.message;
    console.log(pyUnitOutput);
    const cleanPyUnit = stripAnsi(pyUnitOutput);
    const ranMatch = cleanPyUnit.match(/Ran\s+(\d+)\s+tests/i);
    if (ranMatch) {
      pyUnitTestCount = parseInt(ranMatch[1], 10);
      const failMatch = cleanPyUnit.match(/failures=(\d+)/i);
      const errMatch = cleanPyUnit.match(/errors=(\d+)/i);
      pyUnitFailCount = (failMatch ? parseInt(failMatch[1], 10) : 0) + (errMatch ? parseInt(errMatch[1], 10) : 0) || 1;
      pyUnitPassCount = Math.max(0, pyUnitTestCount - pyUnitFailCount);
      pyUnitPassed = false;
      pyUnitExecutionError = false;
      console.error(`\x1b[31m✘ FAILED\x1b[0m: Python unittest suite failed (${pyUnitPassCount}/${pyUnitTestCount} passed, ${pyUnitFailCount} failed).`);
    } else {
      pyUnitTestCount = 0;
      pyUnitPassCount = 0;
      pyUnitFailCount = 0;
      pyUnitPassed = false;
      pyUnitExecutionError = true;
      pyUnitErrorMessage = (err.message || 'Python unittest execution failed').trim();
      console.error(`\x1b[31m✘ FAILED\x1b[0m: Python unit tests execution failed:\n${pyUnitOutput}`);
    }
  }
  stepResults.push({
    command: pyUnitCmd,
    name: "Python Reference Unit Tests",
    passed: pyUnitPassed,
    durationMs: Date.now() - pyUnitStart,
    testCount: pyUnitTestCount,
    passCount: pyUnitPassCount,
    failCount: pyUnitFailCount,
    output: pyUnitOutput,
    executionError: pyUnitExecutionError,
    errorMessage: pyUnitErrorMessage
  });
  console.log();

  // 4. Step 4: Python Authoritative Dataset Compliance Suite (checker.py)
  console.log("--------------------------------------------------------------------------------");
  console.log(" 4. PYTHON AUTHORITATIVE DATASET COMPLIANCE (python3 checker.py --all-cases)");
  console.log("--------------------------------------------------------------------------------");
  const pyCheckCmd = "python3 checker.py --all-cases";
  executedCommands.push(pyCheckCmd);
  const pyCheckStart = Date.now();
  let pyCheckPassed = false;
  let pyCheckOutput = "";
  let pyCheckCasesCount = 0;
  let pyCheckPassCount = 0;
  let pyCheckFailCount = 0;
  let pyCheckExecutionError = false;
  let pyCheckErrorMessage: string | undefined = undefined;

  try {
    pyCheckOutput = execSync(pyCheckCmd, { cwd: ROOT_DIR, stdio: "pipe" }).toString();
    console.log(pyCheckOutput);

    const summary = parsePythonCheckerOutput(pyCheckOutput);
    pyCheckCasesCount = summary.totalCases;
    pyCheckPassCount = summary.passedValidations;
    pyCheckFailCount = summary.failedValidations;
    pyCheckPassed = summary.passed;
    pyCheckExecutionError = summary.executionError;
    pyCheckErrorMessage = summary.errorMessage;

    if (pyCheckPassed) {
      console.log(`\x1b[32m✔ PASSED\x1b[0m: Python dataset compliance check verified (${pyCheckPassCount}/${pyCheckCasesCount} cases).`);
    } else if (!pyCheckExecutionError) {
      console.error(`\x1b[31m✘ FAILED\x1b[0m: Python dataset compliance checker encountered validation failures (${pyCheckPassCount}/${pyCheckCasesCount} passed, ${pyCheckFailCount} failed).`);
    } else {
      console.error(`\x1b[31m✘ FAILED\x1b[0m: Python dataset compliance checker returned malformed or incomplete output.`);
    }
  } catch (err: any) {
    pyCheckOutput = (err.stdout ? err.stdout.toString() : '') + (err.stderr ? err.stderr.toString() : '') || err.message;
    console.log(pyCheckOutput);

    const summary = parsePythonCheckerOutput(pyCheckOutput);
    if (summary.executed) {
      pyCheckCasesCount = summary.totalCases;
      pyCheckPassCount = summary.passedValidations;
      pyCheckFailCount = summary.failedValidations;
      pyCheckPassed = false;
      pyCheckExecutionError = false;
      console.error(`\x1b[31m✘ FAILED\x1b[0m: Python dataset compliance checker encountered validation failures (${pyCheckPassCount}/${pyCheckCasesCount} passed, ${pyCheckFailCount} failed).`);
    } else {
      pyCheckCasesCount = 0;
      pyCheckPassCount = 0;
      pyCheckFailCount = 0;
      pyCheckPassed = false;
      pyCheckExecutionError = true;
      pyCheckErrorMessage = (err.message || 'Process execution failed').trim();
      console.error(`\x1b[31m✘ FAILED\x1b[0m: Python dataset compliance checker execution failed:\n${pyCheckOutput}`);
    }
  }
  stepResults.push({
    command: pyCheckCmd,
    name: "Python Dataset Compliance Checker",
    passed: pyCheckPassed,
    durationMs: Date.now() - pyCheckStart,
    testCount: pyCheckCasesCount,
    passCount: pyCheckPassCount,
    failCount: pyCheckFailCount,
    output: pyCheckOutput,
    executionError: pyCheckExecutionError,
    errorMessage: pyCheckErrorMessage
  });
  console.log();

  // 5. Step 5: Full Production Asset Build (npm run build)
  console.log("--------------------------------------------------------------------------------");
  console.log(" 5. PRODUCTION ASSET BUILD VERIFICATION (npm run build)");
  console.log("--------------------------------------------------------------------------------");
  const buildCmd = "npm run build";
  executedCommands.push(buildCmd);
  const buildStart = Date.now();
  let buildPassed = false;
  let buildOutput = "";
  let buildExecutionError = false;
  let buildErrorMessage: string | undefined = undefined;

  try {
    buildOutput = execSync(buildCmd, { cwd: ROOT_DIR, stdio: "pipe" }).toString();
    const distHtml = path.join(ROOT_DIR, 'dist', 'index.html');
    const distServer = path.join(ROOT_DIR, 'dist', 'server.js');
    if (fs.existsSync(distHtml) && fs.existsSync(distServer)) {
      buildPassed = true;
      console.log(`\x1b[32m✔ PASSED\x1b[0m: Production asset build compiled successfully (dist/index.html & dist/server.js).`);
    } else {
      buildOutput += "\nMissing dist/index.html or dist/server.js output.";
      buildExecutionError = true;
      buildErrorMessage = "Build completed without producing dist/index.html and dist/server.js.";
      console.error(`\x1b[31m✘ FAILED\x1b[0m: Production build succeeded without expected output artifacts.`);
    }
  } catch (err: any) {
    buildOutput = (err.stdout ? err.stdout.toString() : '') + (err.stderr ? err.stderr.toString() : '') || err.message;
    buildExecutionError = true;
    buildErrorMessage = (err.message || 'Build execution failed').trim();
    console.error(`\x1b[31m✘ FAILED\x1b[0m: Production build failed:\n${buildOutput}`);
  }
  stepResults.push({
    command: buildCmd,
    name: "Production Asset Build",
    passed: buildPassed,
    durationMs: Date.now() - buildStart,
    testCount: 1,
    passCount: buildPassed ? 1 : 0,
    failCount: buildPassed ? 0 : 1,
    output: buildOutput,
    executionError: buildExecutionError,
    errorMessage: buildErrorMessage
  });
  console.log();

  // Calculate dynamic totals across all independently executed suites
  const totalExecutionDurationMs = Date.now() - overallStartTime;
  const allStepsPassed = stepResults.every(s => s.passed);
  
  // Aggregate individual test checks
  const totalTestsExecuted = stepResults.reduce((acc, cur) => acc + cur.testCount, 0);
  const totalTestsPassed = stepResults.reduce((acc, cur) => acc + cur.passCount, 0);
  const totalTestsFailed = stepResults.reduce((acc, cur) => acc + cur.failCount, 0);
  const totalExecutionErrors = stepResults.filter(s => s.executionError).length;

  // Construct the authoritative final report payload
  const finalReportPayload = {
    verification_type: "fresh_runtime_execution",
    test_run_timestamp: testRunTimestamp,
    commit_sha: commitSha,
    branch: branch,
    node_version: nodeVersion,
    npm_version: npmVersion,
    python_version: pythonVersion,
    platform: platform,
    overall_status: allStepsPassed ? "PASS" : "FAIL",
    summary: {
      total_tests: totalTestsExecuted,
      passed: totalTestsPassed,
      failed: totalTestsFailed,
      skipped: 0,
      not_verified: 0,
      execution_errors: totalExecutionErrors
    },
    commands: executedCommands,
    pipeline_steps: stepResults.map(s => ({
      name: s.name,
      command: s.command,
      status: s.passed ? "PASS" : "FAIL",
      duration_ms: s.durationMs,
      tests_passed: s.passCount,
      tests_failed: s.failCount,
      tests_total: s.testCount,
      execution_error: s.executionError,
      ...(s.errorMessage ? { error_message: s.errorMessage } : {})
    })),
    execution_duration_ms: totalExecutionDurationMs
  };

  // Write final generated reports
  fs.writeFileSync(reportPath, JSON.stringify(finalReportPayload, null, 2), 'utf8');

  const independentReportPath = path.join(RESULTS_DIR, 'independent-verification.json');
  const independentPayload = {
    verificationDate: testRunTimestamp,
    environment: {
      os: platform,
      nodeVersion: nodeVersion,
      npmVersion: npmVersion,
      pythonVersion: pythonVersion,
      commitSha: commitSha,
      branch: branch
    },
    totalChecks: totalTestsExecuted,
    passed: totalTestsPassed,
    failed: totalTestsFailed,
    skipped: 0,
    notVerified: 0,
    passRate: totalTestsExecuted > 0 ? (totalTestsPassed / totalTestsExecuted) * 100 : 0,
    overallStatus: allStepsPassed ? "PASS" : "FAIL",
    checks: stepResults.map(s => ({
      name: s.name,
      command: s.command,
      status: s.passed ? "PASS" : "FAIL",
      durationMs: s.durationMs,
      testsPassed: s.passCount,
      testsFailed: s.failCount,
      testsTotal: s.testCount,
      executionError: s.executionError,
      ...(s.errorMessage ? { errorMessage: s.errorMessage } : {})
    }))
  };
  fs.writeFileSync(independentReportPath, JSON.stringify(independentPayload, null, 2), 'utf8');

  // Print final summary table
  console.log("================================================================================");
  console.log("           NETSAGE AI — MASTER INDEPENDENT VERIFICATION SUMMARY                 ");
  console.log("================================================================================");
  console.log(`Commit SHA:               ${commitSha}`);
  console.log(`Timestamp:                ${testRunTimestamp}`);
  console.log(`Execution Duration:       ${(totalExecutionDurationMs / 1000).toFixed(2)}s`);
  console.log("--------------------------------------------------------------------------------");
  stepResults.forEach(s => {
    const statusStr = s.passed ? "\x1b[32mPASS\x1b[0m" : "\x1b[31mFAIL\x1b[0m";
    const namePad = s.name.padEnd(42, ' ');
    if (s.executionError) {
      console.log(`${namePad} [${statusStr}] (Execution error: 0 tests executed)`);
    } else {
      console.log(`${namePad} [${statusStr}] (${s.passCount}/${s.testCount} tests passed)`);
    }
  });
  console.log("--------------------------------------------------------------------------------");
  console.log(`TOTAL CHECKS EXECUTED:    ${totalTestsExecuted}`);
  console.log(`TOTAL CHECKS PASSED:      ${totalTestsPassed}`);
  console.log(`TOTAL CHECKS FAILED:      ${totalTestsFailed}`);
  console.log(`OVERALL VERIFICATION:     ${allStepsPassed ? "\x1b[32mPASS (100% VERIFIED)\x1b[0m" : "\x1b[31mFAIL\x1b[0m"}`);
  console.log("================================================================================\n");

  if (!allStepsPassed) {
    process.exit(1);
  } else {
    process.exit(0);
  }

  return allStepsPassed;
}

// Automatically run when invoked directly
if (process.argv[1] && process.argv[1].includes('verify-all')) {
  runAuthoritativeVerification();
}

