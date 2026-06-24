import { toneClasses } from "../utils/backupTheme";

export default function BackupSummaryCard({ theme, title, value, subtitle, icon, tone }) {
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${theme.card}`}>
      <div className="flex items-center gap-4">
        <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-3xl ${toneClasses(tone)}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className={`truncate text-sm ${theme.muted}`}>{title}</p>
          <h3 className="mt-1 truncate text-3xl font-extrabold leading-tight">{value}</h3>
          <p className={`mt-2 truncate text-xs ${theme.muted}`}>{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

