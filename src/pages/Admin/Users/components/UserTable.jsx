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
  handleInactive,
  statusMutation,
  theme,
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border shadow-sm ${theme.tableWrap}`}
    >
      <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-white/10">
        <div>
          <h2 className={`text-base font-semibold ${theme.pageTitle}`}>
            User List
          </h2>

          <p className={`mt-1 text-xs ${theme.muted}`}>
            Showing {filteredUsers.length} users
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px]">
          <thead className="bg-red-600 text-white">
            <tr>
              <th className="px-5 py-3 text-left text-sm font-semibold">
                User
              </th>
              <th className="px-5 py-3 text-left text-sm font-semibold">
                Contact
              </th>
              <th className="px-5 py-3 text-center text-sm font-semibold">
                Role
              </th>
              <th className="px-5 py-3 text-center text-sm font-semibold">
                Status
              </th>
              <th className="px-5 py-3 text-center text-sm font-semibold">
                Actions
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
                      Loading users...
                    </p>
                  </div>
                </td>
              </tr>
            ) : isError ? (
              <tr className={`border-t ${theme.row}`}>
                <td colSpan="5" className="px-4 py-14 text-center">
                  <p className="text-sm font-semibold text-red-500">
                    {error?.response?.data?.message || "Failed to load users."}
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
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        title="Edit user"
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition hover:bg-blue-700"
                      >
                        <FiEdit2 size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleInactive(item)}
                        disabled={statusMutation.isPending}
                        title={
                          item.status === "Active"
                            ? "Deactivate user"
                            : "Activate user"
                        }
                        className={`flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${
                          item.status === "Active"
                            ? "bg-red-500 hover:bg-red-600"
                            : "bg-emerald-500 hover:bg-emerald-600"
                        }`}
                      >
                        {item.status === "Active" ? (
                          <FiTrash2 size={16} />
                        ) : (
                          <FiRefreshCw size={16} />
                        )}
                      </button>
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
                      No users found
                    </p>

                    <p className={`mt-1 text-xs ${theme.muted}`}>
                      Try changing your search keyword.
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
      {status}
    </span>
  );
}