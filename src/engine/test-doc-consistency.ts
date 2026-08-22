import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

export interface DocConsistencySuiteResult {
  passed: boolean;
  totalChecks: number;
  passedChecks: number;
  errors: string[];
}

export function runDocConsistencyTests(): DocConsistencySuiteResult {
  const errors: string[] = [];
  let totalChecks = 0;
  let passedChecks = 0;

  const requiredDocs = [
    'README.md',
    'metadata.json',
    'docs/technical-documentation.md',
    'docs/final-qa-report.md',
    'docs/independent-verification-report.md',
    'docs/requirements-matrix.md',
    'docs/documentation-consistency-report.md',
    'docs/test-matrix.md',
    'docs/demo-script.md',
    'docs/model_audit_log.md'
  ];

  // 1. Verify existence of all required documentation files
  for (const doc of requiredDocs) {
    totalChecks++;
    const fullPath = path.resolve(rootDir, doc);
    if (fs.existsSync(fullPath)) {
      passedChecks++;
    } else {
      errors.push(`Missing required documentation file: ${doc}`);
    }
  }

  // 2. Check for absence of stale Streamlit / Python-only UI claims across documentation
  const docFilesToScan = [
    'README.md',
    'docs/technical-documentation.md',
    'docs/final-qa-report.md',
    'docs/independent-verification-report.md',
    'docs/requirements-matrix.md',
    'docs/documentation-consistency-report.md',
    'docs/test-matrix.md',
    'docs/demo-script.md'
  ];

  for (const doc of docFilesToScan) {
    totalChecks++;
    const fullPath = path.resolve(rootDir, doc);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      // Should not claim the current running app is built in Streamlit
      const hasStaleStreamlit = /run\s+streamlit|streamlit\s+run|built\s+with\s+streamlit/i.test(content);
      if (!hasStaleStreamlit) {
        passedChecks++;
      } else {
        errors.push(`Stale Streamlit UI instruction detected in ${doc}`);
      }
    } else {
      errors.push(`Cannot scan non-existent file: ${doc}`);
    }
  }

  // 3. Verify consistent dataset case count across documents (35 cases)
  const caseCountFiles = [
    'README.md',
    'docs/technical-documentation.md',
    'docs/requirements-matrix.md',
    'docs/documentation-consistency-report.md',
    'docs/test-matrix.md'
  ];

  for (const doc of caseCountFiles) {
    totalChecks++;
    const fullPath = path.resolve(rootDir, doc);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      if (content.includes('35') || content.includes('NET-035')) {
        passedChecks++;
      } else {
        errors.push(`${doc} does not document the full 35-case dataset`);
      }
    }
  }

  // 4. Verify all 15 required sections in docs/final-qa-report.md
  totalChecks++;
  const qaReportPath = path.resolve(rootDir, 'docs/final-qa-report.md');
  if (fs.existsSync(qaReportPath)) {
    const qaContent = fs.readFileSync(qaReportPath, 'utf-8');
    const requiredSections = [
      'Project Overview',
      'Requirements Compliance',
      'Dataset Verification',
      'Rule-Engine Verification',
      'AI Grounding Verification',
      'Responsible AI',
      'Human-in-the-Loop',
      'Audit-Chain Verification',
      'API Verification',
      'Browser/E2E Verification',
      'Production Build Verification',
      'Documentation Consistency',
      'Security/Safety Verification',
      'Known Limitations',
      'Final Readiness Status'
    ];
    let allSectionsPresent = true;
    for (const sec of requiredSections) {
      if (!qaContent.toLowerCase().includes(sec.toLowerCase())) {
        allSectionsPresent = false;
        errors.push(`docs/final-qa-report.md missing required section: "${sec}"`);
      }
    }
    if (allSectionsPresent) {
      passedChecks++;
    }
  } else {
    errors.push('docs/final-qa-report.md does not exist');
  }

  // 5. Verify model audit log has calibration records
  totalChecks++;
  const modelAuditPath = path.resolve(rootDir, 'docs/model_audit_log.md');
  if (fs.existsSync(modelAuditPath)) {
    const modelContent = fs.readFileSync(modelAuditPath, 'utf-8');
    if (modelContent.includes('AUDIT-') && modelContent.includes('CALIBRATION')) {
      passedChecks++;
    } else {
      errors.push('docs/model_audit_log.md missing calibration records');
    }
  }

  // 6. Verify metadata.json has valid name and majorCapabilities
  totalChecks++;
  const metadataPath = path.resolve(rootDir, 'metadata.json');
  if (fs.existsSync(metadataPath)) {
    try {
      const meta = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
      if (meta.name && meta.name.length > 0 && Array.isArray(meta.majorCapabilities)) {
        passedChecks++;
      } else {
        errors.push('metadata.json invalid schema');
      }
    } catch (e: any) {
      errors.push(`metadata.json parse error: ${e.message}`);
    }
  }

  return {
    passed: errors.length === 0,
    totalChecks,
    passedChecks,
    errors
  };
}
