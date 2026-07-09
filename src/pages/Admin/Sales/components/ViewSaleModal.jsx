import { useQuery } from "@tanstack/react-query";
import {
  FiCreditCard,
  FiDollarSign,
  FiMapPin,
  FiPackage,
  FiPrinter,
  FiRefreshCcw,
  FiShoppingCart,
} from "react-icons/fi";
import { getSalesReturnsApi } from "../../../../services/salesReturn.service";
import { FormSection, InfoLine, ModalShell, SummaryMiniBox } from "./SaleModalShared";

const CHANNEL_LABELS = { pos: "POS", phone_order: "ការបញ្ជាទិញតាមទូរស័ព្ទ", online: "អនឡាញ" };
const TYPE_LABELS    = { retail: "លក់រាយ", wholesale: "លក់ដុំ" };
const METHOD_LABELS  = { cash: "សាច់ប្រាក់", bank_transfer: "ផ្ទេរធនាគារ", qr: "QR Code", card: "កាត", other: "ផ្សេងៗ" };

const PAYMENT_STATUS_STYLE = {
  paid:     "bg-emerald-500/10 text-emerald-600",
  partial:  "bg-amber-500/10 text-amber-600",
  unpaid:   "bg-red-500/10 text-red-500",
  refunded: "bg-zinc-200 text-zinc-500 dark:bg-white/10 dark:text-zinc-400",
};
const PAYMENT_STATUS_KH = { paid: "បានបង់", partial: "បង់មួយផ្នែក", unpaid: "មិនទាន់បង់", refunded: "បានសង" };
const SALE_STATUS_KH = { completed: "បានបញ្ចប់", confirmed: "បានបញ្ជាក់", draft: "សេចក្ដីព្រាង", cancelled: "បានបោះបង់" };
const SALE_STATUS_STYLE = {
  completed: "bg-emerald-500/10 text-emerald-600",
  confirmed: "bg-blue-500/10 text-blue-600",
  draft:     "bg-amber-500/10 text-amber-600",
  cancelled: "bg-red-500/10 text-red-500",
};

const RETURN_STATUS_STYLE = {
  pending_approval: "bg-yellow-500/10 text-yellow-600",
  approved:         "bg-blue-500/10 text-blue-600",
  completed:        "bg-emerald-500/10 text-emerald-600",
  rejected:         "bg-red-500/10 text-red-500",
};
const RETURN_STATUS_LABEL  = { pending_approval: "រង់ចាំ", approved: "យល់ព្រម", completed: "បញ្ចប់ហើយ", rejected: "បដិសេធ" };
const RESOLUTION_LABEL     = { refund: "សងប្រាក់ជូនអតិថិជន", replacement: "ដូរទំនិញ", store_credit: "ប្រាក់ credit ហាង" };
const RETURN_TYPE_LABEL    = { full: "ត្រឡប់ទាំងអស់", partial: "ត្រឡប់មួយចំណែក" };
const CONDITION_LABEL      = { good: "ល្អ", damaged: "ខូច", defective: "មានបញ្ហា", expired: "ផុតកំណត់" };
const CONDITION_COLOR      = { good: "text-emerald-600", damaged: "text-red-500", defective: "text-red-500", expired: "text-amber-600" };
const STOCK_ACTION_LABEL   = { restock: "ដាក់ស្តុកត្រឡប់", damaged_write_off: "លុបបំណុលស្តុក", discard: "បោះចោល" };

