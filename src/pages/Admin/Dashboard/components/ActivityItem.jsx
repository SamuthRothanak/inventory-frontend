export default function ActivityItem({ act, theme, isDark }) {
  const Icon = act.icon;
  const bg = typeof act.bg === "function" ? act.bg(isDark) : act.bg;
  return (
    <div className="flex items-start gap-3">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base ${bg} ${act.color}`}>
        <Icon />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold ${theme.pageTitle}`}>{act.label}</p>
        <p className={`text-xs ${theme.muted}`}>{act.sub}</p>
      </div>
      <span className={`shrink-0 text-xs ${theme.muted}`}>{act.time}</span>
    </div>
  );
}

// â”€â”€â”€ Custom Chart Tooltip â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€


