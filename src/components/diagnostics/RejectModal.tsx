import React, { useState } from 'react';
import { X, XCircle, AlertTriangle } from 'lucide-react';
import { DiagnosticCase } from '../../types';

interface RejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCase: DiagnosticCase;
  onConfirmReject: (reason: string, reviewer: string) => void;
}

export const RejectModal: React.FC<RejectModalProps> = ({
  isOpen,
  onClose,
  currentCase,
  onConfirmReject
}) => {
  const [reason, setReason] = useState('');
  const [reviewer, setReviewer] = useState('M. Zhao (NetOps Lead)');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A valid engineering reason is strictly mandatory when rejecting an AI recommendation.');
      return;
    }

    onConfirmReject(reason.trim(), reviewer.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg bg-[#0B1728] border border-rose-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-rose-950/90 text-white flex items-center justify-between border-b border-rose-900/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-900 border border-rose-500/50 flex items-center justify-center text-rose-200">
              <XCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-mono text-white">REJECT AI RECOMMENDATION</h3>
              <p className="text-[11px] text-rose-300">Incident Case: {currentCase.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-rose-300 hover:text-white rounded-lg hover:bg-rose-900">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            Explain why this AI diagnosis or remediation should not be accepted. The rejection and reason will be cryptographically logged to the SHA-256 audit ledger.
          </p>

          {error && (
            <div className="p-3 bg-rose-950/80 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-200 font-mono mb-1">
              Rejection Reason <span className="text-rose-400">*</span>
            </label>
            <textarea
              value={reason}
              onChange={e => {
                setReason(e.target.value);
                setError(null);
              }}
              rows={3}
              placeholder="e.g., AI misdiagnosed physical link failure as an OSPF metric mismatch. Physical line protocol error takes precedence."
              className="w-full bg-[#07111E] border border-[#1A3150] focus:border-rose-500 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none font-sans"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-200 font-mono mb-1">
              Operator / Reviewer Signature
            </label>
            <input
              type="text"
              value={reviewer}
              onChange={e => setReviewer(e.target.value)}
              className="w-full bg-[#07111E] border border-[#1A3150] rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#07111E] hover:bg-[#0E1E34] text-slate-300 rounded-xl text-xs font-semibold font-mono border border-[#1A3150] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold rounded-xl text-xs font-mono shadow-md transition-all"
            >
              Confirm Rejection & Log
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
