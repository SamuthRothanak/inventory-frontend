import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import TableLoading from "../../../../components/TableLoading";

// Matches App\Enums\StockMovementType's actual case values — keep in sync with that enum,
// not with any other module's own vocabulary (e.g. ref_type below is a separate enum).
const MOVEMENT_TYPE_KH = {
  purchase_in: "ទិញចូល",
  sale_out: "លក់ចេញ",
  purchase_return_out: "ត្រឡប់ការទិញចេញ",
  sale_return_in: "ត្រឡប់ការលក់ចូល",
  sale_return_replacement_out: "ប្តូរជំនួសចេញ",
  damage_out: "ខូចខាតចេញ",
  adjustment_in: "ការកែតម្រូវចូល",
  adjustment_out: "ការកែតម្រូវចេញ",
  expired_out: "ផុតកំណត់ចេញ",
  internal_use_out: "ដកប្រើប្រាស់ខ្លួនឯងចេញ",
  lost_out: "បាត់ចេញ",
  transfer_in: "ផ្ទេរចូល",
  transfer_out: "ផ្ទេរចេញ",
};

export const formatMovementTypeKh = (type = "") =>
  MOVEMENT_TYPE_KH[String(type).toLowerCase()] ||
  String(type).replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

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
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  return { date, time };
};

const movementStyle = (qtyBase) =>
  Number(qtyBase) >= 0
    ? "bg-emerald-500/10 text-emerald-600"
    : "bg-red-500/10 text-red-500";

export const translateNote = (note = "") => {
  if (!note || note === "-") return "-";
  if (note === "Manual stock adjustment") return "ការកែតម្រូវស្តុកដោយដៃ";
  if (note === "Purchase stock") return "ស្តុកទិញ";
  if (note === "POS sales") return "ការលក់ POS";
  if (note === "Sold out") return "លក់អស់";
  if (note === "Stock out from purchase return.") return "ស្តុកចេញពីការត្រឡប់ការទិញ។";

  const m1 = note.match(/^Stock in confirmed from (.+)$/);
  if (m1) return `ស្តុកចូលបានបញ្ជាក់ពី ${m1[1]}`;
  const m2 = note.match(/^Stock out from sale (.+)$/i);
  if (m2) return `ស្តុកចេញពីការលក់ ${m2[1]}`;
  const m3 = note.match(/^Stock out from (.+)$/i);
  if (m3) return `ស្តុកចេញពី ${m3[1]}`;
  const m4 = note.match(/^Stock in from (.+)$/i);
  if (m4) return `ស្តុកចូលពី ${m4[1]}`;
  const m5 = note.match(/^Stock returned from (.+)$/i);
  if (m5) return `ស្តុកបានត្រឡប់ពី ${m5[1]}`;
  const m6 = note.match(/^Replacement stock issued for (.+)$/i);
  if (m6) return `ស្តុកជំនួសបានចេញសម្រាប់ ${m6[1]}`;
  const m7 = note.match(/^Replacement stock in from purchase return claim (.+)$/i);
  if (m7) return `ស្តុកជំនួសបានចូលពីការទាមទារត្រឡប់ការទិញ ${m7[1]}`;
  if (note === "accepted purchase quantity.") return "ទទួលចំនួនស្តុកទិញ";
  return note;
};

// Matches App\Enums\StockMovementRefType's case values, as rendered by Inventory.jsx's
// normalizeStockMovement() — either "Claim {purchase_return_no}" (purchase_return with a known
// claim number) or "{ref_type with underscores as spaces} #{id}" (every other ref_type, or
// purchase/purchase_return without their own number resolved).
const REF_TYPE_KH = {
  purchase: "ការទិញ",
  sale: "ការលក់",
  "purchase return": "ត្រឡប់ការទិញ",
  "sale return": "ត្រឡប់ការលក់",
  adjustment: "ការកែតម្រូវស្តុក",
  transfer: "ការផ្ទេរ",
  damage: "ខូចខាត",
};

