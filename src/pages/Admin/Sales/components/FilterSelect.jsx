import { useEffect, useRef, useState } from "react";
import { FiCheck, FiChevronDown } from "react-icons/fi";

export default function FilterSelect({ icon, value, onChange, options, theme }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const selectedOption =
    options.find((option) => String(option.value) === String(value)) ||
    options[0];

  const isDark =
    theme?.select?.includes("bg-[#") ||
    theme?.select?.includes("bg-zinc") ||
    theme?.select?.includes("text-white");

  const menuClass = isDark
    ? "border-white/10 bg-[#18181b] text-white shadow-2xl shadow-black/30"
    : "border-zinc-200 bg-white text-zinc-900 shadow-xl shadow-zinc-200/70";

  const optionClass = isDark ? "hover:bg-white/10" : "hover:bg-zinc-100";
  const selectedClass = isDark
    ? "bg-red-500/15 text-red-300"
    : "bg-red-50 text-red-600";

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        className={`flex h-14 w-full items-center justify-between rounded-2xl border pl-11 pr-4 text-left text-sm font-semibold outline-none transition focus:ring-4 ${theme.select}`}
      >
        <span
          className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg ${theme.muted}`}
        >
          {icon}
        </span>

        <span className="min-w-0 truncate">
          {selectedOption?.label || "Select"}
        </span>

        <FiChevronDown
          className={`ml-3 shrink-0 text-lg transition ${theme.muted} ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          className={`absolute z-50 mt-2 max-h-72 w-full overflow-hidden rounded-2xl border ${menuClass}`}
        >
          <div className="max-h-72 overflow-y-auto py-1">
            {options.map((option) => {
              const selected = String(option.value) === String(value);

              return (
                <button
                  key={String(option.value)}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition ${
                    selected ? selectedClass : optionClass
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
