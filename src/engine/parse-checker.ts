export interface PythonCheckerSummary {
  executed: boolean;
  totalCases: number;
  passedValidations: number;
  failedValidations: number;
  passed: boolean;
  executionError: boolean;
  errorMessage?: string;
}

export function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

export function parsePythonCheckerOutput(output: string): PythonCheckerSummary {
  const clean = stripAnsi(output);
  const totalMatch = clean.match(/Total Cases Executed:\s*(-?\d+)/i);
  const passedMatch = clean.match(/Passed Validations:\s*(-?\d+)/i);
  const failedMatch = clean.match(/Failed Validations:\s*(-?\d+)/i);

  if (totalMatch && passedMatch && failedMatch) {
    const totalCases = parseInt(totalMatch[1], 10);
    const passedValidations = parseInt(passedMatch[1], 10);
    const failedValidations = parseInt(failedMatch[1], 10);

    const isNonNegative = totalCases >= 0 && passedValidations >= 0 && failedValidations >= 0;
    const isSumConsistent = (passedValidations + failedValidations) === totalCases;

    if (isNonNegative && isSumConsistent) {
      const allPassed = totalCases > 0 && failedValidations === 0 && passedValidations === totalCases;
      return {
        executed: true,
        totalCases,
        passedValidations,
        failedValidations,
        passed: allPassed,
        executionError: false
      };
    }
  }

  return {
    executed: false,
    totalCases: 0,
    passedValidations: 0,
    failedValidations: 0,
    passed: false,
    executionError: true,
    errorMessage: "Failed to parse authoritative summary from Python dataset checker output or invariant violation detected."
  };
}
