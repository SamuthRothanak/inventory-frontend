import React from "react";
import {
  FiCheckCircle,
  FiCheckSquare,
  FiChevronLeft,
  FiChevronRight,
  FiEdit2,
  FiEye,
  FiSearch,
  FiTag,
  FiTrash2,
  FiX,
  FiXCircle,
} from "react-icons/fi";

import ProductThumb from "./ProductThumb";
import TableLoading from "../../../../components/TableLoading";
import PermissionGate from "../../../../components/PermissionGate";

export default function ProductTable({
  theme,
  products,
  totalProducts,
  pagination,
  page,
  onPageChange,
  isFetching,
  isLoading,
  isError,
  isDeleting,
  bulkSelectMode = false,
  selectedProductIds = [],
  bulkDeleteIsPending = false,
  onViewProduct,
  onEditProduct,
  onDeleteProduct,
  onToggleStatus,
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
  const tableColSpan = bulkSelectMode ? 7 : 6;
  const pageProductIds = products.map((p) => Number(p.id));
  const allVisibleSelected =
    pageProductIds.length > 0 &&
    pageProductIds.every((id) => selectedProductIds.some((sid) => Number(sid) === id));

  return (
    <div
      className={`overflow-hidden rounded-2xl border shadow-sm ${theme.tableWrap}`}
    >
      <div className="flex flex-col gap-3 border-b border-zinc-200 px-5 py-4 dark:border-white/10 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className={`text-base font-semibold ${theme.pageTitle}`}>
            បញ្ជីផលិតផល
          </h2>

          <p className={`mt-1 text-xs ${theme.muted}`}>
            {isLoading
              ? "រង់ចាំបន្តិច..."
              : `បង្ហាញ ${from || 0}-${to || products.length} នៃ ${totalProducts} ផលិតផល`}
          </p>
        </div>

        <PermissionGate permission="products.delete">
          <div className="flex flex-wrap items-center gap-2">
            {bulkSelectMode ? (
              <>
                <button
                  type="button"
                  onClick={onCancelBulkSelect}
                  disabled={bulkDeleteIsPending}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 text-xs font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
                >
                  <FiX />
                  បោះបង់
                </button>
                <button
                  type="button"
                  onClick={onBulkDelete}
                  disabled={selectedProductIds.length === 0 || bulkDeleteIsPending}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-500 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FiTrash2 />
                  {bulkDeleteIsPending
                    ? "កំពុងលុប..."
                    : `លុបដែលបានជ្រើស (${selectedProductIds.length})`}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onOpenBulkSelect}
                disabled={products.length === 0 || isLoading || isError}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 text-xs font-semibold text-red-500 shadow-sm transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FiCheckSquare />
                ជ្រើសរើសច្រើន
              </button>
            )}
          </div>
        </PermissionGate>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-220">
          <thead className="bg-red-600 text-white">
            <tr>
              {bulkSelectMode && (
                <th className="w-14 px-5 py-4 text-left text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={onToggleSelectAll}
                    aria-label="ជ្រើសផលិតផលទាំងអស់លើទំព័រនេះ"
                    className="h-4 w-4 rounded border-white/60 text-red-500 focus:ring-red-500"
                  />
                </th>
              )}

              <th className="px-4 py-4 text-left text-sm font-semibold">
                ផលិតផល
              </th>

              <th className="px-4 py-4 text-left text-sm font-semibold">
                ប្រភេទ
              </th>

              <th className="px-4 py-4 text-center text-sm font-semibold">
                មុខទំនិញ
              </th>

              <th className="px-4 py-4 text-left text-sm font-semibold">
                តម្លៃលក់
              </th>

              <th className="px-4 py-4 text-center text-sm font-semibold">
                ស្ថានភាព
              </th>

              <th className="px-4 py-4 text-center text-sm font-semibold">
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
                    មិនអាចផ្ទុកផលិតផល។
                  </p>
                </td>
              </tr>
            ) : products.length > 0 ? (
              products.map((product) => {
                const variantsCount = getVariantsCount(product);
                const units = getUnitsArray(product);
                const priceRange = getProductPriceRange(product);
                const priceRulesCount = getProductPriceRuleCount(product);
                const hasPrice = priceRulesCount > 0;

                return (
                  <tr
                    key={product.id}
                    className={`border-t transition ${theme.row} ${bulkSelectMode && selectedProductIds.some((id) => Number(id) === Number(product.id)) ? "bg-red-500/5" : ""}`}
                  >
                    {bulkSelectMode && (
                      <td className="px-5 py-4">
                        <input
                          type="checkbox"
                          checked={selectedProductIds.some((id) => Number(id) === Number(product.id))}
                          onChange={() => onToggleSelect(product.id)}
                          aria-label={`ជ្រើស ${product.name}`}
                          className="h-4 w-4 rounded border-zinc-300 text-red-500 focus:ring-red-500 dark:border-white/20"
                        />
                      </td>
                    )}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <ProductThumb product={product} />

                        <div className="min-w-0">
                          <p className="text-sm font-semibold">
                            {product.name}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <p className="text-sm font-medium">
                        {product.categoryName ||
                          product.category_name ||
                          product.category?.name ||
                          "-"}
                      </p>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${theme.badge}`}
                      >
                        {variantsCount} មុខទំនិញ
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <FiTag className={hasPrice ? "text-red-500" : "text-amber-500"} />

                        <div>
                          {hasPrice ? (
                            <p className="text-sm font-semibold">{priceRange}</p>
                          ) : (
                            <span className="inline-flex rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                              អត់តម្លៃ
                            </span>
                          )}

                          <p className={`mt-1 text-xs ${theme.subText}`}>
                            {hasPrice ? `${priceRulesCount} តម្លៃ` : "មិនទាន់អាចលក់"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <StatusBadge status={product.status} onClick={() => onToggleStatus?.(product)} />
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Tooltip label="មើលផលិតផល">
                          <button
                            type="button"
                            onClick={() => onViewProduct(product)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-b from-amber-400 to-orange-500 text-white shadow-md shadow-orange-500/20 ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:from-amber-500 hover:to-orange-600 hover:shadow-lg hover:shadow-orange-500/25 focus:outline-none focus:ring-4 focus:ring-orange-500/20 active:translate-y-0"
                          >
                            <FiEye size={16} />
                          </button>
                        </Tooltip>

                        <PermissionGate permission="products.update">
                          <Tooltip label="កែផលិតផល">
                            <button
                              type="button"
                              onClick={() => onEditProduct(product)}
                              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-b from-blue-500 to-blue-700 text-white shadow-md shadow-blue-600/20 ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:from-blue-600 hover:to-blue-800 hover:shadow-lg hover:shadow-blue-600/25 focus:outline-none focus:ring-4 focus:ring-blue-500/20 active:translate-y-0"
                            >
                              <FiEdit2 size={16} />
                            </button>
                          </Tooltip>
                        </PermissionGate>

                        <PermissionGate permission="products.delete">
                          <Tooltip label="លុបផលិតផល">
                            <button
                              type="button"
                              disabled={isDeleting}
                              onClick={() => onDeleteProduct(product)}
                               className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-b from-red-500 to-red-700 text-white shadow-md shadow-red-600/20 ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:from-red-600 hover:to-red-800 hover:shadow-lg hover:shadow-red-600/25 focus:outline-none focus:ring-4 focus:ring-red-500/20 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </Tooltip>
                        </PermissionGate>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr className={`border-t ${theme.row}`}>
                <td colSpan={tableColSpan} className="px-4 py-14 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div
                      className={`flex h-16 w-16 items-center justify-center rounded-2xl border ${theme.softCard}`}
                    >
                      <FiSearch className={`text-3xl ${theme.muted}`} />
                    </div>

                    <p
                      className={`mt-4 text-sm font-semibold ${theme.pageTitle}`}
                    >
                      រកមិនឃើញផលិតផល
                    </p>

                    <p className={`mt-1 text-xs ${theme.muted}`}>
                      ព្យាយាមប្តូរពាក្យស្វែងរក ឬតម្រង។
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

            {pageNumbers.map((item, index) =>
              item === "..." ? (
                <span
                  key={`ellipsis-${index}`}
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

function getVariantsCount(product) {
  return Number(
    product.variants_count ??
      product.variantsCount ??
      product.variants?.length ??
      0
  );
}

function getUnitsArray(product) {
  const unitsText = product.units_text ?? product.unitsText ?? "";

  if (!unitsText || unitsText === "-") {
    return [];
  }

  return String(unitsText)
    .split(",")
    .map((unit) => unit.trim())
    .filter(Boolean);
}

function getProductPriceRuleCount(product) {
  return Number(
    product.price_rules_count ??
      product.priceRulesCount ??
      0
  );
}

function getProductPriceRange(product) {
  const min =
    product.min_price_usd ??
    product.minPriceUsd ??
    product.minPrice ??
    null;

  const max =
    product.max_price_usd ??
    product.maxPriceUsd ??
    product.maxPrice ??
    null;

  const minNumber = min !== null ? Number(min) : null;
  const maxNumber = max !== null ? Number(max) : null;

  if (
    minNumber === null ||
    maxNumber === null ||
    Number.isNaN(minNumber) ||
    Number.isNaN(maxNumber)
  ) {
    return "គ្មានតម្លៃ";
  }

  if (minNumber === maxNumber) {
    return `$${formatPrice(minNumber)}`;
  }

  return `$${formatPrice(minNumber)} - $${formatPrice(maxNumber)}`;
}

function formatPrice(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0.00";
  }

  return number.toFixed(2);
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

function StatusBadge({ status, onClick }) {
  const normalized = String(status ?? "").toLowerCase();

  const isActive =
    normalized === "active" ||
    normalized === "1" ||
    status === 1 ||
    status === true;

  const label = isActive ? "ដំណើរការ" : "មិនដំណើរការ";

  return (
    <button
      type="button"
      onClick={onClick}
      title={isActive ? "ចុចដើម្បីផ្លាស់ប្ដូរទៅ មិនដំណើរការ" : "ចុចដើម្បីផ្លាស់ប្ដូរទៅ ដំណើរការ"}
      className={`inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition hover:opacity-70 ${
        isActive
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-red-500/10 text-red-500 dark:text-red-400"
      }`}
    >
      {isActive ? <FiCheckCircle /> : <FiXCircle />}
      {label}
    </button>
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
