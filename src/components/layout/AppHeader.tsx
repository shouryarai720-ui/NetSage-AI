import React from 'react';
import { 
  Shield, 
  Search, 
  Bell, 
  Settings, 
  CheckCircle2, 
  AlertTriangle, 
  Activity, 
  Cpu, 
  Terminal as TerminalIcon,
  HelpCircle,
  X,
  Menu,
  ChevronDown,
  Sparkles,
  Lock,
  Layers
} from 'lucide-react';

interface AppHeaderProps {
  activeCaseId: string;
  simulationMode: boolean;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  onToggleSimulationMode?: () => void;
  unreadNotificationsCount?: number;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  activeCaseId,
  simulationMode,
  onOpenSearch,
  onOpenNotifications,
  onToggleSimulationMode,
  unreadNotificationsCount = 0,
  sidebarCollapsed = false,
  onToggleSidebar
}) => {
  return (
    <header className="h-16 bg-[#070F1C]/90 backdrop-blur-md border-b border-[#162740] text-slate-100 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-40 select-none">
      {/* Brand & Left controls */}
      <div className="flex items-center gap-3 lg:gap-5">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
            title={sidebarCollapsed ? "Expand Navigation" : "Collapse Navigation"}
            aria-label="Toggle navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-3">
          {/* Logo mark */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 via-sky-600 to-blue-700 flex items-center justify-center shadow-lg shadow-cyan-950/60 border border-cyan-400/30">
            <Shield className="w-5 h-5 text-slate-950 font-bold" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wider text-base lg:text-lg text-white font-mono">
                NETSAGE<span className="text-cyan-400">.AI</span>
              </span>
              <span className="text-[10px] uppercase font-semibold bg-cyan-950/90 text-cyan-300 border border-cyan-700/50 px-2 py-0.5 rounded-full tracking-wide hidden sm:inline-block">
                Enterprise v2.6
              </span>
            </div>
            <p className="text-[11px] text-slate-400 tracking-tight hidden sm:block">
              AI Network Troubleshooting Platform
            </p>
          </div>
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="flex-1 max-w-lg mx-4 hidden md:block">
        <button
          onClick={onOpenSearch}
          className="w-full bg-[#0B1728]/80 hover:bg-[#0E1E34] text-slate-400 hover:text-slate-200 border border-[#1A3150] hover:border-cyan-500/60 rounded-xl px-4 py-2 text-xs flex items-center justify-between transition-all group shadow-inner"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
            <span className="truncate">Search incident ID, IP, VLAN, symptom, or Cisco CLI evidence...</span>
          </div>
          <kbd className="hidden lg:inline-flex items-center gap-1 bg-[#13233A] border border-[#1E375A] text-slate-300 px-2 py-0.5 rounded-md text-[10px] font-mono">
            ⌘K / Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right Controls & Status Indicators */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Search Button */}
        <button
          onClick={onOpenSearch}
          className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          aria-label="Search"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Active Case Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B1728] border border-[#1A3150] text-xs font-mono">
          <span className="text-slate-400 text-[10px] uppercase">Active:</span>
          <span className="text-cyan-400 font-bold">{activeCaseId}</span>
        </div>

        {/* Safety Mode Badge */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border bg-emerald-950/70 border-emerald-500/50 text-emerald-300 shadow-sm shadow-emerald-950/30"
          title="SIMULATION MODE — NO LIVE CISCO CONFIGURATION IS EXECUTED. All remediations run in isolated dry-run sandboxes."
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="tracking-wide text-[11px] font-mono font-bold">
            SIMULATION MODE — NO LIVE CISCO CONFIGURATION IS EXECUTED
          </span>
        </div>

        {/* Notifications */}
        <button
          onClick={onOpenNotifications}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 relative transition-colors"
          title="Notifications & Audit Feed"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          )}
        </button>
      </div>
    </header>
  );
};
