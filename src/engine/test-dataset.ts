import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface DatasetValidationResult {
  passed: boolean;
  totalCases: number;
  errors: string[];
  coverage: {
    wireless: number;
    vlan: number;
    gateway: number;
    dhcp: number;
    dns: number;
    routing: number;
    acl: number;
    nat: number;
  };
}

const REQUIRED_HEADERS = [
  'case_id',
  'title',
  'symptom',
  'topology_note',
  'show_outputs',
  'expected_fault',
  'expected_osi_layer',
  'concept_tag',
  'severity',
  'expected_next_command',
  'expected_fix_steps',
  'expected_rule_ids'
];

const VALID_OSI_LAYERS = [
  'Layer 1 (Physical)',
  'Layer 2 (Data Link)',
  'Layer 3 (Network)',
  'Layer 4 (Transport)',
  'Layer 7 (Application)'
];

const VALID_SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];

const VALID_RULE_IDS = new Set([
  'RC-01', 'RC-02', 'RC-03', 'RC-04', 'RC-05',
  'RC-06', 'RC-07', 'RC-08', 'RC-09', 'RC-10',
  'RC-11', 'RC-12', 'RC-13', 'RC-14', 'RC-15'
]);

export function parseCsvRows(content: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];
    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentField += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField);
        currentField = '';
      } else if (char === '\r' || char === '\n') {
        currentRow.push(currentField);
        currentField = '';
        if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0] !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        if (char === '\r' && nextChar === '\n') i++;
      } else {
        currentField += char;
      }
    }
  }
  if (currentRow.length > 0 || currentField !== '') {
    currentRow.push(currentField);
    rows.push(currentRow);
  }
  return rows;
}