const translateReferenceLabel = (label = "") => {
  const claimMatch = label.match(/^Claim (.+)$/);
  if (claimMatch) return `ត្រឡប់ការទិញ ${claimMatch[1]}`;

  const refMatch = label.match(/^([a-z][a-z_\s]*[a-z])(?:\s+#(\d+))?$/i);
  if (refMatch) {
    const key = refMatch[1].toLowerCase();
    if (key in REF_TYPE_KH) {
      return REF_TYPE_KH[key] + (refMatch[2] ? ` #${refMatch[2]}` : "");
    }
  }

  return label;
};

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
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-white/10">
        <div>
          <h2 className={`text-base font-semibold ${theme.pageTitle}`}>ចលនាស្តុក</h2>
          <p className={`mt-0.5 text-xs ${theme.muted}`}>
            {isLoading ? "រង់ចាំបន្តិច..." : `${pagination.total} កំណត់ត្រាចលនា`}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-240">
          <thead className="bg-red-600 text-white">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide">កាលបរិច្ឆេទ</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide">ផលិតផល</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide">ចលនា</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide">ចំនួន</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide">បាច់ / លេខបាច់</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide">តំណភ្ជាប់</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide">កំណត់ចំណាំ</th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <TableLoading theme={theme} colSpan={7} text="រង់ចាំបន្តិច..." />
            ) : (
              movements.map((movement) => {
                const { date, time } = fmt12h(movement.createdAt);
                const isIn = Number(movement.qtyBase) >= 0;
                return (
                  <tr key={movement.id} className={`border-t transition ${theme.row}`}>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-semibold">{date}</p>
                      <p className={`text-xs ${theme.muted}`}>{time}{time && movement.creatorName ? " · " : ""}{movement.creatorName || "ប្រព័ន្ធ"}</p>
                    </td>

                    <td className="px-5 py-3.5">
                      <p className="text-sm font-semibold">{movement.productName}</p>
                      {(movement.variantCode || movement.variantName) && (
                        <span className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium ${theme.badge}`}>
                          {movement.variantCode || movement.variantName}
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${movementStyle(movement.qtyBase)}`}>
                        {formatMovementTypeKh(movement.type)}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      <p className={`text-sm font-bold ${isIn ? "text-emerald-600" : "text-red-500"}`}>
                        {isIn ? "+" : ""}{Number(movement.qtyBase).toLocaleString()}
                      </p>
                      <p className={`text-[11px] ${theme.muted}`}>{isIn ? "ស្តុកចូល" : "ស្តុកចេញ"}</p>
                    </td>

                    <td className="px-5 py-3.5">
                      <p className="text-sm font-semibold" title={movement.batchNo}>
                        {truncateBatchNo(movement.batchNo)}
                      </p>
                      <p className={`text-[11px] ${theme.muted}`}>លេខបាច់: {movement.lotNo || "-"}</p>
                    </td>

                    <td className="px-5 py-3.5">
                      <p className="text-sm font-semibold">{translateReferenceLabel(movement.referenceLabel) || formatMovementTypeKh(movement.refType)}</p>
                      <p className={`text-[11px] ${theme.muted}`}>
                        {movement.sourcePurchaseNo ? `ពី ${movement.sourcePurchaseNo}` : movement.refId ? `#${movement.refId}` : "-"}
                      </p>
                    </td>

                    <td className={`max-w-xs px-5 py-3.5`}>
                      <p className={`truncate text-xs ${theme.muted}`} title={movement.note || ""}>
                        {translateNote(movement.note)}
                      </p>
                    </td>
                  </tr>
                );
              })
            )}

            {!isLoading && movements.length === 0 && (
              <tr className={`border-t ${theme.row}`}>
                <td colSpan={7} className="px-5 py-12 text-center">
                  <p className={`text-sm font-semibold ${theme.pageTitle}`}>គ្មានចលនាស្តុកនៅឡើយ</p>
                  <p className={`mt-1 text-xs ${theme.muted}`}>ចលនាស្តុកចូល និងចេញទាំងអស់នឹងបង្ហាញនៅទីនេះ។</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className={`flex flex-col gap-3 border-t px-5 py-4 ${theme.row} sm:flex-row sm:items-center sm:justify-between`}>
        <p className={`text-xs ${theme.muted}`}>ទំព័រ {pagination.currentPage} នៃ {pagination.lastPage}</p>
        <div className="flex items-center gap-2">
          <button type="button" disabled={pagination.currentPage <= 1}
            onClick={() => onPageChange(pagination.currentPage - 1)}
            className="table-icon-3d inline-flex h-9 items-center gap-1 rounded-xl border border-zinc-300 bg-white px-3 text-xs font-semibold text-zinc-700 transition hover:-translate-y-0.5 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10">
            <FiChevronLeft /> មុន
          </button>
          {pageNumbers.map((p) => (
            <button key={p} type="button" onClick={() => onPageChange(p)}
              className={`h-9 min-w-9 rounded-xl px-3 text-xs font-bold transition hover:-translate-y-0.5 ${
                p === pagination.currentPage
                  ? "quick-action-icon-3d bg-red-600 text-white"
                  : "table-icon-3d border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
              }`}>
              {p}
            </button>
          ))}
          <button type="button" disabled={pagination.currentPage >= pagination.lastPage}
            onClick={() => onPageChange(pagination.currentPage + 1)}
            className="table-icon-3d inline-flex h-9 items-center gap-1 rounded-xl border border-zinc-300 bg-white px-3 text-xs font-semibold text-zinc-700 transition hover:-translate-y-0.5 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10">
            បន្ទាប់ <FiChevronRight />
          </button>
        </div>
      </div>
    </div>
  );
}
