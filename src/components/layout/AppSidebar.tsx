import React from 'react';
import { 
  Activity, 
  Layers, 
  Database, 
  Share2, 
  Cpu, 
  UserCheck, 
  FileText, 
  FileCheck, 
  CheckCircle2, 
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Shield,
  HelpCircle,
  Terminal,
  Lock,
  Zap
} from 'lucide-react';

export type NavigationPage = 
  | 'overview' 
  | 'diagnostics' 
  | 'cases' 
  | 'network' 
  | 'ai-insights' 
  | 'responsible-ai' 
  | 'audit' 
  | 'reports' 
  | 'test-center' 
  | 'settings';

interface AppSidebarProps {
  currentPage: NavigationPage;
  onSelectPage: (page: NavigationPage) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  pendingReviewCount: number;
  criticalCasesCount: number;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  currentPage,
  onSelectPage,
  collapsed,
  onToggleCollapse,
  pendingReviewCount,
  criticalCasesCount
}) => {
  const navSections = [
    {
      group: 'OPERATIONS',
      items: [
        {
          id: 'overview' as NavigationPage,
          label: 'Overview',
          icon: Activity,
          badge: null
        },
        {
          id: 'diagnostics' as NavigationPage,
          label: 'Diagnostics Workspace',
          icon: Layers,
          badge: pendingReviewCount > 0 ? `${pendingReviewCount} pending` : null,
          badgeType: 'amber'
        },
        {
          id: 'cases' as NavigationPage,
          label: 'Case Catalog',
          icon: Database,
          badge: criticalCasesCount > 0 ? `${criticalCasesCount} crit` : null,
          badgeType: 'rose'
        },
        {
          id: 'network' as NavigationPage,
          label: 'Network Lab Map',
          icon: Share2,
          badge: null
        }
      ]
    },
    {
      group: 'INTELLIGENCE',
      items: [
        {
          id: 'ai-insights' as NavigationPage,
          label: 'AI Diagnostic Insights',
          icon: Cpu,
          badge: 'Gemini 3.7',
          badgeType: 'cyan'
        },
        {
          id: 'responsible-ai' as NavigationPage,
          label: 'Responsible AI & Safety',
          icon: UserCheck,
          badge: 'Grounded',
          badgeType: 'emerald'
        }
      ]
    },
    {
      group: 'GOVERNANCE',
      items: [
        {
          id: 'audit' as NavigationPage,
          label: 'Audit Trail & Chain',
          icon: FileText,
          badge: 'SHA-256',
          badgeType: 'cyan'
        },
        {
          id: 'reports' as NavigationPage,
          label: 'Incident Reports',
          icon: FileCheck,
          badge: 'PDF',
          badgeType: 'slate'
        },
        {
          id: 'test-center' as NavigationPage,
          label: 'Test & Verification',
          icon: CheckCircle2,
          badge: '35/35',
          badgeType: 'emerald'
        }
      ]
    },
    {
      group: 'SYSTEM',
      items: [
        {
          id: 'settings' as NavigationPage,
          label: 'Platform Settings',
          icon: SlidersHorizontal,
          badge: null
        }
      ]
    }
  ];

  return (
    <aside 
      className={`bg-[#070F1C] border-r border-[#162740] text-slate-300 flex flex-col transition-all duration-200 select-none z-20 ${
        collapsed ? 'w-16' : 'w-64 lg:w-72'
      }`}
    >
      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 pb-16">
        {navSections.map((section, idx) => (
          <div key={idx} className="space-y-1.5">
            {!collapsed && (
              <div className="px-3 text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400">
                {section.group}
              </div>
            )}

            <div className="space-y-1">
              {section.items.map(item => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectPage(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                      isActive 
                        ? 'bg-gradient-to-r from-cyan-500/15 via-sky-500/10 to-transparent text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-950/40' 
                        : 'text-slate-400 hover:text-slate-100 hover:bg-[#0E1A2C] border border-transparent'
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${
                        isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                      }`} />
                      
                      {!collapsed && (
                        <span className="truncate tracking-tight font-medium text-[13px]">{item.label}</span>
                      )}
                    </div>

                    {!collapsed && item.badge && (
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        item.badgeType === 'amber' ? 'bg-amber-950/80 text-amber-300 border border-amber-600/40' :
                        item.badgeType === 'rose' ? 'bg-rose-950/80 text-rose-300 border border-rose-600/40' :
                        item.badgeType === 'cyan' ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-600/40' :
                        item.badgeType === 'emerald' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/40' :
                        'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Status Card & Collapse Toggle */}
      <div className="p-3 border-t border-[#162740] bg-[#050C17]/80 space-y-2">
        {!collapsed && (
          <div className="p-3 rounded-xl bg-[#091524] border border-[#162A45] space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                <span>NOC Safety Engine</span>
              </span>
              <span className="text-emerald-400 font-bold">100% OK</span>
            </div>
            <div className="text-[10px] text-slate-400 leading-tight">
              Deterministic rule checks + Gemini 3.7 grounded model.
            </div>
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#0E1A2C] transition-colors text-xs font-mono"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse Sidebar</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};
