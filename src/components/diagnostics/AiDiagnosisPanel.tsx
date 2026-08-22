import React, { useState } from 'react';
import { Cpu, CheckCircle2, Copy, Check, Terminal, ShieldAlert, ArrowRight, Activity, BookOpen, Layers, CheckSquare, AlertTriangle, Sparkles } from 'lucide-react';
import { DiagnosticCase } from '../../types';

interface AiDiagnosisPanelProps {
  diagnosis: DiagnosticCase['aiDiagnosis'];
  groundTruth?: DiagnosticCase['groundTruth'];
  hostname: string;
}

export const AiDiagnosisPanel: React.FC<AiDiagnosisPanelProps> = ({
  diagnosis,
  groundTruth,
  hostname
}) => {
  const [copied, setCopied] = useState(false);
  const [showGroundTruth, setShowGroundTruth] = useState(false);

  if (!diagnosis) {
    return (
      <div className="bg-[#0B1728] rounded-2xl border border-[#162942] p-6 shadow-sm text-center text-slate-400 text-xs">
        <Cpu className="w-8 h-8 mx-auto mb-2 text-cyan-400 animate-pulse" />
        <p className="font-semibold text-slate-200">Awaiting AI Diagnostic Sequence</p>
        <p className="mt-1 text-slate-400">Click 'Re-Run AI Diagnosis' to analyze evidence.</p>
      </div>
    );
  }

  const handleCopyFix = () => {
    if (!diagnosis.fixSteps) return;
    const text = diagnosis.fixSteps.join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const confidenceLevel = diagnosis.confidenceLevel || (typeof diagnosis.confidence === 'string' ? diagnosis.confidence : (diagnosis.confidence && diagnosis.confidence >= 90 ? 'High' : diagnosis.confidence && diagnosis.confidence >= 70 ? 'Medium' : 'Low'));
  const confColor = 
    confidenceLevel === 'High' ? 'text-emerald-300 bg-emerald-950/80 border-emerald-500/40' :
    confidenceLevel === 'Medium' ? 'text-amber-300 bg-amber-950/80 border-amber-500/40' :
    'text-rose-300 bg-rose-950/80 border-rose-500/40';

  const isGrounded = !diagnosis.hallucinationFlag;
  const evalStatus = diagnosis.evaluationAgainstGroundTruth || 'CORRECT';

  return (
    <div className="bg-[#0B1728] rounded-2xl border border-[#162942] p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white font-mono tracking-tight uppercase">
              AI Diagnostic Assessment
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Gemini 3.7 Flash Diagnostic Engine</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isGrounded ? (
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Grounded
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-amber-300 bg-amber-950/80 border border-amber-500/40 px-2.5 py-0.5 rounded-full font-mono">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              Review Flags
            </span>
          )}
        </div>
      </div>

      {/* Root Cause Card */}
      <div className="p-3.5 bg-[#07111E] border border-[#1A3150] rounded-xl space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            Inferred Root Cause
          </span>
          <span className="text-[9px] font-mono font-bold text-cyan-300 bg-cyan-950/90 border border-cyan-500/30 px-2 py-0.5 rounded-full">
            AI Inferred
          </span>
        </div>
        <p className="text-xs sm:text-sm font-semibold text-white leading-relaxed">
          {diagnosis.rootCause}
        </p>
      </div>

      {/* Metrics Row: OSI Layer & Confidence */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-[#07111E] border border-[#1A3150] rounded-xl">
          <span className="block text-[10px] uppercase font-bold text-slate-400 font-mono">OSI Layer</span>
          <span className="text-xs font-bold text-cyan-300 font-mono mt-0.5 block truncate">
            {diagnosis.osiLayer}
          </span>
        </div>

        <div className="p-3 bg-[#07111E] border border-[#1A3150] rounded-xl">
          <span className="block text-[10px] uppercase font-bold text-slate-400 font-mono">Confidence Level</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full border ${confColor}`}>
              {confidenceLevel.toUpperCase()}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              (Evidence: {confidenceLevel === 'High' ? 'Strong' : confidenceLevel === 'Medium' ? 'Moderate' : 'Limited'})
            </span>
          </div>
        </div>
      </div>

      {/* Next Verification Command */}
      {diagnosis.nextCommand && (
        <div className="p-3 bg-[#040810] text-slate-200 rounded-xl border border-[#162942] font-mono text-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center justify-between">
            <span>Next Verification Command</span>
            <span className="text-[9px] text-cyan-400">Target: {hostname || 'ROUTER-01'}</span>
          </div>
          <div className="text-cyan-300 font-semibold flex items-center gap-1.5">
            <span className="text-slate-400">#</span>
            <span>{diagnosis.nextCommand}</span>
          </div>
        </div>
      )}

      {/* Recommended Fix CLI block */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            Recommended Remediation Sequence (Cisco IOS)
          </span>
          <button
            onClick={handleCopyFix}
            className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <div className="p-3.5 bg-[#040810] text-slate-200 rounded-xl border border-[#162942] font-mono text-xs space-y-1">
          <div className="text-slate-400 text-[10px] mb-1">! AI-Generated Remediation Sequence</div>
          {diagnosis.fixSteps?.map((step, idx) => (
            <div key={idx} className="flex items-center gap-2 text-emerald-400">
              <span className="text-slate-400 select-none text-[10px]">{idx + 1}.</span>
              <span className="text-slate-100">{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Ground Truth Benchmark Toggle & Panel */}
      {groundTruth && (
        <div className="pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowGroundTruth(!showGroundTruth)}
              className="text-[10px] font-mono font-bold text-slate-300 hover:text-white flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-[#07111E] hover:bg-[#0E1E34] border border-[#1A3150] transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>{showGroundTruth ? 'Hide Benchmark' : 'Ground Truth Spec'}</span>
            </button>

            <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border uppercase ${
              evalStatus === 'CORRECT' ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40' :
              evalStatus === 'PARTIALLY_CORRECT' ? 'bg-amber-950 text-amber-300 border-amber-500/40' :
              'bg-rose-950 text-rose-300 border-rose-500/40'
            }`}>
              Benchmark: {evalStatus}
            </span>
          </div>

          {showGroundTruth && (
            <div className="mt-3 p-3.5 bg-[#07111E] border border-[#1A3150] rounded-xl space-y-2.5 text-xs font-mono">
              <div className="text-[10px] font-bold uppercase text-slate-400 flex items-center justify-between border-b border-slate-800 pb-1">
                <span>Ground Truth Dataset Reference</span>
                <span className="text-cyan-400">Authoritative Spec</span>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] block">Expected Fault:</span>
                <p className="text-white font-semibold mt-0.5">{groundTruth.expectedFault}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 text-[10px] block">Expected OSI:</span>
                  <span className="text-slate-200 font-bold">{groundTruth.expectedOsiLayer}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Expected Rule:</span>
                  <span className="text-slate-200 font-bold">{groundTruth.expectedRuleIds || 'N/A'}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] block mb-1">Expected Remediation CLI:</span>
                <div className="p-2.5 bg-[#040810] text-slate-200 rounded-lg text-[11px] space-y-0.5 border border-[#162942]">
                  {groundTruth.expectedFixSteps?.map((step, idx) => (
                    <div key={idx} className="text-emerald-300">
                      <span className="text-slate-400 select-none mr-1.5">{idx + 1}.</span>
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
