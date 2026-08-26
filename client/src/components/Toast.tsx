import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error';
  title: string;
  message?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full px-4 pointer-events-none"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const isSuccess = toast.type === 'success';

  return (
    <div
      role="alert"
      className={`pointer-events-auto p-4 rounded-xl border flex items-start gap-3 shadow-xl backdrop-blur-md transition-all animate-in slide-in-from-bottom-3 duration-200 ${
        isSuccess
          ? 'bg-slate-900/95 border-emerald-500/40 text-slate-100 shadow-emerald-950/40'
          : 'bg-slate-900/95 border-rose-500/40 text-slate-100 shadow-rose-950/40'
      }`}
    >
      {isSuccess ? (
        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
      ) : (
        <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
      )}
      <div className="flex-1 text-sm">
        <div className="font-semibold text-white">{toast.title}</div>
        {toast.message && <div className="text-slate-300 text-xs mt-0.5">{toast.message}</div>}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition cursor-pointer"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
