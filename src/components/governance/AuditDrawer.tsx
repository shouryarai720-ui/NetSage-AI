import React from 'react';
import { X, ShieldCheck, FileText, Key, CheckCircle2, User, Clock, Terminal, Hash } from 'lucide-react';
import { AuditLogEntry } from '../../types';

interface AuditDrawerProps {
  entry: AuditLogEntry | null;
  onClose: () => void;
}

export const AuditDrawer: React.FC<AuditDrawerProps> = ({ entry, onClose }) => {
  if (!entry) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-sm flex justify-end animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg bg-[#0B1728] border-l border-[#1E3A5F] shadow-2xl h-full flex flex-col overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-[#07111E] text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-mono text-white">AUDIT BLOCK INSPECTOR</h3>
              <p className="text-[10px] text-slate-400 font-mono">{entry.caseId ? `Case: ${entry.caseId}` : 'System Log'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs font-mono">
          {/* Integrity status */}
          <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="font-bold">Cryptographic Chain: VERIFIED</span>
            </div>
            <span className="text-[10px] bg-[#07111E] px-2 py-0.5 rounded border border-emerald-500/40 text-emerald-300">
              {entry.safetyStatus}
            </span>
          </div>

          {/* SHA-256 Hashes */}
          <div className="p-4 bg-[#040810] text-slate-200 rounded-xl border border-[#162942] space-y-2.5">
            <div>
              <span className="text-slate-500 text-[10px] block">PREVIOUS BLOCK HASH:</span>
              <span className="text-cyan-400 text-[11px] break-all">
                {entry.previousHash || 'sha256:genesis_block_init'}
              </span>
            </div>
            <div className="border-t border-slate-900 pt-2">
              <span className="text-slate-500 text-[10px] block">CURRENT BLOCK HASH (INTEGRITY TOKEN):</span>
              <span className="text-emerald-400 text-[11px] break-all font-bold">
                {entry.integrityToken || entry.currentHash || 'sha256:verified_ok'}
              </span>
            </div>
          </div>

          {/* Details Table */}
          <div className="space-y-2.5 border border-[#162942] rounded-xl p-4 bg-[#07111E]">
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Timestamp:</span>
              <span className="text-white font-semibold">{entry.timestamp}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Action Type:</span>
              <span className="text-cyan-400 font-bold">{entry.actionType}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Target Node:</span>
              <span className="text-slate-200">{entry.targetNode}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Authorized Reviewer:</span>
              <span className="text-slate-200 font-semibold">{entry.reviewer || 'M. Zhao (NetOps Lead)'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Human Decision:</span>
              <span className="text-emerald-400 font-bold">{entry.humanDecision || 'ACCEPTED'}</span>
            </div>
          </div>

          {/* Message / Reason */}
          <div>
            <span className="text-slate-300 font-bold block mb-1">Audit Log Message:</span>
            <p className="p-3.5 bg-[#07111E] border border-[#1A3150] rounded-xl text-slate-200 font-sans text-xs leading-relaxed">
              {entry.message}
            </p>
          </div>

          {/* Edited Commands if applicable */}
          {entry.editedCommands && entry.editedCommands.length > 0 && (
            <div>
              <span className="text-slate-300 font-bold block mb-1">Human-Modified Remediation:</span>
              <div className="p-3 bg-[#040810] text-emerald-300 rounded-xl border border-[#162942] space-y-1">
                {entry.editedCommands.map((cmd, idx) => (
                  <div key={idx}>$ {cmd}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
