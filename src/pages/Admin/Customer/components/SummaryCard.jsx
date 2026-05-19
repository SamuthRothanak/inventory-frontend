export default function SummaryCard({ theme, icon, iconBg, title, value }) {
  return (
    <div className={`rounded-2xl border px-6 py-5 shadow-sm ${theme.card}`}>
      <div className="flex items-center gap-5">
        <div
          className={`flex h-16 w-16 items-center justify-center rounded-2xl ${iconBg}`}
        >
          {icon}
        </div>

        <div>
          <p className={`text-sm font-medium ${theme.muted}`}>{title}</p>
          <h3 className="mt-2 text-4xl font-semibold leading-none">{value}</h3>
        </div>
      </div>
    </div>
  );
}