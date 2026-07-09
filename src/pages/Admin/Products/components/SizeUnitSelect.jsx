import React, { useEffect, useMemo, useRef, useState } from "react";
import { FiCheck, FiChevronDown, FiPlus, FiSearch } from "react-icons/fi";

const UNIT_GROUPS = [
  { label: "បរិមាណ", options: ["ml", "L", "cl", "fl oz"] },
  { label: "ទម្ងន់", options: ["g", "kg", "mg", "oz", "lb"] },
  { label: "ផ្សេងៗ", options: ["pcs", "pack", "tablet", "capsule", "sheet", "cm", "m"] },
];

const normalize = (text) => String(text || "").trim().toLowerCase();

export function CreatableOptionSelect({
  value,
  onChange,
  theme,
  groups,
  icon = null,
  label = "",
  required = false,
  embedded = false,
  placeholder = "-- រើស --",
  searchPlaceholder = "ស្វែងរក ឬបញ្ចូលថ្មី",
  hint = "មិនឃើញ? វាយឈ្មោះថ្មី រួចចុចបន្ថែម។",
  existingLabel = "ជម្រើសដែលមានស្រាប់",
  createLabel = "បន្ថែម",
  widthClass = "w-full",
  menuWidthClass = "w-60",
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);

  const themeText = [theme.isDark ? "dark" : "", theme.select, theme.input, theme.modal, theme.section].join(" ");
  const isDark = Boolean(theme.isDark) || themeText.includes("bg-[#") || themeText.includes("bg-zinc-900") || themeText.includes("text-white");

  const dropdownClass = isDark
    ? "border-white/10 bg-[#18181b] text-zinc-100 shadow-2xl shadow-black/30"
    : "border-zinc-200 bg-white text-zinc-800 shadow-xl shadow-zinc-200/70";

  const flatOptions = useMemo(() => groups.flatMap((group) => group.options), [groups]);
  const filteredGroups = useMemo(() => {
    const q = normalize(query);
    if (!q) return groups;
    return groups
      .map((group) => ({
        ...group,
        options: group.options.filter((opt) => normalize(opt).includes(q)),
      }))
      .filter((group) => group.options.length > 0);
  }, [groups, query]);

  const customValue = query.trim();
  const canCreate = customValue && !flatOptions.some((opt) => normalize(opt) === normalize(customValue));

  const selectValue = (nextValue) => {
    onChange(nextValue);
    setQuery("");
    setOpen(false);
  };

  useEffect(() => {
    const handler = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const trigger = (
    <div className={embedded ? "relative h-full" : "relative"}>
      {icon && !embedded && (
        <span className={`pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-base ${theme.muted}`}>
          {icon}
        </span>
      )}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={
          embedded
            ? "flex h-full w-full items-center justify-between rounded-r-xl border-l border-zinc-200/70 bg-transparent px-3 text-sm outline-none transition hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-white/[0.05]"
            : `flex h-11 w-full items-center justify-between rounded-xl border ${icon ? "pl-10" : "pl-3"} pr-3 text-left text-sm outline-none transition focus:ring-4 ${theme.select}`
        }
      >
        <span className={`truncate ${value ? "" : theme.muted}`}>{value || placeholder}</span>
        <FiChevronDown className={`ml-2 shrink-0 text-base transition ${theme.muted} ${open ? "rotate-180" : ""}`} />
      </button>
    </div>
  );

  return (
    <div className={`relative ${widthClass}`} ref={ref}>
      {label && (
        <span className={`mb-2 block text-xs font-semibold ${theme.muted}`}>
          {label}
          {required && <span className="ml-1 text-red-400">*</span>}
        </span>
      )}

      {trigger}

      {open && (
        <div className={`absolute right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border ${menuWidthClass} ${dropdownClass}`}>
          <div className="border-b border-zinc-200 p-2 dark:border-white/10">
            <div className="relative">
              <FiSearch className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm ${theme.muted}`} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={searchPlaceholder}
                className={`h-9 w-full rounded-lg border bg-transparent pl-9 pr-3 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20 ${
                  isDark ? "border-white/10" : "border-zinc-200"
                }`}
                autoFocus
              />
            </div>
            <p className={`mt-1.5 px-1 text-[11px] leading-4 ${theme.muted}`}>{hint}</p>
          </div>

          <div className="max-h-56 overflow-y-auto py-1">
            {canCreate && (
              <button
                type="button"
                onClick={() => selectValue(customValue)}
                className="mx-2 mb-1 flex w-[calc(100%-1rem)] items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-left text-sm font-semibold text-red-500 transition hover:bg-red-500/15"
              >
                <FiPlus className="shrink-0" />
                {createLabel} "{customValue}"
              </button>
            )}

            <button
              type="button"
              onClick={() => selectValue("")}
              className={`w-full px-3 py-2 text-left text-sm ${isDark ? "text-zinc-400 hover:bg-white/10" : "text-zinc-400 hover:bg-zinc-100"}`}
            >
              {placeholder}
            </button>

            <p className={`px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wide ${theme.muted}`}>
              {existingLabel}
            </p>

            {filteredGroups.map((group) => (
              <div key={group.label}>
                <p className={`px-3 pb-1 pt-2 text-xs font-semibold ${theme.muted}`}>{group.label}</p>
                {group.options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => selectValue(option)}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition ${
                      value === option
                        ? "bg-red-500/10 font-semibold text-red-500"
                        : isDark
                          ? "text-zinc-200 hover:bg-white/10"
                          : "text-zinc-700 hover:bg-zinc-100"
                    }`}
                  >
                    {option}
                    {value === option && <FiCheck className="shrink-0 text-xs" />}
                  </button>
                ))}
              </div>
            ))}

            {filteredGroups.length === 0 && !canCreate && (
              <p className={`px-3 py-3 text-sm ${theme.muted}`}>មិនមានលទ្ធផល</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function SizeUnitSelect({ value, onChange, theme, embedded = false }) {
  return (
    <CreatableOptionSelect
      value={value}
      onChange={onChange}
      theme={theme}
      groups={UNIT_GROUPS}
      embedded={embedded}
      placeholder="-- រើស --"
      searchPlaceholder="ស្វែងរក ឬបញ្ចូល unit ថ្មី"
      createLabel="បន្ថែម"
      widthClass="w-32 shrink-0"
      menuWidthClass="w-60"
    />
  );
}
