export default function SettingsSidebar({
  theme,
  sections,
  activeSection,
  onSectionChange,
}) {
  return (
    <aside className={`border-b p-5 lg:border-b-0 lg:border-r ${theme.sidebar}`}>
      <div className="mb-5 hidden lg:block">
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
                className={`group flex min-h-11 min-w-max items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-red-500/15 lg:min-w-0 lg:justify-start ${
                isActive
                  ? "bg-red-500 text-white shadow-sm shadow-red-500/15"
                  : theme.sidebarItem
              }`}
            >
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
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
