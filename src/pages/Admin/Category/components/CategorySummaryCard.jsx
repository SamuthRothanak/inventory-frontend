export default function CategorySummaryCard({
  theme,
  icon,
  iconBg,
  title,
  value,
}) {
  return (
    <div className={`rounded-2xl border px-5 py-5 shadow-sm ${theme.card}`}>
      <div className="flex items-center gap-4">
        <div
          className={`summary-icon-3d flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${iconBg}`}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <p className={`text-sm font-medium ${theme.muted}`}>{title}</p>
          <h3 className="mt-1 text-3xl font-bold leading-none">{value}</h3>
        </div>
      </div>
    </div>
  );
}
