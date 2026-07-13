import {
  FiBox,
  FiClipboard,
  FiDollarSign,
  FiHash,
  FiTag,
  FiX,
} from "react-icons/fi";

const REASON_LABEL_KH = { damaged: "ខូចខាត", expired: "ផុតកំណត់", internal_use: "ដកប្រើប្រាស់ខ្លួនឯង", lost: "បាត់", stock_count: "រាប់ស្តុកពិតប្រាកដ", correction: "ការកែតម្រូវ", other: "ផ្សេងទៀត" };
const ADJUSTMENT_STATUS_KH = { draft: "សេចក្ដីព្រាង", approved: "បានអនុម័ត", cancelled: "បានបោះបង់" };
const ADJUSTMENT_TYPE_KH = { increase: "បន្ថែម", decrease: "កាត់" };
const MOVEMENT_TYPE_KH = { purchase_in: "ទិញចូល", sale_out: "លក់ចេញ", damage_out: "ខូចខាតចេញ", adjustment_in: "ការកែតម្រូវចូល", adjustment_out: "ការកែតម្រូវចេញ", stock_count: "រាប់ស្តុក", correction: "ការកែតម្រូវ", internal_use: "ដកប្រើប្រាស់ខ្លួនឯង", expired_out: "ផុតកំណត់ចេញ", lost_out: "បាត់ចេញ" };
const formatReason = (value = "") => REASON_LABEL_KH[String(value)] || String(value).replaceAll("_", " ");
const formatMovementType = (value = "") => MOVEMENT_TYPE_KH[String(value)] || String(value).replaceAll("_", " ");

const statusClass = (status) => {
  if (status === "approved") return "bg-emerald-500/10 text-emerald-500";
  if (status === "cancelled") return "bg-zinc-500/10 text-zinc-400";
  return "bg-amber-500/10 text-amber-500";
};

