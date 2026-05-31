import React from "react";
import {
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiEdit2,
  FiEye,
  FiSearch,
  FiTag,
  FiTrash2,
  FiXCircle,
} from "react-icons/fi";

import ProductThumb from "./ProductThumb";
import TableLoading from "../../../../components/TableLoading";

import {
  getPriceRange,
  getPriceRuleCount,
  getUnitsText,
} from "../utils/productHelpers";

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
  onViewProduct,
  onEditProduct,
  onDeleteProduct,
}) {
  const totalPages = Number(pagination?.lastPage || 1);
  const currentPage = Number(pagination?.currentPage || page || 1);
  const from = Number(pagination?.from || 0);
  const to = Number(pagination?.to || 0);

  const pageNumbers = getPageNumbers(currentPage, totalPages);

  return (
    <div
      className={`overflow-hidden rounded-2xl border shadow-sm ${theme.tableWrap}`}
    >
      <div className="flex flex-col gap-3 border-b border-zinc-200 px-5 py-4 dark:border-white/10 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className={`text-base font-semibold ${theme.pageTitle}`}>
            Product List
          </h2>

          <p className={`mt-1 text-xs ${theme.muted}`}>
            {isLoading
              ? "Loading products..."
              : `Showing ${from || 0}-${to || products.length} of ${totalProducts} products`}
          </p>
        </div>

        {isFetching && !isLoading && (
          <span className="inline-flex w-fit items-center rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-500">
            Updating...
          </span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1080px]">
          <thead className="bg-red-600 text-white">
            <tr>
              <th className="px-4 py-4 text-left text-sm font-semibold">
                Product
              </th>

              <th className="px-4 py-4 text-left text-sm font-semibold">
                Category
              </th>

              <th className="px-4 py-4 text-center text-sm font-semibold">
                Variants
              </th>

              <th className="px-4 py-4 text-left text-sm font-semibold">
                Units
              </th>

              <th className="px-4 py-4 text-left text-sm font-semibold">
                Price Range
              </th>

              <th className="px-4 py-4 text-center text-sm font-semibold">
                Status
              </th>

              <th className="px-4 py-4 text-center text-sm font-semibold">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <TableLoading
                theme={theme}
                colSpan={7}
                text="Loading products..."
              />
            ) : isError ? (
              <tr className={`border-t ${theme.row}`}>
                <td colSpan="7" className="px-4 py-14 text-center">
                  <p className="text-sm font-semibold text-red-500">
                    Failed to load products.
                  </p>
                </td>
              </tr>
            ) : products.length > 0 ? (
              products.map((product) => (
                <tr
                  key={product.id}
                  className={`border-t transition ${theme.row}`}
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <ProductThumb product={product} />

                      <div>
                        <p className="text-sm font-semibold">{product.name}</p>
                        <p className={`mt-1 text-xs ${theme.subText}`}>
                          ID: {product.id}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <p className="text-sm font-medium">
                      {product.categoryName}
                    </p>
                    <p className={`mt-1 text-xs ${theme.subText}`}>
                      Category ID: {product.categoryId || "-"}
                    </p>
                  </td>

                  <td className="px-4 py-4 text-center">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${theme.badge}`}
                    >
                      {product.variants.length} variants
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex max-w-[220px] flex-wrap gap-1.5">
                      {getUnitsText(product)
                        .split(", ")
                        .map((unit) => (
                          <span
                            key={`${product.id}-${unit}`}
                            className={`rounded-full border px-2.5 py-1 text-xs ${theme.badge}`}
                          >
                            {unit}
                          </span>
                        ))}
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <FiTag className="text-red-500" />

                      <div>
                        <p className="text-sm font-semibold">
                          {getPriceRange(product)}
                        </p>

                        <p className={`mt-1 text-xs ${theme.subText}`}>
                          {getPriceRuleCount(product)} price rules
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4 text-center">
                    <StatusBadge status={product.status} />
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => onViewProduct(product)}
                        title="View product"
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm transition hover:bg-amber-600"
                      >
                        <FiEye size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onEditProduct(product)}
                        title="Edit product"
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition hover:bg-blue-700"
                      >
                        <FiEdit2 size={16} />
                      </button>

                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => onDeleteProduct(product)}
                        title="Delete product"
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500 text-white shadow-sm transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr className={`border-t ${theme.row}`}>
                <td colSpan="7" className="px-4 py-14 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div
                      className={`flex h-16 w-16 items-center justify-center rounded-2xl border ${theme.softCard}`}
                    >
                      <FiSearch className={`text-3xl ${theme.muted}`} />
                    </div>

                    <p
                      className={`mt-4 text-sm font-semibold ${theme.pageTitle}`}
                    >
                      No products found
                    </p>

                    <p className={`mt-1 text-xs ${theme.muted}`}>
                      Try changing your search keyword or filters.
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
            Page {currentPage} of {totalPages}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1 || isFetching}
              onClick={() => onPageChange(currentPage - 1)}
              className="inline-flex h-9 items-center gap-1 rounded-xl border border-zinc-300 bg-white px-3 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
            >
              <FiChevronLeft />
              Previous
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
              Next
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
      {status}
    </span>
  );
}