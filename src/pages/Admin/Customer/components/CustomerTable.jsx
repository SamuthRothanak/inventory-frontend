import {
  FiCheckSquare,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiEdit2,
  FiEye,
  FiMapPin,
  FiPhone,
  FiSearch,
  FiShoppingBag,
  FiTrash2,
  FiUsers,
  FiX,
  FiXCircle,
} from "react-icons/fi";

import PermissionGate from "../../../../components/PermissionGate";

export default function CustomerTable({
  theme,
  customers,
  totalCustomers,
  pagination,
  page,
  onPageChange,
  isFetching,
  isLoading,
  isError,
  isDeleting = false,
  bulkDeleteIsPending = false,
  bulkSelectMode = false,
  selectedCustomerIds = [],
  onView,
  onEdit,
  onDelete,
  onOpenBulkSelect,
  onCancelBulkSelect,
  onToggleSelect,
  onToggleSelectAll,
  onBulkDelete,
}) {
  const totalPages = Number(pagination?.lastPage || 1);
  const currentPage = Number(pagination?.currentPage || page || 1);
  const from = Number(pagination?.from || 0);
  const to = Number(pagination?.to || 0);

  const pageNumbers = getPageNumbers(currentPage, totalPages);
  const tableColSpan = bulkSelectMode ? 6 : 5;
  const pageCustomerIds = customers.map((item) => Number(item.id));
  const allVisibleSelected =
    pageCustomerIds.length > 0 &&
    pageCustomerIds.every((id) =>
      selectedCustomerIds.some((selectedId) => Number(selectedId) === id)
    );

  return (
    <div
      className={`overflow-hidden rounded-2xl border shadow-sm ${theme.tableWrap}`}
    >
      <div className="flex flex-col gap-3 border-b border-zinc-200 px-5 py-4 dark:border-white/10 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className={`text-base font-semibold ${theme.pageTitle}`}>
            បញ្ជីអតិថិជន
          </h2>

          <p className={`mt-1 text-xs ${theme.muted}`}>
            {isLoading
              ? "រង់ចាំបន្តិច..."
              : `បង្ហាញ ${from || 0}-${to || customers.length} នៃ ${totalCustomers} អតិថិជន`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <PermissionGate permission="customers.delete">
            {bulkSelectMode ? (
              <>
                <button
                  type="button"
                  onClick={onCancelBulkSelect}
                  disabled={bulkDeleteIsPending}
                  className="table-icon-3d inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 text-xs font-semibold text-zinc-700 transition hover:-translate-y-0.5 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
                >
                  <FiX />
                  បោះបង់
                </button>

                <button
                  type="button"
                  onClick={onBulkDelete}
                  disabled={selectedCustomerIds.length === 0 || bulkDeleteIsPending}
                  className="quick-action-icon-3d inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-500 px-4 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FiTrash2 />
                  {bulkDeleteIsPending
                    ? "កំពុងលុប..."
                    : `លុបដែលបានជ្រើស (${selectedCustomerIds.length})`}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onOpenBulkSelect}
                disabled={customers.length === 0 || isLoading || isError}
                className="table-icon-3d inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 text-xs font-semibold text-red-500 transition hover:-translate-y-0.5 hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FiCheckSquare />
                ជ្រើសរើសច្រើន
              </button>
            )}
          </PermissionGate>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="responsive-card-table w-full min-w-[1040px]">
          <thead className="bg-red-600 text-white">
            <tr>
              {bulkSelectMode && (
                <th className="w-14 px-5 py-3 text-left text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={onToggleSelectAll}
                    aria-label="ជ្រើសអតិថិជនទាំងអស់លើទំព័រនេះ"
                    className="h-4 w-4 rounded border-white/60 text-red-500 focus:ring-red-500"
                  />
                </th>
              )}

              <th className="px-5 py-3 text-left text-sm font-semibold">
                អតិថិជន
              </th>

              <th className="px-5 py-3 text-left text-sm font-semibold">
                ទំនាក់ទំនង
              </th>

              <th className="px-5 py-3 text-left text-sm font-semibold">
                អាសយដ្ឋាន
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
              <Customer3DLoading
                theme={theme}
                colSpan={tableColSpan}
              />
            ) : isError ? (
              <tr className={`border-t ${theme.row}`}>
                <td colSpan={tableColSpan} className="px-4 py-14 text-center">
                  <p className="text-sm font-semibold text-red-500">
                    មិនអាចផ្ទុកអតិថិជនបានទេ។
                  </p>
                </td>
              </tr>
            ) : customers.length > 0 ? (
              customers.map((item) => (
                <tr
                  key={item.id}
                  className={`border-t transition ${theme.row}`}
                >
                  {bulkSelectMode && (
                    <td data-label="ជ្រើសរើស" className="px-5 py-4">
                      <input
                        type="checkbox"
                        checked={selectedCustomerIds.some(
                          (id) => Number(id) === Number(item.id)
                        )}
                        onChange={() => onToggleSelect(item.id)}
                        aria-label={`ជ្រើស ${item.contactName || item.shopName}`}
                        className="h-4 w-4 rounded border-zinc-300 text-red-500 focus:ring-red-500 dark:border-white/20"
                      />
                    </td>
                  )}

                  <td data-label="អតិថិជន" className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="table-icon-3d flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
                        <FiShoppingBag size={20} />
                      </div>

                      <div>
                        {/* "គ្រប់គ្រងអតិថិជន" (Customer Management) — the person's own name leads,
                            shop name moves down to the badge row. Falls back to shop name if a
                            customer was saved with no contact name at all. */}
                        <p className="text-sm font-semibold leading-5">
                          {item.contactName || item.shopName}
                        </p>

                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${theme.badge}`}
                          >
                            {item.customerCode}
                          </span>

                          <span className={`text-xs ${theme.muted}`}>
                            {item.shopName}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td data-label="ទំនាក់ទំនង" className="px-5 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <FiPhone className={theme.muted} />
                        <span>{item.phone || "-"}</span>
                      </div>

                      <p className={`text-xs ${theme.muted}`}>
                        បានកែ: {item.updatedAt}
                      </p>
                    </div>
                  </td>

                  <td data-label="អាសយដ្ឋាន" className="px-5 py-4">
                    <div
                      className={`flex max-w-[360px] gap-2 text-sm leading-6 ${theme.address}`}
                    >
                      <FiMapPin className="mt-1 shrink-0" />
                      <span className="line-clamp-2">
                        {item.address || "-"}
                      </span>
                    </div>
                  </td>

                  <td data-label="ស្ថានភាព" className="px-5 py-4 text-center">
                    <StatusBadge status={item.status} />
                  </td>

                  <td data-label="សកម្មភាព" className="px-5 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <Tooltip label="មើលអតិថិជន">
                        <button
                          type="button"
                          onClick={() => onView(item)}
                          className="quick-action-icon-3d flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-white shadow-orange-500/20 ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-orange-500/25 focus:outline-none focus:ring-4 focus:ring-orange-500/20 active:translate-y-0"
                        >
                          <FiEye size={16} />
                        </button>
                      </Tooltip>

                      <PermissionGate permission="customers.update">
                        <Tooltip label="កែអតិថិជន">
                          <button
                            type="button"
                            onClick={() => onEdit(item)}
                            className="quick-action-icon-3d flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-blue-600/20 ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-blue-600/25 focus:outline-none focus:ring-4 focus:ring-blue-500/20 active:translate-y-0"
                          >
                            <FiEdit2 size={16} />
                          </button>
                        </Tooltip>
                      </PermissionGate>

                      <PermissionGate permission="customers.delete">
                        <Tooltip label="លុបអតិថិជន">
                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => onDelete(item)}
                             className="quick-action-icon-3d flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-white shadow-red-600/20 ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-red-600/25 focus:outline-none focus:ring-4 focus:ring-red-500/20 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </Tooltip>
                      </PermissionGate>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr className={`border-t ${theme.row}`}>
                <td colSpan={tableColSpan} className="px-4 py-14 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div
                      className={`summary-icon-3d flex h-16 w-16 items-center justify-center rounded-2xl border ${theme.softCard}`}
                    >
                      <FiSearch className={`text-3xl ${theme.muted}`} />
                    </div>

                    <p
                      className={`mt-4 text-sm font-semibold ${theme.pageTitle}`}
                    >
                      រកមិនឃើញអតិថិជន
                    </p>

                    <p className={`mt-1 text-xs ${theme.muted}`}>
                      សូមប្តូរពាក្យស្វែងរក ឬតម្រងស្ថានភាព។
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!isLoading && !isError && totalPages > 1 && (
        <div className="flex flex-col gap-3 border-t border-zinc-200 px-5 py-4 dark:border-white/10 md:flex-row md:items-center md:justify-between">
          <p className={`text-xs ${theme.muted}`}>
            ទំព័រ {currentPage} នៃ {totalPages}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1 || isFetching}
              onClick={() => onPageChange(currentPage - 1)}
              className="table-icon-3d inline-flex h-9 items-center gap-1 rounded-xl border border-zinc-300 bg-white px-3 text-xs font-semibold text-zinc-700 transition hover:-translate-y-0.5 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
            >
              <FiChevronLeft />
              ថយក្រោយ
            </button>

            {pageNumbers.map((item) =>
              item === "..." ? (
                <span
                  key={item}
                  className={`px-2 text-sm font-semibold ${theme.muted}`}
                >
                  ...
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  disabled={isFetching}
                  onClick={() => onPageChange(item)}
                  className={`table-icon-3d h-9 min-w-9 rounded-xl px-3 text-xs font-bold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 ${
                    item === currentPage
                      ? "bg-red-600 text-white"
                      : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
                  }`}
                >
                  {item}
                </button>
              )
            )}

            <button
              type="button"
              disabled={currentPage >= totalPages || isFetching}
              onClick={() => onPageChange(currentPage + 1)}
              className="table-icon-3d inline-flex h-9 items-center gap-1 rounded-xl border border-zinc-300 bg-white px-3 text-xs font-semibold text-zinc-700 transition hover:-translate-y-0.5 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
            >
              បន្ទាប់
              <FiChevronRight />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Customer3DLoading({ theme, colSpan }) {
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
            <div className="absolute bottom-1 h-5 w-20 animate-pulse rounded-[50%] bg-red-500/25 blur-md" />

            <div className="absolute inset-2 animate-spin rounded-full border border-dashed border-red-400/50 [animation-duration:3s]" />
            <div className="absolute inset-5 animate-spin rounded-full border-2 border-transparent border-l-rose-400 border-r-red-500 [animation-direction:reverse] [animation-duration:1.8s]" />

            <div
              className="relative flex h-16 w-16 items-center justify-center rounded-[20px] border border-white/40 bg-gradient-to-br from-rose-400 via-red-500 to-red-700 text-white"
              style={{
                transform: "rotateX(12deg) rotateY(-18deg) translateZ(18px)",
                boxShadow:
                  "14px 18px 24px rgba(127, 29, 29, 0.28), inset 4px 4px 10px rgba(255,255,255,0.32), inset -5px -7px 12px rgba(127,29,29,0.28)",
              }}
            >
              <div className="absolute inset-1 rounded-[16px] border border-white/20" />
              <FiUsers className="relative text-3xl drop-shadow-md" />
              <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-400 shadow-lg shadow-emerald-400/40" />
            </div>
          </div>

          <p className={`mt-3 text-sm font-bold ${theme.pageTitle}`}>
            រង់ចាំបន្តិច...
          </p>
          <p className={`mt-1 text-xs ${theme.muted}`}>
            កំពុងរៀបចំបញ្ជីអតិថិជន
          </p>
        </div>
      </td>
    </tr>
  );
}

function getPageNumbers(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "...", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      "...",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "...",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "...",
    totalPages,
  ];
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
  const isActive = status === "Active";

  return (
    <span
      className={`inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
        isActive
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-red-500/10 text-red-500 dark:text-red-400"
      }`}
    >
      {isActive ? <FiCheckCircle /> : <FiXCircle />}
      {isActive ? "ដំណើរការ" : "មិនដំណើរការ"}
    </span>
  );
}
