import React, { useEffect, useRef, useState } from "react";
import { FiCheck, FiChevronDown } from "react-icons/fi";

const UNIT_GROUPS = [
  { label: "បរិមាណ", options: ["ml", "L", "cl", "fl oz"] },
  { label: "ទម្ងន់", options: ["g", "kg", "mg", "oz", "lb"] },
  { label: "ផ្សេងៗ", options: ["pcs", "pack", "tablet", "capsule", "sheet", "cm", "m"] },
];

export function SizeUnitSelect({ value, onChange, theme }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const themeText = [theme.isDark ? "dark" : "", theme.select, theme.input, theme.modal, theme.section].join(" ");
  const isDark = Boolean(theme.isDark) || themeText.includes("bg-[#") || themeText.includes("bg-zinc-900") || themeText.includes("text-white");

  const dropdownClass = isDark
    ? "border-white/10 bg-[#18181b] text-zinc-100 shadow-2xl shadow-black/30"
    : "border-zinc-200 bg-white text-zinc-800 shadow-xl shadow-zinc-200/70";

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") setOpen(false); };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <div className="relative w-28" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`flex h-11 w-full items-center justify-between rounded-xl border px-3 text-sm outline-none transition focus:ring-4 ${theme.input}`}
      >
        <span className="truncate">{value || "-- រើស --"}</span>
        <FiChevronDown className={`ml-1 shrink-0 transition ${open ? "rotate-180" : ""} ${theme.muted}`} />
      </button>

      {open && (
        <div className={`absolute left-0 top-full z-50 mt-1 w-36 overflow-hidden rounded-xl border ${dropdownClass}`}>
          <div className="max-h-52 overflow-y-auto py-1">
            <button
              type="button"
              onClick={() => { onChange(""); setOpen(false); }}
              className={`w-full px-3 py-2 text-left text-sm ${isDark ? "text-zinc-400 hover:bg-white/10" : "text-zinc-400 hover:bg-zinc-100"}`}
            >
              -- រើស --
            </button>
            {UNIT_GROUPS.map((group) => (
              <div key={group.label}>
                <p className={`px-3 pt-2 pb-1 text-xs font-semibold ${theme.muted}`}>{group.label}</p>
                {group.options.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => { onChange(opt); setOpen(false); }}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition ${
                      value === opt
                        ? "bg-red-500/10 font-semibold text-red-500"
                        : isDark
                        ? "text-zinc-200 hover:bg-white/10"
                        : "text-zinc-700 hover:bg-zinc-100"
                    }`}
                  >
                    {opt}
                    {value === opt && <FiCheck className="shrink-0 text-xs" />}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
