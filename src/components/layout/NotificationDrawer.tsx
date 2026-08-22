import React from 'react';
import { X, Bell, Shield, AlertTriangle, CheckCircle2, FileText, ArrowRight, Trash2 } from 'lucide-react';
import { AuditLogEntry } from '../../types';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'info' | 'warning' | 'critical' | 'success';
  caseId?: string;
  read: boolean;
}

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  onClearAll: () => void;
  onSelectCase?: (caseId: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onClearAll,
  onSelectCase
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-sm flex justify-end animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-[#0B1728] border-l border-[#1E3A5F] shadow-2xl h-full flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#162942] bg-[#07111E] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-mono text-white">OPERATIONS NOTIFICATIONS</h3>
              <p className="text-[11px] text-slate-400">Real-time incident & audit telemetry</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Actions bar */}
        <div className="px-4 py-2.5 bg-[#07111E]/60 border-b border-[#162942] flex items-center justify-between text-xs font-mono">
          <span className="font-semibold text-[11px] text-slate-400">
            {notifications.filter(n => !n.read).length} UNREAD NOTIFICATIONS
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onMarkAllRead}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium"
            >
              Mark all read
            </button>
            <span className="text-slate-700">|</span>
            <button
              onClick={onClearAll}
              className="text-[11px] text-slate-400 hover:text-rose-400 font-medium"
            >
              Clear all
            </button>
          </div>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 divide-y divide-[#162942]/40">
          {notifications.length === 0 ? (
            <div className="py-16 text-center text-slate-400 font-mono">
              <Bell className="w-8 h-8 mx-auto mb-2 text-slate-600 stroke-1" />
              <p className="text-sm font-medium text-white font-sans">All caught up</p>
              <p className="text-xs text-slate-400 mt-1">No active incident or safety warnings at this time.</p>
            </div>
          ) : (
            notifications.map(n => {
              const borderCol = 
                n.type === 'critical' ? 'border-rose-500/40 bg-rose-950/40 text-rose-300' :
                n.type === 'warning' ? 'border-amber-500/40 bg-amber-950/40 text-amber-300' :
                n.type === 'success' ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300' :
                'border-cyan-500/40 bg-cyan-950/40 text-cyan-300';

              const icon = 
                n.type === 'critical' ? <AlertTriangle className="w-4 h-4 text-rose-400" /> :
                n.type === 'warning' ? <AlertTriangle className="w-4 h-4 text-amber-400" /> :
                n.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> :
                <Shield className="w-4 h-4 text-cyan-400" />;

              return (
                <div 
                  key={n.id}
                  className={`p-3 rounded-xl border-l-4 border ${borderCol} transition-colors ${
                    !n.read ? 'ring-1 ring-cyan-500/30' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {icon}
                      <span className="text-xs font-bold text-white">{n.title}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">{n.timestamp}</span>
                  </div>

                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed font-sans">
                    {n.message}
                  </p>

                  {n.caseId && onSelectCase && (
                    <div className="mt-2 pt-1.5 border-t border-[#162942] flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/40">
                        {n.caseId}
                      </span>
                      <button
                        onClick={() => {
                          onSelectCase(n.caseId!);
                          onClose();
                        }}
                        className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono"
                      >
                        Inspect Case <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#162942] bg-[#07111E] text-[11px] text-slate-400 flex items-center justify-between font-mono">
          <span className="text-[10px]">Cisco IOS Event Stream</span>
          <span className="text-[10px] text-emerald-400 font-semibold">● Telemetry Live</span>
        </div>
      </div>
    </div>
  );
};
