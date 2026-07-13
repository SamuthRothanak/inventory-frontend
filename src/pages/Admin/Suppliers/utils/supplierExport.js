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

export const exportSuppliersCsv = (suppliers) => {
  const rows = buildRows(suppliers);
  const csv = [
    headers.map(csvCell).join(","),
    ...rows.map((row) => row.map(csvCell).join(",")),
  ].join("\r\n");

  downloadBlob(`\uFEFF${csv}`, `${filenameBase()}.csv`, "text/csv;charset=utf-8;");
};

export const exportSuppliersExcel = (suppliers) => {
  const rows = buildRows(suppliers);
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

export const exportSuppliersPdf = (suppliers) => {
  const rows = buildRows(suppliers);
  const generatedAt = new Date().toLocaleString("en-US");
  const active = suppliers.filter((supplier) => supplier.status === "Active").length;
  const inactive = suppliers.length - active;

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
            <p>បញ្ជីអ្នកផ្គត់ផ្គង់តាម filter បច្ចុប្បន្ន</p>
          </div>
          <div class="meta">
            <p>ចំនួន: ${suppliers.length.toLocaleString("en-US")} អ្នកផ្គត់ផ្គង់</p>
            <p>ពេលបង្កើត: ${escapeHtml(generatedAt)}</p>
          </div>
        </div>
        <div class="summary">
          <div class="card"><div class="label">អ្នកផ្គត់ផ្គង់សរុប</div><div class="value">${suppliers.length.toLocaleString("en-US")}</div></div>
          <div class="card"><div class="label">ដំណើរការ</div><div class="value">${active.toLocaleString("en-US")}</div></div>
          <div class="card"><div class="label">មិនដំណើរការ</div><div class="value">${inactive.toLocaleString("en-US")}</div></div>
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
