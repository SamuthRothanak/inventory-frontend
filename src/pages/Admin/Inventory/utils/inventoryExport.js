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

const statusLabel = (value) => ({
  "In Stock": "មានស្តុក",
  "Low Stock": "ស្តុកទាប",
  "Out of Stock": "អស់ស្តុក",
}[value] ?? value ?? "");

// Filter state on Inventory.jsx's statusFilter includes 2 derived filters ("Needs Action",
// "Expiring Stock") on top of the 3 raw statuses above — kept as a separate lookup so a filter
// summary can show them distinctly rather than falling through statusLabel() and rendering the
// raw English value.
const statusFilterLabel = (value) => ({
  All: "ទាំងអស់",
  "Needs Action": "ត្រូវការចាត់វិធានការ",
  "Expiring Stock": "ជិតផុតកំណត់",
  "In Stock": "មានស្តុក",
  "Low Stock": "ស្តុកស្ទើរអស់",
  "Out of Stock": "អស់ស្តុក",
}[value] ?? value ?? "ទាំងអស់");

const qtyText = (qty, unit) => `${Number(qty || 0).toLocaleString("en-US")} ${unit || ""}`.trim();

const nearestExpiry = (batches = []) => {
  const dated = batches
    .filter((batch) => batch.expiredDate && batch.expiredDate !== "-")
    .sort((a, b) => new Date(a.expiredDate) - new Date(b.expiredDate));
  return dated[0]?.expiredDate || "-";
};

const batchSortValue = (batch) => {
  if (!batch?.expiredDate || batch.expiredDate === "-") return Number.POSITIVE_INFINITY;
  const time = new Date(batch.expiredDate).getTime();
  return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time;
};

const batchSummary = (item) => {
  const batches = [...(item.batches || [])].sort(
    (a, b) => batchSortValue(a) - batchSortValue(b) || Number(a.id || 0) - Number(b.id || 0)
  );
  if (batches.length === 0) return "-";

  const shown = batches.slice(0, 3)
  .map((batch) => {
    const batchName = batch.batchNo || batch.lotNo || "-";
    const qty = qtyText(batch.qtyRemainingBase, item.baseUnit);
    const expiry = batch.expiredDate && batch.expiredDate !== "-" ? `ផុតកំណត់ ${batch.expiredDate}` : "មិនមានថ្ងៃផុតកំណត់";
    return `${batchName}: ${qty}, ${expiry}`;
  })
  .join(" | ");

  const remaining = batches.length - 3;
  return remaining > 0 ? `${shown} | + ${remaining} បាច់ទៀត` : shown;
};

// Human-readable header/row set — used by the PDF, where a $-prefixed, comma-formatted money
// cell reads better and nothing needs to be summed by the reader's spreadsheet software.
const displayHeaders = [
  "ទំនិញ",
  "កូដ",
  "ប្រភេទ",
  "ស្តុកបច្ចុប្បន្ន",
  "ដែនកំណត់ស្តុក",
  "តម្លៃដើម",
  "តម្លៃដើមស្តុកសរុប",
  "ស្ថានភាព",
  "ថ្ងៃផុតកំណត់ជិតបំផុត",
  "សង្ខេបបាច់",
];

const buildDisplayRows = (inventory) => inventory.map((item) => {
  const stockValue = Number(item.stockBaseQty || 0) * Number(item.unitCostBase || 0);
  return [
    item.variantName || item.productName || "-",
    item.variantCode || "-",
    item.category || "-",
    qtyText(item.stockBaseQty, item.baseUnit),
    qtyText(item.lowStockThreshold, item.baseUnit),
    usd(item.unitCostBase),
    usd(stockValue),
    statusLabel(item.status),
    nearestExpiry(item.batches),
    batchSummary(item),
  ];
});

// Numeric header/row set — used by CSV/Excel. Money cells hold plain numbers (no currency
// symbol, no thousands separator) so a reader can actually SUM/AVERAGE them in a spreadsheet
// (e.g. total inventory value) instead of getting text cells.
const numericHeaders = [
  "ទំនិញ",
  "កូដ",
  "ប្រភេទ",
  "ស្តុកបច្ចុប្បន្ន",
  "ដែនកំណត់ស្តុក",
  "តម្លៃដើម (USD)",
  "តម្លៃដើមស្តុកសរុប (USD)",
  "ស្ថានភាព",
  "ថ្ងៃផុតកំណត់ជិតបំផុត",
  "សង្ខេបបាច់",
];

const buildNumericRows = (inventory) => inventory.map((item) => {
  const unitCostBase = Number(item.unitCostBase || 0);
  const stockValue = Number(item.stockBaseQty || 0) * unitCostBase;
  return [
    item.variantName || item.productName || "-",
    item.variantCode || "-",
    item.category || "-",
    qtyText(item.stockBaseQty, item.baseUnit),
    qtyText(item.lowStockThreshold, item.baseUnit),
    Number(unitCostBase.toFixed(2)),
    Number(stockValue.toFixed(2)),
    statusLabel(item.status),
    nearestExpiry(item.batches),
    batchSummary(item),
  ];
});

