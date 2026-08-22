import React, { useState, useEffect } from 'react';
import { X, Edit3, Terminal, AlertTriangle, Check } from 'lucide-react';
import { DiagnosticCase } from '../../types';

interface EditFixModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCase: DiagnosticCase;
  onSaveEditedDecision: (editedCommands: string[], reason: string, reviewer: string) => void;
}

export const EditFixModal: React.FC<EditFixModalProps> = ({
  isOpen,
  onClose,
  currentCase,
  onSaveEditedDecision
}) => {
  const [commandsText, setCommandsText] = useState('');
  const [reason, setReason] = useState('');
  const [reviewer, setReviewer] = useState('M. Zhao (NetOps Lead)');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (currentCase?.aiDiagnosis?.fixSteps) {
      setCommandsText(currentCase.aiDiagnosis.fixSteps.join('\n'));
    }
  }, [currentCase, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setValidationError('Please state the engineering reason for modifying the AI proposal.');
      return;
    }
    const lines = commandsText.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      setValidationError('At least one remediation command is required.');
      return;
    }

    onSaveEditedDecision(lines, reason.trim(), reviewer.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-[#0B1728] border border-[#1E3A5F] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-[#07111E] text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-amber-300">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-mono text-white">HUMAN MODIFICATION OVERRIDE</h3>
              <p className="text-[11px] text-slate-400">Edit remediation commands for {currentCase.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {validationError && (
            <div className="p-3 bg-rose-950/80 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Side-by-side: AI proposal vs Human modified */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* AI Proposal */}
            <div className="p-3.5 bg-[#07111E] border border-[#1A3150] rounded-xl space-y-2">
              <div className="text-[10px] font-bold uppercase text-slate-400 font-mono flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span>Original AI Proposal</span>
              </div>
              <div className="font-mono text-[11px] text-slate-300 space-y-1 bg-[#040810] p-2.5 rounded-lg border border-[#162942]">
                {currentCase.aiDiagnosis?.fixSteps?.map((step, idx) => (
                  <div key={idx} className="text-slate-300">{step}</div>
                ))}
              </div>
            </div>

            {/* Editable Field */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-cyan-400 font-mono mb-1.5">
                Human Modified Sequence (One per line)
              </label>
              <textarea
                value={commandsText}
                onChange={e => {
                  setCommandsText(e.target.value);
                  setValidationError(null);
                }}
                rows={5}
                className="w-full bg-[#040810] border border-[#1E3A5F] focus:border-cyan-500 rounded-xl p-3 text-xs text-emerald-300 font-mono leading-relaxed focus:outline-none"
                placeholder="Enter revised Cisco commands..."
              />
            </div>
          </div>

          {/* Reason Field */}
          <div>
            <label className="block text-xs font-bold text-slate-200 font-mono mb-1">
              Engineering Reason for Override <span className="text-rose-400">*</span>
            </label>
            <textarea
              value={reason}
              onChange={e => {
                setReason(e.target.value);
                setValidationError(null);
              }}
              rows={2}
              placeholder="e.g., Added explicit MTU configuration to prevent future sub-interface fragmentation."
              className="w-full bg-[#07111E] border border-[#1A3150] focus:border-cyan-500 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none"
            />
          </div>

          {/* Reviewer Signature */}
          <div>
            <label className="block text-xs font-bold text-slate-200 font-mono mb-1">
              Operator Signature
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
              className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs font-mono shadow-md transition-all"
            >
              Commit Modified Fix to Ledger
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
