import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border backdrop-blur-md shadow-2xl transition-all duration-300 font-mono text-xs animate-slideUp ${
              isSuccess
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
                : isError
                ? 'bg-red-950/90 border-red-500/50 text-red-200 shadow-[0_0_20px_rgba(239,68,68,0.25)]'
                : isWarning
                ? 'bg-amber-950/90 border-amber-500/50 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                : 'bg-slate-900/95 border-cyan-500/50 text-cyan-200 shadow-[0_0_20px_rgba(0,240,255,0.25)]'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {isError && <AlertCircle className="w-4 h-4 text-red-400" />}
              {isWarning && <AlertTriangle className="w-4 h-4 text-amber-400" />}
              {!isSuccess && !isError && !isWarning && <Info className="w-4 h-4 text-cyan-400" />}
            </div>

            <div className="flex-1">
              <div className="font-bold text-[12px] tracking-wide uppercase">
                {toast.title}
              </div>
              {toast.message && (
                <div className="text-[11px] opacity-85 mt-0.5 leading-snug">
                  {toast.message}
                </div>
              )}
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              className="shrink-0 opacity-60 hover:opacity-100 p-0.5 rounded transition text-slate-300 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