const inventoryTotals = (inventory) => {
  const totalValue = inventory.reduce(
    (sum, item) => sum + Number(item.stockBaseQty || 0) * Number(item.unitCostBase || 0),
    0
  );
  const lowStock = inventory.filter((item) => item.status === "Low Stock").length;
  const outOfStock = inventory.filter((item) => item.status === "Out of Stock").length;
  return { totalValue, lowStock, outOfStock };
};

const filenameBase = () => `inventory-${new Date().toISOString().slice(0, 10)}`;

// Bundles rows together with what filter actually produced them and a quick stat summary, so a
// reader opening the file later (or forwarding it to someone else) doesn't have to guess what
// was selected when it was generated — matches the pattern in productExport.js/supplierExport.js/
// purchaseExport.js. Previously this info only partly existed in the PDF's stat cards; CSV/Excel
// had no summary at all, and even the PDF never showed which filter (search/status) was active.
export const buildInventoryExport = (inventory, filters = {}) => {
  const generatedAt = new Date().toLocaleString("en-US");
  const { totalValue, lowStock, outOfStock } = inventoryTotals(inventory);

  const filterSummary = [
    `ស្វែងរក: ${filters.search || "ទាំងអស់"}`,
    `ស្ថានភាព: ${statusFilterLabel(filters.status)}`,
  ].join(" | ");

  const statRows = [
    ["ទំនិញសរុប", inventory.length],
    ["តម្លៃដើមស្តុកសរុប (USD)", Number(totalValue.toFixed(2))],
    ["ស្តុកទាប", lowStock],
    ["អស់ស្តុក", outOfStock],
  ];

  return {
    title: "បញ្ជីស្តុក",
    filenameBase: filenameBase(),
    generatedAt,
    filterSummary,
    statRows,
    displayRows: buildDisplayRows(inventory),
    numericRows: buildNumericRows(inventory),
  };
};

export const exportInventoryCsv = (inventory, filters = {}) => {
  const report = buildInventoryExport(inventory, filters);
  const csv = [
    report.title,
    `បង្កើតនៅ,${csvCell(report.generatedAt)}`,
    `តម្រង,${csvCell(report.filterSummary)}`,
    "",
    "សង្ខេប",
    "ប្រភេទទិន្នន័យ,តម្លៃ",
    ...report.statRows.map((row) => row.map(csvCell).join(",")),
    "",
    "បញ្ជីស្តុក",
    report.filterSummary,
    numericHeaders.map(csvCell).join(","),
    ...(report.numericRows.length ? report.numericRows.map((row) => row.map(csvCell).join(",")) : ["គ្មានទិន្នន័យ"]),
  ].join("\r\n");

  downloadBlob(`\uFEFF${csv}`, `${report.filenameBase}.csv`, "text/csv;charset=utf-8;");
};

export const exportInventoryExcel = (inventory, filters = {}) => {
  const report = buildInventoryExport(inventory, filters);
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
        ${tableHtml("បញ្ជីស្តុក", report.filterSummary, numericHeaders, report.numericRows)}
      </body>
    </html>
  `;

  downloadBlob(`\uFEFF${html}`, `${report.filenameBase}.xls`, "application/vnd.ms-excel;charset=utf-8;");
};

export const exportInventoryPdf = (inventory, filters = {}) => {
  const report = buildInventoryExport(inventory, filters);
  const rows = report.displayRows;
  const { totalValue, lowStock, outOfStock } = inventoryTotals(inventory);

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>បញ្ជីស្តុក</title>
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
            <h1>បញ្ជីស្តុក</h1>
            <p>បញ្ជីស្តុកតាមតម្រងបច្ចុប្បន្ន</p>
          </div>
          <div class="meta">
            <p>ចំនួន: ${inventory.length.toLocaleString("en-US")} ទំនិញ</p>
            <p>តម្រង: ${escapeHtml(report.filterSummary)}</p>
            <p>ពេលបង្កើត: ${escapeHtml(report.generatedAt)}</p>
          </div>
        </div>
        <div class="summary">
          <div class="card"><div class="label">ទំនិញសរុប</div><div class="value">${inventory.length.toLocaleString("en-US")}</div></div>
          <div class="card"><div class="label">តម្លៃដើមស្តុកសរុប</div><div class="value">${escapeHtml(usd(totalValue))}</div></div>
          <div class="card"><div class="label">ស្តុកទាប</div><div class="value">${lowStock.toLocaleString("en-US")}</div></div>
          <div class="card"><div class="label">អស់ស្តុក</div><div class="value">${outOfStock.toLocaleString("en-US")}</div></div>
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
