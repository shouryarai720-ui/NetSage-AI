import React from 'react';
import { 
  Shield, 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Play, 
  RefreshCw, 
  Download,
  Terminal,
  Activity,
  Cpu,
  Clock,
  Sparkles
} from 'lucide-react';
import { DiagnosticCase } from '../../types';

interface IncidentHeaderProps {
  currentCase: DiagnosticCase;
  isDiagnosing: boolean;
  onRunDiagnosis: () => void;
  onExportPdf: () => void;
}

export const IncidentHeader: React.FC<IncidentHeaderProps> = ({
  currentCase,
  isDiagnosing,
  onRunDiagnosis,
  onExportPdf
}) => {
  const sevBadge = 
    currentCase.severity === 'Critical' ? 'bg-rose-950/80 text-rose-300 border-rose-500/50' :
    currentCase.severity === 'High' ? 'bg-amber-950/80 text-amber-300 border-amber-500/50' :
    currentCase.severity === 'Medium' ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50' :
    'bg-slate-900 text-slate-300 border-slate-700';

  const statusBadge = 
    currentCase.status === 'Approved' ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50' :
    currentCase.status === 'Rejected' ? 'bg-rose-950/80 text-rose-300 border-rose-500/50' :
    'bg-amber-950/80 text-amber-300 border-amber-500/50';

  return (
    <div className="bg-[#0B1728] rounded-2xl border border-[#162942] p-5 sm:p-6 shadow-md space-y-4">
      {/* Top Meta row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 uppercase tracking-wider">
            <span>Operations</span>
            <span>/</span>
            <span>Diagnostics</span>
            <span>/</span>
            <span className="font-bold text-cyan-400">{currentCase.id}</span>
          </div>

          <span className="text-slate-600 hidden sm:inline">•</span>

          <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase font-mono tracking-wider ${sevBadge}`}>
            {currentCase.severity}
          </span>

          <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-700 font-mono">
            {currentCase.aiDiagnosis?.osiLayer || 'Layer 3 — Network'}
          </span>

          <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border font-mono ${statusBadge}`}>
            ● {currentCase.status.toUpperCase()}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onRunDiagnosis}
            disabled={isDiagnosing}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-slate-950 rounded-xl text-xs font-bold font-mono flex items-center gap-2 shadow-sm transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isDiagnosing ? 'animate-spin' : ''}`} />
            <span>{isDiagnosing ? 'ANALYZING EVIDENCE...' : 'RE-RUN AI DIAGNOSIS'}</span>
          </button>

          <button
            onClick={onExportPdf}
            className="px-3.5 py-2 bg-[#07111E] hover:bg-[#0E1E34] text-slate-300 hover:text-white border border-[#1A3150] rounded-xl text-xs font-semibold font-mono flex items-center gap-2 transition-all shadow-xs"
            title="Export full tamper-sealed PDF incident report"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>EXPORT PDF REPORT</span>
          </button>
        </div>
      </div>

      {/* Case Title & Symptom Description */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2 font-display">
            <span className="font-mono text-cyan-400">{currentCase.id}:</span>
            <span>{currentCase.title}</span>
          </h2>
          <span className="text-xs font-mono text-slate-400">
            Node: <strong className="text-slate-200">{currentCase.networkEvidence?.hostname}</strong>
          </span>
        </div>

        <div className="mt-3 p-3.5 bg-[#07111E] border-l-4 border-cyan-500 rounded-r-xl">
          <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 font-mono mb-1 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" />
            <span>Observed Incident Symptom</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            {currentCase.networkProblem}
          </p>
        </div>
      </div>
    </div>
  );
};