export function ViewSaleModal({ sale, theme, onClose, onPrint }) {
  const fmtRate = Number(sale.exchangeRateKhrPerUsd).toLocaleString(undefined, { maximumFractionDigits: 2 });

  const returnsQuery = useQuery({
    queryKey: ["admin-sale-returns", sale.id],
    queryFn:  () => getSalesReturnsApi({ sale_id: sale.id, per_page: 50 }),
    enabled:  sale.returnsCount > 0,
  });

  const returns = (() => {
    const d = returnsQuery.data;
    if (Array.isArray(d))             return d;
    if (Array.isArray(d?.data))       return d.data;
    if (Array.isArray(d?.data?.data)) return d.data.data;
    return [];
  })();

  function printReturnReceipt(ret) {
    const conditionLabel   = { good: "ល្អ", damaged: "ខូច", defective: "មានបញ្ហា", expired: "ផុតកំណត់" };
    const stockLabel       = { restock: "ដាក់ស្តុកត្រឡប់", damaged_write_off: "លុបបំណុលស្តុក", discard: "បោះចោល" };
    const resolutionLabel  = { refund: "សងប្រាក់ជូនអតិថិជន", replacement: "ដូរទំនិញ", store_credit: "ប្រាក់ credit ហាង" };
    const returnTypeLabel  = { full: "ត្រឡប់ទាំងអស់", partial: "ត្រឡប់មួយចំណែក" };

    const itemRows = (ret.items ?? []).map((item) => `
      <tr>
        <td>${item.variant_name_snapshot || item.product_name_snapshot || "—"}<br/>
            <small style="color:#666">${item.product_name_snapshot} · ${item.unit_name_snapshot}</small></td>
        <td style="text-align:center">${item.qty} ${item.unit_name_snapshot}</td>
        <td style="text-align:center">${conditionLabel[item.item_condition] ?? item.item_condition}</td>
        <td style="text-align:center">${stockLabel[item.stock_action] ?? item.stock_action}</td>
        <td style="text-align:right">$${Number(item.line_total_usd).toFixed(2)}</td>
      </tr>`).join("");

    const refundRow = ret.refund_method
      ? `<tr><td colspan="4" style="font-weight:600">វិធីសងប្រាក់</td>
             <td style="text-align:right">${ret.refund_method.replace(/_/g, " ")}</td></tr>
         <tr><td colspan="4" style="font-weight:600">ចំនួនសង</td>
             <td style="text-align:right;color:#059669">$${Number(ret.refund_amount_usd).toFixed(2)}</td></tr>`
      : "";

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
      <title>${ret.sales_return_no}</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: Arial, sans-serif; font-size: 13px; padding: 32px; color: #111; }
        h1 { font-size: 20px; margin-bottom: 2px; }
        .sub { color: #666; font-size: 12px; margin-bottom: 20px; }
        .badge { display:inline-block; background:#fee2e2; color:#dc2626; border-radius:6px; padding:2px 10px; font-size:11px; font-weight:700; margin-bottom:16px; }
        .grid { display:grid; grid-template-columns:1fr 1fr; gap:8px 24px; margin-bottom:20px; }
        .grid div { font-size:12px; }
        .grid .label { color:#666; font-size:11px; }
        table { width:100%; border-collapse:collapse; margin-bottom:16px; }
        th { background:#dc2626; color:#fff; padding:7px 10px; text-align:left; font-size:12px; }
        td { padding:7px 10px; border-bottom:1px solid #eee; font-size:12px; vertical-align:top; }
        .total-row td { font-weight:700; font-size:14px; border-top:2px solid #dc2626; border-bottom:none; }
        .reason { background:#fef9c3; border:1px solid #fde68a; border-radius:6px; padding:10px; margin-bottom:16px; font-size:12px; }
        .footer { margin-top:24px; text-align:center; font-size:11px; color:#999; border-top:1px dashed #ccc; padding-top:12px; }
        @media print { body { padding:16px; } }
      </style></head><body>
      <h1>${ret.sales_return_no}</h1>
      <div class="sub">Original Invoice: ${ret.original_sale_no_snapshot ?? sale.saleNo} · ${ret.created_at?.slice(0,10) ?? ""}</div>
      <div class="badge">កំណត់ត្រាការត្រឡប់ទំនិញ</div>
      <div class="grid">
        <div><div class="label">អតិថិជន</div>${sale.customerName}</div>
        <div><div class="label">អ្នកគិតប្រាក់</div>${sale.cashierName}</div>
        <div><div class="label">ប្រភេទការត្រឡប់</div>${returnTypeLabel[ret.return_type] ?? ret.return_type}</div>
        <div><div class="label">ដំណោះស្រាយ</div>${resolutionLabel[ret.resolution_type] ?? ret.resolution_type}</div>
      </div>
      ${ret.reason ? `<div class="reason"><strong>មូលហេតុ:</strong> ${ret.reason}</div>` : ""}
      <table>
        <thead><tr>
          <th>ផលិតផល</th><th style="text-align:center">ចំនួន</th>
          <th style="text-align:center">ស្ថានភាព</th><th style="text-align:center">ស្តុក</th>
          <th style="text-align:right">ចំនួនទឹកប្រាក់</th>
        </tr></thead>
        <tbody>${itemRows}</tbody>
        <tfoot>
          <tr class="total-row">
            <td colspan="4">ចំនួនត្រឡប់សរុប</td>
            <td style="text-align:right;color:#dc2626">$${Number(ret.total_amount_usd).toFixed(2)}</td>
          </tr>
          ${refundRow}
        </tfoot>
      </table>
      <div class="footer">អរគុណ · ${new Date().toLocaleString()}</div>
      </body></html>`;

    const win = window.open("", "_blank", "width=680,height=900");
    win.document.write(html);
    win.document.close();
    win.onload = () => { win.focus(); win.print(); };
  }

  return (
    <ModalShell
      title={sale.saleNo}
      subtitle={`${sale.customerName} · ${sale.displayDate} · ${sale.cashierName}`}
      theme={theme}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 dark:hover:text-white"
          >
            បិទ
          </button>
          {onPrint && (
            <button
              type="button"
              onClick={onPrint}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
            >
              <FiPrinter size={15} />
              បោះពុម្ព
            </button>
          )}
        </>
      }
    >
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_1fr]">
        {/* ── Left info panel ── */}
        <div className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
            <FiShoppingCart size={38} />
          </div>

          <div className="mt-5 space-y-3 text-sm">
            <InfoLine label="លេខវិក្កយបត្រ"  value={sale.saleNo} />
            <InfoLine label="អតិថិជន"        value={sale.customerName} />
            <InfoLine label="អ្នកគិតប្រាក់"  value={sale.cashierName} />
            <InfoLine label="ប្រភេទការលក់"   value={TYPE_LABELS[sale.saleType]    ?? sale.saleType} />
            <InfoLine label="បណ្ដាញការលក់"  value={CHANNEL_LABELS[sale.saleChannel] ?? sale.saleChannel} />
            <InfoLine label="រូបិយប័ណ្ណ"     value={sale.invoiceCurrency} />
            <InfoLine label="អត្រាប្ដូររូបិយប័ណ្ណ" value={`1 USD = ${fmtRate} ៛`} />
          </div>

          <div className="mt-4 space-y-3 border-t border-zinc-200 pt-4 text-sm dark:border-white/10">
            <div>
              <p className="text-xs font-semibold text-zinc-500">ស្ថានភាពការលក់</p>
              <span className={`mt-1.5 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${SALE_STATUS_STYLE[sale.saleStatus] ?? "bg-zinc-100 text-zinc-500"}`}>
                {SALE_STATUS_KH[sale.saleStatus] ?? sale.saleStatus}
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-500">ស្ថានភាពទូទាត់</p>
              <span className={`mt-1.5 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${PAYMENT_STATUS_STYLE[sale.paymentStatus] ?? "bg-zinc-100 text-zinc-500"}`}>
                {PAYMENT_STATUS_KH[sale.paymentStatus] ?? sale.paymentStatus}
              </span>
            </div>
          </div>
        </div>

        {/* ── Right content ── */}
        <div className="space-y-5">
          {/* Sale Items */}
          <FormSection
            title="ទំនិញដែលលក់"
            subtitle="ព័ត៌មានទំនិញត្រូវបានរក្សាទុកពេលលក់ ។"
            icon={<FiPackage />}
            theme={theme}
          >
            <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-white/10">
              <table className="w-full min-w-[600px] text-sm">
                <thead className="bg-red-600 text-white">
                  <tr>
                    <th className="px-3 py-3 text-left">មុខទំនិញ</th>
                    <th className="px-3 py-3 text-left">ចំនួន</th>
                    <th className="px-3 py-3 text-left">តម្លៃ</th>
                    <th className="px-3 py-3 text-right">សរុបតម្លៃ</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.items.map((item) => (
                    <tr key={item.id} className="border-t border-zinc-200 dark:border-white/10">
                      <td className="px-3 py-3">
                        <p className="font-semibold">{item.variantNameSnapshot}</p>
                        <p className={`mt-1 text-xs ${theme.muted}`}>
                          {item.productNameSnapshot} · {item.unitNameSnapshot}
                        </p>
                      </td>
                      <td className="px-3 py-3">{item.qty} {item.unitNameSnapshot}</td>
                      <td className="px-3 py-3">
                        <p>${Number(item.unitPrice).toFixed(2)}</p>
                        <p className={`text-xs ${theme.muted}`}>= {Math.round(Number(item.unitPrice) * Number(sale.exchangeRateKhrPerUsd)).toLocaleString()} ៛</p>
                      </td>
                      <td className="px-3 py-3 text-right font-semibold">
                        <p>${Number(item.lineTotal).toFixed(2)}</p>
                        <p className={`text-xs font-normal ${theme.muted}`}>= {Math.round(Number(item.lineTotal) * Number(sale.exchangeRateKhrPerUsd)).toLocaleString()} ៛</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FormSection>

          {/* Summary */}
          <FormSection
            title="សង្ខេប"
            subtitle="ចំនួនលក់, បញ្ចុះតម្លៃ, ថ្លៃដឹក, និងសរុប ។"
            icon={<FiDollarSign />}
            theme={theme}
          >
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <SummaryMiniBox theme={theme} label="តម្លៃដើម"      value={`$${Number(sale.subtotal || 0).toFixed(2)}`} />
              <SummaryMiniBox theme={theme} label="បញ្ចុះតម្លៃ"   value={`$${Number(sale.discountTotal || 0).toFixed(2)}`} />
              <SummaryMiniBox theme={theme} label="ដឹកជញ្ជូន"     value={sale.deliveryRequired ? `$${Number(sale.deliveryFee || 0).toFixed(2)}` : "—"} />
              <SummaryMiniBox
                theme={theme}
                label="ចំនួនទឹកប្រាក់សរុប"
                value={`$${Number(sale.grandTotal).toFixed(2)}`}
                subValue={`= ${Math.round(Number(sale.grandTotal) * Number(sale.exchangeRateKhrPerUsd)).toLocaleString()} ៛`}
                strong
              />
            </div>

            {sale.deliveryRequired && sale.deliveryAddress && (
              <div className="mt-4 rounded-xl border border-zinc-200 p-4 dark:border-white/10">
                <div className="flex items-start gap-3">
                  <FiMapPin className="mt-1 shrink-0 text-red-500" />
                  <div>
                    <p className="text-sm font-semibold">អាសយដ្ឋានដឹកជញ្ជូន</p>
                    <p className={`mt-1 text-sm ${theme.muted}`}>{sale.deliveryAddress}</p>
                  </div>
                </div>
              </div>
            )}

            {sale.note && (
              <div className="mt-4">
                <p className={`text-xs font-semibold ${theme.muted}`}>ចំណាំ</p>
                <p className="mt-2 text-sm leading-6">{sale.note}</p>
              </div>
            )}
          </FormSection>

          {/* Payments */}
          <FormSection
            title="ការទូទាត់"
            subtitle="ការទូទាត់ដែលបានកត់ត្រាសម្រាប់ការលក់នេះ ។"
            icon={<FiCreditCard />}
            theme={theme}
          >
            {sale.payments.length === 0 ? (
              <div className={`rounded-xl border p-4 text-center ${theme.softCard}`}>
                <p className={`text-sm ${theme.muted}`}>មិនទាន់មានការទូទាត់ ។</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sale.payments.map((p, i) => (
                  <div key={p.id ?? i} className={`flex items-center justify-between rounded-xl border p-3 ${theme.softCard}`}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                        <FiCreditCard size={14} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">
                          {METHOD_LABELS[p.paymentMethod] ?? p.paymentMethod}
                        </p>
                        {p.providerName && (
                          <p className={`text-xs ${theme.muted}`}>{p.providerName}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">
                        {p.currencyCode === "KHR"
                          ? `${Number(p.amountReceived).toLocaleString()} ៛`
                          : `$${Number(p.amountReceived).toFixed(2)}`}
                      </p>
                      {Number(p.changeAmount || 0) > 0 && (
                        <p className="text-xs font-semibold text-emerald-600">
                          អាប់: {p.changeCurrency === "KHR"
                            ? `${Number(p.changeAmount).toLocaleString()} ៛`
                            : `$${Number(p.changeAmount).toFixed(2)}`}
                        </p>
                      )}
                      {p.paidAt && (
                        <p className={`text-xs ${theme.muted}`}>{String(p.paidAt).slice(0, 10)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </FormSection>

          {/* Returns History */}
          {sale.returnsCount > 0 && (
            <FormSection
              title={`ប្រវត្តិត្រឡប់ (${sale.returnsCount})`}
              subtitle="ការត្រឡប់ទំនិញទាំងអស់ដែលភ្ជាប់ជាមួយការលក់នេះ ។"
              icon={<FiRefreshCcw />}
              theme={theme}
            >
              {returnsQuery.isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <div className={`h-5 w-5 animate-spin rounded-full border-2 border-t-transparent ${theme.muted}`} />
                </div>
              ) : returns.length === 0 ? (
                <p className={`text-sm ${theme.muted}`}>រកមិនឃើញការត្រឡប់ ។</p>
              ) : (
                <div className="space-y-4">
                  {returns.map((ret) => (
                    <div key={ret.id} className={`rounded-xl border ${theme.softCard}`}>
                      {/* Return header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 px-4 py-3 dark:border-white/10">
                        <div className="flex items-center gap-2">
                          <FiRefreshCcw className="text-red-500" size={14} />
                          <span className="font-bold">{ret.sales_return_no}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${RETURN_STATUS_STYLE[ret.status] ?? "bg-zinc-100 text-zinc-500"}`}>
                            {RETURN_STATUS_LABEL[ret.status] ?? ret.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`flex items-center gap-3 text-xs ${theme.muted}`}>
                            <span>{RETURN_TYPE_LABEL[ret.return_type] ?? ret.return_type}</span>
                            <span>·</span>
                            <span>{ret.created_at?.slice(0, 10)}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => printReturnReceipt(ret)}
                            title="Print return receipt"
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 transition hover:bg-zinc-200 dark:bg-white/10 dark:text-zinc-300 dark:hover:bg-white/20"
                          >
                            <FiPrinter size={13} />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3 p-4">
                        {/* Resolution + Reason */}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div>
                            <p className={`text-xs font-semibold ${theme.muted}`}>ដំណោះស្រាយ</p>
                            <p className="mt-1 text-sm font-semibold">{RESOLUTION_LABEL[ret.resolution_type] ?? ret.resolution_type}</p>
                          </div>
                          {ret.reason && (
                            <div>
                              <p className={`text-xs font-semibold ${theme.muted}`}>មូលហេតុ</p>
                              <p className="mt-1 text-sm">{ret.reason}</p>
                            </div>
                          )}
                        </div>

                        {/* Returned items */}
                        {ret.items?.length > 0 && (
                          <div>
                            <p className={`mb-2 text-xs font-semibold ${theme.muted}`}>ទំនិញដែលត្រឡប់</p>
                            <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-white/10">
                              <table className="w-full text-sm">
                                <thead className={`text-xs ${theme.muted}`}>
                                  <tr className="border-b border-zinc-200 dark:border-white/10">
                                    <th className="px-3 py-2 text-left font-semibold">ផលិតផល</th>
                                    <th className="px-3 py-2 text-left font-semibold">ចំនួន</th>
                                    <th className="px-3 py-2 text-left font-semibold">ស្ថានភាព</th>
                                    <th className="px-3 py-2 text-left font-semibold">ស្តុក</th>
                                    <th className="px-3 py-2 text-right font-semibold">ចំនួនទឹកប្រាក់</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {ret.items.map((item) => (
                                    <tr key={item.id} className="border-t border-zinc-200 dark:border-white/10">
                                      <td className="px-3 py-2">
                                        <p className="font-semibold">{item.variant_name_snapshot || item.product_name_snapshot}</p>
                                        <p className={`text-xs ${theme.muted}`}>{item.product_name_snapshot} · {item.unit_name_snapshot}</p>
                                      </td>
                                      <td className="px-3 py-2">{item.qty} {item.unit_name_snapshot}</td>
                                      <td className="px-3 py-2">
                                        <span className={`font-semibold capitalize ${CONDITION_COLOR[item.item_condition]}`}>
                                          {CONDITION_LABEL[item.item_condition] ?? item.item_condition}
                                        </span>
                                      </td>
                                      <td className={`px-3 py-2 text-xs ${theme.muted}`}>
                                        {STOCK_ACTION_LABEL[item.stock_action] ?? item.stock_action}
                                      </td>
                                      <td className="px-3 py-2 text-right font-semibold">
                                        ${Number(item.line_total_usd).toFixed(2)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Totals + Refund info */}
                        <div className="flex flex-wrap items-start justify-between gap-3 border-t border-zinc-200 pt-3 dark:border-white/10">
                          <div>
                            <p className={`text-xs font-semibold ${theme.muted}`}>ចំនួនត្រឡប់សរុប</p>
                            <p className="mt-1 text-base font-bold text-red-500">${Number(ret.total_amount_usd).toFixed(2)}</p>
                          </div>
                          {ret.refund_method && (
                            <div className="text-right">
                              <p className={`text-xs font-semibold ${theme.muted}`}>ការសង</p>
                              <p className="mt-1 text-sm font-semibold capitalize">{ret.refund_method.replace("_", " ")}</p>
                              {ret.refund_amount_usd > 0 && (
                                <p className="text-xs text-emerald-600">${Number(ret.refund_amount_usd).toFixed(2)}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </FormSection>
          )}
        </div>
      </div>
    </ModalShell>
  );
}
