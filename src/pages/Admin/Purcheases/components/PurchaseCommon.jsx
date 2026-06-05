import React from "react";
import { FiChevronDown, FiX } from "react-icons/fi";export function FilterSelect({ value, setValue, theme, icon, options }) {

  return (

    <div className="relative">

      <span className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg ${theme.muted}`}>{icon}</span>

      <select value={value} onChange={(event) => setValue(event.target.value)} className={`h-12 w-full appearance-none rounded-2xl border pl-11 pr-11 text-sm outline-none transition focus:ring-4 ${theme.select}`}>

        {options.map((option) => <option key={String(option.value)} value={option.value}>{option.label}</option>)}

      </select>

      <FiChevronDown className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-lg ${theme.muted}`} />

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




export function SummaryCard({ theme, title, value, icon, iconBg }) {

  return (

    <div className={`rounded-2xl border px-5 py-5 shadow-sm ${theme.card}`}>

      <div className="flex items-center gap-4">

        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${iconBg}`}>{icon}</div>

        <div>

          <p className={`text-sm font-medium ${theme.muted}`}>{title}</p>

          <h3 className="mt-1 text-3xl font-bold leading-none">{value}</h3>

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

  return <span className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(status)}`}>{getStatusIcon(status)}{status}</span>;

}




export function FormInput({ label, required = false, value, onChange, theme, error = "", type = "text", placeholder = "", icon, disabled = false }) {

  return (

    <label className="block">

      <span className={`mb-2 block text-xs font-semibold ${theme.muted}`}>{label}{required && <span className="ml-1 text-red-400">*</span>}</span>

      <div className="relative">

        {icon && <span className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base ${theme.muted}`}>{icon}</span>}

        <input type={type} value={value} disabled={disabled} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className={`h-11 w-full rounded-xl border ${icon ? "pl-10" : "px-3"} pr-3 text-sm outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:opacity-70 ${theme.input} ${error ? "border-red-500 focus:border-red-500" : ""}`} />

      </div>

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




export function FormSelect({ label, required = false, value, onChange, options, theme, error = "", icon, disabled = false }) {

  return (

    <label className="block">

      <span className={`mb-2 block text-xs font-semibold ${theme.muted}`}>{label}{required && <span className="ml-1 text-red-400">*</span>}</span>

      <div className="relative">

        {icon && <span className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base ${theme.muted}`}>{icon}</span>}

        <select value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className={`h-11 w-full appearance-none rounded-xl border ${icon ? "pl-10" : "pl-3"} pr-10 text-sm outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:opacity-70 ${theme.select} ${error ? "border-red-500 focus:border-red-500" : ""}`}>

          {options.map((option) => <option key={String(option.value)} value={option.value}>{option.label}</option>)}

        </select>

        <FiChevronDown className={`pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-base ${theme.muted}`} />

      </div>

      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}

    </label>

  );

}




export function SummaryMiniBox({ theme, label, value, strong = false }) {

  return (

    <div className={`rounded-xl border p-4 ${theme.softCard}`}>

      <p className={`text-xs font-semibold ${theme.muted}`}>{label}</p>

      <p className={`mt-2 ${strong ? "text-xl font-bold" : "text-sm font-semibold"}`}>{value}</p>

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



