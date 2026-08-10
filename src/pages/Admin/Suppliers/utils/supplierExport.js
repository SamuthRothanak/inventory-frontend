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

const statusLabel = (value) => (value === "Active" ? "ដំណើរការ" : "មិនដំណើរការ");

const statusFilterLabel = (value) => ({
  All: "ទាំងអស់",
  Active: "ដំណើរការ",
  Inactive: "មិនដំណើរការ",
}[value] || value || "ទាំងអស់");

const headers = [
  "កូដអ្នកផ្គត់ផ្គង់",
  "ឈ្មោះអ្នកផ្គត់ផ្គង់",
  "អ្នកទំនាក់ទំនង",
  "ទូរស័ព្ទ",
  "អ៊ីមែល",
  "អាសយដ្ឋាន",
  "ស្ថានភាព",
  "ថ្ងៃបង្កើត",
  "ថ្ងៃកែ",
  "ចំណាំ",
];

const buildRows = (suppliers) => suppliers.map((supplier) => [
  supplier.supplierCode,
  supplier.name,
  supplier.contactPerson || "-",
  supplier.phone || "-",
  supplier.email || "-",
  supplier.address || "-",
  statusLabel(supplier.status),
  supplier.createdAt || "-",
  supplier.updatedAt || "-",
  supplier.note || "-",
]);

const filenameBase = () => `suppliers-${new Date().toISOString().slice(0, 10)}`;

// Same idea as Products/Purchases export: bundle the filtered rows together with what filter
// actually produced them and a quick stat summary, so a reader opening the file later (or
// forwarding it to someone else) doesn't have to guess what was selected when it was generated
// — this was previously only shown (partially) in the PDF; CSV/Excel had no filter/stat info
// at all.
export const buildSupplierExport = (suppliers, filters = {}) => {
  const generatedAt = new Date().toLocaleString("en-US");
  const active = suppliers.filter((supplier) => supplier.status === "Active").length;
  const inactive = suppliers.length - active;

  const filterSummary = [
    `ស្វែងរក: ${filters.search || "ទាំងអស់"}`,
    `ស្ថានភាព: ${statusFilterLabel(filters.status)}`,
  ].join(" | ");

  const statRows = [
    ["អ្នកផ្គត់ផ្គង់សរុប", suppliers.length],
    ["ដំណើរការ", active],
    ["មិនដំណើរការ", inactive],
  ];

  return {
    title: "អ្នកផ្គត់ផ្គង់",
    filenameBase: filenameBase(),
    generatedAt,
    filterSummary,
    statRows,
    rows: buildRows(suppliers),
  };
};

const tableHtml = (title, note, tableHeaders, rows) => `
  <section class="report-section">
    <h2>${escapeHtml(title)}</h2>
    ${note ? `<p class="section-note">${escapeHtml(note)}</p>` : ""}
    <table>
      <thead><tr>${tableHeaders.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>
      <tbody>
        ${rows.length
          ? rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")
          : `<tr><td colspan="${tableHeaders.length}" class="empty">គ្មានទិន្នន័យ</td></tr>`}
      </tbody>
    </table>
  </section>
`;

export const exportSuppliersCsv = (suppliers, filters = {}) => {
  const report = buildSupplierExport(suppliers, filters);
  const csv = [
    report.title,
    `បង្កើតនៅ,${csvCell(report.generatedAt)}`,
    `តម្រង,${csvCell(report.filterSummary)}`,
    "",
    "សង្ខេប",
    "ប្រភេទទិន្នន័យ,តម្លៃ",
    ...report.statRows.map((row) => row.map(csvCell).join(",")),
    "",
    "បញ្ជីអ្នកផ្គត់ផ្គង់",
    report.filterSummary,
    headers.map(csvCell).join(","),
    ...(report.rows.length ? report.rows.map((row) => row.map(csvCell).join(",")) : ["គ្មានទិន្នន័យ"]),
  ].join("\r\n");

  downloadBlob(`\uFEFF${csv}`, `${report.filenameBase}.csv`, "text/csv;charset=utf-8;");
};

export const exportSuppliersExcel = (suppliers, filters = {}) => {
  const report = buildSupplierExport(suppliers, filters);
  const html = `
    <html>
      <head>
        <meta charset="UTF-8" />
        <style>
          body { font-family: Arial, "Noto Sans Khmer", sans-serif; color: #18181b; }
          h1 { margin-bottom: 4px; }
          h2 { margin: 22px 0 8px; color: #b91c1c; }
          p { margin: 0 0 6px; color: #52525b; }
          table { border-collapse: collapse; width: 100%; margin-bottom: 16px; }
          th, td { border: 1px solid #d4d4d8; padding: 7px 8px; text-align: left; vertical-align: top; }
          th { background: #dc2626; color: #ffffff; font-weight: 700; }
          tr:nth-child(even) td { background: #fafafa; }
          .section-note { margin-bottom: 8px; font-size: 12px; }
          .empty { color: #71717a; text-align: center; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(report.title)}</h1>
        <p>បង្កើតនៅ: ${escapeHtml(report.generatedAt)}</p>
        <p>តម្រង: ${escapeHtml(report.filterSummary)}</p>
        ${tableHtml("សង្ខេប", null, ["ប្រភេទទិន្នន័យ", "តម្លៃ"], report.statRows)}
        ${tableHtml("បញ្ជីអ្នកផ្គត់ផ្គង់", report.filterSummary, headers, report.rows)}
      </body>
    </html>
  `;

  downloadBlob(`\uFEFF${html}`, `${report.filenameBase}.xls`, "application/vnd.ms-excel;charset=utf-8;");
};

export const exportSuppliersPdf = (suppliers, filters = {}) => {
  const report = buildSupplierExport(suppliers, filters);

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>អ្នកផ្គត់ផ្គង់</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: Arial, "Noto Sans Khmer", sans-serif; color: #111827; margin: 0; padding: 14mm; font-size: 11px; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; gap: 16px; border-bottom: 2px solid #ef4444; padding-bottom: 10px; margin-bottom: 12px; }
          h1 { margin: 0; font-size: 24px; font-weight: 800; }
          .meta { text-align: right; color: #52525b; }
          .meta p { margin: 0; }
          .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 12px; }
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
            <h1>អ្នកផ្គត់ផ្គង់</h1>
            <p>បញ្ជីអ្នកផ្គត់ផ្គង់តាមតម្រងបច្ចុប្បន្ន</p>
          </div>
          <div class="meta">
            <p>ចំនួន: ${suppliers.length.toLocaleString("en-US")} អ្នកផ្គត់ផ្គង់</p>
            <p>តម្រង: ${escapeHtml(report.filterSummary)}</p>
            <p>ពេលបង្កើត: ${escapeHtml(report.generatedAt)}</p>
          </div>
        </div>
        <div class="summary">
          ${report.statRows.map(([label, value]) => `<div class="card"><div class="label">${escapeHtml(label)}</div><div class="value">${Number(value).toLocaleString("en-US")}</div></div>`).join("")}
        </div>
        <table>
          <thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>
          <tbody>
            ${report.rows.length
              ? report.rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")
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
