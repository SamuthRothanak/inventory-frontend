export default function SettingSummaryCard({
  theme,
  title,
  value,
  subtitle,
  icon,
  iconBg,
}) {
  return (
    <div className={`rounded-2xl border px-5 py-5 shadow-sm ${theme.card}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className={`text-sm font-medium ${theme.muted}`}>{title}</p>

          <h3 className="mt-2 text-2xl font-bold leading-tight">{value}</h3>

          <p className={`mt-2 text-xs ${theme.muted}`}>{subtitle}</p>
        </div>

        <div
          className={`summary-icon-3d flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${iconBg}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