export function validateDataset(csvPath?: string): DatasetValidationResult {
  const targetPath = csvPath || path.resolve(__dirname, '../../data/cases.csv');
  const errors: string[] = [];

  if (!fs.existsSync(targetPath)) {
    return {
      passed: false,
      totalCases: 0,
      errors: [`Dataset file not found at ${targetPath}`],
      coverage: { wireless: 0, vlan: 0, gateway: 0, dhcp: 0, dns: 0, routing: 0, acl: 0, nat: 0 }
    };
  }

  const content = fs.readFileSync(targetPath, 'utf8');
  const rows = parseCsvRows(content);

  if (rows.length <= 1) {
    return {
      passed: false,
      totalCases: 0,
      errors: ['Dataset is empty or missing data rows.'],
      coverage: { wireless: 0, vlan: 0, gateway: 0, dhcp: 0, dns: 0, routing: 0, acl: 0, nat: 0 }
    };
  }

  const headers = rows[0];
  // Verify all required headers exist
  for (const reqHeader of REQUIRED_HEADERS) {
    if (!headers.includes(reqHeader)) {
      errors.push(`Missing required column header: '${reqHeader}'`);
    }
  }

  const dataRows = rows.slice(1);
  const totalCases = dataRows.length;

  // Requirement: minimum 30 cases
  if (totalCases < 30) {
    errors.push(`Dataset requirement failed: expected minimum 30 cases, found only ${totalCases}`);
  }

  const caseIds = new Set<string>();
  const coverage = {
    wireless: 0,
    vlan: 0,
    gateway: 0,
    dhcp: 0,
    dns: 0,
    routing: 0,
    acl: 0,
    nat: 0
  };

  dataRows.forEach((row, idx) => {
    const rowNum = idx + 2;
    if (row.length < REQUIRED_HEADERS.length) {
      errors.push(`Row ${rowNum}: expected ${REQUIRED_HEADERS.length} columns, found ${row.length}`);
      return;
    }

    const caseId = row[0]?.trim();
    const title = row[1]?.trim();
    const symptom = row[2]?.trim();
    const topologyNote = row[3]?.trim();
    const showOutputs = row[4]?.trim();
    const expectedFault = row[5]?.trim();
    const osiLayer = row[6]?.trim();
    const conceptTag = row[7]?.trim();
    const severity = row[8]?.trim();
    const nextCommand = row[9]?.trim();
    const fixSteps = row[10]?.trim();
    const expectedRuleIdsStr = row[11]?.trim() || '';

    // 1. Check for duplicate IDs
    if (!caseId) {
      errors.push(`Row ${rowNum}: case_id is empty`);
    } else if (caseIds.has(caseId)) {
      errors.push(`Duplicate case_id detected: '${caseId}' at row ${rowNum}`);
    } else {
      caseIds.add(caseId);
    }

    // 2. Check no empty required fields
    if (!title) errors.push(`Case ${caseId || rowNum}: title is empty`);
    if (!symptom) errors.push(`Case ${caseId || rowNum}: symptom is empty`);
    if (!topologyNote) errors.push(`Case ${caseId || rowNum}: topology_note is empty`);
    if (!showOutputs) errors.push(`Case ${caseId || rowNum}: show_outputs is empty`);
    if (!expectedFault) errors.push(`Case ${caseId || rowNum}: expected_fault is empty`);
    if (!nextCommand) errors.push(`Case ${caseId || rowNum}: expected_next_command is empty`);
    if (!fixSteps) errors.push(`Case ${caseId || rowNum}: expected_fix_steps is empty`);

    // 3. Valid OSI layers
    if (!osiLayer || !VALID_OSI_LAYERS.includes(osiLayer)) {
      errors.push(`Case ${caseId}: invalid osi_layer '${osiLayer}'. Must be one of: ${VALID_OSI_LAYERS.join(', ')}`);
    }

    // 4. Valid severity
    if (!severity || !VALID_SEVERITIES.includes(severity)) {
      errors.push(`Case ${caseId}: invalid severity '${severity}'. Must be one of: ${VALID_SEVERITIES.join(', ')}`);
    }

    // 5. Valid concept tags
    if (!conceptTag || conceptTag.length < 2) {
      errors.push(`Case ${caseId}: invalid or empty concept_tag '${conceptTag}'`);
    }

    // 6. Valid expected rule IDs
    if (expectedRuleIdsStr) {
      const ruleIds = expectedRuleIdsStr.split(',').map(s => s.trim()).filter(Boolean);
      for (const rId of ruleIds) {
        if (!VALID_RULE_IDS.has(rId)) {
          errors.push(`Case ${caseId}: unknown expected_rule_id '${rId}'`);
        }
      }
    }

    // 7. Track Domain Coverage
    const combinedText = `${title} ${symptom} ${conceptTag} ${expectedFault} ${showOutputs}`.toLowerCase();
    if (combinedText.includes('wireless') || combinedText.includes('wlan') || combinedText.includes('wlc') || combinedText.includes('ap')) {
      coverage.wireless++;
    }
    if (combinedText.includes('vlan') || combinedText.includes('trunk') || combinedText.includes('802.1q') || combinedText.includes('switchport')) {
      coverage.vlan++;
    }
    if (combinedText.includes('gateway') || combinedText.includes('default gateway') || combinedText.includes('svi') || combinedText.includes('default-information')) {
      coverage.gateway++;
    }
    if (combinedText.includes('dhcp') || combinedText.includes('helper-address') || combinedText.includes('lease pool')) {
      coverage.dhcp++;
    }
    if (combinedText.includes('dns') || combinedText.includes('domain lookup') || combinedText.includes('port 53')) {
      coverage.dns++;
    }
    if (combinedText.includes('ospf') || combinedText.includes('routing') || combinedText.includes('route') || combinedText.includes('static route')) {
      coverage.routing++;
    }
    if (combinedText.includes('acl') || combinedText.includes('access-list') || combinedText.includes('access control') || combinedText.includes('permit') || combinedText.includes('deny')) {
      coverage.acl++;
    }
    if (combinedText.includes('nat') || combinedText.includes('translation') || combinedText.includes('pat') || combinedText.includes('ip nat')) {
      coverage.nat++;
    }
  });

  // Verify mandatory coverage categories
  if (coverage.wireless === 0) errors.push("Coverage failure: 0 cases for Wireless networking");
  if (coverage.vlan === 0) errors.push("Coverage failure: 0 cases for VLAN / Trunking");
  if (coverage.gateway === 0) errors.push("Coverage failure: 0 cases for Gateway / Default Gateway");
  if (coverage.dhcp === 0) errors.push("Coverage failure: 0 cases for DHCP");
  if (coverage.dns === 0) errors.push("Coverage failure: 0 cases for DNS");
  if (coverage.routing === 0) errors.push("Coverage failure: 0 cases for Routing / OSPF");
  if (coverage.acl === 0) errors.push("Coverage failure: 0 cases for ACL / Security");
  if (coverage.nat === 0) errors.push("Coverage failure: 0 cases for NAT / PAT");

  return {
    passed: errors.length === 0,
    totalCases,
    errors,
    coverage
  };
}
