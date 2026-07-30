import { useEffect, useRef, useState } from "react";
import {
  FiAlertTriangle,
  FiCheck,
  FiCheckCircle,
  FiChevronDown,
  FiClock,
  FiPackage,
  FiPlusCircle,
  FiX,
  FiXCircle,
} from "react-icons/fi";

const isDarkTheme = (theme) => {
  const themeText = [
    theme?.isDark ? "dark" : "",
    theme?.select,
    theme?.input,
    theme?.modal,
    theme?.section,
  ].join(" ");

  return (
    Boolean(theme?.isDark) ||
    themeText.includes("bg-[#") ||
    themeText.includes("bg-zinc-900") ||
    themeText.includes("text-white")
  );
};
const formatStockValue = (raw) => {
  const n = Number(raw) || 0;
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatUsdTwoDigits = (value) =>
  `$${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export function ExpiryBadge({ info, showAll = false }) {
  if (!info || (!showAll && !info.shouldWarn)) return null;

  return (
    <span className={`inline-flex w-fit items-center justify-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${info.className}`}>
      <FiClock className="shrink-0" />
      {info.label}
    </span>
  );
}

const sanitizeNumber = (value, allowDecimal = true) => {
  let nextValue = String(value || "").replace(/-/g, "");
  if (!allowDecimal) return nextValue.replace(/[^0-9]/g, "");
  nextValue = nextValue.replace(/[^0-9.]/g, "");
  const parts = nextValue.split(".");
  return parts.length > 2 ? `${parts[0]}.${parts.slice(1).join("")}` : nextValue;
};

export function SummaryCard({ theme, title, value, icon, iconBg, rawValue }) {
  const display = rawValue !== undefined ? formatStockValue(rawValue) : value;
  const isLong = String(display).length > 10;
  return (
    <div className={`rounded-2xl border px-5 py-5 shadow-sm ${theme.card}`}>
      <div className="flex items-center gap-4">
        <div className={`summary-icon-3d flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${iconBg}`}>
          {icon}
        </div>

        <div className="min-w-0">
          <p className={`text-sm font-medium ${theme.muted}`}>{title}</p>
          <h3 className={`mt-1 font-bold leading-none truncate ${isLong ? "text-xl" : "text-3xl"}`}>{display}</h3>
        </div>
      </div>
    </div>
  );
}

export function ActionCard({ theme, title, subtitle, icon, buttonText, buttonLabel, buttonClass, onClick }) {
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${theme.card}`}>
      <div className="flex items-center gap-4">
        <div className="summary-icon-3d flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-red-500/10">
          {icon}
        </div>

        <div>
          <h3 className="text-base font-bold">{title}</h3>
          <p className={`mt-1 text-xs ${theme.muted}`}>{subtitle}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onClick}
        className={`quick-action-icon-3d mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 ${buttonClass}`}
      >
        <FiPlusCircle />
        {buttonText || buttonLabel}
      </button>
    </div>
  );
}

export function InventoryThumb({ item, size = "normal" }) {
  const sizeClass =
    size === "large"
      ? "h-40 w-full rounded-2xl"
      : "h-12 w-12 rounded-2xl";

  if (item.imagePath) {
    return (
      <img
        src={item.imagePath}
        alt={item.variantName}
        className={`${size === "normal" ? "table-icon-3d" : ""} ${sizeClass} object-cover`}
        onError={(event) => {
          event.currentTarget.style.display = "none";
        }}
      />
    );
  }

  return (
    <div className={`flex shrink-0 items-center justify-center bg-red-500/10 ${size === "normal" ? "table-icon-3d" : ""} ${sizeClass}`}>
      <FiPackage className={size === "large" ? "text-5xl text-red-500" : "text-xl text-red-500"} />
    </div>
  );
}

export function ModalShell({ title, subtitle, theme, onClose, children, footer, width = "max-w-5xl", mobileFullScreen = false }) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:px-4 sm:py-6"
    >
      <div
        onClick={(event) => event.stopPropagation()}
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
              className={`table-icon-3d flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition hover:-translate-y-0.5 ${
                theme.isDark
                  ? "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white"
                  : "border-zinc-300 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 hover:text-zinc-950"
              }`}
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
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              {footer}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function SectionTitle({ icon, title, subtitle, theme }) {
  return (
    <div className="flex items-start gap-3">
      <div className="summary-icon-3d mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
        {icon}
      </div>

      <div>
        <h3 className="text-sm font-bold">{title}</h3>
        <p className={`mt-0.5 text-xs leading-5 ${theme.muted}`}>{subtitle}</p>
      </div>
    </div>
  );
}

