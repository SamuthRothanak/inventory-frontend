import {
  FiChevronLeft,
  FiChevronRight,
  FiChevronDown,
  FiDownload,
  FiEye,
  FiFileText,
  FiPackage,
  FiSearch,
  FiTrendingDown,
  FiTrendingUp,
} from "react-icons/fi";
import {
  ExpiryBadge,
  formatUsdTwoDigits,
  InventoryThumb,
  StockStatusBadge,
} from "./InventoryCommon";
import { getNearestExpiryInfo } from "../utils/inventoryExpiry";
import PermissionGate from "../../../../components/PermissionGate";

export default function InventoryTable({
    theme,
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
    canExport,
    exportMenuOpen,
    setExportMenuOpen,
    handleExport,
  }) {
    return (
      <div className={`overflow-hidden rounded-2xl border shadow-sm ${theme.tableWrap}`}>
        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-zinc-200 px-4 py-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h2 className={`text-base font-semibold ${theme.pageTitle}`}>បញ្ជីស្តុក</h2>
            <p className={`mt-0.5 text-xs ${theme.muted}`}>
              {isLoading
                ? "រង់ចាំបន្តិច..."
                : `បង្ហាញ ${pagination.from || 0}–${pagination.to || filteredInventory.length} នៃ ${pagination.total} ស្តុក`}
            </p>
          </div>
          <div className="relative">
            <button
              type="button"
              disabled={!canExport}
              onClick={() => canExport && setExportMenuOpen?.((open) => !open)}
              className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition hover:border-red-300 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:w-auto ${theme.badge}`}
            >
              <FiDownload />
              Export
              <FiChevronDown className={`transition ${exportMenuOpen ? "rotate-180" : ""}`} />
            </button>
            {exportMenuOpen && (
              <div className={`absolute right-0 z-30 mt-2 w-44 overflow-hidden rounded-xl border shadow-xl ${theme.card}`}>
                {["pdf", "excel", "csv"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleExport?.(type)}
                    className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 ${theme.text}`}
                  >
                    <FiFileText />
                    {type.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="responsive-card-table w-full min-w-240">
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
                <Inventory3DLoading theme={theme} colSpan={6} />
              ) : (
                filteredInventory.map((item) => {
                  const stockBreakdown = getVariantStockBreakdown(item);
                  const thresholdBreakdown = getLowStockThresholdBreakdown(item);
                  const pendingStockIn = getPendingStockInForInventoryItem?.(item) || { baseQty: 0, qty: 0 };
                  const productMeta = item.category && item.category !== "-" ? item.category : item.productName;
                  const hasPending = Number(pendingStockIn.baseQty || 0) > 0;
                  const nearestExpiry = getNearestExpiryInfo(item.batches);
                  const convertedCostRows = (item.units || [])
                    .filter((unit) => Number(unit.conversionQty || 1) > 1)
                    .sort((a, b) => Number(a.conversionQty || 1) - Number(b.conversionQty || 1))
                    .slice(0, 2)
                    .map((unit) => ({
                      key: unit.id || unit.unitName,
                      unitName: unit.unitName,
                      cost: Number(item.unitCostBase || 0) * Number(unit.conversionQty || 1),
                    }));

                  return (
                    <tr key={item.id} className={`border-t transition ${theme.row}`}>
                      {/* Product / Variant */}
                      <td data-label="ទំនិញ" className="px-5 py-3.5">
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
                      <td data-label="ស្តុកបច្ចុប្បន្ន" className="px-5 py-3.5">
                        <p className="text-sm font-bold">{stockBreakdown.baseText}</p>
                        {stockBreakdown.convertedTexts.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {stockBreakdown.convertedTexts.map((c) => (
                              <span key={c.unitName} className={`rounded-full border px-2 py-0.5 text-[11px] ${theme.badge}`}>
                                {c.symbol || "≈"} {c.text}
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
                      <td data-label="កម្រិតស្តុក" className="px-5 py-3.5">
                        {thresholdBreakdown.convertedTexts.length > 0 ? (
                          thresholdBreakdown.convertedTexts.map((c) => (
                            <p key={c.unitName} className="text-sm font-semibold">{c.text}</p>
                          ))
                        ) : (
                          <p className="text-sm font-semibold">{thresholdBreakdown.baseText}</p>
                        )}
                      </td>

                      {/* Cost / Value */}
                      <td data-label="តម្លៃដើម" className="px-5 py-3.5">
                        <p className="text-sm font-semibold">
                          {formatUsdTwoDigits(item.unitCostBase)}
                          <span className={`ml-1 text-xs font-normal ${theme.muted}`}>/ {item.baseUnit}</span>
                        </p>
                        {convertedCostRows.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {convertedCostRows.map((unit) => (
                              <span
                                key={unit.key}
                                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${theme.badge}`}
                              >
                                {formatUsdTwoDigits(unit.cost)}
                                <span className={`ml-1 font-normal ${theme.muted}`}>/ {unit.unitName}</span>
                              </span>
                            ))}
                          </div>
                        )}
                        <p className={`mt-0.5 text-xs ${theme.muted}`}>
                          សរុប: {formatUsdTwoDigits(
                            Number(item.stockValueUsd || 0) ||
                              Number(item.stockBaseQty || 0) * Number(item.unitCostBase || 0)
                          )}
                        </p>
                      </td>

                      {/* Status */}
                      <td data-label="ស្ថានភាព" className="px-5 py-3.5 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          <StockStatusBadge status={item.status} getStatusClass={getStatusClass} />
                          <ExpiryBadge info={nearestExpiry?.info} />
                        </div>
                      </td>

                      {/* Actions */}
                      <td data-label="សកម្មភាព" className="px-5 py-3.5">
                        <div className="flex items-center justify-center gap-2">
                          <Tooltip label="មើលស្តុក">
                            <button type="button" onClick={() => openViewModal(item)}
                              className="quick-action-icon-3d flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-white shadow-orange-500/20 ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-orange-500/25 focus:outline-none focus:ring-4 focus:ring-orange-500/20 active:translate-y-0">
                              <FiEye size={15} />
                            </button>
                          </Tooltip>
                          <PermissionGate permission="stock.adjust">
                            <Tooltip label="ស្តុកចូល">
                              <button type="button" onClick={() => openAdjustmentModal("adjustment_in", item)}
                                className="quick-action-icon-3d flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-blue-600/20 ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-blue-600/25 focus:outline-none focus:ring-4 focus:ring-blue-500/20 active:translate-y-0">
                                <FiTrendingUp size={15} />
                              </button>
                            </Tooltip>
                            <Tooltip label="ស្តុកចេញ">
                              <button type="button" onClick={() => openAdjustmentModal("adjustment_out", item)}
                                className="quick-action-icon-3d flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-white shadow-red-600/20 ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-red-600/25 focus:outline-none focus:ring-4 focus:ring-red-500/20 active:translate-y-0">
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
                className="table-icon-3d inline-flex h-9 items-center gap-1 rounded-xl border border-zinc-300 bg-white px-3 text-xs font-semibold text-zinc-700 transition hover:-translate-y-0.5 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10">
                <FiChevronLeft /> មុន
              </button>
              {pageNumbers.map((p, i) =>
                p === "..." ? (
                  <span key={`e-${i}`} className={`px-2 text-sm font-semibold ${theme.muted}`}>...</span>
                ) : (
                  <button key={p} type="button" onClick={() => onPageChange(p)}
                    className={`h-9 min-w-9 rounded-xl px-3 text-xs font-bold transition hover:-translate-y-0.5 ${
                      p === pagination.currentPage
                        ? "quick-action-icon-3d bg-red-600 text-white"
                        : "table-icon-3d border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
                    }`}>
                    {p}
                  </button>
                )
              )}
              <button type="button" disabled={pagination.currentPage >= pagination.lastPage}
                onClick={() => onPageChange((c) => Math.min(pagination.lastPage, c + 1))}
                className="table-icon-3d inline-flex h-9 items-center gap-1 rounded-xl border border-zinc-300 bg-white px-3 text-xs font-semibold text-zinc-700 transition hover:-translate-y-0.5 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10">
                បន្ទាប់ <FiChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

function Inventory3DLoading({ theme, colSpan }) {
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
            <div className="absolute bottom-1 h-5 w-20 animate-pulse rounded-[50%] bg-amber-500/25 blur-md" />

            <div className="absolute inset-2 animate-spin rounded-full border border-dashed border-amber-400/50 [animation-duration:3s]" />
            <div className="absolute inset-5 animate-spin rounded-full border-2 border-transparent border-l-yellow-300 border-r-orange-600 [animation-direction:reverse] [animation-duration:1.8s]" />

            <div
              className="relative flex h-16 w-16 items-center justify-center rounded-[20px] border border-white/40 bg-gradient-to-br from-yellow-300 via-amber-500 to-orange-700 text-white"
              style={{
                transform: "rotateX(12deg) rotateY(-18deg) translateZ(18px)",
                boxShadow:
                  "14px 18px 24px rgba(146, 64, 14, 0.3), inset 4px 4px 10px rgba(255,255,255,0.38), inset -5px -7px 12px rgba(154,52,18,0.3)",
              }}
            >
              <div className="absolute inset-1 rounded-[16px] border border-white/20" />
              <FiPackage className="relative text-3xl drop-shadow-md" />
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-400 text-[11px] font-black text-emerald-950 shadow-lg shadow-emerald-400/40">
                +
              </span>
            </div>
          </div>

          <p className={`mt-3 text-sm font-bold ${theme.pageTitle}`}>
            រង់ចាំបន្តិច...
          </p>
          <p className={`mt-1 text-xs ${theme.muted}`}>
            កំពុងរៀបចំបញ្ជីស្តុក
          </p>
        </div>
      </td>
    </tr>
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
