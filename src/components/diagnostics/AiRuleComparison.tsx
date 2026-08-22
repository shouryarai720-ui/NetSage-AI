import React from 'react';
import { GitCompare, CheckCircle2, AlertTriangle, Cpu, ShieldCheck } from 'lucide-react';
import { RuleCheckItem } from '../../types';

interface AiRuleComparisonProps {
  deterministicFinding: string;
  aiRootCause: string;
  isConsistent: boolean;
}

export const AiRuleComparison: React.FC<AiRuleComparisonProps> = ({
  deterministicFinding,
  aiRootCause,
  isConsistent = true
}) => {
  return (
    <div className="bg-[#0B1728] rounded-2xl border border-[#162942] p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <GitCompare className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wide">
            Hybrid Engine Agreement
          </h3>
        </div>

        <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border uppercase ${
          isConsistent 
            ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40' 
            : 'bg-amber-950 text-amber-300 border-amber-500/40'
        }`}>
          {isConsistent ? '✓ 100% CONSISTENT' : '⚠ REVIEW REQUIRED'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {/* Deterministic Engine */}
        <div className="p-3 bg-[#07111E] border border-[#1A3150] rounded-xl space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase font-mono text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Deterministic Finding</span>
          </div>
          <p className="text-slate-300 font-medium leading-relaxed font-mono text-[11px]">
            {deterministicFinding || 'Rule inspection verified against RFC & Cisco IOS grammar specifications.'}
          </p>
        </div>

        {/* AI Diagnostic Engine */}
        <div className="p-3 bg-[#07111E] border border-[#1A3150] rounded-xl space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase font-mono text-cyan-400">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>Gemini AI Inference</span>
          </div>
          <p className="text-slate-300 font-medium leading-relaxed font-mono text-[11px]">
            {aiRootCause || 'Under contextual diagnostic analysis.'}
          </p>
        </div>
      </div>
    </div>
  );
};