export default function StockAdjustmentDetailModal({ adjustment, theme, onClose }) {
  const totalBaseQty = adjustment.items.reduce(
    (total, item) => total + Number(item.baseQty || 0),
    0
  );
  const totalCost = adjustment.items.reduce(
    (total, item) => total + Number(item.lineCost || 0),
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm">
      <div className={`flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border shadow-2xl ${theme.modal}`}>
        <div className={`flex items-start justify-between gap-4 border-b p-6 ${theme.modalHeader}`}>
          <div>
            <h2 className="text-xl font-bold">
              {adjustment.adjustmentNo || `ADJ-${adjustment.id}`}
            </h2>
            <p className={`mt-1 text-sm ${theme.muted}`}>
              ព័ត៌មានលម្អិតការកែតម្រូវស្តុក
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-zinc-700 shadow-sm transition hover:bg-zinc-100"
          >
            <FiX size={22} />
          </button>
        </div>

        <div className={`flex-1 overflow-y-auto p-6 ${theme.modalBody}`}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className={`rounded-2xl border p-4 ${theme.softCard}`}>
              <div className="flex items-center gap-3">
                <FiHash className="text-xl text-red-500" />
                <div>
                  <p className={`text-xs ${theme.muted}`}>ប្រភេទ</p>
                  <p className="text-sm font-semibold">
                    {ADJUSTMENT_TYPE_KH[adjustment.adjustmentType] || adjustment.adjustmentType}
                  </p>
                </div>
              </div>
            </div>

            <div className={`rounded-2xl border p-4 ${theme.softCard}`}>
              <div className="flex items-center gap-3">
                <FiTag className="text-xl text-amber-500" />
                <div>
                  <p className={`text-xs ${theme.muted}`}>មូលហេតុ</p>
                  <p className="text-sm font-semibold">
                    {formatReason(adjustment.reason)}
                  </p>
                </div>
              </div>
            </div>

            <div className={`rounded-2xl border p-4 ${theme.softCard}`}>
              <div className="flex items-center gap-3">
                <FiBox className="text-xl text-blue-500" />
                <div>
                  <p className={`text-xs ${theme.muted}`}>ចំនួនមូលដ្ឋាន</p>
                  <p className="text-sm font-semibold">
                    {Number(totalBaseQty).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className={`rounded-2xl border p-4 ${theme.softCard}`}>
              <div className="flex items-center gap-3">
                <FiDollarSign className="text-xl text-emerald-500" />
                <div>
                  <p className={`text-xs ${theme.muted}`}>តម្លៃសរុបបន្ទាត់</p>
                  <p className="text-sm font-semibold">
                    ${Number(totalCost).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className={`mt-5 rounded-2xl border p-5 ${theme.softCard}`}>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className={`text-xs ${theme.muted}`}>ថ្ងៃបង្កើត</p>
                <p className="mt-1 text-sm font-semibold">
                  {adjustment.createdAt || "-"}
                </p>
              </div>

              <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${statusClass(adjustment.status)}`}>
                {ADJUSTMENT_STATUS_KH[adjustment.status] || adjustment.status}
              </span>
            </div>

            {adjustment.note && (
              <div className="mt-4 flex gap-3">
                <FiClipboard className={`mt-0.5 shrink-0 ${theme.muted}`} />
                <p className={`text-sm ${theme.muted}`}>{adjustment.note}</p>
              </div>
            )}
          </div>

          <div className={`mt-5 overflow-hidden rounded-2xl border ${theme.tableWrap}`}>
            <div className="border-b border-zinc-200 px-5 py-4 dark:border-white/10">
              <h3 className="text-base font-semibold">ទំនិញកែតម្រូវ</h3>
              <p className={`mt-1 text-xs ${theme.muted}`}>
                {adjustment.items.length} បន្ទាត់ទំនិញ
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-red-600 text-white">
                  <tr>
                    <th className="px-5 py-3 text-left text-sm font-semibold">ផលិតផល / ប្រភេទ</th>
                    <th className="px-5 py-3 text-left text-sm font-semibold">ចលនា</th>
                    <th className="px-5 py-3 text-left text-sm font-semibold">ចំនួន</th>
                    <th className="px-5 py-3 text-left text-sm font-semibold">តម្លៃ</th>
                    <th className="px-5 py-3 text-left text-sm font-semibold">កំណត់ចំណាំ</th>
                  </tr>
                </thead>
                <tbody>
                  {adjustment.items.map((item) => (
                    <tr key={item.id} className={`border-t ${theme.row}`}>
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold">{item.productName}</p>
                        <p className={`mt-1 text-xs ${theme.muted}`}>
                          {item.variantCode || item.variantName}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold">
                          {formatMovementType(item.movementType)}
                        </p>
                        <p className={`mt-1 text-xs ${theme.muted}`}>
                          Batch: {item.inventoryBatchId || "-"}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold">
                          {Number(item.qty).toLocaleString()} {item.unitName}
                        </p>
                        <p className={`mt-1 text-xs ${theme.muted}`}>
                          មូលដ្ឋាន: {Number(item.baseQty).toLocaleString()}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold">
                          ${Number(item.lineCost).toFixed(2)}
                        </p>
                        <p className={`mt-1 text-xs ${theme.muted}`}>
                          តម្លៃដើម: ${Number(item.unitCostBase).toFixed(2)}
                        </p>
                      </td>
                      <td className={`px-5 py-4 text-sm ${theme.muted}`}>
                        {item.note || "-"}
                      </td>
                    </tr>
                  ))}

                  {adjustment.items.length === 0 && (
                    <tr className={`border-t ${theme.row}`}>
                      <td colSpan="5" className="px-5 py-8 text-center text-sm">
                        គ្មានទំនិញ
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className={`flex justify-end border-t p-4 ${theme.modalHeader}`}>
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl bg-white px-6 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-100"
          >
            បិទ
          </button>
        </div>
      </div>
    </div>
  );
}
