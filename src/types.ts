export interface DeviceNode {
  id: string;
  name: string;
  type: 'PC' | 'Switch' | 'Router' | 'Server';
  ip: string;
  vlan?: string;
  status: 'active' | 'warning' | 'failed';
  x: number;
  y: number;
  interfaces: string[];
}

export interface NetworkLink {
  source: string;
  target: string;
  status: 'active' | 'failed' | 'congested';
  bandwidth?: string;
}

export interface RuleCheckItem {
  id: string;
  ruleName: string;
  status: 'pass' | 'fail' | 'warn';
  category: 'STP' | 'Security' | 'Routing' | 'IPAM';
  details: string;
}

export interface GroundTruth {
  expectedFault: string;
  expectedOsiLayer: string;
  expectedNextCommand: string;
  expectedFixSteps: string[];
  expectedRuleIds?: string;
}

export interface DiagnosticCase {
  id: string;
  title: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Pending Review' | 'Approved' | 'Rejected';
  category: string;
  timestamp: string;
  operator: string;
  networkProblem: string;
  networkEvidence: {
    hostname: string;
    showCommandOutput: string;
    commandHistory: string[];
  };
  ruleChecks: RuleCheckItem[];
  groundTruth?: GroundTruth;
  aiDiagnosis?: {
    rootCause: string;
    osiLayer: string;
    confidence: number;
    confidenceLevel?: 'High' | 'Medium' | 'Low';
    evidenceHighlight: string;
    nextCommand: string;
    fixSteps: string[];
    hallucinationFlag?: boolean;
    groundingStatus?: 'GROUNDED' | 'UNSUPPORTED_CLAIMS_BLOCKED' | 'WARNING';
    evaluationAgainstGroundTruth?: 'CORRECT' | 'PARTIALLY_CORRECT' | 'INCORRECT' | 'UNVERIFIED';
    evaluationNotes?: string;
  };
  topology: {
    nodes: DeviceNode[];
    links: NetworkLink[];
  };
  expectedRuleIds?: string;
}

export interface AuditLogEntry {
  timestamp: string;
  actionType: string;
  targetNode: string;
  message: string;
  integrityToken: string;
  previousHash?: string;
  currentHash?: string;
  reviewer?: string;
  safetyStatus: 'SECURE' | 'ATTENTION' | 'COMPLIANT' | 'BLOCKED' | 'MODIFIED';
  caseId?: string;
  aiDiagnosis?: string;
  confidence?: string;
  evidence?: string;
  originalCommands?: string[];
  editedCommands?: string[];
  humanDecision?: string;
  reason?: string;
}

