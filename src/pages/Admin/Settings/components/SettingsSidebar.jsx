export default function SettingsSidebar({ theme, sections, activeSection, onSectionChange }) {
  return (
    <div className={`rounded-2xl border p-3 shadow-sm ${theme.card}`}>
      <p className={`mb-2 px-2 text-[11px] font-bold uppercase tracking-widest ${theme.muted}`}>
        ការកំណត់
      </p>
      <nav className="space-y-0.5">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;

          return (
            <button
              key={section.id}
              type="button"
              onClick={() => onSectionChange(section.id)}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all duration-150 ${
                isActive
                  ? "bg-red-500 text-white shadow-sm"
                  : `hover:bg-zinc-100 dark:hover:bg-white/5 ${theme.pageTitle}`
              }`}
            >
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
                  isActive ? "bg-white/20 text-white" : "bg-red-500/10 text-red-500"
                }`}
              >
                <Icon size={14} />
              </div>
              <span className={`text-sm font-semibold ${isActive ? "text-white" : ""}`}>
                {section.title}
              </span>
              {isActive && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/70" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
