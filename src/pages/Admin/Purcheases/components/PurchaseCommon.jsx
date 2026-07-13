import React, { useEffect, useRef, useState } from "react";
import { FiCheck, FiChevronDown, FiX } from "react-icons/fi";
import { RETURN_STATUS_LABEL, STATUS_LABEL } from "../utils/purchaseConstants";

const isDarkTheme = (theme) => String(theme?.select || "").includes("bg-[#1b1b1f]");
const sanitizeNumber = (value, allowDecimal = true, decimalPlaces = null) => {
  let nextValue = String(value || "").replace(/-/g, "");
  if (!allowDecimal) return nextValue.replace(/[^0-9]/g, "");
  nextValue = nextValue.replace(/[^0-9.]/g, "");
  const parts = nextValue.split(".");
  const integerPart = (parts[0] || "").replace(/^0+(?=\d)/, "") || (nextValue.startsWith(".") ? "0" : parts[0]);
  const decimalPart = parts.slice(1).join("");
  if (parts.length === 1) return integerPart;
  const limitedDecimal = decimalPlaces === null ? decimalPart : decimalPart.slice(0, decimalPlaces);
  return `${integerPart || "0"}.${limitedDecimal}`;
};

export function FilterSelect({ value, setValue, theme, icon, options, searchable = false }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef(null);
  const selectedOption = options.find((option) => String(option.value) === String(value)) || options[0];
  const isDark = isDarkTheme(theme);
  const dropdownClass = isDark
    ? "border-white/10 bg-[#18181b] text-zinc-100 shadow-2xl shadow-black/30"
    : "border-zinc-200 bg-white text-zinc-800 shadow-xl shadow-zinc-200/70";
  const searchInputClass = isDark
    ? "border-white/10 bg-[#111113] text-zinc-100 placeholder:text-zinc-500"
    : "border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400";
  const visibleOptions =
    searchable && query
      ? options.filter((option) => String(option.label).toLowerCase().includes(query.toLowerCase()))
      : options;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (

    <div className="relative" ref={wrapperRef}>

      <span className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg ${theme.muted}`}>{icon}</span>

      <button type="button" onClick={() => setOpen((previous) => !previous)} className={`flex h-12 w-full items-center justify-between rounded-2xl border pl-11 pr-11 text-left text-sm outline-none transition focus:ring-4 ${theme.select}`}>

        <span className="truncate">{selectedOption?.label || "ជ្រើស"}</span>

      </button>

      <FiChevronDown className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-lg transition ${theme.muted} ${open ? "rotate-180" : ""}`} />

      {open && (
        <div className={`absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border ${dropdownClass}`}>
          {searchable && (
            <div className={`border-b p-2 ${isDark ? "border-white/10" : "border-zinc-200"}`}>
              <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ស្វែងរក..." className={`h-9 w-full rounded-xl border px-3 text-sm outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-500/20 ${searchInputClass}`} />
            </div>
          )}

          <div className="max-h-60 overflow-y-auto py-1">
            {visibleOptions.map((option) => {
              const isActive = String(option.value) === String(value);
              return (
                <button key={String(option.value)} type="button" onClick={() => { setValue(option.value); setOpen(false); setQuery(""); }} className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition ${isActive ? "bg-red-500/10 font-semibold text-red-500 dark:text-red-400" : isDark ? "text-zinc-200 hover:bg-white/[0.06] hover:text-white" : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"}`}>
                  <span className="truncate">{option.label}</span>
                  {isActive && <FiCheck className="ml-2 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

    </div>

  );

}




export function AlertMiniCard({ theme, icon, title, value, description, colorClass, onClick }) {

  return (

    <button

      type="button"

      onClick={onClick}

      className={`flex items-start gap-4 rounded-2xl border p-4 text-left transition ${theme.softCard} ${theme.softCardHover}`}

    >

      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-current/10 ${colorClass}`}>

        <span className="text-2xl">{icon}</span>

      </div>

      <div className="min-w-0">

        <p className={`text-sm font-bold ${theme.pageTitle}`}>{title}</p>

        <p className={`mt-1 text-2xl font-bold leading-none ${theme.pageTitle}`}>{value}</p>

        <p className={`mt-2 text-xs leading-5 ${theme.muted}`}>{description}</p>

      </div>

    </button>

  );

}




export function SummaryCard({ theme, title, value, icon, iconBg, subValue = null, subValueColor = null }) {

  return (

    <div className={`rounded-2xl border px-5 py-5 shadow-sm ${theme.card}`}>

      <div className="flex items-center gap-4">

        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${iconBg}`}>{icon}</div>

        <div className="min-w-0 flex-1">

          <p className={`text-sm font-medium ${theme.muted}`}>{title}</p>

          <h3 className={`mt-1 font-bold leading-none ${subValue ? "text-2xl" : "text-3xl"}`}>{value}</h3>

          {subValue && (
            <p className={`mt-1 truncate text-xs font-semibold ${subValueColor ?? theme.muted}`}>{subValue}</p>
          )}

        </div>

      </div>

    </div>

  );

}




export function ModalShell({ title, subtitle, theme, onClose, children, footer, width = "max-w-6xl" }) {

  return (

    <div onMouseDown={onClose} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">

      <div onMouseDown={(event) => event.stopPropagation()} className={`flex h-auto max-h-[90dvh] w-full ${width} flex-col overflow-hidden rounded-3xl border shadow-2xl ${theme.modal}`}>

        <div className={`shrink-0 border-b px-6 py-5 ${theme.modalHeader}`}>

          <div className="flex items-start justify-between gap-4">

            <div className="min-w-0">

              <h2 className="text-xl font-bold tracking-tight">{title}</h2>

              {subtitle && <p className={`mt-1.5 text-sm leading-6 ${theme.muted}`}>{subtitle}</p>}

            </div>

            <button type="button" onClick={onClose} aria-label="Close modal" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-zinc-300 bg-zinc-100 text-zinc-700 shadow-sm transition hover:bg-zinc-200 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white">

              <FiX className="text-lg" />

            </button>

          </div>

        </div>

        <div className={`custom-modal-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5 ${theme.modalBody}`}>{children}</div>

        {footer && <div className={`shrink-0 border-t px-6 py-4 ${theme.modalHeader}`}><div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">{footer}</div></div>}

      </div>

    </div>

  );

}




export function FormSection({ title, subtitle, icon, theme, children }) {

  return (

    <div className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>

      <div className="mb-4 flex items-start gap-3">

        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500">{icon}</div>

        <div>

          <h3 className="text-sm font-bold">{title}</h3>

          {subtitle && <p className={`mt-0.5 text-xs leading-5 ${theme.muted}`}>{subtitle}</p>}

        </div>

      </div>

      {children}

    </div>

  );

}




export function StatusBadge({ status, getStatusClass, getStatusIcon }) {
  const label = STATUS_LABEL[status] ?? RETURN_STATUS_LABEL[status] ?? status;
  return <span className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(status)}`}>{getStatusIcon(status)}{label}</span>;

}




export function FormInput({ label, required = false, value, onChange, theme, error = "", type = "text", placeholder = "", icon, disabled = false, helper = "", allowDecimal = true, decimalPlaces = null }) {

  return (

    <label className="block">

      <span className={`mb-2 block text-xs font-semibold ${theme.muted}`}>{label}{required && <span className="ml-1 text-red-400">*</span>}</span>

      <div className="relative">

        {icon && <span className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base ${theme.muted}`}>{icon}</span>}

        <input type={type === "number" ? "text" : type} value={value} disabled={disabled} placeholder={placeholder} inputMode={type === "number" ? "decimal" : undefined} onChange={(event) => onChange(type === "number" ? sanitizeNumber(event.target.value, allowDecimal, decimalPlaces) : event.target.value)} onBlur={(event) => type === "number" && onChange(sanitizeNumber(event.target.value, allowDecimal, decimalPlaces))} className={`h-11 w-full rounded-xl border ${icon ? "pl-10" : "px-3"} pr-3 text-sm outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:opacity-70 ${theme.input} ${error ? "border-red-500 focus:border-red-500" : ""}`} />

      </div>

      {helper && !error && <p className={`mt-1.5 text-xs ${theme.muted}`}>{helper}</p>}

      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}

    </label>

  );

}




export function FormTextarea({ label, value, onChange, theme, placeholder = "", icon }) {

  return (

    <label className="block">

      <span className={`mb-2 block text-xs font-semibold ${theme.muted}`}>{label}</span>

      <div className="relative">

        {icon && <span className={`pointer-events-none absolute left-3.5 top-3.5 text-base ${theme.muted}`}>{icon}</span>}

        <textarea value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} rows={3} className={`w-full resize-none rounded-xl border ${icon ? "pl-10" : "px-3"} pr-3 py-3 text-sm outline-none transition focus:ring-4 ${theme.input}`} />

      </div>

    </label>

  );

}




export function FormSelect({ label, required = false, value, onChange, options, theme, error = "", icon, disabled = false, searchable }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef(null);
  const isDark = isDarkTheme(theme);
  const shouldSearch = searchable ?? options.length > 6;
  const selectedOption = options.find((option) => String(option.value) === String(value)) || options[0];
  const dropdownClass = isDark
    ? "border-white/10 bg-[#18181b] text-zinc-100 shadow-2xl shadow-black/30"
    : "border-zinc-200 bg-white text-zinc-800 shadow-xl shadow-zinc-200/70";
  const searchInputClass = isDark
    ? "border-white/10 bg-[#111113] text-zinc-100 placeholder:text-zinc-500"
    : "border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400";
  const visibleOptions =
    shouldSearch && query
      ? options.filter((option) => String(option.label).toLowerCase().includes(query.toLowerCase()))
      : options;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (

    <div className="block" ref={wrapperRef}>

      <span className={`mb-2 block text-xs font-semibold ${theme.muted}`}>{label}{required && <span className="ml-1 text-red-400">*</span>}</span>

      <div className="relative">

        {icon && <span className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base ${theme.muted}`}>{icon}</span>}

        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (!disabled) setOpen((previous) => !previous);
          }}
          className={`flex h-11 w-full items-center justify-between rounded-xl border ${icon ? "pl-10" : "pl-3"} pr-10 text-left text-sm outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:opacity-70 ${theme.select} ${error ? "border-red-500 focus:border-red-500" : ""}`}
        >
          <span className="truncate">{selectedOption?.label || "ជ្រើស"}</span>
        </button>

        <FiChevronDown className={`pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-base transition ${theme.muted} ${open ? "rotate-180" : ""}`} />

        {open && (
          <div className={`absolute z-[70] mt-2 w-full overflow-hidden rounded-2xl border ${dropdownClass}`}>
            {shouldSearch && (
              <div className={`border-b p-2 ${isDark ? "border-white/10" : "border-zinc-200"}`}>
                <input
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="ស្វែងរក..."
                  className={`h-10 w-full rounded-xl border px-3 text-sm outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-500/20 ${searchInputClass}`}
                />
              </div>
            )}

            <div className="max-h-60 overflow-y-auto py-1">
              {visibleOptions.length === 0 ? (
                <div className={`px-4 py-3 text-sm ${theme.muted}`}>រកមិនឃើញ</div>
              ) : (
                visibleOptions.map((option) => {
                  const isActive = String(option.value) === String(value);
                  return (
                    <button
                      key={String(option.value)}
                      type="button"
                      onClick={() => {
                        onChange(option.value);
                        setOpen(false);
                        setQuery("");
                      }}
                      className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition ${isActive ? "bg-red-500/10 font-semibold text-red-500 dark:text-red-400" : isDark ? "text-zinc-200 hover:bg-white/[0.06] hover:text-white" : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"}`}
                    >
                      <span className="truncate">{option.label}</span>
                      {isActive && <FiCheck className="ml-2 shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

      </div>

      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}

    </div>

  );

}




export function SummaryMiniBox({ theme, label, value, strong = false, colorClass = "" }) {

  return (

    <div className={`rounded-xl border p-4 ${theme.softCard}`}>

      <p className={`text-xs font-semibold ${theme.muted}`}>{label}</p>

      <p className={`mt-2 ${strong ? "text-xl font-bold" : "text-sm font-semibold"} ${colorClass}`}>{value}</p>

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




export function EmptyState({ theme, icon, title, description }) {

  return (

    <div className={`flex flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center ${theme.softCard}`}>

      <div className="text-4xl text-red-500">{icon}</div>

      <p className="mt-3 text-sm font-semibold">{title}</p>

      <p className={`mt-1 text-xs leading-5 ${theme.muted}`}>{description}</p>

    </div>

  );

}
