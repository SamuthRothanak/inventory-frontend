import {
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiCheckSquare,
  FiEdit2,
  FiEye,
  FiSearch,
  FiTrash2,
  FiX,
  FiXCircle,
} from "react-icons/fi";

import CategoryImage from "./CategoryImage";
import TableLoading from "../../../../components/TableLoading";
import PermissionGate from "../../../../components/PermissionGate";

export default function CategoryTable({
  categories,
  totalCategories,
  pagination,
  page,
  onPageChange,
  isFetching,
  isLoading,
  isError,
  error,
  deleteIsPending,
  bulkDeleteIsPending,
  bulkSelectMode = false,
  selectedCategoryIds = [],
  theme,
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
  const selectedCount = selectedCategoryIds.length;
  const pageIds = categories.map((item) => Number(item.id));
  const hasCategories = categories.length > 0;
  const allPageSelected =
    hasCategories &&
    pageIds.every((id) =>
      selectedCategoryIds.some((selectedId) => Number(selectedId) === id)
    );
  const tableColSpan = bulkSelectMode ? 5 : 4;

  const pageNumbers = getPageNumbers(currentPage, totalPages);

  return (
    <div
      className={`overflow-hidden rounded-2xl border shadow-sm ${theme.tableWrap}`}
    >
      <div className="flex flex-col gap-3 border-b border-zinc-200 px-5 py-4 dark:border-white/10 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className={`text-base font-semibold ${theme.title}`}>
            បញ្ជីប្រភេទ
          </h2>

          <p className={`mt-1 text-xs ${theme.muted}`}>
            {isLoading
              ? "រង់ចាំបន្តិច..."
              : `បង្ហាញ ${from || 0}-${to || categories.length} នៃ ${totalCategories} ប្រភេទ`}
          </p>
        </div>

        <PermissionGate permission="categories.delete">
          {bulkSelectMode ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onCancelBulkSelect}
                disabled={bulkDeleteIsPending || deleteIsPending}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
              >
                <FiX />
                បោះបង់
              </button>

              <button
                type="button"
                onClick={onBulkDelete}
                disabled={selectedCount === 0 || bulkDeleteIsPending || deleteIsPending}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-500 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FiTrash2 />
                {bulkDeleteIsPending ? "កំពុងលុប..." : `លុបដែលបានជ្រើស (${selectedCount})`}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenBulkSelect}
              disabled={!hasCategories || isLoading || isError}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 text-sm font-semibold text-red-500 shadow-sm transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiCheckSquare />
              ជ្រើសរើសច្រើន
            </button>
          )}
        </PermissionGate>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead className="bg-red-600 text-white">
            <tr>
              {bulkSelectMode && (
                <th className="w-14 px-5 py-3 text-left text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    disabled={!hasCategories || isLoading || isError}
                    onChange={onToggleSelectAll}
                    className="h-4 w-4 rounded border-white/40 accent-red-500"
                    aria-label="Select all categories on this page"
                  />
                </th>
              )}

              <th className="px-5 py-3 text-left text-sm font-semibold">
                ប្រភេទ
              </th>

              <th className="px-5 py-3 text-left text-sm font-semibold">
                ការពិពណ៌នា
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
              <TableLoading
                theme={theme}
                colSpan={tableColSpan}
                text="រង់ចាំបន្តិច..."
              />
            ) : isError ? (
              <tr className={`border-t ${theme.row}`}>
                <td colSpan={tableColSpan} className="px-4 py-14 text-center">
                  <p className="text-sm font-semibold text-red-500">
                    {error?.response?.data?.message ||
                      "មិនអាចផ្ទុកប្រភេទ។"}
                  </p>
                </td>
              </tr>
            ) : categories.length > 0 ? (
              categories.map((item) => (
                <tr
                  key={item.id}
                  className={`border-t transition ${theme.row}`}
                >
                  {bulkSelectMode && (
                    <td className="px-5 py-4">
                      <input
                        type="checkbox"
                        checked={selectedCategoryIds.some(
                          (id) => Number(id) === Number(item.id)
                        )}
                        onChange={() => onToggleSelect(item.id)}
                        disabled={deleteIsPending || bulkDeleteIsPending}
                        className="h-4 w-4 rounded border-zinc-300 accent-red-500 dark:border-white/20"
                        aria-label={`Select ${item.name}`}
                      />
                    </td>
                  )}

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <CategoryImage image={item.imagePath} name={item.name} />

                      <div>
                        <p className="text-sm font-semibold leading-5">
                          {item.name}
                        </p>

                        {item.hasBeenUpdated && (
                          <p className={`mt-1 text-xs ${theme.muted}`}>
                            បានកែ: {item.updatedAt}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <p
                      className={`max-w-[520px] text-sm leading-6 ${theme.muted}`}
                    >
                      {item.description || "-"}
                    </p>
                  </td>

                  <td className="px-5 py-4 text-center">
                    <StatusBadge status={item.status} />
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <Tooltip label="មើលប្រភេទ">
                        <button
                          type="button"
                          onClick={() => onView(item)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm transition hover:bg-amber-600"
                        >
                          <FiEye size={16} />
                        </button>
                      </Tooltip>

                      <PermissionGate permission="categories.update">
                        <Tooltip label="កែប្រភេទ">
                          <button
                            type="button"
                            onClick={() => onEdit(item)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition hover:bg-blue-700"
                          >
                            <FiEdit2 size={16} />
                          </button>
                        </Tooltip>
                      </PermissionGate>

                      <PermissionGate permission="categories.delete">
                        <Tooltip label="លុបប្រភេទ">
                          <button
                            type="button"
                            onClick={() => onDelete(item.id)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500 text-white shadow-sm transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={deleteIsPending}
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
                      className={`flex h-16 w-16 items-center justify-center rounded-2xl border ${theme.softCard}`}
                    >
                      <FiSearch className={`text-3xl ${theme.muted}`} />
                    </div>

                    <p className={`mt-4 text-sm font-semibold ${theme.title}`}>
                      រកមិនឃើញប្រភេទ
                    </p>

                    <p className={`mt-1 text-xs ${theme.muted}`}>
                      ព្យាយាមប្តូរពាក្យស្វែងរក ឬតម្រងស្ថានភាព។
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
              className="inline-flex h-9 items-center gap-1 rounded-xl border border-zinc-300 bg-white px-3 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
            >
              <FiChevronLeft />
              មុន
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
                  className={`h-9 min-w-9 rounded-xl px-3 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
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
              className="inline-flex h-9 items-center gap-1 rounded-xl border border-zinc-300 bg-white px-3 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
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
