import {
  FiCheckCircle,
  FiEdit2,
  FiEye,
  FiMapPin,
  FiPhone,
  FiSearch,
  FiShoppingBag,
  FiTrash2,
  FiXCircle,
} from "react-icons/fi";

export default function CustomerTable({
  theme,
  customers,
  filteredCustomers,
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
            Customer List
          </h2>

          <p className={`mt-1 text-xs ${theme.muted}`}>
            Showing {filteredCustomers.length} of {customers.length} customers
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full">
          <thead className="bg-red-600 text-white">
            <tr>
              <th className="px-5 py-3 text-left text-sm font-semibold">
                Customer
              </th>
              <th className="px-5 py-3 text-left text-sm font-semibold">
                Contact
              </th>
              <th className="px-5 py-3 text-left text-sm font-semibold">
                Address
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
                    Loading customers...
                  </p>
                </td>
              </tr>
            )}

            {isError && !isLoading && (
              <tr className={`border-t ${theme.row}`}>
                <td colSpan="5" className="px-4 py-14 text-center">
                  <p className="text-sm font-semibold text-red-500">
                    Failed to load customers.
                  </p>
                </td>
              </tr>
            )}

            {!isLoading &&
              !isError &&
              filteredCustomers.map((item) => (
                <tr key={item.id} className={`border-t transition ${theme.row}`}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
                        <FiShoppingBag size={20} />
                      </div>

                      <div>
                        <p className="text-sm font-semibold leading-5">
                          {item.shopName}
                        </p>

                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${theme.badge}`}
                          >
                            {item.customerCode}
                          </span>

                          <span className={`text-xs ${theme.muted}`}>
                            {item.contactName || "No contact"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <FiPhone className={theme.muted} />
                        <span>{item.phone || "-"}</span>
                      </div>

                      <p className={`text-xs ${theme.muted}`}>
                        Updated: {item.updatedAt}
                      </p>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div
                      className={`flex max-w-[360px] gap-2 text-sm leading-6 ${theme.address}`}
                    >
                      <FiMapPin className="mt-1 shrink-0" />
                      <span className="line-clamp-2">
                        {item.address || "-"}
                      </span>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-center">
                    <span
                      className={`inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                        item.status === "Active"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-red-500/10 text-red-500 dark:text-red-400"
                      }`}
                    >
                      {item.status === "Active" ? (
                        <FiCheckCircle />
                      ) : (
                        <FiXCircle />
                      )}
                      {item.status}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => onView(item)}
                        title="View customer"
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm transition hover:bg-amber-600"
                      >
                        <FiEye size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        title="Edit customer"
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition hover:bg-blue-700"
                      >
                        <FiEdit2 size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onToggleStatus(item)}
                        title="Activate / Deactivate customer"
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500 text-white shadow-sm transition hover:bg-red-600"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

            {!isLoading && !isError && filteredCustomers.length === 0 && (
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
                      No customers found
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