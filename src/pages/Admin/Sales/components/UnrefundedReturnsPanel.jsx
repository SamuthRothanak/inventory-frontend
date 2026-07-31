import { FiCheck, FiDollarSign, FiEye, FiRefreshCw } from "react-icons/fi";

const fmtUsd = (n) => `$${Number(n || 0).toFixed(2)}`;
const fmtKhr = (n) => `៛${Number(n || 0).toLocaleString("en-US")}`;

const itemSummary = (items = []) =>
  items
    .map((item) => `${item.variant_name_snapshot || item.product_name_snapshot} × ${Number(item.qty || 0)} ${item.unit_name_snapshot || ""}`.trim())
    .join(", ");

// Returns already completed (stock restocked) with resolution_type "refund" but no refund ever
// recorded — the gap this panel exists to close. See Sale.jsx's unrefundedReturnsQuery comment
// for why these accumulate (there used to be no "record refund" action anywhere in the app).
export default function UnrefundedReturnsPanel({ theme, returns = [], isLoading, onRefund, onView }) {
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
        <p className="text-sm font-semibold">គ្មានការត្រឡប់ណាមួយរង់ចាំសងប្រាក់ទេ</p>
        <p className="max-w-sm text-xs">ការត្រឡប់ដែលបញ្ចប់ហើយ (ស្តុកចូលវិញរួច) ប៉ុន្តែមិនទាន់បានកត់ត្រាការសងប្រាក់ នឹងបង្ហាញនៅទីនេះ។</p>
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
            <th className="px-4 py-3 font-semibold">ចំនួនត្រូវសង</th>
            <th className="px-4 py-3 font-semibold">បញ្ចប់នៅ</th>
            <th className="px-4 py-3 text-right font-semibold">សកម្មភាព</th>
          </tr>
        </thead>
        <tbody>
          {returns.map((ret) => (
            <tr key={ret.id} className={`border-b last:border-0 ${theme.muted} border-opacity-30`}>
              <td className={`px-4 py-3 font-semibold ${theme.pageTitle}`}>
                <div>{ret.sales_return_no}</div>
                <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-500">
                  <FiDollarSign size={10} /> រង់ចាំសង
                </span>
              </td>
              <td className="px-4 py-3">{ret.original_sale_no_snapshot}</td>
              <td className="px-4 py-3">{ret.customer_name_snapshot || "អតិថិជនទូទៅ"}</td>
              <td className="px-4 py-3 max-w-xs truncate" title={itemSummary(ret.items)}>
                {itemSummary(ret.items)}
              </td>
              <td className={`px-4 py-3 font-semibold ${theme.pageTitle}`}>
                {fmtUsd(ret.total_amount_usd)}
                <span className={`ml-1 text-xs ${theme.muted}`}>{fmtKhr(ret.total_amount_khr)}</span>
              </td>
              <td className={`px-4 py-3 text-xs ${theme.muted}`}>
                {String(ret.returned_at || ret.updated_at || "").slice(0, 16).replace("T", " ")}
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
                    title="កត់ត្រាការសងប្រាក់"
                    onClick={() => onRefund(ret)}
                    className="quick-action-icon-3d flex h-9 items-center justify-center gap-1.5 rounded-xl bg-red-600 px-3 text-xs font-bold text-white transition hover:-translate-y-0.5 hover:bg-red-700 active:translate-y-0"
                  >
                    <FiDollarSign size={14} /> សងប្រាក់
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
