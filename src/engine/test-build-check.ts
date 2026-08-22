import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

export interface BuildTypeCheckResult {
  passed: boolean;
  status: "PASS" | "FAIL" | "NOT VERIFIED";
  typeCheckPassed: boolean;
  buildPassed: boolean;
  totalChecks: number;
  passedChecks: number;
  errors: string[];
  durationMs: number;
}

export function runRealBuildAndTypeCheck(): BuildTypeCheckResult {
  const startTime = Date.now();
  let typeCheckPassed = false;
  let buildPassed = false;
  const errors: string[] = [];

  // 1. Real TypeScript Type Check (tsc --noEmit)
  try {
    execSync('npx tsc --noEmit', {
      cwd: rootDir,
      stdio: 'pipe',
      timeout: 30000
    });
    typeCheckPassed = true;
  } catch (err: any) {
    const errorMsg = (err.stdout ? err.stdout.toString() : '') + (err.stderr ? err.stderr.toString() : '') || err.message;
    errors.push(`TypeScript compiler (tsc --noEmit) failed: ${errorMsg.trim()}`);
  }

  // 2. Real Production Asset Build (vite build & esbuild server.ts)
  try {
    execSync('npx vite build && npx esbuild server.ts --bundle --platform=node --format=esm --target=node18 --packages=external --sourcemap --outfile=dist/server.js', {
      cwd: rootDir,
      stdio: 'pipe',
      timeout: 60000
    });

    // Verify output artifacts exist
    const distHtml = path.join(rootDir, 'dist/index.html');
    const distServer = path.join(rootDir, 'dist/server.js');
    if (fs.existsSync(distHtml) && fs.existsSync(distServer)) {
      buildPassed = true;
    } else {
      errors.push('Production build completed but expected output artifacts (dist/index.html, dist/server.js) are missing.');
    }
  } catch (err: any) {
    const errorMsg = (err.stdout ? err.stdout.toString() : '') + (err.stderr ? err.stderr.toString() : '') || err.message;
    errors.push(`Production build failed: ${errorMsg.trim()}`);
  }

  const durationMs = Date.now() - startTime;
  const passed = typeCheckPassed && buildPassed;
  let status: "PASS" | "FAIL" | "NOT VERIFIED" = "NOT VERIFIED";

  if (passed) {
    status = "PASS";
  } else if (errors.length > 0) {
    status = "FAIL";
  }

  const totalChecks = 2;
  const passedChecks = (typeCheckPassed ? 1 : 0) + (buildPassed ? 1 : 0);

  return {
    passed,
    status,
    typeCheckPassed,
    buildPassed,
    totalChecks,
    passedChecks,
    errors,
    durationMs
  };
}
