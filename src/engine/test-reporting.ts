import { parsePythonCheckerOutput, PythonCheckerSummary } from './parse-checker.ts';

export interface ReportingSuiteResult {
  passed: boolean;
  totalTests: number;
  passedTests: number;
  errors: string[];
}

export function runReportingFailureModeTests(): ReportingSuiteResult {
  const errors: string[] = [];
  let totalTests = 0;
  let passedTests = 0;

  // TEST A: Checker succeeds with 35/35
  totalTests++;
  const mockOutputA = `
=====================================================================
 PYTHON AUTOMATED COMPLIANCE REPORT
=====================================================================
  Total Cases Executed:      35
  Passed Validations:        35
  Failed Validations:        0
  Rule Integrity Coverage:   100.0%
=====================================================================
SUCCESS: Independent Python validation successfully verified all 35 rule cases!
`;
  const resA = parsePythonCheckerOutput(mockOutputA);
  if (
    resA.executed === true &&
    resA.totalCases === 35 &&
    resA.passedValidations === 35 &&
    resA.failedValidations === 0 &&
    resA.passed === true &&
    resA.executionError === false
  ) {
    passedTests++;
  } else {
    errors.push(`TEST A failed: Expected 35/35 pass, got ${JSON.stringify(resA)}`);
  }

  // TEST B: Checker executes but reports validation failures (34/35)
  totalTests++;
  const mockOutputB = `
=====================================================================
 PYTHON AUTOMATED COMPLIANCE REPORT
=====================================================================
  Total Cases Executed:      35
  Passed Validations:        34
  Failed Validations:        1
  Rule Integrity Coverage:   97.1%
=====================================================================
FAIL: Independent Python validation discovered non-compliant rule cases.
`;
  const resB = parsePythonCheckerOutput(mockOutputB);
  if (
    resB.executed === true &&
    resB.totalCases === 35 &&
    resB.passedValidations === 34 &&
    resB.failedValidations === 1 &&
    resB.passed === false &&
    resB.executionError === false
  ) {
    passedTests++;
  } else {
    errors.push(`TEST B failed: Expected 34/35 validation fail, got ${JSON.stringify(resB)}`);
  }

  // TEST C: Checker cannot execute (missing file or runtime crash)
  totalTests++;
  const mockOutputC = `
Traceback (most recent call last):
  File "checker.py", line 811, in main
    FileNotFoundError: [Errno 2] No such file or directory: 'data/cases.csv'
`;
  const resC = parsePythonCheckerOutput(mockOutputC);
  if (
    resC.executed === false &&
    resC.totalCases === 0 &&
    resC.passedValidations === 0 &&
    resC.failedValidations === 0 &&
    resC.passed === false &&
    resC.executionError === true
  ) {
    passedTests++;
  } else {
    errors.push(`TEST C failed: Expected executionError=true with 0 tests, got ${JSON.stringify(resC)}`);
  }

  // TEST D: Checker returns malformed output
  totalTests++;
  const mockOutputD = `
=====================================================================
 PYTHON AUTOMATED COMPLIANCE REPORT
=====================================================================
  Total Cases Executed:      35
  Passed Validations:        
=====================================================================
`;
  const resD = parsePythonCheckerOutput(mockOutputD);
  if (
    resD.executed === false &&
    resD.totalCases === 0 &&
    resD.passedValidations === 0 &&
    resD.failedValidations === 0 &&
    resD.passed === false &&
    resD.executionError === true
  ) {
    passedTests++;
  } else {
    errors.push(`TEST D failed: Expected executionError=true with 0 tests, got ${JSON.stringify(resD)}`);
  }

  // TEST E: Empty output handling
  totalTests++;
  const resE = parsePythonCheckerOutput("");
  if (
    resE.executed === false &&
    resE.totalCases === 0 &&
    resE.passedValidations === 0 &&
    resE.failedValidations === 0 &&
    resE.passed === false &&
    resE.executionError === true
  ) {
    passedTests++;
  } else {
    errors.push(`TEST E failed: Expected executionError=true for empty output, got ${JSON.stringify(resE)}`);
  }

  // TEST F: Aggregate truthfulness verification (no invented test counts)
  totalTests++;
  const stepA = { testCount: 189, passCount: 189, failCount: 0, executionError: false };
  const stepB = { testCount: 38, passCount: 38, failCount: 0, executionError: false };
  const stepC = { testCount: resC.totalCases, passCount: resC.passedValidations, failCount: resC.failedValidations, executionError: resC.executionError };

  const allSteps = [stepA, stepB, stepC];
  const aggTotal = allSteps.reduce((acc, cur) => acc + cur.testCount, 0);
  const aggPassed = allSteps.reduce((acc, cur) => acc + cur.passCount, 0);
  const aggFailed = allSteps.reduce((acc, cur) => acc + cur.failCount, 0);

  if (aggTotal === 227 && aggPassed === 227 && aggFailed === 0) {
    passedTests++;
  } else {
    errors.push(`TEST F failed: Aggregate counted unexecuted tests! Total=${aggTotal}, Passed=${aggPassed}, Failed=${aggFailed}`);
  }

  // TEST G: Negative test count handling
  totalTests++;
  const mockOutputG = `
=====================================================================
 PYTHON AUTOMATED COMPLIANCE REPORT
=====================================================================
  Total Cases Executed:      -5
  Passed Validations:        -5
  Failed Validations:        0
=====================================================================
`;
  const resG = parsePythonCheckerOutput(mockOutputG);
  if (resG.executed === false && resG.executionError === true && resG.passed === false) {
    passedTests++;
  } else {
    errors.push(`TEST G failed: Expected rejection of negative count, got ${JSON.stringify(resG)}`);
  }

  // TEST H: Inconsistent sum / contradictory totals (30 passed + 0 failed != 35 total)
  totalTests++;
  const mockOutputH = `
=====================================================================
 PYTHON AUTOMATED COMPLIANCE REPORT
=====================================================================
  Total Cases Executed:      35
  Passed Validations:        30
  Failed Validations:        0
=====================================================================
`;
  const resH = parsePythonCheckerOutput(mockOutputH);
  if (resH.executed === false && resH.executionError === true && resH.passed === false) {
    passedTests++;
  } else {
    errors.push(`TEST H failed: Expected rejection of contradictory counts, got ${JSON.stringify(resH)}`);
  }

  // TEST I: Passed > Total count overflow
  totalTests++;
  const mockOutputI = `
=====================================================================
 PYTHON AUTOMATED COMPLIANCE REPORT
=====================================================================
  Total Cases Executed:      35
  Passed Validations:        40
  Failed Validations:        0
=====================================================================
`;
  const resI = parsePythonCheckerOutput(mockOutputI);
  if (resI.executed === false && resI.executionError === true && resI.passed === false) {
    passedTests++;
  } else {
    errors.push(`TEST I failed: Expected rejection of passed > total, got ${JSON.stringify(resI)}`);
  }

  // TEST J: Failed > Total count overflow
  totalTests++;
  const mockOutputJ = `
=====================================================================
 PYTHON AUTOMATED COMPLIANCE REPORT
=====================================================================
  Total Cases Executed:      35
  Passed Validations:        0
  Failed Validations:        40
=====================================================================
`;
  const resJ = parsePythonCheckerOutput(mockOutputJ);
  if (resJ.executed === false && resJ.executionError === true && resJ.passed === false) {
    passedTests++;
  } else {
    errors.push(`TEST J failed: Expected rejection of failed > total, got ${JSON.stringify(resJ)}`);
  }

  return {
    passed: errors.length === 0,
    totalTests,
    passedTests,
    errors
  };
}
