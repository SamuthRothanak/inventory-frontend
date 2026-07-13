import { useEffect } from "react";
import { FiPrinter, FiX } from "react-icons/fi";
import { getShopInitials, getStoredShopInfo } from "../../../../utils/shopInfo";

const METHOD_LABEL = {
  cash: "សាច់ប្រាក់",
  bank_transfer: "ផ្ទេរប្រាក់",
  qr: "QR",
  card: "កាត",
  other: "ផ្សេងៗ",
};
const SALE_TYPE_LABEL = { retail: "លក់រាយ", wholesale: "លក់ដុំ" };
const PAYMENT_STATUS_LABEL = {
  paid: "បានទូទាត់",
  partial: "បង់មួយចំណែក",
  unpaid: "មិនទាន់បង់",
  refunded: "ត្រឡប់ប្រាក់",
};

const fmtUsd = (n) =>
  "$" + Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const paymentStatusClass = {
  paid: "bg-emerald-100 text-emerald-700",
  partial: "bg-amber-100 text-amber-700",
  unpaid: "bg-red-100 text-red-600",
  refunded: "bg-purple-100 text-purple-700",
};

export default function SalePrintModal({ sale, onClose }) {
  const shopInfo = getStoredShopInfo();
  const rate = Number(sale.exchangeRateKhrPerUsd || 0);
  const grandKhr = rate > 0 ? Math.round(Number(sale.grandTotal || 0) * rate).toLocaleString("en-US") + " ៛" : null;
  const now = new Date().toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
  const isPaid     = sale.paymentStatus === "paid";
  const isPartial  = sale.paymentStatus === "partial";
  const isUnpaid   = sale.paymentStatus === "unpaid";
  const balance    = Number(sale.balanceTotal || 0);
  const balanceKhr = rate > 0 ? Math.round(balance * rate).toLocaleString("en-US") + " ៛" : null;

  useEffect(() => {
    const style = document.createElement("style");
    style.id = "sale-print-css";
    style.textContent = `
      @media print {
        body > * { visibility: hidden !important; }
        #sale-print-receipt,
        #sale-print-receipt * { visibility: visible !important; }
        #sale-print-receipt {
          position: fixed;
          inset: 0;
          overflow: visible;
          background: white;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `;
    document.head.appendChild(style);
    return () => document.getElementById("sale-print-css")?.remove();
  }, []);

  return (
    <div className="fixed inset-0 z-[2000] flex flex-col bg-black/70">
      {/* Toolbar — hidden on print */}
      <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-6 py-3 print:hidden">
        <p className="text-sm font-semibold text-zinc-700">
          មើលមុនបោះពុម្ព — <span className="text-red-600">{sale.saleNo}</span>
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
          >
            <FiPrinter size={14} /> បោះពុម្ព
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-300 bg-white text-zinc-600 transition hover:bg-zinc-100"
          >
            <FiX size={16} />
          </button>
        </div>
      </div>

      {/* Scrollable area */}
      <div className="flex-1 overflow-y-auto py-8 px-4">
        {/* Receipt */}
        <div
          id="sale-print-receipt"
          className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
          style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
        >
          {/* PAID stamp */}
          {isPaid && (
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%, -50%) rotate(-30deg)",
              zIndex: 10, pointerEvents: "none",
              border: "4px solid rgba(5,150,105,0.35)",
              borderRadius: 8, padding: "6px 24px",
              color: "rgba(5,150,105,0.35)",
              fontSize: 52, fontWeight: 900, letterSpacing: 6,
              whiteSpace: "nowrap",
            }}>
              PAID
            </div>
          )}
          {/* Header */}
          <div style={{ background: "linear-gradient(135deg,#dc2626 0%,#b91c1c 100%)", padding: "30px 40px 28px", color: "white" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 16, minWidth: 0 }}>
                <div style={{
                  width: 56, height: 56, background: "rgba(255,255,255,0.22)",
                  borderRadius: 12, display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 24, fontWeight: 800, color: "white", flexShrink: 0,
                  boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.12)",
                }}>{getShopInitials(shopInfo.name)}</div>
                <div style={{ minWidth: 0, paddingTop: 1 }}>
                  <div style={{ fontSize: 23, fontWeight: 800, lineHeight: 1.15, letterSpacing: 0.2 }}>{shopInfo.name}</div>
                  {shopInfo.khmerName && (
                    <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.55, marginTop: 5, opacity: 0.94 }}>
                      {shopInfo.khmerName}
                    </div>
                  )}
                  <div style={{ display: "grid", gap: 3, marginTop: 8, maxWidth: 360, fontSize: 11, lineHeight: 1.45, color: "rgba(255,255,255,0.78)" }}>
                    {shopInfo.phone && <div>{shopInfo.phone}</div>}
                    {shopInfo.address && <div>{shopInfo.address}</div>}
                  </div>
                </div>
              </div>
              <div style={{
                background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: 10, padding: "10px 16px", textAlign: "right", flexShrink: 0,
              }}>
                <div style={{ fontSize: 10, opacity: 0.8, letterSpacing: 1, textTransform: "uppercase" }}>Invoice / Receipt</div>
                <div style={{ fontSize: 16, fontWeight: 800, marginTop: 5, letterSpacing: 0.4 }}>{sale.saleNo}</div>
                <div style={{ fontSize: 11, opacity: 0.85, marginTop: 5 }}>{sale.displayDate}</div>
              </div>
            </div>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 divide-x divide-zinc-100 border-b border-zinc-100">
            <div className="p-5">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">ព័ត៌មានវិក្កយបត្រ</p>
              <MetaRow label="ប្រភេទ" value={SALE_TYPE_LABEL[sale.saleType] || sale.saleType} />
              <MetaRow label="អ្នកលក់" value={sale.cashierName || "—"} />
              <div className="flex items-center justify-between py-1 text-xs">
                <span className="text-zinc-400">ស្ថានភាព</span>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${paymentStatusClass[sale.paymentStatus] || "bg-zinc-100 text-zinc-600"}`}>
                  {PAYMENT_STATUS_LABEL[sale.paymentStatus] || sale.paymentStatus}
                </span>
              </div>
            </div>
            <div className="p-5">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">ព័ត៌មានអតិថិជន</p>
              <MetaRow label="អតិថិជន" value={sale.customerName} />
              <MetaRow
                label="ការទូទាត់"
                value={sale.payments.map((p) => p.providerName || METHOD_LABEL[p.paymentMethod] || p.paymentMethod).join(", ") || "—"}
              />
              {sale.deliveryRequired && sale.deliveryOption && sale.deliveryOption !== "none" && (
                <MetaRow label="ការដឹក" value={sale.deliveryOption.replaceAll("_", " ")} />
              )}
            </div>
          </div>

          {/* Items */}
          <div className="p-6 pb-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              ទំនិញ · {sale.items.length} មុខ
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "#18181b", color: "white" }}>
                  {["ផលិតផល", "ខ្នាតទំនិញ", "ចំនួន", "តម្លៃ", "បញ្ចុះ", "សរុប"].map((h, i) => (
                    <th
                      key={h}
                      className={`py-2.5 text-[11px] font-semibold uppercase tracking-wide ${i === 0 ? "pl-3 text-left" : i >= 2 ? "text-right pr-3" : "text-center"}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sale.items.map((item, idx) => {
                  const hasDisc = Number(item.discountAmount || 0) > 0;
                  return (
                    <tr key={item.id || idx} className="border-b border-zinc-50 even:bg-zinc-50/60">
                      <td className="py-2.5 pl-3 pr-2">
                        <p className="font-semibold text-zinc-800">{item.variantNameSnapshot || item.productNameSnapshot}</p>
                        {item.productNameSnapshot && item.variantNameSnapshot && item.variantNameSnapshot !== item.productNameSnapshot && (
                          <p className="text-[11px] text-zinc-400">{item.productNameSnapshot}</p>
                        )}
                      </td>
                      <td className="py-2.5 text-center text-zinc-500">{item.unitNameSnapshot || "—"}</td>
                      <td className="py-2.5 text-center font-semibold">{Number(item.qty).toLocaleString()}</td>
                      <td className="py-2.5 pr-1 text-right text-zinc-600">{fmtUsd(item.unitPrice)}</td>
                      <td className={`py-2.5 pr-1 text-right text-[12px] ${hasDisc ? "font-semibold text-red-500" : "text-zinc-300"}`}>
                        {hasDisc ? "-" + fmtUsd(item.discountAmount) : "—"}
                      </td>
                      <td className="py-2.5 pr-3 text-right font-bold text-zinc-900">{fmtUsd(item.lineTotal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bottom: Payment + Totals */}
          <div className="grid grid-cols-2 divide-x divide-zinc-100 border-t border-zinc-100 px-6 py-5">
            {/* Payment */}
            <div className="pr-8">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">ការទូទាត់</p>
              {sale.payments.length > 0 ? sale.payments.map((p, i) => {
                const isCash = p.paymentMethod === "cash";
                const received = p.currencyCode === "KHR"
                  ? Math.round(Number(p.amountReceived || 0)).toLocaleString("en-US") + " ៛"
                  : fmtUsd(p.amountReceived);
                const change = Number(p.changeAmount || 0) > 0
                  ? (p.changeCurrency === "KHR"
                    ? Math.round(Number(p.changeAmount)).toLocaleString("en-US") + " ៛"
                    : fmtUsd(p.changeAmount))
                  : null;
                return (
                  <div key={i}>
                    <PayRow label={p.providerName || METHOD_LABEL[p.paymentMethod] || p.paymentMethod} value={received} />
                    {isCash && change && (
                      <PayRow label={`អាប់ (${p.changeCurrency || "USD"})`} value={change} red />
                    )}
                  </div>
                );
              }) : <p className="text-xs text-zinc-400">មិនទាន់មានការទូទាត់</p>}
            </div>

            {/* Totals */}
            <div className="pl-8">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">សរុប</p>
              <TotalRow label="តម្លៃទំនិញ" value={fmtUsd(sale.subtotal)} />
              {Number(sale.discountTotal || 0) > 0 && (
                <TotalRow label="បញ្ចុះតម្លៃ" value={"-" + fmtUsd(sale.discountTotal)} red />
              )}
              {sale.deliveryRequired && (
                <TotalRow label="ថ្លៃដឹក" value={fmtUsd(sale.deliveryFee)} />
              )}
              {Number(sale.returnsTotalUsd || 0) > 0 && (
                <TotalRow label={`ត្រឡប់ (${sale.returnsCount}x)`} value={"-" + fmtUsd(sale.returnsTotalUsd)} purple />
              )}
              <div className="mt-3 border-t-2 border-red-600 pt-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-bold text-zinc-900">សរុបទូទៅ</span>
                  <div className="text-right">
                    <p className="text-xl font-bold text-red-600">{fmtUsd(sale.grandTotal)}</p>
                    {grandKhr && <p className="text-[11px] text-zinc-400">= {grandKhr}</p>}
                  </div>
                </div>
              </div>

              {(isUnpaid || isPartial) && balance > 0 && (
                <div className="mt-3 rounded-lg border-2 border-red-400 bg-red-50 px-3 py-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-bold text-red-600">
                      {isPartial ? "ប្រាក់ជំពាក់នៅសល់" : "ត្រូវទូទាត់"}
                    </span>
                    <div className="text-right">
                      <p className="text-base font-bold text-red-600">{fmtUsd(balance)}</p>
                      {balanceKhr && <p className="text-[11px] text-red-400">= {balanceKhr}</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Note */}
          {sale.note && (
            <div className="border-t border-amber-200 bg-amber-50 px-6 py-3 text-xs text-amber-800">
              📝 {sale.note}
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-dashed border-zinc-200 py-5 text-center">
            <p className="text-lg font-bold text-red-600">🙏 អរគុណ!</p>
            <p className="mt-1 text-xs text-zinc-400">{shopInfo.receiptFooter}</p>
            <p className="mt-2 text-[10px] text-zinc-300">បោះពុម្ព: {now}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaRow({ label, value }) {
  return (
    <div className="flex items-baseline justify-between py-1 text-xs">
      <span className="text-zinc-400">{label}</span>
      <span className="max-w-[55%] text-right font-semibold text-zinc-800">{value}</span>
    </div>
  );
}

function PayRow({ label, value, red }) {
  return (
    <div className={`flex justify-between border-b border-zinc-50 py-1.5 text-xs ${red ? "font-bold text-red-500" : ""}`}>
      <span className={red ? "text-red-500" : "text-zinc-400"}>{label}</span>
      <span className={red ? "text-red-500" : "font-semibold text-zinc-800"}>{value}</span>
    </div>
  );
}

function TotalRow({ label, value, red, purple }) {
  const color = red ? "text-red-500" : purple ? "text-purple-600" : "text-zinc-800";
  return (
    <div className="flex justify-between border-b border-zinc-50 py-1.5 text-xs">
      <span className="text-zinc-400">{label}</span>
      <span className={`font-semibold ${color}`}>{value}</span>
    </div>
  );
}
