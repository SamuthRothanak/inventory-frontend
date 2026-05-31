
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
            className={`absolute z-50 mt-2 w-full overflow-hidden rounded-xl border bg-white shadow-xl dark:bg-zinc-900 ${theme.section}`}
          >
            {searchable && (
              <div className="border-b border-zinc-200 p-2 dark:border-white/10">
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search..."
                  className={`h-9 w-full rounded-lg border px-3 text-sm outline-none ${theme.input}`}
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
                        ? "bg-emerald-500/10 font-semibold text-emerald-600 dark:text-emerald-400"
                        : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/10"
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