const STOCK_STATUS_KH = {
  "In Stock": "មានស្តុក",
  "Low Stock": "ស្តុកស្ទើរអស់",
  "Out of Stock": "អស់ស្តុក",
};

export function StockStatusBadge({ status, getStatusClass }) {
  return (
    <span className={`inline-flex w-fit items-center justify-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(status)}`}>
      {status === "In Stock" ? <FiCheckCircle /> : status === "Low Stock" ? <FiAlertTriangle /> : <FiXCircle />}
      {STOCK_STATUS_KH[status] || status}
    </span>
  );
}

export function FormInput({ label, value, onChange, theme, error = "", type = "text", placeholder = "", icon, allowDecimal = true }) {
  return (
    <label className="block">
      <span className={`mb-2 block text-xs font-semibold ${theme.muted}`}>{label}</span>
      <div className="relative">
        {icon && <span className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base ${theme.muted}`}>{icon}</span>}
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          inputMode={type === "number" ? "decimal" : undefined}
          onChange={(event) => onChange(type === "number" ? sanitizeNumber(event.target.value, allowDecimal) : event.target.value)}
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
        {icon && <span className={`pointer-events-none absolute left-3.5 top-3.5 text-base ${theme.muted}`}>{icon}</span>}
        <textarea
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          rows={3}
          className={`w-full resize-none rounded-xl border ${icon ? "pl-10" : "px-3"} pr-3 py-3 text-sm outline-none transition focus:ring-4 ${theme.input} ${error ? "border-red-500 focus:border-red-500" : ""}`}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </label>
  );
}

export function InventoryDropdown({
  value,
  onChange,
  theme,
  error = "",
  icon,
  options = [],
  disabled = false,
  searchable = false,
  placeholder = "Select",
  heightClass = "h-11",
  roundedClass = "rounded-xl",
  textClass = "text-sm",
  fontClass = "",
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef(null);
  const selectedOption = options.find((option) => String(option.value) === String(value));
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
      {icon && <span className={`pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-base ${theme.muted}`}>{icon}</span>}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((previous) => !previous)}
        className={`flex ${heightClass} w-full items-center justify-between ${roundedClass} border ${icon ? "pl-10" : "pl-3"} pr-3 text-left ${textClass} ${fontClass} outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:opacity-70 ${theme.select} ${error ? "border-red-500 focus:border-red-500" : ""}`}
      >
        <span className={`truncate ${selectedOption ? "" : theme.muted}`}>{selectedOption?.label || placeholder}</span>
        <FiChevronDown className={`ml-2 shrink-0 text-base transition ${theme.muted} ${open ? "rotate-180" : ""}`} />
      </button>

      {open && !disabled && (
        <div className={`absolute z-50 mt-2 w-full overflow-hidden rounded-xl border ${dropdownClass}`}>
          {searchable && (
            <div className={`border-b p-2 ${isDark ? "border-white/10" : "border-zinc-200"}`}>
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="ស្វែងរក..."
                className={`h-9 w-full rounded-lg border px-3 text-sm outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-500/20 ${searchInputClass}`}
              />
            </div>
          )}
          <div className="max-h-56 overflow-y-auto py-1">
            {visibleOptions.length === 0 && (
              <p className={`px-4 py-3 text-center text-xs ${theme.muted}`}>រកមិនឃើញ</p>
            )}
            {visibleOptions.map((option) => {
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
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm capitalize transition ${isActive ? "bg-red-500/10 font-semibold text-red-500 dark:text-red-400" : isDark ? "text-zinc-200 hover:bg-white/[0.06] hover:text-white" : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"}`}
                >
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

export function FormSelect({ label, value, onChange, theme, error = "", icon, options = [], disabled = false, searchable = false }) {
  return (
    <label className="block">
      <span className={`mb-2 block text-xs font-semibold ${theme.muted}`}>{label}</span>
      <InventoryDropdown
        value={value}
        onChange={onChange}
        theme={theme}
        error={error}
        icon={icon}
        options={options}
        disabled={disabled}
        searchable={searchable}
      />
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </label>
  );
}

export function InfoLine({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold text-zinc-500">{label}</p>
      <p className="mt-1">{value || "-"}</p>
    </div>
  );
}
