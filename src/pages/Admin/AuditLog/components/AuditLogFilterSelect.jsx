import React, { useEffect, useMemo, useRef, useState } from "react";
import { FiCheck, FiChevronDown, FiSearch } from "react-icons/fi";

function getDropdownTheme(isDark) {
  return {
    trigger: isDark
      ? "border-white/10 bg-[#18181b] text-white hover:border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
      : "border-zinc-200 bg-white text-zinc-900 hover:border-red-300 focus:border-red-500 focus:ring-red-500/20",
    menu: isDark
      ? "border-white/10 bg-[#18181b] text-white shadow-2xl shadow-black/40"
      : "border-zinc-200 bg-white text-zinc-900 shadow-xl shadow-zinc-200/70",
    search: isDark
      ? "border-white/10 bg-[#111113] text-white placeholder:text-zinc-500"
      : "border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400",
    option: isDark ? "hover:bg-white/10" : "hover:bg-zinc-100",
    selected: isDark ? "bg-red-500/15 text-red-300" : "bg-red-50 text-red-600",
  };
}

export default function AuditLogFilterSelect({
  icon,
  value,
  options = [],
  onChange,
  isDark = false,
  searchable = false,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef(null);
  const theme = getDropdownTheme(isDark);

  const selectedOption = options.find((option) => String(option.value) === String(value)) || options[0];
  const visibleOptions = useMemo(() => {
    if (!searchable || !query.trim()) return options;
    const lowerQuery = query.toLowerCase();
    return options.filter((option) => option.label.toLowerCase().includes(lowerQuery));
  }, [options, query, searchable]);

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        className={`flex h-14 w-full items-center justify-between rounded-2xl border px-4 text-left text-sm font-semibold outline-none transition focus:ring-4 ${theme.trigger}`}
      >
        <span className="flex min-w-0 items-center gap-3">
          {icon && <span className="shrink-0 text-xl text-zinc-400">{icon}</span>}
          <span className="truncate">{selectedOption?.label || "Select"}</span>
        </span>
        <FiChevronDown className={`ml-3 shrink-0 text-lg text-zinc-400 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className={`absolute z-50 mt-2 max-h-72 w-full overflow-hidden rounded-2xl border ${theme.menu}`}>
          {searchable && (
            <div className={`border-b p-2 ${isDark ? "border-white/10" : "border-zinc-100"}`}>
              <div className="relative">
                <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="ស្វែងរក..."
                  className={`h-10 w-full rounded-xl border pl-9 pr-3 text-sm outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-500/20 ${theme.search}`}
                />
              </div>
            </div>
          )}

          <div className="max-h-56 overflow-y-auto py-1">
            {visibleOptions.map((option) => {
              const selected = String(option.value) === String(value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition ${
                    selected ? theme.selected : theme.option
                  }`}
                >
                  <span className="truncate">{option.label}</span>
                  {selected && <FiCheck className="ml-3 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

