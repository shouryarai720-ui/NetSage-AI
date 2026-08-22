import React from 'react';
import { 
  Shield, 
  ArrowRight, 
  Layers, 
  Cpu, 
  UserCheck, 
  CheckCircle2, 
  Terminal, 
  Share2, 
  Activity, 
  Sparkles, 
  Lock,
  ChevronRight,
  Database,
  Search
} from 'lucide-react';

interface HeroExperienceProps {
  onStartDiagnosis: () => void;
  onExplorePlatform: () => void;
  totalCasesCount: number;
  pendingReviewCount: number;
}

export const HeroExperience: React.FC<HeroExperienceProps> = ({
  onStartDiagnosis,
  onExplorePlatform,
  totalCasesCount,
  pendingReviewCount
}) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#0B1728] via-[#081220] to-[#050B14] border border-[#1A3356]/70 shadow-2xl p-6 sm:p-8 lg:p-10 mb-8">
      {/* Background Decorative Grid & Glows */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />
      
      {/* Subtle Cyan/Blue Light Cones */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Brand & Value Proposition */}
        <div className="lg:col-span-7 space-y-5">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-mono tracking-wide shadow-sm">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-semibold">NETSAGE AI</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300 font-sans">Evidence-Grounded Cisco Diagnostics</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15] font-display">
            Turn Network Evidence Into <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400">Clear Diagnoses</span>.
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl font-light">
            Analyze Cisco CLI and syslog evidence, pinpoint multi-layer network faults across OSI Layers 1–7, 
            and generate deterministic, grounded remediation plans with a strict human approval gate.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onStartDiagnosis}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 shadow-lg shadow-cyan-950/50 hover:shadow-cyan-500/20 transition-all transform hover:-translate-y-0.5"
            >
              <span>Start Diagnosis</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onExplorePlatform}
              className="px-5 py-3 bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all"
            >
              <Database className="w-4 h-4 text-cyan-400" />
              <span>Explore Case Catalog ({totalCasesCount})</span>
            </button>
          </div>

          {/* Trust & Safety Highlights */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-800/80 max-w-xl text-xs">
            <div className="space-y-1">
              <div className="text-slate-400 font-mono text-[11px] flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Simulation Safe</span>
              </div>
              <p className="text-slate-200 font-medium">Zero blind hardware writes</p>
            </div>

            <div className="space-y-1">
              <div className="text-slate-400 font-mono text-[11px] flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>HITL Gate</span>
              </div>
              <p className="text-slate-200 font-medium">Accept • Edit • Reject</p>
            </div>

            <div className="space-y-1">
              <div className="text-slate-400 font-mono text-[11px] flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                <span>Audit Trail</span>
              </div>
              <p className="text-slate-200 font-medium">SHA-256 Hash Chain</p>
            </div>
          </div>
        </div>

        {/* Right Column: Abstract Interactive Diagnostic Pipeline Visual */}
        <div className="lg:col-span-5 relative">
          <div className="bg-[#07111E]/90 border border-cyan-500/20 rounded-2xl p-5 shadow-2xl backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
                <Activity className="w-4 h-4 animate-pulse" />
                <span>DIAGNOSTIC PIPELINE FLOW</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                Live Simulation
              </span>
            </div>

            {/* Step Pipeline */}
            <div className="space-y-2.5 font-mono text-xs">
              {/* Step 1 */}
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/40 transition-colors">
                <div className="w-6 h-6 rounded bg-cyan-950 text-cyan-400 flex items-center justify-center text-[10px] font-bold border border-cyan-500/30">
                  1
                </div>
                <div className="flex-1">
                  <div className="text-slate-200 font-semibold text-[11px]">Cisco Topology & Telemetry</div>
                  <div className="text-slate-400 text-[10px]">show ip interface brief, show vlan, syslog</div>
                </div>
                <Terminal className="w-4 h-4 text-cyan-400" />
              </div>

              {/* Step 2 */}
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/40 transition-colors">
                <div className="w-6 h-6 rounded bg-blue-950 text-blue-400 flex items-center justify-center text-[10px] font-bold border border-blue-500/30">
                  2
                </div>
                <div className="flex-1">
                  <div className="text-slate-200 font-semibold text-[11px]">Deterministic Rule Checks</div>
                  <div className="text-slate-400 text-[10px]">15 Authoritative Matrix Rules (RC-01 to RC-15)</div>
                </div>
                <Layers className="w-4 h-4 text-blue-400" />
              </div>

              {/* Step 3 */}
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/40 transition-colors">
                <div className="w-6 h-6 rounded bg-indigo-950 text-indigo-400 flex items-center justify-center text-[10px] font-bold border border-indigo-500/30">
                  3
                </div>
                <div className="flex-1">
                  <div className="text-slate-200 font-semibold text-[11px]">Gemini 3.7 AI Diagnostic Engine</div>
                  <div className="text-slate-400 text-[10px]">Root cause inference with evidence grounding</div>
                </div>
                <Cpu className="w-4 h-4 text-indigo-400" />
              </div>

              {/* Step 4 */}
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30">
                <div className="w-6 h-6 rounded bg-emerald-900 text-emerald-300 flex items-center justify-center text-[10px] font-bold border border-emerald-400/40">
                  4
                </div>
                <div className="flex-1">
                  <div className="text-emerald-300 font-semibold text-[11px]">Human-in-the-Loop Gate</div>
                  <div className="text-emerald-400/80 text-[10px]">Operator verification before dry-run commit</div>
                </div>
                <UserCheck className="w-4 h-4 text-emerald-400" />
              </div>

              {/* Step 5 */}
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <div className="w-6 h-6 rounded bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-bold border border-slate-700">
                  5
                </div>
                <div className="flex-1">
                  <div className="text-slate-200 font-semibold text-[11px]">Cryptographic SHA-256 Ledger</div>
                  <div className="text-slate-400 text-[10px]">Immutable record & post-mortem PDF generation</div>
                </div>
                <Lock className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
