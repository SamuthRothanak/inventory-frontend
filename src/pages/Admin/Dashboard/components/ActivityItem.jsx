import { Link } from "react-router-dom";

export default function ActivityItem({ act, theme, isDark }) {
  const Icon = act.icon;
  const bg = typeof act.bg === "function" ? act.bg(isDark) : act.bg;
  const Wrapper = act.to ? Link : "div";
  const wrapperProps = act.to ? { to: act.to } : {};
  return (
    <Wrapper
      {...wrapperProps}
      className={`flex items-start gap-3 rounded-lg transition ${act.to ? "cursor-pointer hover:opacity-80" : ""}`}
    >
      <div className={`table-icon-3d flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base ${bg} ${act.color}`}>
        <Icon />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold ${theme.pageTitle}`}>{act.label}</p>
        <p className={`text-xs ${theme.muted}`}>{act.sub}</p>
      </div>
      <span className={`shrink-0 text-xs ${theme.muted}`}>{act.time}</span>
    </Wrapper>
  );
}

// â”€â”€â”€ Custom Chart Tooltip â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€


