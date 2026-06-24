import { FiChevronLeft, FiChevronRight, FiEye, FiRotateCcw } from "react-icons/fi";
import TableLoading from "../../../../components/TableLoading";

const REASON_LABEL_KH = { damaged: "ខូចខាត", expired: "ផុតកំណត់", internal_use: "ដកប្រើប្រាស់ខ្លួនឯង", lost: "បាត់", stock_count: "រាប់ស្តុកពិតប្រាកដ", correction: "ការកែតម្រូវ", other: "ផ្សេងទៀត" };
const ADJUSTMENT_STATUS_KH = { draft: "សេចក្ដីព្រាង", approved: "បានអនុម័ត", cancelled: "បានបោះបង់" };
const ADJUSTMENT_TYPE_KH = { increase: "បន្ថែម", decrease: "កាត់" };
const reasonLabel = (value = "") => REASON_LABEL_KH[String(value)] || String(value).replaceAll("_", " ");

export default function StockAdjustmentTable({
  theme,
  adjustments,
  isLoading,
  pagination,
  pageNumbers = [],
  onPageChange,
  onView,
  onCancel,
}) {
  return (
    <div className={`overflow-hidden rounded-2xl border shadow-sm ${theme.tableWrap}`}>
      <div className="flex flex-col gap-2 border-b border-zinc-200 px-5 py-4 dark:border-white/10 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className={`text-base font-semibold ${theme.pageTitle}`}>ប្រវត្តិការកែតម្រូវស្តុក</h2>
          <p className={`mt-1 text-xs ${theme.muted}`}>
            {isLoading ? "រង់ចាំបន្តិច..." : `${adjustments.length} កំណត់ត្រាការកែតម្រូវ`}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px]">
          <thead className="bg-red-600 text-white">
            <tr>
              <th className="px-5 py-3 text-left text-sm font-semibold">ការកែតម្រូវ</th>
              <th className="px-5 py-3 text-left text-sm font-semibold">ប្រភេទ / មូលហេតុ</th>
              <th className="px-5 py-3 text-left text-sm font-semibold">ទំនិញ</th>
              <th className="px-5 py-3 text-left text-sm font-semibold">តម្លៃ</th>
              <th className="px-5 py-3 text-left text-sm font-semibold">ស្ថានភាព</th>
              <th className="px-5 py-3 text-center text-sm font-semibold">សកម្មភាព</th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <TableLoading theme={theme} colSpan={6} text="រង់ចាំបន្តិច..." />
            ) : (
              adjustments.map((adjustment) => {
                const totalQty = adjustment.items.reduce((total, item) => total + Number(item.baseQty || 0), 0);
                const totalCost = adjustment.items.reduce((total, item) => total + Number(item.lineCost || 0), 0);
                const canCancel = adjustment.status === "draft";

                return (
                  <tr key={adjustment.id} className={`border-t transition ${theme.row}`}>
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold">{adjustment.adjustmentNo || `ADJ-${adjustment.id}`}</p>
                      <p className={`mt-1 text-xs ${theme.muted}`}>{adjustment.createdAt || "-"}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold">{ADJUSTMENT_TYPE_KH[adjustment.adjustmentType] || adjustment.adjustmentType}</p>
                      <p className={`mt-1 text-xs ${theme.muted}`}>{reasonLabel(adjustment.reason)}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold">{adjustment.items.length} ទំនិញ</p>
                      <p className={`mt-1 text-xs ${theme.muted}`}>{Number(totalQty).toLocaleString()} ខ្នាតមូលដ្ឋាន</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold">${Number(totalCost).toFixed(2)}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        adjustment.status === "approved"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : adjustment.status === "cancelled"
                            ? "bg-zinc-500/10 text-zinc-400"
                            : "bg-amber-500/10 text-amber-500"
                      }`}>
                        {ADJUSTMENT_STATUS_KH[adjustment.status] || adjustment.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => onView(adjustment)}
                          title="មើលការកែតម្រូវ"
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm transition hover:bg-amber-600"
                        >
                          <FiEye size={16} />
                        </button>
                        {canCancel && (
                          <button
                            type="button"
                            onClick={() => onCancel(adjustment)}
                            title="លុបសេចក្ដីព្រាង"
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-600 text-white shadow-sm transition hover:bg-zinc-700"
                          >
                            <FiRotateCcw size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}

            {!isLoading && adjustments.length === 0 && (
              <tr className={`border-t ${theme.row}`}>
                <td colSpan="6" className="px-5 py-10 text-center">
                  <p className={`text-sm font-semibold ${theme.pageTitle}`}>គ្មានការកែតម្រូវស្តុកនៅឡើយ</p>
                  <p className={`mt-1 text-xs ${theme.muted}`}>ការផ្លាស់ប្ដូរស្តុកដោយដៃនឹងបង្ហាញនៅទីនេះ</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className={`flex flex-col gap-3 border-t px-5 py-4 ${theme.row} sm:flex-row sm:items-center sm:justify-between`}>
          <p className={`text-sm ${theme.muted}`}>
            ទំព័រ {pagination.currentPage} នៃ {pagination.lastPage}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pagination.currentPage <= 1}
              onClick={() => onPageChange(pagination.currentPage - 1)}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-zinc-300 bg-white px-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
            >
              <FiChevronLeft />
              មុន
            </button>

            {pageNumbers.map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() => onPageChange(pageNumber)}
                className={`h-10 min-w-10 rounded-xl px-3 text-sm font-semibold transition ${
                  pageNumber === pagination.currentPage
                    ? "bg-red-600 text-white"
                    : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
                }`}
              >
                {pageNumber}
              </button>
            ))}

            <button
              type="button"
              disabled={pagination.currentPage >= pagination.lastPage}
              onClick={() => onPageChange(pagination.currentPage + 1)}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-zinc-300 bg-white px-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
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
