
import React, { useEffect, useRef, useState } from "react";
import { FiCheck, FiChevronDown } from "react-icons/fi";

/**
 * SearchableDropdown — custom dropdown ដែលមាន search + scroll (max-height).
 * សម្រាប់ options ច្រើន (Category, Unit ... ពេល mart ធំ).
 *
 * Props:
 *  - value, onChange(value)
 *  - options: [{ value, label }]
 *  - icon, theme, error, required, label, placeholder
 *  - searchable (default true)
 */
export default function SearchableDropdown({
  label,
  required = false,
  error = "",
  theme,
  icon,
  value,
  onChange,
  options = [],
  placeholder = "Select",
  searchable = true,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef(null);

  const selectedOption = options.find(
    (o) => String(o.value) === String(value),
  );
  const themeText = [
    theme.isDark ? "dark" : "",
    theme.select,
    theme.input,
    theme.modal,
    theme.section,
  ].join(" ");
  const isDark =
    Boolean(theme.isDark) ||
    themeText.includes("bg-[#") ||
    themeText.includes("bg-zinc-900") ||
    themeText.includes("text-white");
  const dropdownClass = isDark
    ? "border-white/10 bg-[#18181b] text-zinc-100 shadow-2xl shadow-black/30"
    : "border-zinc-200 bg-white text-zinc-800 shadow-xl shadow-zinc-200/70";
  const searchWrapClass = isDark ? "border-white/10" : "border-zinc-200";
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

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  const visibleOptions =
    searchable && query
      ? options.filter((o) =>
          String(o.label).toLowerCase().includes(query.toLowerCase()),
        )
      : options;

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setOpen(false);
    setQuery("");
  };

  return (
    <label className="block" ref={wrapperRef}>
      <span className={`mb-2 block text-xs font-semibold ${theme.muted}`}>
        {label}
        {required && <span className="ml-1 text-red-400">*</span>}
      </span>

      <div className="relative">
        {icon && (
          <span
            className={`pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-base ${theme.muted}`}
          >
            {icon}
          </span>
        )}

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className={`flex h-11 w-full items-center justify-between rounded-xl border ${
            icon ? "pl-10" : "pl-3"
          } pr-3 text-left text-sm outline-none transition focus:ring-4 ${theme.select} ${
            error ? "border-red-500 focus:border-red-500" : ""
          }`}
        >
          <span className={`truncate ${selectedOption ? "" : theme.muted}`}>
            {selectedOption?.label || placeholder}
          </span>
          <FiChevronDown
            className={`ml-2 shrink-0 text-base transition ${theme.muted} ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        {open && (
          <div
            className={`absolute z-50 mt-2 w-full overflow-hidden rounded-xl border ${dropdownClass}`}
          >
            {searchable && (
              <div className={`border-b p-2 ${searchWrapClass}`}>
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search..."
                  className={`h-9 w-full rounded-lg border px-3 text-sm outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-500/20 ${searchInputClass}`}
                />
              </div>
            )}

            <div className="max-h-56 overflow-y-auto py-1">
              {visibleOptions.length === 0 && (
                <p className={`px-4 py-3 text-center text-xs ${theme.muted}`}>
                  No results
                </p>
              )}

              {visibleOptions.map((option) => {
                const isActive = String(option.value) === String(value);
                return (
                  <button
                    key={String(option.value)}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition ${
                      isActive
                        ? "bg-red-500/10 font-semibold text-red-500 dark:text-red-400"
                        : isDark
                        ? "text-zinc-200 hover:bg-white/[0.06] hover:text-white"
                        : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
                    }`}
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

      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </label>
  );
}
