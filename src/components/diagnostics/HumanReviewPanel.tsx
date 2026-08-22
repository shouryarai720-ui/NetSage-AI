import React from 'react';
import { UserCheck, CheckCircle2, Edit3, XCircle, Download, Terminal, Shield, ArrowRight, Lock } from 'lucide-react';
import { DiagnosticCase } from '../../types';

interface HumanReviewPanelProps {
  currentCase: DiagnosticCase;
  onApprove: () => void;
  onOpenEdit: () => void;
  onOpenReject: () => void;
  onExportPdf: () => void;
  isApproved: boolean;
  isRejected: boolean;
}

export const HumanReviewPanel: React.FC<HumanReviewPanelProps> = ({
  currentCase,
  onApprove,
  onOpenEdit,
  onOpenReject,
  onExportPdf,
  isApproved,
  isRejected
}) => {
  return (
    <div className="bg-[#0B1728] rounded-2xl border-2 border-cyan-500/50 p-5 sm:p-6 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-300 flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-mono tracking-tight uppercase flex items-center gap-2">
              <span>Human-in-the-Loop Decision Gate</span>
              <span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded border border-slate-800">
                HITL v2.6
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Review evidence and remediation syntax before committing to the Cisco Packet Tracer dry-run queue.
            </p>
          </div>
        </div>

        <div>
          <span className={`text-[11px] font-mono font-bold px-3 py-1 rounded-full border uppercase ${
            isApproved ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50' :
            isRejected ? 'bg-rose-950 text-rose-300 border-rose-500/50' :
            'bg-amber-950 text-amber-300 border-amber-500/50'
          }`}>
            {isApproved ? '● STATUS: APPROVED & SIMULATED' :
             isRejected ? '● STATUS: REJECTED BY OPERATOR' :
             '● STATUS: ACTION REQUIRED'}
          </span>
        </div>
      </div>

      {/* AI Proposed Fix CLI Preview Box */}
      <div className="p-4 bg-[#040810] rounded-xl border border-[#162942] font-mono text-xs text-slate-200">
        <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-900 pb-2 mb-2.5">
          <div className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold text-slate-300">QUEUED REMEDIATION COMMANDS (Cisco IOS)</span>
          </div>
          <span className="text-[10px] text-cyan-400 font-mono">Target: {currentCase.networkEvidence?.hostname}</span>
        </div>

        <div className="space-y-1 text-[11px]">
          <div className="text-cyan-400">configure terminal</div>
          {currentCase.aiDiagnosis?.fixSteps?.map((step, idx) => (
            <div key={idx} className="text-emerald-300 pl-3 border-l-2 border-slate-800">
              {step}
            </div>
          ))}
          <div className="text-cyan-400">end</div>
          <div className="text-cyan-400">write memory</div>
        </div>
      </div>

      {/* Human Actions Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={onApprove}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 rounded-xl text-xs font-bold font-mono flex items-center gap-2 shadow-md shadow-emerald-950/50 transition-all transform hover:-translate-y-0.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>APPROVE & APPLY TO SIMULATION</span>
          </button>

          <button
            onClick={onOpenEdit}
            className="px-4 py-2.5 bg-[#0E1E34] hover:bg-[#132A4A] text-slate-200 hover:text-white border border-[#1E3A5F] rounded-xl text-xs font-semibold font-mono flex items-center gap-2 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
            <span>EDIT FIX</span>
          </button>

          <button
            onClick={onOpenReject}
            className="px-4 py-2.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-semibold font-mono flex items-center gap-2 transition-colors"
          >
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>REJECT</span>
          </button>
        </div>

        <button
          onClick={onExportPdf}
          className="px-4 py-2.5 bg-[#07111E] hover:bg-[#0E1E34] text-slate-300 hover:text-white border border-[#1A3150] rounded-xl text-xs font-semibold font-mono flex items-center gap-2 shadow-xs transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span>Export Audit PDF</span>
        </button>
      </div>
    </div>
  );
};
