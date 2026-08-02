"use client";

// Dependency-free toast system. Mount <ToastProvider> once (app/layout.tsx),
// call toast("...") anywhere below it. Auto-dismisses after 5s; announced to
// screen readers via the aria-live region.
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

type Variant = "info" | "error";
type Toast = { id: number; message: string; variant: Variant };
type ToastFn = (message: string, opts?: { variant?: Variant }) => void;

const ToastContext = createContext<ToastFn | null>(null);

export function useToast(): ToastFn {
  const toast = useContext(ToastContext);
  if (!toast) throw new Error("useToast must be used inside <ToastProvider>");
  return toast;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const toast = useCallback<ToastFn>((message, { variant = "info" } = {}) => {
    const id = nextId.current++;
    setToasts((all) => [...all, { id, message, variant }]);
    setTimeout(() => setToasts((all) => all.filter((t) => t.id !== id)), 5000);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex flex-col items-center gap-2 px-6"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`card pointer-events-auto px-4 py-2.5 text-sm ${
              t.variant === "error" ? "border-destructive/40 text-destructive" : "text-foreground"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
