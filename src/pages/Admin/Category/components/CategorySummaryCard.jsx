export default function CategorySummaryCard({ title, value, icon, iconBg }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900 px-6 py-5 text-white shadow-sm">
      <div className="flex items-center gap-5">
        <div
          className={`flex h-16 w-16 items-center justify-center rounded-2xl ${iconBg}`}
        >
          {icon}
        </div>

        <div>
          <p className="text-sm font-medium text-zinc-400">{title}</p>
          <h3 className="mt-2 text-4xl font-semibold leading-none">{value}</h3>
        </div>
      </div>
    </div>
  );
}