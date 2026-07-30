import { useEffect, useRef, useState } from "react";
import {
  FiCheck,
  FiChevronDown,
  FiX,
} from "react-icons/fi";

export function ModalShell({ title, subtitle, theme, onClose, children, footer, width = "max-w-6xl", mobileFullScreen = false }) {
  return (
    <div
      onMouseDown={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:px-4 sm:py-6"
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className={`flex w-full ${width} flex-col overflow-hidden shadow-2xl sm:h-auto sm:max-h-[90dvh] sm:rounded-3xl sm:border ${mobileFullScreen ? "h-dvh max-h-dvh border-0" : "h-auto max-h-[88dvh] rounded-t-3xl border"} ${theme.modal}`}
      >
        <div className={`shrink-0 border-b px-4 py-4 sm:px-6 sm:py-5 ${theme.modalHeader}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-xl font-bold tracking-tight">{title}</h2>
              {subtitle && <p className={`mt-1.5 text-sm leading-6 ${theme.muted}`}>{subtitle}</p>}
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

        <div className={`custom-modal-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5 ${theme.modalBody}`}>
          {children}
        </div>

        {footer && (
          <div className={`shrink-0 border-t px-4 py-3 sm:px-6 sm:py-4 ${theme.modalHeader}`}>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">{footer}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export function FormSection({ title, subtitle, icon, theme, children }) {
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>
      <div className="mb-4 flex items-start gap-3">
        <div className="summary-icon-3d mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-bold">{title}</h3>
          {subtitle && <p className={`mt-0.5 text-xs leading-5 ${theme.muted}`}>{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

const sanitizeNumber = (value, decimalPlaces = null) => {
  let nextValue = String(value || "").replace(/-/g, "").replace(/[^0-9.]/g, "");
  const parts = nextValue.split(".");
  const integerPart = (parts[0] || "").replace(/^0+(?=\d)/, "") || (nextValue.startsWith(".") ? "0" : parts[0]);
  if (decimalPlaces === 0) return integerPart || "";
  if (parts.length === 1) return integerPart || "";
  const decimalPart = parts.slice(1).join("");
  const limitedDecimal = decimalPlaces === null ? decimalPart : decimalPart.slice(0, decimalPlaces);
  return `${integerPart || "0"}.${limitedDecimal}`;
};

export function FormInput({ label, required = false, value, onChange, theme, error = "", type = "text", placeholder = "", icon, decimalPlaces = null }) {
  return (
    <label className="block">
      <span className={`mb-2 block text-xs font-semibold ${theme.muted}`}>
        {label}
        {required && <span className="ml-1 text-red-400">*</span>}
      </span>
      <div className="relative">
        {icon && (
          <span className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base ${theme.muted}`}>
            {icon}
          </span>
        )}
        <input
          type={type === "number" ? "text" : type}
          value={value}
          placeholder={placeholder}
          inputMode={type === "number" ? "decimal" : undefined}
          onChange={(e) => onChange(type === "number" ? sanitizeNumber(e.target.value, decimalPlaces) : e.target.value)}
          onBlur={(e) => type === "number" && onChange(sanitizeNumber(e.target.value, decimalPlaces))}
          className={`h-11 w-full rounded-xl border ${icon ? "pl-10" : "px-3"} pr-3 text-sm outline-none transition focus:ring-4 ${theme.input} ${error ? "border-red-500 focus:border-red-500" : ""}`}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </label>
  );
}

export function FormTextarea({ label, value, onChange, theme, error = "", placeholder = "", icon }) {
  return (
    <label className="block">
      <span className={`mb-2 block text-xs font-semibold ${theme.muted}`}>{label}</span>
      <div className="relative">
        {icon && (
          <span className={`pointer-events-none absolute left-3.5 top-3.5 text-base ${theme.muted}`}>{icon}</span>
        )}
        <textarea
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className={`w-full resize-none rounded-xl border ${icon ? "pl-10" : "px-3"} pr-3 py-3 text-sm outline-none transition focus:ring-4 ${theme.input} ${error ? "border-red-500 focus:border-red-500" : ""}`}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </label>
  );
}

export function FormSelect({ label, required = false, value, onChange, options, theme, error = "", icon, compact = false }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const selectedOption =
    options.find((option) => String(option.value) === String(value)) || options[0];
  const isDark = String(theme?.select || "").includes("bg-[#1b1b1f]");

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  return (
    <div className="block" ref={wrapperRef}>
      {label && (
        <span className={`mb-2 block text-xs font-semibold ${theme.muted}`}>
          {label}
          {required && <span className="ml-1 text-red-400">*</span>}
        </span>
      )}
      <div className="relative">
        {icon && (
          <span className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base ${theme.muted}`}>
            {icon}
          </span>
        )}
        <button
          type="button"
          onClick={() => setOpen((previous) => !previous)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={`flex ${compact ? "h-10" : "h-11"} w-full items-center rounded-xl border ${icon ? "pl-10" : "pl-3"} pr-10 text-left text-sm outline-none transition focus:ring-4 ${theme.select} ${error ? "border-red-500 focus:border-red-500" : ""}`}
        >
          <span className="truncate">{selectedOption?.label || "ជ្រើសរើស"}</span>
        </button>
        <FiChevronDown
          className={`pointer-events-none absolute right-3.5 ${compact ? "top-5" : "top-[22px]"} -translate-y-1/2 text-base transition-transform ${theme.muted} ${open ? "rotate-180" : ""}`}
        />

        {open && (
          <div
            role="listbox"
            className={`absolute z-[80] mt-2 w-full overflow-hidden rounded-xl border py-1 shadow-2xl ${
              isDark
                ? "border-white/10 bg-[#202024] text-zinc-100 shadow-black/40"
                : "border-zinc-200 bg-white text-zinc-800 shadow-zinc-300/60"
            }`}
          >
            {options.map((option) => {
              const selected = String(option.value) === String(value);

              return (
                <button
                  key={String(option.value)}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition ${
                    selected
                      ? "bg-red-500/10 font-semibold text-red-500"
                      : isDark
                        ? "text-zinc-200 hover:bg-white/[0.06] hover:text-white"
                        : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
                  }`}
                >
                  <span>{option.label}</span>
                  {selected && <FiCheck className="shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  );
}

export function SummaryMiniBox({ theme, label, value, subValue, strong = false }) {
  return (
    <div className={`rounded-xl border p-4 ${theme.softCard}`}>
      <p className={`text-xs font-semibold ${theme.muted}`}>{label}</p>
      <p className={`mt-2 ${strong ? "text-xl font-bold" : "text-sm font-semibold"}`}>{value}</p>
      {subValue && <p className={`mt-0.5 text-xs ${theme.muted}`}>{subValue}</p>}
    </div>
  );
}

export function InfoLine({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold text-zinc-500">{label}</p>
      <p className="mt-1 capitalize">{value || "-"}</p>
    </div>
  );
}
