import {
  FiChevronLeft,
  FiChevronRight,
  FiEye,
  FiSearch,
  FiTrendingDown,
  FiTrendingUp,
} from "react-icons/fi";
import TableLoading from "../../../../components/TableLoading";
import { InventoryThumb, StockStatusBadge } from "./InventoryCommon";
export default function InventoryTable({
    theme,
    inventory,
    filteredInventory,
    isLoading,
    pagination,
    pageNumbers,
    onPageChange,
    getVariantStockBreakdown,
    getLowStockThresholdBreakdown,
    getPendingStockInForInventoryItem,
    getStatusClass,
    openViewModal,
    openAdjustmentModal,
  }) {
    return (
      <div
        className={`overflow-hidden rounded-2xl border shadow-sm ${theme.tableWrap}`}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-white/10">
          <div>
            <h2 className={`text-base font-semibold ${theme.pageTitle}`}>
              Inventory List
            </h2>

            <p className={`mt-1 text-xs ${theme.muted}`}>
              {isLoading
                ? "Loading inventory..."
                : `Showing ${pagination.from || 0}-${pagination.to || filteredInventory.length} of ${pagination.total} stock items`}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px]">
            <thead className="bg-red-600 text-white">
              <tr>
                <th className="px-5 py-3 text-left text-sm font-semibold">
                  Product / Variant
                </th>
                <th className="px-5 py-3 text-left text-sm font-semibold">
                  Current Stock
                </th>
                <th className="px-5 py-3 text-left text-sm font-semibold">
                  Low Stock Alert
                </th>
                <th className="px-5 py-3 text-left text-sm font-semibold">
                  Cost / Value
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
                <TableLoading
                  theme={theme}
                  colSpan={6}
                  text="Loading inventory..."
                />
              ) : (
                filteredInventory.map((item) => {
                const stockBreakdown = getVariantStockBreakdown(item);
                const thresholdBreakdown = getLowStockThresholdBreakdown(item);
                const pendingStockIn = getPendingStockInForInventoryItem?.(item) || { baseQty: 0, qty: 0 };
                const productMeta = item.category && item.category !== "-" ? item.category : item.productName;

                return (
                  <tr key={item.id} className={`border-t transition ${theme.row}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <InventoryThumb item={item} />

                        <div>
                          <p className="text-sm font-semibold leading-5">
                            {item.variantName}
                          </p>

                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${theme.badge}`}
                            >
                              {item.variantCode}
                            </span>

                            {productMeta && productMeta !== "-" && (
                              <span className={`text-xs ${theme.muted}`}>
                                {productMeta}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <p className={`text-[11px] font-semibold uppercase ${theme.muted}`}>
                        Confirmed
                      </p>

                      <p className="mt-1 text-sm font-bold">{stockBreakdown.baseText}</p>

                      {Number(pendingStockIn.baseQty || 0) > 0 && (
                        <div className="mt-2 inline-flex rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-500">
                          Pending Stock In +{Number(pendingStockIn.qty || 0).toLocaleString()} {pendingStockIn.unitName}
                          {pendingStockIn.baseQty !== pendingStockIn.qty &&
                            ` / ${Number(pendingStockIn.baseQty || 0).toLocaleString()} ${pendingStockIn.baseUnit}`}
                        </div>
                      )}

                      {stockBreakdown.convertedTexts.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {stockBreakdown.convertedTexts.map((converted) => (
                            <span
                              key={converted.unitName}
                              className={`rounded-full border px-2.5 py-0.5 text-xs ${theme.badge}`}
                            >
                              ≈ {converted.text}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <p className={`text-sm font-semibold ${theme.pageTitle}`}>
                        {thresholdBreakdown.baseText}
                      </p>

                      {thresholdBreakdown.convertedTexts.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {thresholdBreakdown.convertedTexts.map((converted) => (
                            <span
                              key={converted.unitName}
                              className={`rounded-full border px-2.5 py-0.5 text-xs ${theme.badge}`}
                            >
                              {converted.text}
                            </span>
                          ))}
                        </div>
                      )}

                      <p className={`mt-1 text-xs ${theme.muted}`}>
                        Alert when equal or below base unit
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold">
                        ${Number(item.unitCostBase).toFixed(3)} / {item.baseUnit}
                      </p>

                      <p className={`mt-1 text-xs ${theme.muted}`}>
                        Value: $
                        {(
                          Number(item.stockBaseQty || 0) *
                          Number(item.unitCostBase || 0)
                        ).toFixed(2)}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <StockStatusBadge
                        status={item.status}
                        getStatusClass={getStatusClass}
                      />
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => openViewModal(item)}
                          title="View stock"
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm transition hover:bg-amber-600"
                        >
                          <FiEye size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => openAdjustmentModal("adjustment_in", item)}
                          title="Manual adjustment in"
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition hover:bg-blue-700"
                        >
                          <FiTrendingUp size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => openAdjustmentModal("adjustment_out", item)}
                          title="Stock out"
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500 text-white shadow-sm transition hover:bg-red-600"
                        >
                          <FiTrendingDown size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
                })
              )}

              {!isLoading && filteredInventory.length === 0 && (
                <tr className={`border-t ${theme.row}`}>
                  <td colSpan="6" className="px-4 py-14 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div
                        className={`flex h-16 w-16 items-center justify-center rounded-2xl border ${theme.softCard}`}
                      >
                        <FiSearch className={`text-3xl ${theme.muted}`} />
                      </div>

                      <p className={`mt-4 text-sm font-semibold ${theme.pageTitle}`}>
                        No inventory found
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

        {!isLoading && pagination.lastPage > 1 && (
          <div className="flex flex-col gap-3 border-t border-zinc-200 px-5 py-4 dark:border-white/10 md:flex-row md:items-center md:justify-between">
            <p className={`text-xs ${theme.muted}`}>
              Page {pagination.currentPage} of {pagination.lastPage}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={pagination.currentPage <= 1}
                onClick={() => onPageChange((current) => Math.max(1, current - 1))}
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
                    onClick={() => onPageChange(item)}
                    className={`h-9 min-w-9 rounded-xl px-3 text-xs font-bold transition ${
                      item === pagination.currentPage
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
                disabled={pagination.currentPage >= pagination.lastPage}
                onClick={() => onPageChange((current) => Math.min(pagination.lastPage, current + 1))}
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


