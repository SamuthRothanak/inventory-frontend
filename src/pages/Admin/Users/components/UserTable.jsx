import {
  FiEdit2,
  FiTrash2,
  FiRefreshCw,
  FiUser,
  FiMail,
  FiPhone,
  FiShield,
  FiCheckCircle,
  FiXCircle,
  FiSearch,
} from "react-icons/fi";
import { capitalize } from "../utils/userUtils";

export default function UserTable({
  filteredUsers,
  isLoading,
  isError,
  error,
  openEditModal,
  onDelete,
  isDeletingId,
  theme,
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border shadow-sm ${theme.tableWrap}`}
    >
      <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-white/10">
        <div>
          <h2 className={`text-base font-semibold ${theme.pageTitle}`}>
            បញ្ជីអ្នកប្រើប្រាស់
          </h2>

          <p className={`mt-1 text-xs ${theme.muted}`}>
            បង្ហាញ {filteredUsers.length} អ្នកប្រើប្រាស់
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px]">
          <thead className="bg-red-600 text-white">
            <tr>
              <th className="px-5 py-3 text-left text-sm font-semibold">
                អ្នកប្រើប្រាស់
              </th>
              <th className="px-5 py-3 text-left text-sm font-semibold">
                ទំនាក់ទំនង
              </th>
              <th className="px-5 py-3 text-center text-sm font-semibold">
                តួនាទី
              </th>
              <th className="px-5 py-3 text-center text-sm font-semibold">
                ស្ថានភាព
              </th>
              <th className="px-5 py-3 text-center text-sm font-semibold">
                សកម្មភាព
              </th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr className={`border-t ${theme.row}`}>
                <td colSpan="5" className="px-4 py-14 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div
                      className={`flex h-16 w-16 items-center justify-center rounded-2xl border ${theme.softCard}`}
                    >
                      <FiRefreshCw
                        className={`animate-spin text-3xl ${theme.muted}`}
                      />
                    </div>

                    <p
                      className={`mt-4 text-sm font-semibold ${theme.pageTitle}`}
                    >
                      រង់ចាំបន្តិច...
                    </p>
                  </div>
                </td>
              </tr>
            ) : isError ? (
              <tr className={`border-t ${theme.row}`}>
                <td colSpan="5" className="px-4 py-14 text-center">
                  <p className="text-sm font-semibold text-red-500">
                    {error?.response?.data?.message || "មិនអាចផ្ទុកអ្នកប្រើប្រាស់បានទេ ។"}
                  </p>
                </td>
              </tr>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((item) => (
                <tr key={item.id} className={`border-t transition ${theme.row}`}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
                        <FiUser size={20} />
                      </div>

                      <div>
                        <p className="text-sm font-semibold leading-5">
                          {item.name || "-"}
                        </p>

                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${theme.badge}`}
                          >
                            @{item.username || "username"}
                          </span>

                          <span className={`text-xs ${theme.muted}`}>
                            ID: {item.id}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <FiMail className={theme.muted} />
                        <span>{item.email || "-"}</span>
                      </div>

                      <div
                        className={`flex items-center gap-2 text-sm ${theme.muted}`}
                      >
                        <FiPhone />
                        <span>{item.phone || "-"}</span>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-center">
                    <span
                      className={`inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${theme.badge}`}
                    >
                      <FiShield />
                      {capitalize(item.role)}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-center">
                    <StatusBadge status={item.status} />
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <Tooltip label="កែអ្នកប្រើប្រាស់">
                        <button type="button" onClick={() => openEditModal(item)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition hover:bg-blue-700">
                          <FiEdit2 size={16} />
                        </button>
                      </Tooltip>
                      <Tooltip label="លុបអ្នកប្រើប្រាស់">
                        <button type="button" onClick={() => onDelete(item)} disabled={isDeletingId === item.id}
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500 text-white shadow-sm transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60">
                          {isDeletingId === item.id ? <FiRefreshCw size={16} className="animate-spin" /> : <FiTrash2 size={16} />}
                        </button>
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr className={`border-t ${theme.row}`}>
                <td colSpan="5" className="px-4 py-14 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div
                      className={`flex h-16 w-16 items-center justify-center rounded-2xl border ${theme.softCard}`}
                    >
                      <FiSearch className={`text-3xl ${theme.muted}`} />
                    </div>

                    <p
                      className={`mt-4 text-sm font-semibold ${theme.pageTitle}`}
                    >
                      រកមិនឃើញអ្នកប្រើប្រាស់
                    </p>

                    <p className={`mt-1 text-xs ${theme.muted}`}>
                      ព្យាយាមប្ដូរពាក្យស្វែងរក ។
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Tooltip({ label, children }) {
  return (
    <div className="relative inline-flex group">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-zinc-800 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-zinc-700">
        {label}
        <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-zinc-800 dark:border-t-zinc-700" />
      </span>
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
        status === "Active"
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-red-500/10 text-red-500 dark:text-red-400"
      }`}
    >
      {status === "Active" ? <FiCheckCircle /> : <FiXCircle />}
      {status === "Active" ? "ដំណើរការ" : "មិនដំណើរការ"}
    </span>
  );
}