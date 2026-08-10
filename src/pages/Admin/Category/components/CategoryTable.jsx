import {
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiCheckSquare,
  FiEdit2,
  FiEye,
  FiSearch,
  FiTag,
  FiTrash2,
  FiX,
  FiXCircle,
} from "react-icons/fi";

import CategoryImage from "./CategoryImage";
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
      <div className="flex flex-col gap-3 border-b border-zinc-200 px-4 py-4 dark:border-white/10 sm:px-5 md:flex-row md:items-center md:justify-between">
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
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
              <button
                type="button"
                onClick={onCancelBulkSelect}
                disabled={bulkDeleteIsPending || deleteIsPending}
                className="table-icon-3d inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-3 text-sm font-semibold text-zinc-700 transition hover:-translate-y-0.5 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 sm:h-10 sm:px-4"
              >
                <FiX />
                បោះបង់
              </button>

              <button
                type="button"
                onClick={onBulkDelete}
                disabled={selectedCount === 0 || bulkDeleteIsPending || deleteIsPending}
                className="quick-action-icon-3d inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-500 px-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-red-600 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:px-4"
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
              className="table-icon-3d inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 text-sm font-semibold text-red-500 transition hover:-translate-y-0.5 hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:w-auto"
            >
              <FiCheckSquare />
              ជ្រើសរើសច្រើន
            </button>
          )}
        </PermissionGate>
      </div>

      <div className="hidden overflow-x-auto lg:block">
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
              <Category3DLoading
                theme={theme}
                colSpan={tableColSpan}
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
                          className="quick-action-icon-3d flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-white shadow-md shadow-orange-500/20 ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-lg hover:shadow-orange-500/25 focus:outline-none focus:ring-4 focus:ring-orange-500/20 active:translate-y-0"
                        >
                          <FiEye size={16} />
                        </button>
                      </Tooltip>

                      <PermissionGate permission="categories.update">
                        <Tooltip label="កែប្រភេទ">
                          <button
                            type="button"
                            onClick={() => onEdit(item)}
                            className="quick-action-icon-3d flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20 ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/25 focus:outline-none focus:ring-4 focus:ring-blue-500/20 active:translate-y-0"
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
                            className="quick-action-icon-3d flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-white shadow-md shadow-red-600/20 ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/25 focus:outline-none focus:ring-4 focus:ring-red-500/20 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
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

      <div className="divide-y divide-zinc-200 dark:divide-white/10 lg:hidden">
        {isLoading ? (
          <CategoryMobileLoading theme={theme} />
        ) : isError ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm font-semibold text-red-500">
              {error?.response?.data?.message || "មិនអាចផ្ទុកប្រភេទ។"}
            </p>
          </div>
        ) : hasCategories ? (
          categories.map((item) => {
            const isSelected = selectedCategoryIds.some(
              (id) => Number(id) === Number(item.id)
            );

            return (
              <article key={item.id} className="p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  {bulkSelectMode && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(item.id)}
                      disabled={deleteIsPending || bulkDeleteIsPending}
                      className="mt-5 h-5 w-5 shrink-0 rounded border-zinc-300 accent-red-500 dark:border-white/20"
                      aria-label={`Select ${item.name}`}
                    />
                  )}

                  <CategoryImage image={item.imagePath} name={item.name} />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className={`break-words text-sm font-bold leading-6 ${theme.title}`}>
                          {item.name}
                        </h3>
                        {item.hasBeenUpdated && (
                          <p className={`mt-0.5 text-xs ${theme.muted}`}>
                            បានកែ: {item.updatedAt}
                          </p>
                        )}
                      </div>
                      <StatusBadge status={item.status} />
                    </div>

                    <p className={`mt-3 line-clamp-3 text-sm leading-6 ${theme.muted}`}>
                      {item.description || "គ្មានការពិពណ៌នា។"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-end gap-2 border-t border-zinc-200 pt-3 dark:border-white/10">
                  <span className={`mr-auto text-[11px] font-bold ${theme.muted}`}>សកម្មភាព</span>
                  <button
                    type="button"
                    onClick={() => onView(item)}
                    title="មើលប្រភេទ"
                    aria-label="មើលប្រភេទ"
                    className="quick-action-icon-3d inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white shadow-md shadow-orange-500/20 ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-500/20"
                  >
                    <FiEye size={17} />
                  </button>

                  <PermissionGate permission="categories.update">
                    <button
                      type="button"
                      onClick={() => onEdit(item)}
                      title="កែប្រភេទ"
                      aria-label="កែប្រភេទ"
                      className="quick-action-icon-3d inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20 ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
                    >
                      <FiEdit2 size={17} />
                    </button>
                  </PermissionGate>

                  <PermissionGate permission="categories.delete">
                    <button
                      type="button"
                      onClick={() => onDelete(item.id)}
                      disabled={deleteIsPending}
                      title="លុបប្រភេទ"
                      aria-label="លុបប្រភេទ"
                      className="quick-action-icon-3d inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white shadow-md shadow-red-600/20 ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <FiTrash2 size={17} />
                    </button>
                  </PermissionGate>
                </div>
              </article>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
            <div className={`flex h-16 w-16 items-center justify-center rounded-2xl border ${theme.softCard}`}>
              <FiSearch className={`text-3xl ${theme.muted}`} />
            </div>
            <p className={`mt-4 text-sm font-semibold ${theme.title}`}>រកមិនឃើញប្រភេទ</p>
            <p className={`mt-1 text-xs ${theme.muted}`}>ព្យាយាមប្តូរពាក្យស្វែងរក ឬតម្រងស្ថានភាព។</p>
          </div>
        )}
      </div>

      {!isLoading && !isError && totalPages > 1 && (
        <div className="flex flex-col gap-3 border-t border-zinc-200 px-4 py-4 dark:border-white/10 sm:px-5 md:flex-row md:items-center md:justify-between">
          <p className={`text-xs ${theme.muted}`}>
            ទំព័រ {currentPage} នៃ {totalPages}
          </p>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
            <button
              type="button"
              disabled={currentPage <= 1 || isFetching}
              onClick={() => onPageChange(currentPage - 1)}
              className="table-icon-3d inline-flex h-11 items-center justify-center gap-1 rounded-xl border border-zinc-300 bg-white px-3 text-xs font-semibold text-zinc-700 transition hover:-translate-y-0.5 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 sm:h-9"
            >
              <FiChevronLeft />
              មុន
            </button>

            {pageNumbers.map((item) =>
              item === "..." ? (
                <span
                  key={item}
                  className={`hidden px-2 text-sm font-semibold sm:inline ${theme.muted}`}
                >
                  ...
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  disabled={isFetching}
                  onClick={() => onPageChange(item)}
                  className={`hidden h-9 min-w-9 rounded-xl px-3 text-xs font-bold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 sm:block ${
                    item === currentPage
                      ? "quick-action-icon-3d bg-red-600 text-white"
                      : "table-icon-3d border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
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
              className="table-icon-3d inline-flex h-11 items-center justify-center gap-1 rounded-xl border border-zinc-300 bg-white px-3 text-xs font-semibold text-zinc-700 transition hover:-translate-y-0.5 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 sm:h-9"
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

function CategoryMobileLoading({ theme }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center px-4 py-12" role="status" aria-live="polite">
      <div className="flex h-16 w-16 animate-pulse items-center justify-center rounded-2xl bg-teal-500/10 text-teal-500">
        <FiTag className="text-3xl" />
      </div>
      <p className={`mt-4 text-sm font-bold ${theme.title}`}>រង់ចាំបន្តិច...</p>
      <p className={`mt-1 text-xs ${theme.muted}`}>កំពុងរៀបចំបញ្ជីប្រភេទទំនិញ</p>
    </div>
  );
}

function Category3DLoading({ theme, colSpan }) {
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
            <div className="absolute bottom-1 h-5 w-20 animate-pulse rounded-[50%] bg-teal-500/25 blur-md" />

            <div className="absolute inset-2 animate-spin rounded-full border border-dashed border-teal-400/50 [animation-duration:3s]" />
            <div className="absolute inset-5 animate-spin rounded-full border-2 border-transparent border-l-cyan-300 border-r-teal-600 [animation-direction:reverse] [animation-duration:1.8s]" />

            <div
              className="relative flex h-16 w-16 items-center justify-center rounded-[20px] border border-white/40 bg-gradient-to-br from-cyan-300 via-teal-500 to-emerald-700 text-white"
              style={{
                transform: "rotateX(12deg) rotateY(-18deg) translateZ(18px)",
                boxShadow:
                  "14px 18px 24px rgba(15, 118, 110, 0.3), inset 4px 4px 10px rgba(255,255,255,0.38), inset -5px -7px 12px rgba(4,120,87,0.3)",
              }}
            >
              <div className="absolute inset-1 rounded-[16px] border border-white/20" />
              <FiTag className="relative text-3xl drop-shadow-md" />
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-amber-400 text-[11px] font-black text-amber-950 shadow-lg shadow-amber-400/40">
                +
              </span>
            </div>
          </div>

          <p className={`mt-3 text-sm font-bold ${theme.title}`}>
            រង់ចាំបន្តិច...
          </p>
          <p className={`mt-1 text-xs ${theme.muted}`}>
            កំពុងរៀបចំបញ្ជីប្រភេទទំនិញ
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
