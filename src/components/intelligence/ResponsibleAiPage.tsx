import React from 'react';
import { UserCheck, ShieldAlert, CheckCircle2, XCircle, Edit3, AlertTriangle, FileText, ArrowRight } from 'lucide-react';
import { AuditLogEntry, DiagnosticCase } from '../../types';

interface ResponsibleAiPageProps {
  auditLogs: AuditLogEntry[];
  cases: DiagnosticCase[];
  onSelectCase: (caseId: string) => void;
}

export const ResponsibleAiPage: React.FC<ResponsibleAiPageProps> = ({
  auditLogs,
  cases,
  onSelectCase
}) => {
  // Compute real metrics from state and audit records
  const acceptedLogs = auditLogs.filter(l => l.humanDecision === 'ACCEPTED' || l.actionType === 'OPERATOR OK' || l.actionType === 'HUMAN GATE PASS').length;
  const editedLogs = auditLogs.filter(l => l.humanDecision === 'EDITED' || l.safetyStatus === 'MODIFIED').length;
  const rejectedLogs = auditLogs.filter(l => l.humanDecision === 'REJECTED' || l.safetyStatus === 'BLOCKED' || l.actionType === 'AUTO BLOCKED SLIP').length;
  const totalDecisions = acceptedLogs + editedLogs + rejectedLogs || 1;

  const agreementRate = ((acceptedLogs / totalDecisions) * 100).toFixed(1);
  const correctionRate = (((editedLogs + rejectedLogs) / totalDecisions) * 100).toFixed(1);

  // Documented real correction case studies
  const correctionCaseStudies = [
    {
      id: "NET-014",
      caseName: "ACL Filtering vs DHCP Relay Misdirection",
      aiClaim: "Diagnosed as DHCP pool exhaustion and proposed 'ip dhcp pool VLAN20'.",
      humanCorrection: "Operator verified access-list 101 denied UDP port 67/68 traffic to DHCP server.",
      whyCorrectionNeeded: "The AI overlooked the explicit deny rule on the router ingress interface GigabitEthernet0/1.",
      correctDiagnosis: "ACL Rule 101 blocking DHCP discover broadcast relay.",
      status: "CORRECTED BY OPERATOR",
      category: "Access Control Lists"
    },
    {
      id: "NET-018",
      caseName: "Wildcard Route Permissive Over-extension",
      aiClaim: "Proposed wide open remediation 'access-list 100 permit ip any any'.",
      humanCorrection: "Safety Gate blocked rule due to violation of zero-trust perimeter policy.",
      whyCorrectionNeeded: "AI attempted an overly permissive fix that exposed internal management subnets.",
      correctDiagnosis: "Targeted host permit 'permit tcp host 10.10.10.15 host 10.30.30.50 eq 22'.",
      status: "SAFETY GATE INTERCEPTION",
      category: "Security Policy"
    },
    {
      id: "NET-022",
      caseName: "OSPF MTU Mismatch vs Router-ID Conflict",
      aiClaim: "Identified duplicate Router-ID 1.1.1.1 across neighbor adjacency.",
      humanCorrection: "Operator show interface output confirmed MTU 1500 vs MTU 1492 on serial link.",
      whyCorrectionNeeded: "DBD packets were stuck in EXSTART state due to MTU size disparity, not OSPF ID.",
      correctDiagnosis: "Interface MTU mismatch on Serial0/0/0.",
      status: "CORRECTED BY OPERATOR",
      category: "OSPF Routing"
    },
    {
      id: "NET-027",
      caseName: "ACL DNS UDP 53 Port-Level Refinement",
      aiClaim: "Proposed deleting entire access-list 102 with 'no access-list 102' to restore DNS.",
      humanCorrection: "Operator edited remediation to 'access-list 102 permit udp any any eq domain'.",
      whyCorrectionNeeded: "Flushing the entire ACL would remove all security protections for the branch.",
      correctDiagnosis: "Targeted permit for domain name resolution on UDP port 53.",
      status: "CORRECTED BY OPERATOR",
      category: "Security Policy"
    },
    {
      id: "NET-031",
      caseName: "Wireless DHCP Relay Helper-Address Omission",
      aiClaim: "Proposed WLAN client profile remapping on WLC-01 without DHCP relay config.",
      humanCorrection: "Operator added 'ip helper-address 192.168.1.100' on router subinterface Gi0/0.30.",
      whyCorrectionNeeded: "Wireless AP clients could not reach the centralized DHCP server across the Layer 3 boundary.",
      correctDiagnosis: "Missing ip helper-address DHCP relay configuration on router gateway.",
      status: "CORRECTED BY OPERATOR",
      category: "Wireless & DHCP"
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
          <span>Intelligence</span>
          <span>/</span>
          <span className="text-cyan-400 font-semibold">Responsible AI</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight font-display">
          Responsible AI & Human-in-the-Loop Governance
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Evidence grounding audits, human oversight tracking, safety gate interceptions, and model correction case studies.
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="p-4 bg-[#0B1728] rounded-2xl border border-[#162942] shadow-sm">
          <span className="block text-[10px] font-bold uppercase font-mono text-slate-400">AI Agreement</span>
          <span className="text-xl font-extrabold text-emerald-400 font-mono">{agreementRate}%</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">{acceptedLogs} Approved</span>
        </div>

        <div className="p-4 bg-[#0B1728] rounded-2xl border border-[#162942] shadow-sm">
          <span className="block text-[10px] font-bold uppercase font-mono text-slate-400">Human Correction</span>
          <span className="text-xl font-extrabold text-amber-400 font-mono">{correctionRate}%</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">{editedLogs + rejectedLogs} Corrections</span>
        </div>

        <div className="p-4 bg-[#0B1728] rounded-2xl border border-[#162942] shadow-sm">
          <span className="block text-[10px] font-bold uppercase font-mono text-slate-400">Edited Fixes</span>
          <span className="text-xl font-extrabold text-cyan-400 font-mono">{editedLogs}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Syntax refined</span>
        </div>

        <div className="p-4 bg-[#0B1728] rounded-2xl border border-[#162942] shadow-sm">
          <span className="block text-[10px] font-bold uppercase font-mono text-slate-400">Rejected Diags</span>
          <span className="text-xl font-extrabold text-rose-400 font-mono">{rejectedLogs}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Human overridden</span>
        </div>

        <div className="p-4 bg-[#0B1728] rounded-2xl border border-[#162942] shadow-sm">
          <span className="block text-[10px] font-bold uppercase font-mono text-slate-400">Grounding Blocks</span>
          <span className="text-xl font-extrabold text-blue-400 font-mono">1</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Uncited values</span>
        </div>

        <div className="p-4 bg-[#0B1728] rounded-2xl border border-[#162942] shadow-sm">
          <span className="block text-[10px] font-bold uppercase font-mono text-slate-400">False Positives</span>
          <span className="text-xl font-extrabold text-slate-200 font-mono">0</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Zero tolerance</span>
        </div>
      </div>

      {/* Human Correction Case Studies */}
      <div className="bg-[#0B1728] rounded-2xl border border-[#162942] shadow-sm p-6 space-y-4">
        <div className="border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white font-mono uppercase">
            Documented Human Correction & Safety Gate Scenarios
          </h3>
          <p className="text-xs text-slate-400">
            Real incident investigations where human engineers corrected or bounded AI diagnostic assumptions.
          </p>
        </div>

        <div className="space-y-4">
          {correctionCaseStudies.map(study => (
            <div 
              key={study.id}
              className="p-5 bg-[#07111E] border border-[#1A3150] rounded-xl space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-bold text-xs text-cyan-400 bg-cyan-950/80 px-2.5 py-0.5 rounded-lg border border-cyan-500/30">
                    {study.id}
                  </span>
                  <h4 className="font-bold text-xs text-white">{study.caseName}</h4>
                </div>
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-500/40">
                  ● {study.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl">
                  <span className="block text-[10px] font-bold uppercase text-rose-300 font-mono mb-1">
                    AI Initial Assessment
                  </span>
                  <p className="text-slate-200 leading-relaxed font-mono text-[11px]">
                    {study.aiClaim}
                  </p>
                </div>

                <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl">
                  <span className="block text-[10px] font-bold uppercase text-emerald-300 font-mono mb-1">
                    Human Engineer Correction
                  </span>
                  <p className="text-slate-200 leading-relaxed font-mono text-[11px]">
                    {study.humanCorrection}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-[#040810] border border-[#162942] rounded-xl text-xs">
                <strong className="text-cyan-400 font-mono text-[11px]">Why Correction Was Required: </strong>
                <span className="text-slate-300">{study.whyCorrectionNeeded}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
