import React, { useState } from 'react';
import { Shield, Server, Cpu, Database, CheckCircle2, AlertTriangle, Key, Lock } from 'lucide-react';

interface SettingsPageProps {
  simulationMode: boolean;
  onToggleSimulationMode: (enabled: boolean) => void;
  onResetData?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  simulationMode,
  onToggleSimulationMode,
  onResetData
}) => {
  const [groundingThreshold, setGroundingThreshold] = useState(90);

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-150">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
          <span>System</span>
          <span>/</span>
          <span className="text-cyan-400 font-semibold">Settings</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight font-display">
          System Configuration & Operational Policies
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage simulation sandboxing, API engine endpoints, grounding thresholds, and cryptographic audit parameters.
        </p>
      </div>

      {/* Safe Simulation Mode Card */}
      <div className="p-6 bg-[#0B1728] rounded-2xl border border-[#162942] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-300 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-mono">SAFE SIMULATION MODE</h3>
              <p className="text-xs text-slate-400">
                Restricts all approved commands to the Cisco Packet Tracer dry-run queue.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 rounded-xl text-xs font-mono font-bold">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>PERMANENTLY ENFORCED</span>
          </div>
        </div>

        <div className="p-3.5 bg-cyan-950/40 border border-cyan-500/30 rounded-xl text-xs text-cyan-200 flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="text-white">Safety Invariant Enforced:</strong> Live Cisco hardware execution is strictly disabled by design. All remediation workflows are sandboxed dry-runs for Packet Tracer and lab simulations.
          </div>
        </div>
      </div>

      {/* Engine & Server Status */}
      <div className="p-6 bg-[#0B1728] rounded-2xl border border-[#162942] shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-white font-mono uppercase">
          Backend Services & AI Engine Status
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-4 bg-[#07111E] border border-[#1A3150] rounded-xl space-y-1">
            <span className="text-slate-400 block mb-1">AI DIAGNOSTIC ENGINE</span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <strong className="text-white">Google Gemini 3.7 Flash</strong>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-sans">
              Structured JSON output mode with server-side proxy security.
            </p>
          </div>

          <div className="p-4 bg-[#07111E] border border-[#1A3150] rounded-xl space-y-1">
            <span className="text-slate-400 block mb-1">IMMUTABLE AUDIT LEDGER</span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <strong className="text-white">SHA-256 Cryptographic Chain</strong>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-sans">
              Persistent log verified across active records.
            </p>
          </div>
        </div>
      </div>

      {/* Grounding Sensitivity */}
      <div className="p-6 bg-[#0B1728] rounded-2xl border border-[#162942] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white font-mono uppercase">
              AI Grounding Confidence Threshold
            </h3>
            <p className="text-xs text-slate-400">
              Minimum acceptable confidence score before triggering mandatory engineering review.
            </p>
          </div>
          <span className="text-sm font-bold text-cyan-300 font-mono bg-cyan-950/80 px-3 py-1 rounded-xl border border-cyan-500/30">
            {groundingThreshold}%
          </span>
        </div>

        <input
          type="range"
          min="70"
          max="99"
          value={groundingThreshold}
          onChange={e => setGroundingThreshold(Number(e.target.value))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
        />
      </div>
    </div>
  );
};
