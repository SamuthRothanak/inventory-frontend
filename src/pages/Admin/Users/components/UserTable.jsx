import {
  FiEdit2,
  FiEye,
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
import { getRoleLabel } from "../utils/userUtils";
import PermissionGate from "../../../../components/PermissionGate";

export default function UserTable({
  filteredUsers,
  isLoading,
  isError,
  error,
  openViewModal,
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
        <table className="responsive-card-table w-full min-w-[980px]">
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
              <Users3DLoading theme={theme} colSpan={5} />
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
                  <td data-label="អ្នកប្រើប្រាស់" className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="table-icon-3d flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
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
                            @{item.username || "ឈ្មោះអ្នកប្រើ"}
                          </span>

                          <span className={`text-xs ${theme.muted}`}>
                            លេខសម្គាល់៖ {item.id}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td data-label="ទំនាក់ទំនង" className="px-5 py-4">
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

                  <td data-label="តួនាទី" className="px-5 py-4 text-center">
                    <span
                      className={`inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${theme.badge}`}
                    >
                      <FiShield />
                      {getRoleLabel(item.role)}
                    </span>
                  </td>

                  <td data-label="ស្ថានភាព" className="px-5 py-4 text-center">
                    <StatusBadge status={item.status} />
                  </td>

                  <td data-label="សកម្មភាព" className="px-5 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <Tooltip label="មើលអ្នកប្រើប្រាស់">
                        <button
                          type="button"
                          onClick={() => openViewModal(item)}
                          className="quick-action-icon-3d flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-white shadow-orange-500/20 ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-orange-500/25 focus:outline-none focus:ring-4 focus:ring-orange-500/20 active:translate-y-0"
                        >
                          <FiEye size={16} />
                        </button>
                      </Tooltip>
                      <PermissionGate permission="users.update">
                        <Tooltip label="កែអ្នកប្រើប្រាស់">
                          <button type="button" onClick={() => openEditModal(item)}
                            className="quick-action-icon-3d flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-blue-600/20 ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-blue-600/25 focus:outline-none focus:ring-4 focus:ring-blue-500/20 active:translate-y-0">
                            <FiEdit2 size={16} />
                          </button>
                        </Tooltip>
                      </PermissionGate>
                      <PermissionGate permission="users.delete">
                        <Tooltip label="លុបអ្នកប្រើប្រាស់">
                          <button type="button" onClick={() => onDelete(item)} disabled={isDeletingId === item.id}
                                className="quick-action-icon-3d flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-white shadow-red-600/20 ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-red-600/25 focus:outline-none focus:ring-4 focus:ring-red-500/20 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60">
                            {isDeletingId === item.id ? <FiRefreshCw size={16} className="animate-spin" /> : <FiTrash2 size={16} />}
                          </button>
                        </Tooltip>
                      </PermissionGate>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr className={`border-t ${theme.row}`}>
                <td colSpan="5" className="px-4 py-14 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div
                      className={`summary-icon-3d flex h-16 w-16 items-center justify-center rounded-2xl border ${theme.softCard}`}
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

function Users3DLoading({ theme, colSpan }) {
  return (
    <tr className={`border-t ${theme.row}`}>
      <td colSpan={colSpan} className="px-4 py-16 text-center">
        <div
          className="flex min-h-[230px] flex-col items-center justify-center"
          role="status"
          aria-live="polite"
        >
          <div
            className="relative flex h-32 w-32 items-center justify-center"
            style={{ perspective: "700px" }}
          >
            <div className="absolute bottom-1 h-5 w-20 animate-pulse rounded-[50%] bg-cyan-500/25 blur-md" />

            <div className="absolute inset-2 animate-spin rounded-full border border-dashed border-cyan-400/50 [animation-duration:3s]" />
            <div className="absolute inset-5 animate-spin rounded-full border-2 border-transparent border-l-sky-300 border-r-cyan-600 [animation-direction:reverse] [animation-duration:1.8s]" />

            <div
              className="relative flex h-16 w-16 items-center justify-center rounded-[20px] border border-white/40 bg-gradient-to-br from-sky-300 via-cyan-500 to-blue-700 text-white"
              style={{
                transform: "rotateX(12deg) rotateY(-18deg) translateZ(18px)",
                boxShadow:
                  "14px 18px 24px rgba(14, 116, 144, 0.3), inset 4px 4px 10px rgba(255,255,255,0.35), inset -5px -7px 12px rgba(30,64,175,0.3)",
              }}
            >
              <div className="absolute inset-1 rounded-[16px] border border-white/20" />
              <FiUser className="relative text-3xl drop-shadow-md" />
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-400 text-[11px] font-black text-emerald-950 shadow-lg shadow-emerald-400/40">
                +
              </span>
            </div>
          </div>

          <p className={`mt-3 text-sm font-bold ${theme.pageTitle}`}>
            រង់ចាំបន្តិច...
          </p>
          <p className={`mt-1 text-xs ${theme.muted}`}>
            កំពុងរៀបចំបញ្ជីអ្នកប្រើប្រាស់
          </p>
        </div>
      </td>
    </tr>
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
