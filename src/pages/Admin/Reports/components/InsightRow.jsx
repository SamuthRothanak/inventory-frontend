export default function InsightRow({ theme, label, value, badge, badgeColor }) {
  const badgePalette = {
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    blue:    "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    amber:   "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    red:     "bg-red-500/10 text-red-500",
    zinc:    "bg-zinc-500/10 text-zinc-500",
  };
  return (
    <div className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${theme.softCard}`}>
      <span className={`text-sm ${theme.muted}`}>{label}</span>
      <div className="flex items-center gap-2">
        <span className={`font-bold text-sm ${theme.pageTitle}`}>{value}</span>
        {badge && (
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badgePalette[badgeColor] ?? badgePalette.zinc}`}>
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}



