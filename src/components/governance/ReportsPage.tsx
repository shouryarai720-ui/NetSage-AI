import React from 'react';
import { FileText, Download, CheckCircle2, Shield, Calendar, Server, ArrowRight } from 'lucide-react';
import { DiagnosticCase } from '../../types';

interface ReportsPageProps {
  cases: DiagnosticCase[];
  onExportPdf: (c: DiagnosticCase) => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ cases, onExportPdf }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
            <span>Governance</span>
            <span>/</span>
            <span className="text-cyan-400 font-semibold">Incident Reports</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight font-display">
            Diagnostic & Post-Mortem Reports
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Export enterprise PDF post-mortems with cryptographic audit hash citations, CLI show outputs, and human sign-offs.
          </p>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {cases.map(c => {
          const isApproved = c.status === 'Approved';
          const isRejected = c.status === 'Rejected';

          return (
            <div 
              key={c.id}
              className="bg-[#0B1728] rounded-2xl border border-[#162942] p-5 shadow-sm flex flex-col justify-between space-y-4 hover:border-cyan-500/40 transition-all hover:-translate-y-0.5"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="font-mono font-bold text-xs text-cyan-400 bg-cyan-950/80 px-2.5 py-0.5 rounded-lg border border-cyan-500/30">
                    {c.id}
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border uppercase ${
                    isApproved ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40' :
                    isRejected ? 'bg-rose-950 text-rose-300 border-rose-500/40' :
                    'bg-amber-950 text-amber-300 border-amber-500/40'
                  }`}>
                    {c.status}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-white line-clamp-1">{c.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">{c.networkProblem}</p>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Host: <strong className="text-slate-200">{c.networkEvidence?.hostname}</strong></span>
                  <span className="text-cyan-400">{c.aiDiagnosis?.osiLayer || 'Layer 3'}</span>
                </div>
              </div>

              <button
                onClick={() => onExportPdf(c)}
                className="w-full py-2.5 bg-[#07111E] hover:bg-[#0E1E34] text-slate-200 hover:text-white border border-[#1A3150] rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors font-mono cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Export PDF Post-Mortem</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
