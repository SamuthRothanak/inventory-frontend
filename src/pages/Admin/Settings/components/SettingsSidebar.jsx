export default function SettingsSidebar({
  theme,
  sections,
  activeSection,
  onSectionChange,
}) {
  return (
    <aside className="border-b border-zinc-200 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.025] lg:border-b-0 lg:border-r">
      <div className="mb-3 hidden lg:block">
        <p className={`text-xs font-bold uppercase tracking-wide ${theme.muted}`}>
          ការកំណត់
        </p>
        <h2 className={`mt-1 text-base font-extrabold ${theme.pageTitle}`}>
          មជ្ឈមណ្ឌលគ្រប់គ្រង
        </h2>
      </div>

      <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;

          return (
            <button
              key={section.id}
              type="button"
              onClick={() => onSectionChange(section.id)}
              title={section.description}
              className={`group flex min-h-10 min-w-max items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-red-500/15 lg:min-w-0 lg:justify-start ${
                isActive
                  ? "bg-red-500 text-white shadow-sm shadow-red-500/15"
                  : `border border-transparent text-zinc-600 hover:border-red-200 hover:bg-red-50 hover:text-zinc-950 dark:text-zinc-300 dark:hover:border-red-500/30 dark:hover:bg-red-500/10 dark:hover:text-white`
              }`}
            >
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
                isActive ? "bg-white/20 text-white" : "bg-red-500/10 text-red-500"
              }`}>
                <Icon size={15} />
              </span>
              <span className="truncate">{section.title}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
