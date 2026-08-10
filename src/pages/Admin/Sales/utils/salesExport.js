const BOM = String.fromCharCode(0xfeff);

const money = (value) => Number(value || 0).toLocaleString("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const usd = (value) => `$${money(value)}`;
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

const saleTypeLabel = (value) => ({
  retail: "លក់រាយ",
  wholesale: "លក់បោះដុំ",
}[value] ?? value ?? "");

const paymentStatusLabel = (value) => ({
  paid: "បានទូទាត់",
  partial: "បង់មួយចំណែក",
  unpaid: "មិនទាន់ទូទាត់",
  refunded: "សងប្រាក់",
}[value] ?? value ?? "");

const saleStatusLabel = (value) => ({
  completed: "បញ្ចប់ហើយ",
  confirmed: "បញ្ជាក់ហើយ",
  draft: "ព្រាង",
  cancelled: "បានបោះបង់",
}[value] ?? value ?? "");

const paymentMethodLabel = (value) => ({
  cash: "សាច់ប្រាក់",
  bank_transfer: "ធនាគារ / QR",
  qr: "QR Code",
  card: "កាត",
  other: "ផ្សេងៗ",
}[value] ?? value ?? "");

// Filter state on Sale.jsx uses its own vocabulary for each dropdown — kept as separate lookups
// (rather than reusing the label maps above, which translate raw persisted values) so a filter
// summary can show "ទាំងអស់" for the unselected/"All" case instead of leaking the raw string.
const activeTabLabel = (value) => ({
  all: "ទាំងអស់",
  pending: "មិនទាន់ទូទាត់",
  refunded: "ដោះស្រាយរួច",
}[value] ?? value ?? "ទាំងអស់");

const saleTypeFilterLabel = (value) => ({
  All: "ទាំងអស់",
  retail: "លក់រាយ",
  wholesale: "លក់បោះដុំ",
}[value] ?? value ?? "ទាំងអស់");

const paymentStatusFilterLabel = (value) => ({
  All: "ទាំងអស់",
  paid: "បានទូទាត់",
  partial: "បង់មួយចំណែក",
  unpaid: "មិនទាន់ទូទាត់",
  refunded: "សងប្រាក់",
}[value] ?? value ?? "ទាំងអស់");

const paymentSummary = (sale) => {
  if (!sale.payments?.length) return "—";
  const labels = sale.payments.map((payment) => (
    payment.providerName || paymentMethodLabel(payment.paymentMethod)
  ));
  return [...new Set(labels)].filter(Boolean).join(" + ") || "—";
};

const itemSummary = (sale) => (sale.items || [])
  .map((item) => `${item.productNameSnapshot} ${item.variantNameSnapshot || ""} x ${Number(item.qty || 0).toLocaleString("en-US")}`)
  .join(" | ");

// Human-readable header/row set — used by the PDF, where currency symbols and comma-formatted
// money read better and nothing needs to be summed by the reader's spreadsheet software.
const displayHeaders = [
  "លេខវិក្កយបត្រ",
  "ថ្ងៃលក់",
  "អតិថិជន",
  "ប្រភេទលក់",
  "ទំនិញ",
  "វិធីទូទាត់",
  "ស្ថានភាពទូទាត់",
  "ស្ថានភាពលក់",
  "តម្លៃសរុប",
  "បានទូទាត់",
  "មិនទាន់ទូទាត់",
  "ត្រឡប់",
  "អ្នកលក់",
];

const buildDisplayRows = (sales) => sales.map((sale) => [
  sale.saleNo,
  sale.displayDate || sale.saleDate,
  sale.customerName,
  saleTypeLabel(sale.saleType),
  itemSummary(sale),
  paymentSummary(sale),
  paymentStatusLabel(sale.paymentStatus),
  saleStatusLabel(sale.saleStatus),
  usd(sale.grandTotal),
  usd(sale.paidTotal),
  usd(sale.balanceTotal),
  usd(sale.returnsTotalUsd),
  sale.cashierName,
]);

// Numeric header/row set — used by CSV/Excel. Money cells hold plain numbers (no currency
// symbol, no thousands separator) so a reader can actually SUM/AVERAGE them in a spreadsheet.
const numericHeaders = [
  "លេខវិក្កយបត្រ",
  "ថ្ងៃលក់",
  "អតិថិជន",
  "ប្រភេទលក់",
  "ទំនិញ",
  "វិធីទូទាត់",
  "ស្ថានភាពទូទាត់",
  "ស្ថានភាពលក់",
  "តម្លៃសរុប (USD)",
  "បានទូទាត់ (USD)",
  "មិនទាន់ទូទាត់ (USD)",
  "ត្រឡប់ (USD)",
  "អ្នកលក់",
];

const buildNumericRows = (sales) => sales.map((sale) => [
  sale.saleNo,
  sale.displayDate || sale.saleDate,
  sale.customerName,
  saleTypeLabel(sale.saleType),
  itemSummary(sale),
  paymentSummary(sale),
  paymentStatusLabel(sale.paymentStatus),
  saleStatusLabel(sale.saleStatus),
  Number(Number(sale.grandTotal || 0).toFixed(2)),
  Number(Number(sale.paidTotal || 0).toFixed(2)),
  Number(Number(sale.balanceTotal || 0).toFixed(2)),
  Number(Number(sale.returnsTotalUsd || 0).toFixed(2)),
  sale.cashierName,
]);

const saleTotals = (sales) => {
  const total = sales.reduce((sum, sale) => sum + Number(sale.grandTotal || 0), 0);
  const paid = sales.reduce((sum, sale) => sum + Number(sale.paidTotal || 0), 0);
  const balance = sales.reduce((sum, sale) => sum + Number(sale.balanceTotal || 0), 0);
  const returns = sales.reduce((sum, sale) => sum + Number(sale.returnsTotalUsd || 0), 0);
  return { total, paid, balance, returns };
};

const filenameBase = () => `sales-${new Date().toISOString().slice(0, 10)}`;

// Bundles rows together with what filter actually produced them and a quick stat summary, so a
// reader opening the file later (or forwarding it to someone else) doesn't have to guess what
// was selected when it was generated — matches the pattern in productExport.js/supplierExport.js/
// purchaseExport.js/inventoryExport.js/customerExport.js. Previously this info only partly
// existed in the PDF's stat cards; CSV/Excel had no summary at all, and even the PDF never
// showed which filter (search/tab/date/type/status) was active.
export const buildSalesExport = (sales, filters = {}) => {
  const generatedAt = new Date().toLocaleString("en-US");
  const { total, paid, balance, returns } = saleTotals(sales);

  const filterSummary = [
    `ស្វែងរក: ${filters.search || "ទាំងអស់"}`,
    `ទិដ្ឋភាព: ${activeTabLabel(filters.activeTab)}`,
    `កាលបរិច្ឆេទ: ${filters.startDate || "ទាំងអស់"}`,
    `ប្រភេទលក់: ${saleTypeFilterLabel(filters.saleType)}`,
    `ស្ថានភាពទូទាត់: ${paymentStatusFilterLabel(filters.paymentStatus)}`,
  ].join(" | ");

  const statRows = [
    ["វិក្កយបត្រសរុប", sales.length],
    ["តម្លៃសរុប (USD)", Number(total.toFixed(2))],
    ["បានទូទាត់ (USD)", Number(paid.toFixed(2))],
    ["មិនទាន់ទូទាត់ (USD)", Number(balance.toFixed(2))],
    ["ត្រឡប់ (USD)", Number(returns.toFixed(2))],
  ];

  return {
    title: "ការលក់",
    filenameBase: filenameBase(),
    generatedAt,
    filterSummary,
    statRows,
    displayRows: buildDisplayRows(sales),
    numericRows: buildNumericRows(sales),
  };
};

export const exportSalesCsv = (sales, filters = {}) => {
  const report = buildSalesExport(sales, filters);
  const csv = [
    report.title,
    `បង្កើតនៅ,${csvCell(report.generatedAt)}`,
    `តម្រង,${csvCell(report.filterSummary)}`,
    "",
    "សង្ខេប",
    "ប្រភេទទិន្នន័យ,តម្លៃ",
    ...report.statRows.map((row) => row.map(csvCell).join(",")),
    "",
    "បញ្ជីលក់",
    report.filterSummary,
    numericHeaders.map(csvCell).join(","),
    ...(report.numericRows.length ? report.numericRows.map((row) => row.map(csvCell).join(",")) : ["គ្មានទិន្នន័យ"]),
  ].join("\r\n");

  downloadBlob(BOM + csv, `${report.filenameBase}.csv`, "text/csv;charset=utf-8;");
};

export const exportSalesExcel = (sales, filters = {}) => {
  const report = buildSalesExport(sales, filters);
  const tableHtml = (title, note, tableHeaders, rows) => `
    <section>
      <h2>${escapeHtml(title)}</h2>
      ${note ? `<p>${escapeHtml(note)}</p>` : ""}
      <table border="1">
        <thead><tr>${tableHeaders.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>
        <tbody>
          ${rows.length
            ? rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")
            : `<tr><td colspan="${tableHeaders.length}">គ្មានទិន្នន័យ</td></tr>`}
        </tbody>
      </table>
    </section>
  `;

  const html = `
    <html>
      <head><meta charset="UTF-8" /></head>
      <body>
        <h1>${escapeHtml(report.title)}</h1>
        <p>បង្កើតនៅ: ${escapeHtml(report.generatedAt)}</p>
        <p>តម្រង: ${escapeHtml(report.filterSummary)}</p>
        ${tableHtml("សង្ខេប", null, ["ប្រភេទទិន្នន័យ", "តម្លៃ"], report.statRows)}
        ${tableHtml("បញ្ជីលក់", report.filterSummary, numericHeaders, report.numericRows)}
      </body>
    </html>
  `;

  downloadBlob(BOM + html, `${report.filenameBase}.xls`, "application/vnd.ms-excel;charset=utf-8;");
};

export const exportSalesPdf = (sales, filters = {}) => {
  const report = buildSalesExport(sales, filters);
  const rows = report.displayRows;
  const { total, paid, balance } = saleTotals(sales);

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>ការលក់</title>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: Arial, "Noto Sans Khmer", sans-serif;
            color: #111827;
            margin: 0;
            padding: 14mm;
            font-size: 11px;
            line-height: 1.5;
          }
          .header {
            display: flex;
            justify-content: space-between;
            gap: 16px;
            border-bottom: 2px solid #ef4444;
            padding-bottom: 10px;
            margin-bottom: 12px;
          }
          h1 { margin: 0; font-size: 24px; font-weight: 800; }
          .meta { text-align: right; color: #52525b; }
          .meta p { margin: 0; }
          .summary {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            margin-bottom: 12px;
          }
          .card {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 8px 10px;
            background: #fafafa;
          }
          .label { color: #6b7280; font-size: 10px; }
          .value { margin-top: 3px; font-size: 14px; font-weight: 800; }
          table { border-collapse: collapse; width: 100%; table-layout: fixed; }
          th, td {
            border: 1px solid #e5e7eb;
            padding: 6px 7px;
            text-align: left;
            vertical-align: top;
            font-size: 9px;
            word-break: break-word;
          }
          th {
            background: #dc2626;
            color: #fff;
            font-weight: 800;
          }
          tr:nth-child(even) td { background: #fafafa; }
          .empty { text-align: center; color: #71717a; }
          @page { size: A4 landscape; margin: 0; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>ការលក់</h1>
            <p>បញ្ជីលក់តាមតម្រងបច្ចុប្បន្ន</p>
          </div>
          <div class="meta">
            <p>ចំនួន: ${sales.length.toLocaleString("en-US")} វិក្កយបត្រ</p>
            <p>តម្រង: ${escapeHtml(report.filterSummary)}</p>
            <p>ពេលបង្កើត: ${escapeHtml(report.generatedAt)}</p>
          </div>
        </div>
        <div class="summary">
          <div class="card"><div class="label">តម្លៃសរុប</div><div class="value">${escapeHtml(usd(total))}</div></div>
          <div class="card"><div class="label">បានទូទាត់</div><div class="value">${escapeHtml(usd(paid))}</div></div>
          <div class="card"><div class="label">មិនទាន់ទូទាត់</div><div class="value">${escapeHtml(usd(balance))}</div></div>
          <div class="card"><div class="label">វិក្កយបត្រ</div><div class="value">${sales.length.toLocaleString("en-US")}</div></div>
        </div>
        <table>
          <thead><tr>${displayHeaders.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>
          <tbody>
            ${rows.length
              ? rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")
              : `<tr><td colspan="${displayHeaders.length}" class="empty">គ្មានទិន្នន័យ</td></tr>`}
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
