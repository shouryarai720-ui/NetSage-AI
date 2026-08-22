export interface RuleEvaluationResult {
  triggered: boolean;
  details: string;
  rule_id?: string;
  status?: 'ERRORS_DETECTED' | 'NO_ERROR';
  severity?: 'Critical' | 'High' | 'Medium' | 'Low';
  message?: string;
  evidence?: string[];
  confidence?: 'High' | 'Medium' | 'Low';
}

export interface RuleDefinition {
  id: string;
  name: string;
  category: 'STP' | 'Security' | 'Routing' | 'IPAM';
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  description: string;
  check: (text: string) => RuleEvaluationResult;
}
