import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search, ChevronDown, CheckCircle, Users } from "./posIcons";

/**
 * CustomerSearchSelect — searchable customer combobox for POS wholesale mode.
 * Filters by shop name, customer code, contact name, and phone.
 */
export default function CustomerSearchSelect({ customers, value, onChange, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef(null);

  const selected = customers.find((c) => c.id === value) || null;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const visibleCustomers = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return customers;
    return customers.filter((c) =>
      [c.shopName, c.code, c.contactName, c.phone]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(keyword))
    );
  }, [customers, query]);

  const handleSelect = (customerId) => {
    onChange(customerId);
    setOpen(false);
    setQuery("");
  };

  return (
    <div className="relative min-w-0 flex-1" ref={wrapperRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-9 w-full max-w-xs items-center justify-between gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none transition disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 focus:border-red-300"
      >
        <span className={`truncate ${selected ? "" : "text-slate-400"}`}>
          {selected ? `${selected.shopName} (${selected.code})` : "ជ្រើសរើសអតិថិជន..."}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && !disabled && (
        <div className="absolute z-50 mt-1.5 w-full min-w-[16rem] max-w-xs overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70">
          <div className="flex items-center gap-1.5 border-b border-slate-100 px-2.5 py-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ស្វែងរកអតិថិជន..."
              className="h-7 w-full border-none bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>

          <button
            type="button"
            onClick={() => handleSelect("")}
            className={`flex h-9 w-full items-center justify-between border-b border-slate-100 px-3 text-left text-xs transition ${
              !value ? "bg-red-50 font-semibold text-red-500" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            ជ្រើសរើសអតិថិជន...
            {!value && <CheckCircle className="h-3.5 w-3.5 shrink-0" />}
          </button>

          {visibleCustomers.length === 0 ? (
            <p className="flex flex-col items-center gap-1 px-3 py-5 text-center text-xs text-slate-400">
              <Users className="h-5 w-5 text-slate-300" />
              រកមិនឃើញអតិថិជន
            </p>
          ) : (
            /* Shows 5 customer rows (5 × 42px) before this list scrolls */
            <div className="max-h-52.5 overflow-y-auto py-1">
              {visibleCustomers.map((c) => {
                const isActive = c.id === value;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelect(c.id)}
                    className={`flex h-10.5 w-full items-center justify-between gap-2 px-3 text-left text-xs transition ${
                      isActive ? "bg-red-50 font-semibold text-red-500" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{c.shopName} <span className="text-slate-400">({c.code})</span></span>
                      {(c.contactName || c.phone) && (
                        <span className="block truncate text-[10px] text-slate-400">
                          {[c.contactName, c.phone].filter(Boolean).join(" · ")}
                        </span>
                      )}
                    </span>
                    {isActive && <CheckCircle className="h-3.5 w-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
