import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error' | 'warning';
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(t => {
        const bg = 
          t.type === 'success' ? 'bg-slate-900 border-emerald-500 text-white' :
          t.type === 'warning' ? 'bg-slate-900 border-amber-500 text-white' :
          t.type === 'error' ? 'bg-slate-900 border-rose-500 text-white' :
          'bg-slate-900 border-sky-500 text-white';

        const icon = 
          t.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" /> :
          t.type === 'warning' ? <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" /> :
          t.type === 'error' ? <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" /> :
          <Info className="w-4 h-4 text-sky-400 flex-shrink-0" />;

        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-2.5 p-3 rounded-md border shadow-xl text-xs font-medium animate-in slide-in-from-bottom-2 duration-200 ${bg}`}
          >
            <div className="mt-0.5">{icon}</div>
            <p className="flex-1 leading-relaxed text-slate-200">{t.message}</p>
            <button
              onClick={() => onDismiss(t.id)}
              className="text-slate-400 hover:text-white p-0.5 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
