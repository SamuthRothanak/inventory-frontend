import { FiCheck, FiClock, FiCreditCard, FiDollarSign, FiEye, FiPackage, FiRefreshCcw, FiRefreshCw, FiX } from "react-icons/fi";

const STATUS_CHIP = {
  pending_approval: { label: "រង់ចាំអនុម័ត", icon: FiClock,   className: "bg-amber-500/10 text-amber-600" },
  approved:         { label: "ចាំស្តុក",     icon: FiPackage, className: "bg-blue-500/10 text-blue-600" },
};

const RESOLUTION_CHIP = {
  refund:       { label: "សងប្រាក់",   icon: FiDollarSign, className: "bg-red-500/10 text-red-500" },
  replacement:  { label: "ដូរទំនិញ",   icon: FiRefreshCcw, className: "bg-blue-500/10 text-blue-600" },
  store_credit: { label: "Credit ហាង", icon: FiCreditCard, className: "bg-purple-500/10 text-purple-600" },
};

const fmtUsd = (n) => `$${Number(n || 0).toFixed(2)}`;
const fmtKhr = (n) => `៛${Number(n || 0).toLocaleString("en-US")}`;

const itemSummary = (items = []) =>
  items
    .map((item) => `${item.variant_name_snapshot || item.product_name_snapshot} × ${Number(item.qty || 0)} ${item.unit_name_snapshot || ""}`.trim())
    .join(", ");

export default function PendingReturnsPanel({
  theme,
  returns = [],
  isLoading,
  onApprove,
  onComplete,
  onReject,
  onView,
  processingId,
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="summary-icon-3d flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-2xl text-emerald-500">
          <FiRefreshCw className="animate-spin" />
        </div>
      </div>
    );
  }

  if (returns.length === 0) {
    return (
      <div className={`flex flex-col items-center gap-2 py-16 text-center ${theme.muted}`}>
        <div className="summary-icon-3d flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-3xl text-emerald-500">
          <FiCheck />
        </div>
        <p className="text-sm font-semibold">គ្មានសំណើត្រឡប់រង់ចាំអនុម័តទេ</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead>
          <tr className={`border-b ${theme.muted}`}>
            <th className="px-4 py-3 font-semibold">លេខសំណើ</th>
            <th className="px-4 py-3 font-semibold">វិក្កយបត្រដើម</th>
            <th className="px-4 py-3 font-semibold">អតិថិជន</th>
            <th className="px-4 py-3 font-semibold">ទំនិញ</th>
            <th className="px-4 py-3 font-semibold">ដំណោះស្រាយ</th>
            <th className="px-4 py-3 font-semibold">ចំនួនទឹកប្រាក់</th>
            <th className="px-4 py-3 font-semibold">ដាក់ស្នើនៅ</th>
            <th className="px-4 py-3 text-right font-semibold">សកម្មភាព</th>
          </tr>
        </thead>
        <tbody>
          {returns.map((ret) => {
            const isProcessing = processingId === ret.id;
            const isWaitingStock = ret.status === "approved";
            const chip = STATUS_CHIP[ret.status];
            const ChipIcon = chip?.icon;
            return (
              <tr key={ret.id} className={`border-b last:border-0 ${theme.muted} border-opacity-30`}>
                <td className={`px-4 py-3 font-semibold ${theme.pageTitle}`}>
                  <div>{ret.sales_return_no}</div>
                  {chip && (
                    <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${chip.className}`}>
                      {ChipIcon && <ChipIcon size={10} />}
                      {chip.label}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">{ret.original_sale_no_snapshot}</td>
                <td className="px-4 py-3">{ret.customer_name_snapshot || "អតិថិជនទូទៅ"}</td>
                <td className="px-4 py-3 max-w-xs truncate" title={itemSummary(ret.items)}>
                  {itemSummary(ret.items)}
                </td>
                <td className="px-4 py-3">
                  {(() => {
                    const resolution = RESOLUTION_CHIP[ret.resolution_type];
                    const ResolutionIcon = resolution?.icon;
                    return resolution ? (
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${resolution.className}`}>
                        {ResolutionIcon && <ResolutionIcon size={10} />}
                        {resolution.label}
                      </span>
                    ) : (
                      ret.resolution_type
                    );
                  })()}
                </td>
                <td className={`px-4 py-3 font-semibold ${theme.pageTitle}`}>
                  {fmtUsd(ret.total_amount_usd)}
                  <span className={`ml-1 text-xs ${theme.muted}`}>{fmtKhr(ret.total_amount_khr)}</span>
                </td>
                <td className={`px-4 py-3 text-xs ${theme.muted}`}>
                  <span className="inline-flex items-center gap-1">
                    <FiClock className="shrink-0" />
                    {String(ret.created_at || "").slice(0, 16).replace("T", " ")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      title="មើលលម្អិត"
                      onClick={() => onView(ret)}
                      className="quick-action-icon-3d flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-white transition hover:-translate-y-0.5 hover:bg-orange-600 active:translate-y-0"
                    >
                      <FiEye size={16} />
                    </button>
                    <button
                      type="button"
                      title={isWaitingStock ? "បញ្ចប់ (ស្តុកចូលហើយ)" : "អនុម័ត"}
                      disabled={isProcessing}
                      onClick={() => (isWaitingStock ? onComplete(ret) : onApprove(ret))}
                      className="quick-action-icon-3d flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white transition hover:-translate-y-0.5 hover:bg-emerald-600 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <FiCheck size={16} />
                    </button>
                    <button
                      type="button"
                      title={isWaitingStock ? "លុបចោល" : "បដិសេធ"}
                      disabled={isProcessing}
                      onClick={() => onReject(ret)}
                      className="quick-action-icon-3d flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-white transition hover:-translate-y-0.5 hover:bg-red-700 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
