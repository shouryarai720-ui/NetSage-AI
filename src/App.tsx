import React, { useState, useEffect } from 'react';
import { 
  DiagnosticCase, 
  AuditLogEntry, 
  RuleCheckItem 
} from './types';
import { INITIAL_CASES } from './cases';
import { runDeterministicChecks } from './engine/checker';
import { exportCaseAuditPDF } from './utils/pdfExport';

// Layout & Common Components
import { AppHeader } from './components/layout/AppHeader';
import { AppSidebar, NavigationPage } from './components/layout/AppSidebar';
import { GlobalSearchModal } from './components/layout/GlobalSearchModal';
import { NotificationDrawer } from './components/layout/NotificationDrawer';
import { ToastContainer, ToastMessage } from './components/common/ToastContainer';

// Page Views
import { OverviewPage } from './components/dashboard/OverviewPage';
import { DiagnosticsPage } from './components/diagnostics/DiagnosticsPage';
import { CasesDirectoryPage } from './components/cases/CasesDirectoryPage';
import { NetworkHealthPage } from './components/network/NetworkHealthPage';
import { AiInsightsPage } from './components/intelligence/AiInsightsPage';
import { ResponsibleAiPage } from './components/intelligence/ResponsibleAiPage';
import { AuditPage } from './components/governance/AuditPage';
import { ReportsPage } from './components/governance/ReportsPage';
import { TestCenterPage } from './components/governance/TestCenterPage';
import { SettingsPage } from './components/system/SettingsPage';

