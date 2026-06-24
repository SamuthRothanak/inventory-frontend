import { FiSearch } from "react-icons/fi";

export default function SettingsSidebar({
  theme,
  sections,
  activeSection,
  searchTerm,
  onSearchChange,
  onSectionChange,
}) {
  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${theme.card}`}>
      <div className="relative mb-4">
        <FiSearch
          className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg ${theme.muted}`}
        />

        <input
          type="text"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search settings..."
          className={`h-12 w-full rounded-2xl border pl-11 pr-4 text-sm outline-none transition focus:ring-4 ${theme.input}`}
        />
      </div>

      <div className="space-y-2">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;

          return (
            <button
              key={section.id}
              type="button"
              onClick={() => onSectionChange(section.id)}
              className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition ${
                isActive
                  ? "border-red-500 bg-red-500 text-white shadow-sm"
                  : `${theme.softCard} hover:border-red-300 dark:hover:border-red-500/40`
              }`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  isActive ? "bg-white/20 text-white" : "bg-red-500/10 text-red-500"
                }`}
              >
                <Icon size={19} />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-bold">{section.title}</p>

                <p
                  className={`mt-1 text-xs leading-5 ${
                    isActive ? "text-white/80" : theme.muted
                  }`}
                >
                  {section.description}
                </p>
              </div>
            </button>
          );
        })}

        {sections.length === 0 && (
          <div className={`rounded-2xl border p-4 text-center text-sm ${theme.softCard}`}>
            <p className={theme.muted}>No settings found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
