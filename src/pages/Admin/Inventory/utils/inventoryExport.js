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
  return remaining > 0 ? `${shown} | + ${remaining} Batch ទៀត` : shown;
};

const headers = [
  "ទំនិញ",
  "កូដ",
  "ប្រភេទ",
  "ស្តុកបច្ចុប្បន្ន",
  "ដែនកំណត់ស្តុក",
  "តម្លៃដើម",
  "តម្លៃដើមស្តុកសរុប",
  "ស្ថានភាព",
  "ថ្ងៃផុតកំណត់ជិតបំផុត",
  "Batch សង្ខេប",
];

const buildRows = (inventory) => inventory.map((item) => {
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

const filenameBase = () => `inventory-${new Date().toISOString().slice(0, 10)}`;

export const exportInventoryCsv = (inventory) => {
  const rows = buildRows(inventory);
  const csv = [
    headers.map(csvCell).join(","),
    ...rows.map((row) => row.map(csvCell).join(",")),
  ].join("\r\n");

  downloadBlob(`\uFEFF${csv}`, `${filenameBase()}.csv`, "text/csv;charset=utf-8;");
};

export const exportInventoryExcel = (inventory) => {
  const rows = buildRows(inventory);
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

export const exportInventoryPdf = (inventory) => {
  const rows = buildRows(inventory);
  const pdfHeaders = headers.slice(0, -1);
  const pdfRows = rows.map((row) => row.slice(0, -1));
  const totalValue = inventory.reduce(
    (sum, item) => sum + Number(item.stockBaseQty || 0) * Number(item.unitCostBase || 0),
    0
  );
  const lowStock = inventory.filter((item) => item.status === "Low Stock").length;
  const outOfStock = inventory.filter((item) => item.status === "Out of Stock").length;
  const generatedAt = new Date().toLocaleString("en-US");

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
            <p>បញ្ជីស្តុកតាម filter បច្ចុប្បន្ន</p>
          </div>
          <div class="meta">
            <p>ចំនួន: ${inventory.length.toLocaleString("en-US")} ទំនិញ</p>
            <p>ពេលបង្កើត: ${escapeHtml(generatedAt)}</p>
          </div>
        </div>
        <div class="summary">
          <div class="card"><div class="label">ទំនិញសរុប</div><div class="value">${inventory.length.toLocaleString("en-US")}</div></div>
          <div class="card"><div class="label">តម្លៃដើមស្តុកសរុប</div><div class="value">${escapeHtml(usd(totalValue))}</div></div>
          <div class="card"><div class="label">ស្តុកទាប</div><div class="value">${lowStock.toLocaleString("en-US")}</div></div>
          <div class="card"><div class="label">អស់ស្តុក</div><div class="value">${outOfStock.toLocaleString("en-US")}</div></div>
        </div>
        <table>
          <thead><tr>${pdfHeaders.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>
          <tbody>
            ${pdfRows.length
              ? pdfRows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")
              : `<tr><td colspan="${pdfHeaders.length}" class="empty">គ្មានទិន្នន័យ</td></tr>`}
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