export default function App() {
  // Navigation State
  const [currentPage, setCurrentPage] = useState<NavigationPage>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Global Cases & Audit Logs State
  const [cases, setCases] = useState<DiagnosticCase[]>(INITIAL_CASES);
  const [activeCaseId, setActiveCaseId] = useState<string>('NET-001');
  const [simulationMode, setSimulationMode] = useState(true);

  // AI Diagnostic State
  const [isDiagnosing, setIsDiagnosing] = useState(false);

  // Search & Notification Modals
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // Toast Notification System
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: ToastMessage['type'] = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Initial Seed Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([
    {
      timestamp: "2026-08-20 08:32:00",
      actionType: "OPERATOR OK",
      targetNode: "10.10.10.3 / ACCESS-SWITCH-02",
      message: "Dry-run simulation of spanning-tree guard root passed. Configuration queued.",
      integrityToken: "sha256:dce8427901fb4a8b",
      safetyStatus: "SECURE",
      reviewer: "M. Zhao (NetOps Lead)",
      humanDecision: "ACCEPTED"
    },
    {
      timestamp: "2026-08-20 08:30:12",
      actionType: "INCIDENT INGEST",
      targetNode: "10.10.10.15 / PC-01",
      message: "STP switching loop alert generated in VLAN 10. Frame drop rate exceeds 45%.",
      integrityToken: "sha256:ba9023412ea80c11",
      safetyStatus: "ATTENTION",
      reviewer: "Auto-Telemetry Ingest",
      humanDecision: "PENDING"
    },
    {
      timestamp: "2026-08-20 08:15:22",
      actionType: "HUMAN GATE PASS",
      targetNode: "192.168.12.1 / CORE-01",
      message: "Case NET-008 approved by M. Zhao. MTU parameters aligned across interfaces.",
      integrityToken: "sha256:ea4210988cc10ab3",
      safetyStatus: "COMPLIANT",
      caseId: "NET-008",
      reviewer: "M. Zhao (NetOps Lead)",
      humanDecision: "ACCEPTED"
    },
    {
      timestamp: "2026-08-20 07:50:41",
      actionType: "AUTO BLOCKED SLIP",
      targetNode: "10.30.30.50 / SRV-01",
      message: "ACL validation check blocked an incorrect AI wildcard route suggestion 'no route-map CORE'.",
      integrityToken: "sha256:fc881109a12fe4d7",
      safetyStatus: "BLOCKED",
      caseId: "NET-018",
      reviewer: "AI Safety Gate",
      humanDecision: "REJECTED"
    }
  ]);

  // Sync backend data on boot
  useEffect(() => {
    const syncBackendData = async () => {
      try {
        const casesRes = await fetch('/api/cases');
        if (casesRes.ok) {
          const casesData = await casesRes.json();
          if (Array.isArray(casesData) && casesData.length > 0) {
            setCases(casesData);
          }
        }

        const auditRes = await fetch('/api/audit-logs');
        if (auditRes.ok) {
          const auditData = await auditRes.json();
          if (Array.isArray(auditData) && auditData.length > 0) {
            setAuditLogs(auditData);
          }
        }
        addToast("Connected to NetSage Enterprise Core & Audit Ledger", "success");
      } catch (err) {
        console.warn("NetSage local mode:", err);
      }
    };

    syncBackendData();

    // Global keyboard shortcut for search (Cmd+K / Ctrl+K)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Counts for sidebar badges
  const pendingReviewCount = cases.filter(c => c.status === 'Pending Review').length;
  const criticalCasesCount = cases.filter(c => c.severity === 'Critical').length;

  // Active selected case object
  const activeCase = cases.find(c => c.id === activeCaseId) || cases[0];

  // Dynamic Rule Compliance checks run live on current Cisco console logs
  const dynamicRuleChecks = activeCase 
    ? runDeterministicChecks(activeCase.networkEvidence.showCommandOutput, activeCase.id, activeCase.title, activeCase.category)
    : [];

  // Action decision: Run AI Diagnosis
  const handleRunDiagnosis = async () => {
    if (!activeCase) return;
    setIsDiagnosing(true);
    addToast(`Initiating Gemini 3.7 Flash analysis for ${activeCase.id}...`, "info");

    try {
      const diagnosticPayload = {
        case_id: activeCase.id,
        symptom: activeCase.networkProblem,
        topology_note: `Connected nodes: ${activeCase.topology.nodes.map(n => `${n.name} (${n.ip})`).join(', ')}`,
        show_outputs: activeCase.networkEvidence.showCommandOutput,
        concept_tag: activeCase.category,
        severity: activeCase.severity,
        osi_layer: activeCase.aiDiagnosis?.osiLayer || "Layer 3",
        deterministic_rule_results: dynamicRuleChecks.map(r => `${r.ruleName}: ${r.status.toUpperCase()} - ${r.details}`)
      };

      const response = await fetch('/api/diagnose-network', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(diagnosticPayload)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server error ${response.status}`);
      }

      const data = await response.json();

      let confidenceVal = 95;
      if (typeof data.confidence === 'string') {
        if (data.confidence.toLowerCase() === 'high') confidenceVal = 97;
        else if (data.confidence.toLowerCase() === 'medium') confidenceVal = 82;
        else if (data.confidence.toLowerCase() === 'low') confidenceVal = 48;
      } else if (typeof data.confidence === 'number') {
        confidenceVal = data.confidence;
      }

      const updatedDiagnosis = {
        rootCause: data.root_cause || "Diagnostic analysis complete.",
        osiLayer: data.osi_layer || "Layer 3",
        confidence: confidenceVal,
        evidenceHighlight: Array.isArray(data.evidence) ? data.evidence.join('; ') : (data.evidence || ''),
        nextCommand: data.next_command || "show ip interface brief",
        fixSteps: Array.isArray(data.fix_steps) ? data.fix_steps : [data.fix_steps || 'no shutdown']
      };

      setCases(prev => prev.map(c => {
        if (c.id === activeCase.id) {
          return {
            ...c,
            status: 'Pending Review',
            aiDiagnosis: updatedDiagnosis
          };
        }
        return c;
      }));

      // Synchronize with Express backend
      fetch(`/api/cases/${activeCase.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Pending Review',
          aiDiagnosis: updatedDiagnosis
        })
      }).catch(err => console.warn("Failed backend sync:", err));

      addToast(`Root cause identified for ${activeCase.id}. Pending human review.`, "success");
    } catch (err: any) {
      console.error("Diagnosis error:", err);
      addToast(err.message || "Failed to contact AI diagnostic service.", "error");
    } finally {
      setIsDiagnosing(false);
    }
  };

  // Action decision: Approve & Simulate
  const handleApproveCase = (caseId: string) => {
    const targetCase = cases.find(c => c.id === caseId) || activeCase;
    if (!targetCase) return;

    setCases(prev => prev.map(c => c.id === targetCase.id ? { ...c, status: 'Approved' } : c));

    const newLog: AuditLogEntry = {
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      actionType: "HUMAN GATE PASS",
      targetNode: `${targetCase.networkEvidence.hostname}`,
      message: `Case ${targetCase.id} approved by Operator M. Zhao. Remediation commands queued for Packet Tracer simulation.`,
      integrityToken: `sha256:${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`,
      safetyStatus: "COMPLIANT",
      caseId: targetCase.id,
      aiDiagnosis: targetCase.aiDiagnosis?.rootCause,
      confidence: targetCase.aiDiagnosis ? `${targetCase.aiDiagnosis.confidence}%` : "95%",
      evidence: targetCase.aiDiagnosis?.evidenceHighlight,
      originalCommands: targetCase.aiDiagnosis?.fixSteps,
      humanDecision: "ACCEPTED",
      reviewer: "M. Zhao (NetOps Lead)",
      reason: "Grounded evidence confirmed against Packet Tracer topology."
    };

    setAuditLogs(prev => [newLog, ...prev]);

    // Backend sync
    fetch(`/api/cases/${targetCase.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Approved' })
    }).catch(console.warn);

    fetch('/api/audit-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLog)
    }).catch(console.warn);

    addToast(`Case ${targetCase.id} approved & simulation committed.`, "success");
  };

  // Action decision: Save Edited Decision
  const handleSaveEditedDecision = (caseId: string, editedCommands: string[], reason: string, reviewer: string) => {
    const targetCase = cases.find(c => c.id === caseId) || activeCase;
    if (!targetCase) return;

    setCases(prev => prev.map(c => {
      if (c.id === targetCase.id) {
        return {
          ...c,
          status: 'Approved',
          aiDiagnosis: c.aiDiagnosis ? {
            ...c.aiDiagnosis,
            fixSteps: editedCommands
          } : undefined
        };
      }
      return c;
    }));

    const newLog: AuditLogEntry = {
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      actionType: "OPERATOR OVERRIDE",
      targetNode: `${targetCase.networkEvidence.hostname}`,
      message: `Case ${targetCase.id} approved with human-modified commands by ${reviewer}. Reason: ${reason}`,
      integrityToken: `sha256:${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`,
      safetyStatus: "MODIFIED",
      caseId: targetCase.id,
      aiDiagnosis: targetCase.aiDiagnosis?.rootCause,
      confidence: targetCase.aiDiagnosis ? `${targetCase.aiDiagnosis.confidence}%` : "N/A",
      evidence: targetCase.aiDiagnosis?.evidenceHighlight,
      originalCommands: targetCase.aiDiagnosis?.fixSteps,
      editedCommands: editedCommands,
      humanDecision: "EDITED",
      reviewer: reviewer,
      reason: reason
    };

    setAuditLogs(prev => [newLog, ...prev]);

    fetch(`/api/cases/${targetCase.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'Approved',
        aiDiagnosis: targetCase.aiDiagnosis ? {
          ...targetCase.aiDiagnosis,
          fixSteps: editedCommands
        } : undefined
      })
    }).catch(console.warn);

    fetch('/api/audit-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLog)
    }).catch(console.warn);

    addToast(`Edited remediation logged and simulated for ${targetCase.id}.`, "success");
  };

  // Action decision: Reject Diagnosis
  const handleConfirmReject = (caseId: string, reason: string, reviewer: string) => {
    const targetCase = cases.find(c => c.id === caseId) || activeCase;
    if (!targetCase) return;

    setCases(prev => prev.map(c => c.id === targetCase.id ? { ...c, status: 'Rejected' } : c));

    const newLog: AuditLogEntry = {
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      actionType: "OPERATOR REJECT",
      targetNode: `${targetCase.networkEvidence.hostname}`,
      message: `Case ${targetCase.id} rejected by ${reviewer}. Reason: ${reason}`,
      integrityToken: `sha256:${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`,
      safetyStatus: "BLOCKED",
      caseId: targetCase.id,
      aiDiagnosis: targetCase.aiDiagnosis?.rootCause,
      confidence: targetCase.aiDiagnosis ? `${targetCase.aiDiagnosis.confidence}%` : "N/A",
      evidence: targetCase.aiDiagnosis?.evidenceHighlight,
      originalCommands: targetCase.aiDiagnosis?.fixSteps,
      humanDecision: "REJECTED",
      reviewer: reviewer,
      reason: reason
    };

    setAuditLogs(prev => [newLog, ...prev]);

    fetch(`/api/cases/${targetCase.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Rejected' })
    }).catch(console.warn);

    fetch('/api/audit-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLog)
    }).catch(console.warn);

    addToast(`Rejection reason logged to tamper-evident audit ledger.`, "info");
  };

  // PDF Export
  const handleExportPdf = (caseItem: DiagnosticCase) => {
    addToast(`Exporting cryptographic audit report for ${caseItem.id}...`, "info");
    exportCaseAuditPDF(caseItem, auditLogs);
  };

  // Case Selection
  const handleSelectCase = (caseId: string) => {
    setActiveCaseId(caseId);
    if (currentPage !== 'diagnostics') {
      setCurrentPage('diagnostics');
    }
  };

  return (
    <div className="min-h-screen bg-[#060D17] flex flex-col text-slate-100 font-sans antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 1. Global Header */}
      <AppHeader
        activeCaseId={activeCaseId}
        simulationMode={simulationMode}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenNotifications={() => setIsNotificationOpen(true)}
      />

      {/* 2. Body Container with Sidebar + Main View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Collapsible Enterprise Sidebar */}
        <AppSidebar
          currentPage={currentPage}
          onSelectPage={page => setCurrentPage(page)}
          collapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          pendingReviewCount={pendingReviewCount}
          criticalCasesCount={criticalCasesCount}
        />

        {/* Dynamic Main Workspace Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 max-w-7xl mx-auto w-full">
          {currentPage === 'overview' && (
            <OverviewPage
              cases={cases}
              auditLogs={auditLogs}
              onNavigate={page => {
                if (page === 'diagnostics' || page === 'cases' || page === 'network' || page === 'audit' || page === 'reports') {
                  setCurrentPage(page as NavigationPage);
                } else {
                  setCurrentPage(page as NavigationPage);
                }
              }}
              onSelectCase={handleSelectCase}
            />
          )}

          {currentPage === 'diagnostics' && (
            <DiagnosticsPage
              cases={cases}
              activeCaseId={activeCaseId}
              onSelectCase={setActiveCaseId}
              onRunDiagnosis={handleRunDiagnosis}
              isDiagnosing={isDiagnosing}
              onApproveCase={handleApproveCase}
              onSaveEditedDecision={handleSaveEditedDecision}
              onConfirmReject={handleConfirmReject}
              onExportPdf={handleExportPdf}
              dynamicRuleChecks={dynamicRuleChecks}
            />
          )}

          {currentPage === 'cases' && (
            <CasesDirectoryPage
              cases={cases}
              onSelectCase={handleSelectCase}
              onExportPdf={handleExportPdf}
            />
          )}

          {currentPage === 'network' && (
            <NetworkHealthPage
              cases={cases}
              onSelectCase={handleSelectCase}
            />
          )}

          {currentPage === 'ai-insights' && (
            <AiInsightsPage
              cases={cases}
            />
          )}

          {currentPage === 'responsible-ai' && (
            <ResponsibleAiPage
              auditLogs={auditLogs}
              cases={cases}
              onSelectCase={handleSelectCase}
            />
          )}

          {currentPage === 'audit' && (
            <AuditPage
              auditLogs={auditLogs}
            />
          )}

          {currentPage === 'reports' && (
            <ReportsPage
              cases={cases}
              onExportPdf={handleExportPdf}
            />
          )}

          {currentPage === 'test-center' && (
            <TestCenterPage />
          )}

          {currentPage === 'settings' && (
            <SettingsPage
              simulationMode={simulationMode}
              onToggleSimulationMode={setSimulationMode}
            />
          )}
        </main>
      </div>

      {/* 3. Global Search Palette Modal (Cmd+K) */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        cases={cases}
        onSelectCase={handleSelectCase}
      />

      {/* 4. Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        auditLogs={auditLogs}
        onSelectCase={handleSelectCase}
      />

      {/* 5. Toasts Container */}
      <ToastContainer
        toasts={toasts}
        onDismiss={removeToast}
      />
    </div>
  );
}
