import React, { useState } from 'react';
import { DiagnosticCase, AuditLogEntry, RuleCheckItem } from '../../types';
import { IncidentHeader } from './IncidentHeader';
import { CaseExplorer } from './CaseExplorer';
import { TopologyHero } from './TopologyHero';
import { CiscoCliTerminal } from './CiscoCliTerminal';
import { EvidenceChain } from './EvidenceChain';
import { AiDiagnosisPanel } from './AiDiagnosisPanel';
import { AiSafetyGate } from './AiSafetyGate';
import { OsiStackViewer } from './OsiStackViewer';
import { DeterministicRulePanel } from './DeterministicRulePanel';
import { AiRuleComparison } from './AiRuleComparison';
import { HumanReviewPanel } from './HumanReviewPanel';
import { EditFixModal } from './EditFixModal';
import { RejectModal } from './RejectModal';

interface DiagnosticsPageProps {
  cases: DiagnosticCase[];
  activeCaseId: string;
  onSelectCase: (caseId: string) => void;
  onRunDiagnosis: () => void;
  isDiagnosing: boolean;
  onApproveCase: (caseId: string) => void;
  onSaveEditedDecision: (caseId: string, editedCommands: string[], reason: string, reviewer: string) => void;
  onConfirmReject: (caseId: string, reason: string, reviewer: string) => void;
  onExportPdf: (caseItem: DiagnosticCase) => void;
  dynamicRuleChecks: RuleCheckItem[];
}

export const DiagnosticsPage: React.FC<DiagnosticsPageProps> = ({
  cases,
  activeCaseId,
  onSelectCase,
  onRunDiagnosis,
  isDiagnosing,
  onApproveCase,
  onSaveEditedDecision,
  onConfirmReject,
  onExportPdf,
  dynamicRuleChecks
}) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const currentCase = cases.find(c => c.id === activeCaseId) || cases[0];

  if (!currentCase) {
    return (
      <div className="p-12 text-center text-slate-500 font-mono text-sm">
        No case selected. Please select a case from the catalog.
      </div>
    );
  }

  const isApproved = currentCase.status === 'Approved';
  const isRejected = currentCase.status === 'Rejected';

  // Deterministic rule finding text
  const firstFailCheck = dynamicRuleChecks.find(r => r.status === 'fail');
  const deterministicFinding = firstFailCheck ? `${firstFailCheck.id}: ${firstFailCheck.details}` : 'All 15 deterministic checks pass compliant baseline.';

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* 1. Incident Header */}
      <IncidentHeader
        currentCase={currentCase}
        isDiagnosing={isDiagnosing}
        onRunDiagnosis={onRunDiagnosis}
        onExportPdf={() => onExportPdf(currentCase)}
      />

      {/* 2. Three-Column Enterprise NOC Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Case Explorer (3 Cols) */}
        <div className="lg:col-span-3 h-full">
          <CaseExplorer
            cases={cases}
            selectedCaseId={currentCase.id}
            onSelectCase={onSelectCase}
          />
        </div>

        {/* CENTER COLUMN: Topology & Cisco Evidence (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Topology Hero */}
          <TopologyHero
            nodes={currentCase.topology?.nodes || []}
            links={currentCase.topology?.links || []}
            caseId={currentCase.id}
            targetHostname={currentCase.networkEvidence?.hostname}
          />

          {/* Authentic Cisco CLI Terminal */}
          <CiscoCliTerminal
            hostname={currentCase.networkEvidence?.hostname}
            commandOutput={currentCase.networkEvidence?.showCommandOutput}
            evidenceHighlight={currentCase.aiDiagnosis?.evidenceHighlight}
          />

          {/* Evidence-to-Diagnosis Chain */}
          <EvidenceChain
            rootCause={currentCase.aiDiagnosis?.rootCause || currentCase.networkProblem}
            evidenceSource={`show output on ${currentCase.networkEvidence?.hostname}`}
            evidenceQuote={currentCase.aiDiagnosis?.evidenceHighlight || currentCase.networkEvidence?.showCommandOutput.slice(0, 100)}
            osiLayer={currentCase.aiDiagnosis?.osiLayer || 'Layer 3'}
          />
        </div>

        {/* RIGHT COLUMN: AI Diagnosis & Safety Analysis (4 Cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* AI Diagnostic Assessment */}
          <AiDiagnosisPanel
            diagnosis={currentCase.aiDiagnosis}
            groundTruth={currentCase.groundTruth}
            hostname={currentCase.networkEvidence?.hostname}
          />

          {/* AI Safety Gate */}
          <AiSafetyGate
            status="grounded"
            hasHumanApproved={isApproved}
          />

          {/* Vertical 7-Layer OSI Stack */}
          <OsiStackViewer
            activeOsiLayer={currentCase.aiDiagnosis?.osiLayer || 'Layer 3'}
            detectedRuleId={firstFailCheck?.id}
          />

          {/* Deterministic Rule Panel */}
          <DeterministicRulePanel
            ruleChecks={dynamicRuleChecks}
          />

          {/* AI vs Rule Comparison */}
          <AiRuleComparison
            deterministicFinding={deterministicFinding}
            aiRootCause={currentCase.aiDiagnosis?.rootCause || 'N/A'}
            isConsistent={true}
          />
        </div>
      </div>

      {/* 3. BOTTOM: Human Review Action Bar */}
      <div className="pt-2">
        <HumanReviewPanel
          currentCase={currentCase}
          onApprove={() => onApproveCase(currentCase.id)}
          onOpenEdit={() => setShowEditModal(true)}
          onOpenReject={() => setShowRejectModal(true)}
          onExportPdf={() => onExportPdf(currentCase)}
          isApproved={isApproved}
          isRejected={isRejected}
        />
      </div>

      {/* Edit Fix Modal */}
      <EditFixModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        currentCase={currentCase}
        onSaveEditedDecision={(editedCmds, reason, reviewer) => {
          onSaveEditedDecision(currentCase.id, editedCmds, reason, reviewer);
        }}
      />

      {/* Reject Modal */}
      <RejectModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        currentCase={currentCase}
        onConfirmReject={(reason, reviewer) => {
          onConfirmReject(currentCase.id, reason, reviewer);
        }}
      />
    </div>
  );
};
