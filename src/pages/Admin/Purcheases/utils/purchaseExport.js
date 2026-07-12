const money = (value) => Number(value || 0).toLocaleString("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const usd = (value) => `$${money(value)}`;
const khr = (value) => `៛${Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
const plain = (value) => String(value ?? "").replace(/\s+/g, " ").trim();

const csvCell = (value) => {
  const text = plain(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

const escapeHtml = (value) => plain(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;");

const downloadBlob = (content, filename, type) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const key = (value) => String(value || "").trim().toLowerCase();

const statusLabel = (value) => ({
  draft: "ព្រាង",
  pending_receive: "រង់ចាំទទួល",
  pending_stock_in: "រង់ចាំបញ្ចូលស្តុក",
  pending_claim: "មានបញ្ហា",
  received: "បានទទួល",
  cancelled: "បានបោះបង់",
  canceled: "បានបោះបង់",
}[key(value)] ?? value ?? "");

const paymentModeLabel = (value) => ({
  pay_now: "បង់ភ្លាម",
  prepaid: "បង់មុន",
  partial_prepaid: "បង់មួយផ្នែក",
  pay_after_check: "បង់ក្រោយពិនិត្យ",
}[key(value)] ?? value ?? "");

const paymentStatusLabel = (value) => ({
  paid: "បានបង់",
  partial: "បង់មួយផ្នែក",
  unpaid: "មិនទាន់បង់",
}[key(value)] ?? value ?? "");

const actualPaid = (purchase) => {
  if (purchase.paymentStatus === "unpaid") return usd(0);
  const currency = String(purchase.paidCurrency || purchase.inputCurrency || "USD").toUpperCase();
  if (currency === "KHR") return khr(purchase.paidAmount || purchase.paidAmountKhr);
  return usd(purchase.paidAmount || purchase.paidAmountUsd);
};

const itemSummary = (purchase) => {
  const items = purchase.items?.length ? purchase.items : purchase.summaryItems || [];
  return items.map((item) => {
    const name = item.variantName || item.productName || item.variantCode || "-";
    const qty = Number(item.invoicedQty || item.paidQty || item.receivedQty || 0).toLocaleString("en-US");
    return `${name} x ${qty}`;
  }).join(" | ");
};

const headers = [
  "លេខវិក្កយបត្រទិញ",
  "ថ្ងៃទិញ",
  "អ្នកផ្គត់ផ្គង់",
  "ទំនិញ",
  "របៀបទូទាត់",
  "ស្ថានភាពទូទាត់",
  "ស្ថានភាពទិញ",
  "សរុប USD",
  "សរុប KHR",
  "បានបង់ពិត",
  "មិនទាន់បង់ USD",
  "មិនទាន់បង់ KHR",
  "ចំណាំ",
];

const buildRows = (purchases) => purchases.map((purchase) => [
  purchase.purchaseNo,
  purchase.purchaseDate,
  purchase.supplierName,
  itemSummary(purchase),
  paymentModeLabel(purchase.paymentMode),
  paymentStatusLabel(purchase.paymentStatus),
  statusLabel(purchase.status),
  usd(purchase.grandTotalUsd),
  khr(purchase.grandTotalKhr),
  actualPaid(purchase),
  usd(purchase.balanceAmountUsd),
  khr(purchase.balanceAmountKhr),
  purchase.note,
]);

const filenameBase = () => `purchases-${new Date().toISOString().slice(0, 10)}`;

export const exportPurchasesCsv = (purchases) => {
  const rows = buildRows(purchases);
  const csv = [
    headers.map(csvCell).join(","),
    ...rows.map((row) => row.map(csvCell).join(",")),
  ].join("\r\n");

  downloadBlob(`\uFEFF${csv}`, `${filenameBase()}.csv`, "text/csv;charset=utf-8;");
};

export const exportPurchasesExcel = (purchases) => {
  const rows = buildRows(purchases);
  const html = `
    <html>
      <head><meta charset="UTF-8" /></head>
      <body>
        <table border="1">
          <thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>
          <tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}</tbody>
        </table>
      </body>
    </html>
  `;

  downloadBlob(`\uFEFF${html}`, `${filenameBase()}.xls`, "application/vnd.ms-excel;charset=utf-8;");
};

export const exportPurchasesPdf = (purchases) => {
  const rows = buildRows(purchases);
  const total = purchases.reduce((sum, item) => sum + Number(item.grandTotalUsd || 0), 0);
  const paidUsd = purchases.reduce((sum, item) => {
    if (item.paymentStatus === "unpaid") return sum;
    const currency = String(item.paidCurrency || item.inputCurrency || "USD").toUpperCase();
    return currency === "USD" ? sum + Number(item.paidAmount || item.paidAmountUsd || 0) : sum;
  }, 0);
  const paidKhr = purchases.reduce((sum, item) => {
    if (item.paymentStatus === "unpaid") return sum;
    const currency = String(item.paidCurrency || item.inputCurrency || "USD").toUpperCase();
    return currency === "KHR" ? sum + Number(item.paidAmount || item.paidAmountKhr || 0) : sum;
  }, 0);
  const balance = purchases.reduce((sum, item) => sum + Number(item.balanceAmountUsd || 0), 0);
  const generatedAt = new Date().toLocaleString("en-US");

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>ការទិញ</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: Arial, "Noto Sans Khmer", sans-serif; color: #111827; margin: 0; padding: 14mm; font-size: 11px; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; gap: 16px; border-bottom: 2px solid #ef4444; padding-bottom: 10px; margin-bottom: 12px; }
          h1 { margin: 0; font-size: 24px; font-weight: 800; }
          .meta { text-align: right; color: #52525b; }
          .meta p { margin: 0; }
          .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 12px; }
          .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px 10px; background: #fafafa; }
          .label { color: #6b7280; font-size: 10px; }
          .value { margin-top: 3px; font-size: 14px; font-weight: 800; }
          .subvalue { margin-top: 2px; font-size: 12px; font-weight: 800; }
          table { border-collapse: collapse; width: 100%; table-layout: fixed; }
          th, td { border: 1px solid #e5e7eb; padding: 6px 7px; text-align: left; vertical-align: top; font-size: 9px; word-break: break-word; }
          th { background: #dc2626; color: #fff; font-weight: 800; }
          tr:nth-child(even) td { background: #fafafa; }
          .empty { text-align: center; color: #71717a; }
          @page { size: A4 landscape; margin: 0; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>ការទិញ</h1>
            <p>បញ្ជីទិញតាម filter បច្ចុប្បន្ន</p>
          </div>
          <div class="meta">
            <p>ចំនួន: ${purchases.length.toLocaleString("en-US")} វិក្កយបត្រទិញ</p>
            <p>ពេលបង្កើត: ${escapeHtml(generatedAt)}</p>
          </div>
        </div>
        <div class="summary">
          <div class="card"><div class="label">សរុបលុយទិញ</div><div class="value">${escapeHtml(usd(total))}</div></div>
          <div class="card"><div class="label">បានបង់ពិត</div><div class="value">${escapeHtml(usd(paidUsd))}</div><div class="subvalue">${escapeHtml(khr(paidKhr))}</div></div>
          <div class="card"><div class="label">មិនទាន់បង់</div><div class="value">${escapeHtml(usd(balance))}</div></div>
          <div class="card"><div class="label">វិក្កយបត្រទិញ</div><div class="value">${purchases.length.toLocaleString("en-US")}</div></div>
        </div>
        <table>
          <thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>
          <tbody>
            ${rows.length
              ? rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")
              : `<tr><td colspan="${headers.length}" class="empty">គ្មានទិន្នន័យ</td></tr>`}
          </tbody>
        </table>
        <script>window.onload = function () { window.focus(); window.print(); };</script>
      </body>
    </html>
  `;

  const printWindow = window.open("", "_blank");
  if (!printWindow) return false;
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  return true;
};
