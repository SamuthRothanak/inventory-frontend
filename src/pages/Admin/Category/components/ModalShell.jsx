import { FiX } from "react-icons/fi";

export default function ModalShell({
  title,
  subtitle,
  theme,
  onClose,
  children,
  footer,
  mobileFullScreen = false,
}) {
  return (
    <div
      onMouseDown={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:px-4 sm:py-6"
    >
      <div
        onMouseDown={(event) => event.stopPropagation()}
        className={`flex w-full max-w-[760px] flex-col overflow-hidden shadow-2xl sm:h-auto sm:max-h-[90dvh] sm:rounded-3xl sm:border ${
          mobileFullScreen
            ? "h-dvh max-h-dvh border-0"
            : "h-auto max-h-[88dvh] rounded-t-3xl border"
        } ${theme.modal}`}
      >
        <div className={`shrink-0 border-b px-4 py-4 sm:px-6 sm:py-5 ${theme.modalHeader}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-lg font-bold tracking-tight sm:text-xl">{title}</h2>

              {subtitle && (
                <p className={`mt-1.5 text-sm leading-6 ${theme.muted}`}>
                  {subtitle}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="table-icon-3d flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-zinc-300 bg-zinc-100 text-zinc-700 transition hover:-translate-y-0.5 hover:bg-zinc-200 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <FiX className="text-lg" />
            </button>
          </div>
        </div>

        <div
          className={`custom-modal-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5 ${theme.modalBody}`}
        >
          {children}
        </div>

        {footer && (
          <div className={`shrink-0 border-t px-4 py-3 sm:px-6 sm:py-4 ${theme.modalHeader}`}>
            <div className="flex flex-col-reverse gap-2 [&>button]:w-full sm:flex-row sm:justify-end sm:gap-3 sm:[&>button]:w-auto">
              {footer}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
