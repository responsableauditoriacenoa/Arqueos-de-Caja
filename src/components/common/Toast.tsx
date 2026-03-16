import React from 'react';
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { clsx } from '../../utils/formatters';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  variant?: ToastVariant;
  onClose: () => void;
}

const ICONS = {
  success: <CheckCircle size={18} className="text-emerald-500" />,
  error:   <AlertTriangle size={18} className="text-red-500" />,
  warning: <AlertTriangle size={18} className="text-amber-500" />,
  info:    <Info size={18} className="text-brand-500" />,
};

const CLASSES: Record<ToastVariant, string> = {
  success: 'border-emerald-200 bg-emerald-50',
  error:   'border-red-200 bg-red-50',
  warning: 'border-amber-200 bg-amber-50',
  info:    'border-brand-200 bg-brand-50',
};

export function Toast({ message, variant = 'info', onClose }: ToastProps) {
  React.useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={clsx(
      'flex items-center gap-3 px-4 py-3 rounded-xl border shadow-card-md text-sm font-medium text-surface-800 min-w-[280px] max-w-sm',
      CLASSES[variant]
    )}>
      {ICONS[variant]}
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="text-surface-400 hover:text-surface-600 ml-1">
        <X size={14} />
      </button>
    </div>
  );
}

// ─── Toast container ──────────────────────────────────────────────────────────

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  addToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = React.createContext<ToastContextValue>({ addToast: () => {} });

export function useToast() {
  return React.useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const addToast = React.useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = `${Date.now()}`;
    setToasts(prev => [...prev, { id, message, variant }]);
  }, []);

  const remove = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-5 right-5 flex flex-col gap-2 z-50">
        {toasts.map(t => (
          <Toast key={t.id} message={t.message} variant={t.variant} onClose={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
