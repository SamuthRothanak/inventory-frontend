import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import TableLoading from "../../../../components/TableLoading";

const formatLabel = (value = "") => String(value).replaceAll("_", " ");

const truncateBatchNo = (batchNo) => {
  if (!batchNo) return "-";
  const parts = String(batchNo).split("-");
  if (parts.length <= 4) return batchNo;
  return `${parts.slice(0, 3).join("-")}-…${parts[parts.length - 1]}`;
};

const fmt12h = (value) => {
  if (!value) return { date: "-", time: "" };
  const d = new Date(String(value).replace(" ", "T"));
  if (isNaN(d.getTime())) return { date: String(value), time: "" };
  const date = d.toLocaleDateString("en-CA");
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true });
  return { date, time };
};

const movementClass = (qtyBase) =>
  Number(qtyBase) >= 0
    ? "bg-emerald-500/10 text-emerald-500"
    : "bg-red-500/10 text-red-500";

export default function StockMovementTable({
  theme,
  movements,
  isLoading,
  pagination,
  pageNumbers = [],
  onPageChange,
}) {
  return (
    <div className={`overflow-hidden rounded-2xl border shadow-sm ${theme.tableWrap}`}>
      <div className="flex flex-col gap-2 border-b border-zinc-200 px-5 py-4 dark:border-white/10 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className={`text-base font-semibold ${theme.pageTitle}`}>Stock Movements</h2>
          <p className={`mt-1 text-xs ${theme.muted}`}>
            {isLoading ? "Loading movements..." : `${pagination.total} movement record${pagination.total === 1 ? "" : "s"}`}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px]">
          <thead className="bg-red-600 text-white">
            <tr>
              <th className="px-5 py-3 text-left text-sm font-semibold">Date</th>
              <th className="px-5 py-3 text-left text-sm font-semibold">Product / Variant</th>
              <th className="px-5 py-3 text-left text-sm font-semibold">Movement</th>
              <th className="px-5 py-3 text-left text-sm font-semibold">Qty</th>
              <th className="px-5 py-3 text-left text-sm font-semibold">Batch / Lot</th>
              <th className="px-5 py-3 text-left text-sm font-semibold">Reference</th>
              <th className="px-5 py-3 text-left text-sm font-semibold">Note</th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <TableLoading theme={theme} colSpan={7} text="Loading movements..." />
            ) : (
              movements.map((movement) => (
                <tr key={movement.id} className={`border-t transition ${theme.row}`}>
                  <td className="px-5 py-4">
                    {(() => { const { date, time } = fmt12h(movement.createdAt); return (
                      <>
                        <p className="text-sm font-semibold">{date}</p>
                        {time && <p className="text-xs font-medium">{time}</p>}
                      </>
                    ); })()}
                    <p className={`mt-1 text-xs ${theme.muted}`}>{movement.creatorName || "System"}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold">{movement.productName}</p>
                    <p className={`mt-1 text-xs ${theme.muted}`}>
                      {movement.variantCode || movement.variantName || "-"}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${movementClass(movement.qtyBase)}`}>
                      {formatLabel(movement.type)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold">
                      {Number(movement.qtyBase).toLocaleString()}
                    </p>
                    <p className={`mt-1 text-xs ${theme.muted}`}>
                      {Number(movement.qtyBase) >= 0 ? "Stock in" : "Stock out"}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold" title={movement.batchNo}>{truncateBatchNo(movement.batchNo)}</p>
                    <p className={`mt-1 text-xs ${theme.muted}`}>Lot: {movement.lotNo || "-"}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold capitalize">{movement.referenceLabel || formatLabel(movement.refType)}</p>
                    <p className={`mt-1 text-xs ${theme.muted}`}>
                      {movement.sourcePurchaseNo
                        ? `From ${movement.sourcePurchaseNo}`
                        : movement.refId
                          ? `ID: ${movement.refId}`
                          : "-"}
                    </p>
                  </td>
                  <td className={`px-5 py-4 text-sm ${theme.muted}`}>
                    {movement.note || "-"}
                  </td>
                </tr>
              ))
            )}

            {!isLoading && movements.length === 0 && (
              <tr className={`border-t ${theme.row}`}>
                <td colSpan="7" className="px-5 py-10 text-center">
                  <p className={`text-sm font-semibold ${theme.pageTitle}`}>No stock movements yet</p>
                  <p className={`mt-1 text-xs ${theme.muted}`}>Every stock in and stock out movement will appear here.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className={`flex flex-col gap-3 border-t px-5 py-4 ${theme.row} sm:flex-row sm:items-center sm:justify-between`}>
        <p className={`text-sm ${theme.muted}`}>
          Page {pagination.currentPage} of {pagination.lastPage}
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={pagination.currentPage <= 1}
            onClick={() => onPageChange(pagination.currentPage - 1)}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-zinc-300 bg-white px-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
          >
            <FiChevronLeft />
            Previous
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
            Next
            <FiChevronRight />
          </button>
        </div>
      </div>
    </div>
  );
}
