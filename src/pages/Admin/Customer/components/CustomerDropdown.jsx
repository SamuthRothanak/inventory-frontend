import React, { useEffect, useRef, useState } from "react";
import { FiCheck, FiChevronDown } from "react-icons/fi";

const isDarkTheme = (theme = {}) => {
  const themeText = [theme.select, theme.input, theme.modal, theme.section].join(" ");
  return Boolean(theme.isDark) || themeText.includes("bg-[#") || themeText.includes("bg-zinc-900") || themeText.includes("text-white");
};

export default function CustomerDropdown({
  label,
  required = false,
  error = "",
  theme,
  icon,
  value,
  onChange,
  options = [],
  placeholder = "ជ្រើសរើស",
  searchable = false,
  heightClass = "h-12",
  roundedClass = "rounded-2xl",
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef(null);
  const isDark = isDarkTheme(theme);
  const selectedOption = options.find((option) => String(option.value) === String(value)) || options[0];
  const visibleOptions =
    searchable && query
      ? options.filter((option) => String(option.label).toLowerCase().includes(query.toLowerCase()))
      : options;
  const dropdownClass = isDark
    ? "border-white/10 bg-[#18181b] text-zinc-100 shadow-2xl shadow-black/30"
    : "border-zinc-200 bg-white text-zinc-800 shadow-xl shadow-zinc-200/70";
  const searchInputClass = isDark
    ? "border-white/10 bg-[#111113] text-zinc-100 placeholder:text-zinc-500"
    : "border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400";

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
      {label && (
        <span className={`mb-2 block text-xs font-semibold ${theme.muted}`}>
          {label}
          {required && <span className="ml-1 text-red-400">*</span>}
        </span>
      )}

      <div className="relative">
        {icon && <span className={`pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-lg ${theme.muted}`}>{icon}</span>}
        <button
          type="button"
          onClick={() => setOpen((previous) => !previous)}
          className={`flex ${heightClass} w-full items-center justify-between ${roundedClass} border ${icon ? "pl-11" : "pl-4"} pr-4 text-left text-sm outline-none transition focus:ring-4 ${theme.select} ${error ? "border-red-500 focus:border-red-500" : ""}`}
        >
          <span className={`truncate ${selectedOption ? "" : theme.muted}`}>{selectedOption?.label || placeholder}</span>
          <FiChevronDown className={`ml-2 shrink-0 text-lg transition ${theme.muted} ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div className={`absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border ${dropdownClass}`}>
            {searchable && (
              <div className={`border-b p-2 ${isDark ? "border-white/10" : "border-zinc-200"}`}>
                <input
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="ស្វែងរក..."
                  className={`h-9 w-full rounded-xl border px-3 text-sm outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-500/20 ${searchInputClass}`}
                />
              </div>
            )}

            <div className="max-h-60 overflow-y-auto py-1">
              {visibleOptions.length === 0 ? (
                <div className={`px-4 py-3 text-sm ${theme.muted}`}>រកមិនឃើញជម្រើស</div>
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
