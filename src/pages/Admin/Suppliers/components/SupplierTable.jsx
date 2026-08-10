import {
  FiCheckSquare,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
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
  FiX,
  FiXCircle,
} from "react-icons/fi";

import PermissionGate from "../../../../components/PermissionGate";

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

export default function SupplierTable({
  theme,
  suppliers,
  totalSuppliers,
  pagination,
  page,
  onPageChange,
  isFetching,
  isLoading,
  isError,
  isDeleting = false,
  bulkDeleteIsPending = false,
  bulkSelectMode = false,
  selectedSupplierIds = [],
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
  const pageSupplierIds = suppliers.map((item) => Number(item.id));
  const allVisibleSelected =
    pageSupplierIds.length > 0 &&
    pageSupplierIds.every((id) =>
      selectedSupplierIds.some((selectedId) => Number(selectedId) === id),
    );

  return (
    <div
      className={`overflow-hidden rounded-2xl border shadow-sm ${theme.tableWrap}`}
    >
      <div className="flex flex-col gap-3 border-b border-zinc-200 px-5 py-4 dark:border-white/10 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className={`text-base font-semibold ${theme.pageTitle}`}>
            បញ្ជីអ្នកផ្គត់ផ្គង់
          </h2>

          <p className={`mt-1 text-xs ${theme.muted}`}>
            {isLoading
              ? "រង់ចាំបន្តិច..."
              : `បង្ហាញ ${from || 0}-${to || suppliers.length} នៃ ${totalSuppliers} អ្នកផ្គត់ផ្គង់`}
          </p>
        </div>

        <PermissionGate permission="suppliers.delete">
          <div className="flex flex-wrap items-center gap-2">
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
                  disabled={selectedSupplierIds.length === 0 || bulkDeleteIsPending}
                  className="quick-action-icon-3d inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-500 px-4 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:bg-red-600 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FiTrash2 />
                  {bulkDeleteIsPending
                    ? "កំពុងលុប..."
                    : `លុបដែលបានជ្រើស (${selectedSupplierIds.length})`}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onOpenBulkSelect}
                disabled={suppliers.length === 0 || isLoading || isError}
                className="table-icon-3d inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 text-xs font-semibold text-red-500 transition hover:-translate-y-0.5 hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FiCheckSquare />
                ជ្រើសរើសច្រើន
              </button>
            )}
          </div>
        </PermissionGate>
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
                    aria-label="ជ្រើសអ្នកផ្គត់ផ្គង់ទាំងអស់លើទំព័រនេះ"
                    className="h-4 w-4 rounded border-white/60 text-red-500 focus:ring-red-500"
                  />
                </th>
              )}

              <th className="px-5 py-3 text-left text-sm font-semibold">
                អ្នកផ្ដត់ផ្គង់
              </th>

              <th className="px-5 py-3 text-left text-sm font-semibold">
                ទំនាក់ទំនង
              </th>

              <th className="px-5 py-3 text-left text-sm font-semibold">
                អាសយដ្ឋាន / ចំណាំ
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
              <Supplier3DLoading
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
            ) : suppliers.length > 0 ? (
              suppliers.map((item) => (
                <tr
                  key={item.id}
                  className={`border-t transition ${theme.row}`}
                >
                  {bulkSelectMode && (
                    <td data-label="ជ្រើសរើស" className="px-5 py-4">
                      <input
                        type="checkbox"
                        checked={selectedSupplierIds.some(
                          (id) => Number(id) === Number(item.id),
                        )}
                        onChange={() => onToggleSelect(item.id)}
                        aria-label={`ជ្រើស ${item.name}`}
                        className="h-4 w-4 rounded border-zinc-300 text-red-500 focus:ring-red-500 dark:border-white/20"
                      />
                    </td>
                  )}

                  <td data-label="អ្នកផ្គត់ផ្គង់" className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="table-icon-3d flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
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
                            បានកែ: {item.updatedAt}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td data-label="ទំនាក់ទំនង" className="px-5 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <FiUser className={theme.muted} />
                        <span>{item.contactPerson || "គ្មានអ្នកទំនាក់ទំនង"}</span>
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

                  <td data-label="អាសយដ្ឋាន" className="px-5 py-4">
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

                  <td data-label="ស្ថានភាព" className="px-5 py-4 text-center">
                    <StatusBadge status={item.status} />
                  </td>

                  <td data-label="សកម្មភាព" className="px-5 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <Tooltip label="មើលអ្នកផ្គត់ផ្គង់">
                        <button
                          type="button"
                          onClick={() => onView(item)}
                          className="quick-action-icon-3d flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-white shadow-md shadow-orange-500/20 ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-lg hover:shadow-orange-500/25 focus:outline-none focus:ring-4 focus:ring-orange-500/20 active:translate-y-0"
                        >
                          <FiEye size={16} />
                        </button>
                      </Tooltip>

                      <PermissionGate permission="suppliers.update">
                        <Tooltip label="កែអ្នកផ្គត់ផ្គង់">
                          <button
                            type="button"
                            onClick={() => onEdit(item)}
                            className="quick-action-icon-3d flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20 ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/25 focus:outline-none focus:ring-4 focus:ring-blue-500/20 active:translate-y-0"
                          >
                            <FiEdit2 size={16} />
                          </button>
                        </Tooltip>
                      </PermissionGate>

                      <PermissionGate permission="suppliers.delete">
                        <Tooltip label="លុបអ្នកផ្គត់ផ្គង់">
                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => onDelete(item)}
                            className="quick-action-icon-3d flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-white shadow-md shadow-red-600/20 ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/25 focus:outline-none focus:ring-4 focus:ring-red-500/20 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
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
                      រកមិនឃើញអ្នកផ្គត់ផ្គង់
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
              ),
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

function Supplier3DLoading({ theme, colSpan }) {
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
            <div className="absolute bottom-1 h-5 w-20 animate-pulse rounded-[50%] bg-indigo-500/25 blur-md" />

            <div className="absolute inset-2 animate-spin rounded-full border border-dashed border-indigo-400/50 [animation-duration:3s]" />
            <div className="absolute inset-5 animate-spin rounded-full border-2 border-transparent border-l-violet-300 border-r-indigo-600 [animation-direction:reverse] [animation-duration:1.8s]" />

            <div
              className="relative flex h-16 w-16 items-center justify-center rounded-[20px] border border-white/40 bg-gradient-to-br from-violet-300 via-indigo-500 to-blue-700 text-white"
              style={{
                transform: "rotateX(12deg) rotateY(-18deg) translateZ(18px)",
                boxShadow:
                  "14px 18px 24px rgba(55, 48, 163, 0.3), inset 4px 4px 10px rgba(255,255,255,0.38), inset -5px -7px 12px rgba(30,64,175,0.3)",
              }}
            >
              <div className="absolute inset-1 rounded-[16px] border border-white/20" />
              <FiTruck className="relative text-3xl drop-shadow-md" />
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-400 text-[11px] font-black text-emerald-950 shadow-lg shadow-emerald-400/40">
                ✓
              </span>
            </div>
          </div>

          <p className={`mt-3 text-sm font-bold ${theme.pageTitle}`}>
            រង់ចាំបន្តិច...
          </p>
          <p className={`mt-1 text-xs ${theme.muted}`}>
            កំពុងរៀបចំបញ្ជីអ្នកផ្គត់ផ្គង់
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
