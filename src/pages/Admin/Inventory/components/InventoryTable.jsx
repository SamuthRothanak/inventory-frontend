import {
  FiChevronLeft,
  FiChevronRight,
  FiEye,
  FiPackage,
  FiSearch,
  FiTrendingDown,
  FiTrendingUp,
} from "react-icons/fi";
import TableLoading from "../../../../components/TableLoading";
import { InventoryThumb, StockStatusBadge } from "./InventoryCommon";
import PermissionGate from "../../../../components/PermissionGate";

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
      <div className={`overflow-hidden rounded-2xl border shadow-sm ${theme.tableWrap}`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-white/10">
          <div>
            <h2 className={`text-base font-semibold ${theme.pageTitle}`}>បញ្ជីស្តុក</h2>
            <p className={`mt-0.5 text-xs ${theme.muted}`}>
              {isLoading
                ? "រង់ចាំបន្តិច..."
                : `បង្ហាញ ${pagination.from || 0}–${pagination.to || filteredInventory.length} នៃ ${pagination.total} ស្តុក`}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-240">
            <thead className="bg-red-600 text-white">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide">ទំនិញ</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide">ស្តុកបច្ចុប្បន្ន</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide">ដែនកំណត់ស្តុក</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide">តម្លៃដើម</th>
                <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide">ស្ថានភាព</th>
                <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide">សកម្មភាព</th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <TableLoading theme={theme} colSpan={6} text="រង់ចាំបន្តិច..." />
              ) : (
                filteredInventory.map((item) => {
                  const stockBreakdown = getVariantStockBreakdown(item);
                  const thresholdBreakdown = getLowStockThresholdBreakdown(item);
                  const pendingStockIn = getPendingStockInForInventoryItem?.(item) || { baseQty: 0, qty: 0 };
                  const productMeta = item.category && item.category !== "-" ? item.category : item.productName;
                  const hasPending = Number(pendingStockIn.baseQty || 0) > 0;

                  return (
                    <tr key={item.id} className={`border-t transition ${theme.row}`}>
                      {/* Product / Variant */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <InventoryThumb item={item} />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{item.variantName}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${theme.badge}`}>
                                {item.variantCode}
                              </span>
                              {productMeta && productMeta !== "-" && (
                                <span className={`text-[11px] ${theme.muted}`}>{productMeta}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Current Stock */}
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-bold">{stockBreakdown.baseText}</p>
                        {stockBreakdown.convertedTexts.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {stockBreakdown.convertedTexts.map((c) => (
                              <span key={c.unitName} className={`rounded-full border px-2 py-0.5 text-[11px] ${theme.badge}`}>
                                ≈ {c.text}
                              </span>
                            ))}
                          </div>
                        )}
                        {hasPending && (
                          <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
                            +{Number(pendingStockIn.qty || 0).toLocaleString()} {pendingStockIn.unitName} រង់ចាំ
                          </span>
                        )}
                      </td>

                      {/* Low Stock Alert */}
                      <td className="px-5 py-3.5">
                        {thresholdBreakdown.convertedTexts.length > 0 ? (
                          thresholdBreakdown.convertedTexts.map((c) => (
                            <p key={c.unitName} className="text-sm font-semibold">{c.text}</p>
                          ))
                        ) : (
                          <p className="text-sm font-semibold">{thresholdBreakdown.baseText}</p>
                        )}
                      </td>

                      {/* Cost / Value */}
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-semibold">
                          ${Number(item.unitCostBase).toFixed(3)}
                          <span className={`ml-1 text-xs font-normal ${theme.muted}`}>/ {item.baseUnit}</span>
                        </p>
                        <p className={`mt-0.5 text-xs ${theme.muted}`}>
                          សរុប: ${(Number(item.stockBaseQty || 0) * Number(item.unitCostBase || 0)).toFixed(2)}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5 text-center">
                        <StockStatusBadge status={item.status} getStatusClass={getStatusClass} />
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-center gap-2">
                          <Tooltip label="មើលស្តុក">
                            <button type="button" onClick={() => openViewModal(item)}
                              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-b from-amber-400 to-orange-500 text-white shadow-md shadow-orange-500/20 ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:from-amber-500 hover:to-orange-600 hover:shadow-lg hover:shadow-orange-500/25 focus:outline-none focus:ring-4 focus:ring-orange-500/20 active:translate-y-0">
                              <FiEye size={15} />
                            </button>
                          </Tooltip>
                          <PermissionGate permission="stock.adjust">
                            <Tooltip label="ស្តុកចូល">
                              <button type="button" onClick={() => openAdjustmentModal("adjustment_in", item)}
                                className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-b from-blue-500 to-blue-700 text-white shadow-md shadow-blue-600/20 ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:from-blue-600 hover:to-blue-800 hover:shadow-lg hover:shadow-blue-600/25 focus:outline-none focus:ring-4 focus:ring-blue-500/20 active:translate-y-0">
                                <FiTrendingUp size={15} />
                              </button>
                            </Tooltip>
                            <Tooltip label="ស្តុកចេញ">
                              <button type="button" onClick={() => openAdjustmentModal("adjustment_out", item)}
                                className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-b from-red-500 to-red-700 text-white shadow-md shadow-red-600/20 ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:from-red-600 hover:to-red-800 hover:shadow-lg hover:shadow-red-600/25 focus:outline-none focus:ring-4 focus:ring-red-500/20 active:translate-y-0">
                                <FiTrendingDown size={15} />
                              </button>
                            </Tooltip>
                          </PermissionGate>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}

              {!isLoading && filteredInventory.length === 0 && (
                <tr className={`border-t ${theme.row}`}>
                  <td colSpan={6} className="px-4 py-14 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${theme.softCard}`}>
                        <FiSearch className={`text-2xl ${theme.muted}`} />
                      </div>
                      <p className={`mt-3 text-sm font-semibold ${theme.pageTitle}`}>រកមិនឃើញស្តុក</p>
                      <p className={`mt-1 text-xs ${theme.muted}`}>ព្យាយាមប្តូរការស្វែងរក ឬតម្រង។</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && pagination.lastPage > 1 && (
          <div className="flex flex-col gap-3 border-t border-zinc-200 px-5 py-4 dark:border-white/10 md:flex-row md:items-center md:justify-between">
            <p className={`text-xs ${theme.muted}`}>ទំព័រ {pagination.currentPage} នៃ {pagination.lastPage}</p>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" disabled={pagination.currentPage <= 1}
                onClick={() => onPageChange((c) => Math.max(1, c - 1))}
                className="inline-flex h-9 items-center gap-1 rounded-xl border border-zinc-300 bg-white px-3 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10">
                <FiChevronLeft /> មុន
              </button>
              {pageNumbers.map((p, i) =>
                p === "..." ? (
                  <span key={`e-${i}`} className={`px-2 text-sm font-semibold ${theme.muted}`}>...</span>
                ) : (
                  <button key={p} type="button" onClick={() => onPageChange(p)}
                    className={`h-9 min-w-9 rounded-xl px-3 text-xs font-bold transition ${
                      p === pagination.currentPage
                        ? "bg-red-600 text-white"
                        : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
                    }`}>
                    {p}
                  </button>
                )
              )}
              <button type="button" disabled={pagination.currentPage >= pagination.lastPage}
                onClick={() => onPageChange((c) => Math.min(pagination.lastPage, c + 1))}
                className="inline-flex h-9 items-center gap-1 rounded-xl border border-zinc-300 bg-white px-3 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10">
                បន្ទាប់ <FiChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>
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
