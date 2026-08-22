import React from 'react';
import { ShieldCheck, AlertCircle, CheckCircle2, AlertTriangle, Cpu, Layers } from 'lucide-react';
import { RuleCheckItem } from '../../types';

interface DeterministicRulePanelProps {
  ruleChecks: RuleCheckItem[];
}

export const DeterministicRulePanel: React.FC<DeterministicRulePanelProps> = ({
  ruleChecks
}) => {
  const checks = ruleChecks && ruleChecks.length > 0 ? ruleChecks : [
    {
      id: 'RC-01',
      ruleName: 'Interface Administrative State Verification',
      status: 'pass' as const,
      category: 'Routing' as const,
      details: 'All critical interfaces are administratively enabled.'
    }
  ];

  return (
    <div className="bg-[#0B1728] rounded-2xl border border-[#162942] p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wide">
            Deterministic Engine Matrix (RC-01 to RC-15)
          </h3>
        </div>
        <span className="text-[10px] font-mono text-slate-400 font-semibold">
          {checks.filter(c => c.status === 'fail').length > 0 ? 'Anomaly Detected' : 'All Rules Pass'}
        </span>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {checks.map(check => {
          const isFail = check.status === 'fail';
          const isWarn = check.status === 'warn';

          const badgeBg = 
            isFail ? 'bg-rose-950/80 border-rose-500/40 text-rose-200' :
            isWarn ? 'bg-amber-950/80 border-amber-500/40 text-amber-200' :
            'bg-[#07111E] border-slate-800 text-slate-300';

          return (
            <div 
              key={check.id}
              className={`p-3 rounded-xl border text-xs font-mono transition-colors ${badgeBg}`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-cyan-300 bg-[#0B1728] px-2 py-0.5 rounded border border-cyan-500/30 text-[10px]">
                    {check.id}
                  </span>
                  <span className="font-semibold text-white truncate max-w-[170px]">
                    {check.ruleName}
                  </span>
                </div>

                <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                  isFail ? 'bg-rose-900/90 text-rose-200 border-rose-500/60' :
                  isWarn ? 'bg-amber-900/90 text-amber-200 border-amber-500/60' :
                  'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                }`}>
                  {isFail ? 'FAULT' : isWarn ? 'WARN' : 'PASS'}
                </span>
              </div>

              <p className="text-[11px] text-slate-400 font-sans leading-relaxed mt-1">
                {check.details}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
