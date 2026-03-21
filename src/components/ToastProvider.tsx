import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

type ToastItem = {
  id: number;
  message: string;
  title?: string;
  variant: ToastVariant;
  duration: number;
};

type ToastInput = {
  message: string;
  title?: string;
  duration?: number;
};

type ToastContextValue = {
  showToast: (input: ToastInput & { variant: ToastVariant }) => void;
  success: (message: string, options?: Omit<ToastInput, 'message'>) => void;
  error: (message: string, options?: Omit<ToastInput, 'message'>) => void;
  warning: (message: string, options?: Omit<ToastInput, 'message'>) => void;
  info: (message: string, options?: Omit<ToastInput, 'message'>) => void;
  dismissToast: (id: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const variantStyles: Record<
  ToastVariant,
  {
    icon: typeof CheckCircle2;
    iconClass: string;
    chipClass: string;
    glowClass: string;
    label: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    iconClass: 'text-emerald-300',
    chipClass: 'border-emerald-400/20 bg-emerald-400/15 text-emerald-200',
    glowClass: 'bg-emerald-400/20',
    label: 'Success',
  },
  error: {
    icon: AlertCircle,
    iconClass: 'text-rose-300',
    chipClass: 'border-rose-400/20 bg-rose-400/15 text-rose-200',
    glowClass: 'bg-rose-400/20',
    label: 'Error',
  },
  warning: {
    icon: TriangleAlert,
    iconClass: 'text-amber-200',
    chipClass: 'border-amber-300/20 bg-amber-300/15 text-amber-100',
    glowClass: 'bg-amber-300/20',
    label: 'Warning',
  },
  info: {
    icon: Info,
    iconClass: 'text-brand-primary',
    chipClass: 'border-brand-primary/20 bg-brand-primary/15 text-zinc-100',
    glowClass: 'bg-brand-primary/20',
    label: 'Info',
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ variant, message, title, duration = 4200 }: ToastInput & { variant: ToastVariant }) => {
      const id = ++idRef.current;
      setToasts((current) => [...current, { id, variant, message, title, duration }]);
      window.setTimeout(() => dismissToast(id), duration);
    },
    [dismissToast],
  );

  const value = useMemo<ToastContextValue>(() => {
    const makeVariant =
      (variant: ToastVariant) =>
      (message: string, options?: Omit<ToastInput, 'message'>) =>
        showToast({ variant, message, ...options });

    return {
      showToast,
      success: makeVariant('success'),
      error: makeVariant('error'),
      warning: makeVariant('warning'),
      info: makeVariant('info'),
      dismissToast,
    };
  }, [dismissToast, showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[200] flex w-[min(92vw,24rem)] flex-col gap-3 md:right-6 md:top-6">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const style = variantStyles[toast.variant];
            const Icon = style.icon;

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className="pointer-events-auto relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#1b1737]/95 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl"
              >
                <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full blur-3xl ${style.glowClass}`} />
                <div className="relative flex items-start gap-4">
                  <div className={`mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 ${style.iconClass}`}>
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.24em] ${style.chipClass}`}>
                        {toast.title ?? style.label}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-zinc-100">{toast.message}</p>
                  </div>
                  <button
                    onClick={() => dismissToast(toast.id)}
                    className="rounded-xl p-2 text-zinc-500 transition-colors hover:bg-white/5 hover:text-white"
                    aria-label="Dismiss notification"
                  >
                    <X size={16} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }

  return context;
}
