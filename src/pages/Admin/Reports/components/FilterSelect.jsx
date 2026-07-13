import { FiChevronDown } from "react-icons/fi";

export default function FilterSelect({ icon, value, onChange, options, theme }) {
  return (
    <div className="relative">
      <span className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base ${theme.muted}`}>{icon}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-12 w-full appearance-none rounded-2xl border pl-11 pr-10 text-sm outline-none transition focus:ring-4 ${theme.select}`}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <FiChevronDown className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 ${theme.muted}`} />
    </div>
  );
}


