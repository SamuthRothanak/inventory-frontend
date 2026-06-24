import { createContext, useCallback, useContext, useRef, useState } from "react";
import { FiAlertTriangle, FiX } from "react-icons/fi";

const ConfirmContext = createContext(null);

export function ConfirmDialogProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const resolveRef = useRef(null);

  const confirm = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setDialog({ message, ...options });
    });
  }, []);

  const handleConfirm = () => {
    resolveRef.current?.(true);
    setDialog(null);
  };

  const handleCancel = () => {
    resolveRef.current?.(false);
    setDialog(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {dialog && (
        <div
          onMouseDown={handleCancel}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4"
        >
          <div
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full max-w-sm overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-white/10 dark:bg-zinc-900"
          >
            <div className="flex items-start justify-between border-b border-zinc-100 px-5 py-4 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                  <FiAlertTriangle className="text-base" />
                </div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {dialog.title || "បញ្ជាក់ការលុប"}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCancel}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 text-zinc-500 transition hover:bg-zinc-200 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400 dark:hover:bg-white/10"
              >
                <FiX className="text-sm" />
              </button>
            </div>

            <div className="px-5 py-4">
              <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {dialog.message}
              </p>
            </div>

            <div className="flex justify-end gap-2 border-t border-zinc-100 px-5 py-4 dark:border-white/10">
              <button
                type="button"
                onClick={handleCancel}
                className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
              >
                {dialog.cancelLabel || "បោះបង់"}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="h-10 rounded-xl bg-red-500 px-4 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                {dialog.confirmLabel || "លុប"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used inside ConfirmDialogProvider");
  return ctx;
}
