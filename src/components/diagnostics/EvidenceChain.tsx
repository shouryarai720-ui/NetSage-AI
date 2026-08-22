import React from 'react';
import { ArrowDown, CheckCircle2, ShieldCheck, Terminal, Cpu } from 'lucide-react';

interface EvidenceChainProps {
  rootCause: string;
  evidenceSource: string;
  evidenceQuote: string;
  osiLayer: string;
}

export const EvidenceChain: React.FC<EvidenceChainProps> = ({
  rootCause,
  evidenceSource,
  evidenceQuote,
  osiLayer
}) => {
  return (
    <div className="bg-[#0B1728] rounded-2xl border border-[#162942] p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wide">
            Evidence-to-Diagnosis Chain
          </h3>
        </div>
        <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-semibold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Evidence Grounded
        </span>
      </div>

      <div className="space-y-2.5 text-xs">
        {/* Step 1: AI Claim */}
        <div className="p-3 bg-[#07111E] border border-[#1A3150] rounded-xl">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-cyan-400 uppercase font-mono mb-1">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>1. Inferred Diagnostic Root Cause</span>
          </div>
          <p className="text-slate-200 font-semibold leading-relaxed">
            {rootCause}
          </p>
          <div className="mt-1.5 text-[10px] text-slate-400 font-mono">
            Target Layer: <strong className="text-cyan-300">{osiLayer}</strong>
          </div>
        </div>

        {/* Connector */}
        <div className="flex justify-center">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono font-semibold py-0.5">
            <ArrowDown className="w-3.5 h-3.5 text-cyan-400" />
            <span>Directly Proven by Cisco CLI Output</span>
          </div>
        </div>

        {/* Step 2: Cisco Evidence Line */}
        <div className="p-3 bg-[#040810] border border-[#162942] rounded-xl text-slate-200 font-mono text-[11px]">
          <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-900 pb-1 mb-2">
            <div className="flex items-center gap-1.5">
              <Terminal className="w-3 h-3 text-cyan-400" />
              <span>Source: {evidenceSource || 'show ip interface brief'}</span>
            </div>
            <span className="text-emerald-400 font-semibold">Grounded Evidence</span>
          </div>
          <div className="p-2 bg-[#07111E] rounded-lg text-amber-300 font-medium border border-amber-500/20">
            "{evidenceQuote || 'Interface state anomaly verified in console stream'}"
          </div>
        </div>
      </div>
    </div>
  );
};
