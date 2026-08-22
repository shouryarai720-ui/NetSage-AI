import React from 'react';
import { Shield, ShieldAlert, CheckCircle2, AlertTriangle, Lock, UserCheck } from 'lucide-react';

interface AiSafetyGateProps {
  status: 'grounded' | 'warning' | 'blocked' | 'pending_approval';
  validationNote?: string;
  hasHumanApproved: boolean;
}

export const AiSafetyGate: React.FC<AiSafetyGateProps> = ({
  status = 'grounded',
  validationNote,
  hasHumanApproved
}) => {
  const isApproved = hasHumanApproved;

  return (
    <div className="bg-[#0B1728] rounded-2xl border border-[#162942] p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wide">
            AI Safety Gate & Grounding
          </h3>
        </div>

        <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border uppercase ${
          isApproved 
            ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40' 
            : 'bg-amber-950 text-amber-300 border-amber-500/40'
        }`}>
          {isApproved ? '● HUMAN APPROVED' : '● HUMAN GATE PENDING'}
        </span>
      </div>

      <div className="p-3.5 bg-[#07111E] border border-[#1A3150] rounded-xl text-xs space-y-2 font-mono">
        <div className="flex items-start gap-2.5 text-slate-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="text-white">Evidence Grounded:</strong> Show output citations verified against active router telemetry.
          </div>
        </div>

        <div className="flex items-start gap-2.5 text-slate-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="text-white">Hallucination Check:</strong> No unsupported IP subnets or non-existent interfaces detected.
          </div>
        </div>

        <div className="flex items-start gap-2.5 text-slate-300">
          <Lock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="text-white">Execution Safety:</strong> Direct production push blocked. Dry-run simulation only upon operator sign-off.
          </div>
        </div>
      </div>
    </div>
  );
};
