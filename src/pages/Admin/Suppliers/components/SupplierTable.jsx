import {
  FiCheckCircle,
  FiEdit2,
  FiEye,
  FiFileText,
  FiMail,
  FiMapPin,
  FiPhone,
  FiSearch,
  FiTrash2,
  FiTruck,
  FiUser,
  FiXCircle,
} from "react-icons/fi";

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

export default function SupplierTable({
  theme,
  suppliers,
  filteredSuppliers,
  isLoading,
  isError,
  onView,
  onEdit,
  onToggleStatus,
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border shadow-sm ${theme.tableWrap}`}
    >
      <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-white/10">
        <div>
          <h2 className={`text-base font-semibold ${theme.pageTitle}`}>
            Supplier List
          </h2>

          <p className={`mt-1 text-xs ${theme.muted}`}>
            Showing {filteredSuppliers.length} of {suppliers.length} suppliers
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full">
          <thead className="bg-red-600 text-white">
            <tr>
              <th className="px-5 py-3 text-left text-sm font-semibold">
                Supplier
              </th>
              <th className="px-5 py-3 text-left text-sm font-semibold">
                Contact
              </th>
              <th className="px-5 py-3 text-left text-sm font-semibold">
                Address / Note
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
            {isLoading && (
              <tr className={`border-t ${theme.row}`}>
                <td colSpan="5" className="px-4 py-14 text-center">
                  <p className={`text-sm font-semibold ${theme.pageTitle}`}>
                    Loading suppliers...
                  </p>
                </td>
              </tr>
            )}

            {isError && !isLoading && (
              <tr className={`border-t ${theme.row}`}>
                <td colSpan="5" className="px-4 py-14 text-center">
                  <p className="text-sm font-semibold text-red-500">
                    Failed to load suppliers.
                  </p>
                </td>
              </tr>
            )}

            {!isLoading &&
              !isError &&
              filteredSuppliers.map((item) => (
                <tr key={item.id} className={`border-t transition ${theme.row}`}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
                        <FiTruck size={20} />
                      </div>

                      <div>
                        <p className="text-sm font-semibold leading-5">
                          {item.name}
                        </p>

                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${theme.badge}`}
                          >
                            {item.supplierCode}
                          </span>

                          <span className={`text-xs ${theme.muted}`}>
                            Updated: {item.updatedAt}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <FiUser className={theme.muted} />
                        <span>{item.contactPerson || "No contact person"}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <FiPhone className={theme.muted} />
                        <span>{item.phone || "-"}</span>
                      </div>

                      {item.email && (
                        <div className="flex items-center gap-2 text-xs">
                          <FiMail className={theme.muted} />
                          <span className={theme.muted}>{item.email}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="space-y-2">
                      <div
                        className={`flex max-w-[380px] gap-2 text-sm leading-6 ${theme.address}`}
                      >
                        <FiMapPin className="mt-1 shrink-0" />
                        <span className="line-clamp-2">
                          {item.address || "-"}
                        </span>
                      </div>

                      {item.note && (
                        <div
                          className={`flex max-w-[380px] gap-2 text-xs leading-5 ${theme.note}`}
                        >
                          <FiFileText className="mt-0.5 shrink-0" />
                          <span className="line-clamp-1">{item.note}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-5 py-4 text-center">
                    <StatusBadge status={item.status} />
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => onView(item)}
                        title="View supplier"
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm transition hover:bg-amber-600"
                      >
                        <FiEye size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        title="Edit supplier"
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition hover:bg-blue-700"
                      >
                        <FiEdit2 size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onToggleStatus(item)}
                        title="Activate / Deactivate supplier"
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500 text-white shadow-sm transition hover:bg-red-600"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

            {!isLoading && !isError && filteredSuppliers.length === 0 && (
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
                      No suppliers found
                    </p>

                    <p className={`mt-1 text-xs ${theme.muted}`}>
                      Try changing your search keyword or status filter.
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