import { FiSearch, FiPlusCircle } from "react-icons/fi";
import PermissionGate from "../../../../components/PermissionGate";

export default function UserToolbar({
  search,
  setSearch,
  openCreateModal,
  theme,
}) {
  return (
    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div className="relative w-full xl:max-w-4xl">
        <FiSearch
          className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg ${theme.muted}`}
        />

        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="ស្វែងរកឈ្មោះ, username, email, ទូរស័ព្ទ, តួនាទី..."
          className={`h-12 w-full rounded-2xl border pl-11 pr-4 text-sm outline-none transition focus:ring-4 ${theme.input}`}
        />
      </div>

      <PermissionGate permission="users.create">
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600"
        >
          <FiPlusCircle className="text-lg" />
          បន្ថែមអ្នកប្រើប្រាស់
        </button>
      </PermissionGate>
    </div>
  );
}