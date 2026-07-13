const money = (value) => Number(value || 0).toLocaleString("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const number = (value) => Number(value || 0).toLocaleString("en-US");
const qty = (value) => Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });
const usd = (value) => `$${money(value)}`;
const khr = (value) => `${number(Math.round(Number(value || 0)))} KHR`;

const plain = (value) => String(value ?? "").replace(/\s+/g, " ").trim();

const escapeHtml = (value) => plain(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;");

const csvCell = (value) => {
  const text = plain(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

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
  "Low Stock": "ស្តុកស្ទើរអស់",
  "Out of Stock": "អស់ស្តុក",
}[value] ?? value ?? "");

const paymentMethodLabel = (value) => ({
  cash: "សាច់ប្រាក់",
  bank_transfer: "ធនាគារ / QR",
  qr: "ធនាគារ / QR",
  card: "កាត",
  other: "ផ្សេងៗ",
}[value] ?? value ?? "ផ្សេងៗ");

const salesTypeLabel = (value) => ({
  retail: "លក់រាយ",
  wholesale: "លក់បោះដុំ",
}[value] ?? value ?? "");

const chartGranularityLabel = (value) => ({
  hour: "តាមម៉ោង",
  day: "តាមថ្ងៃ",
  week: "តាមសប្តាហ៍",
  month: "តាមខែ",
  month_week: "តាមសប្តាហ៍ក្នុងខែ",
}[value] ?? value ?? "");

const tableHtml = (section) => `
  <section>
    <h2>${escapeHtml(section.title)}</h2>
    ${section.note ? `<p class="section-note">${escapeHtml(section.note)}</p>` : ""}
    <table>
      <thead><tr>${section.headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>
      <tbody>
        ${section.rows.length
          ? section.rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")
          : `<tr><td colspan="${section.headers.length}" class="empty">គ្មានទិន្ន័យ</td></tr>`}
      </tbody>
    </table>
  </section>
`;

const reportPrintSectionsHtml = (report) => report.sections.map(tableHtml).join("");

const csvSection = (section) => [
  section.title,
  ...(section.note ? [section.note] : []),
  section.headers.map(csvCell).join(","),
  ...(section.rows.length ? section.rows.map((row) => row.map(csvCell).join(",")) : ["គ្មានទិន្ន័យ"]),
  "",
].join("\r\n");

export const buildReportExport = ({
  dateFrom,
  dateTo,
  stats = {},
  salesByType = {},
  chartData = [],
  chartGranularity = "",
  topProducts = [],
  paymentSummary = {},
  paymentBreakdown = [],
  lowStock = [],
  outstanding = {},
  purchaseMoney = {},
  insights = {},
  recentActivities = [],
}) => {
  const safeFrom = dateFrom || "from";
  const safeTo = dateTo || "to";
  const generatedAt = new Date().toLocaleString("en-US");
  const filenameBase = `report-${safeFrom}-to-${safeTo}`;

  const purchaseTotalKhr = purchaseMoney.totalKhr ?? purchaseMoney.purchaseKhr ?? (
    Number(purchaseMoney.paidKhr || 0) + Number(purchaseMoney.outstandingKhr || 0)
  );
  const purchaseTotalUsd = purchaseMoney.totalUsd ?? stats.total_purchases_usd;
  const purchaseOutstandingEquivalentUsd = purchaseMoney.outstandingEquivalentUsd
    ?? purchaseMoney.outstandingUsd
    ?? 0;

  const closingRows = [
    [
      "សាច់ប្រាក់ត្រូវមានក្នុងថតលុយ",
      usd(paymentSummary.cashUsd),
      khr(paymentSummary.cashKhr),
      "",
      "ចំនួនសុទ្ធក្រោយដកលុយអាប់",
    ],
    [
      "លុយធនាគារ / QR ត្រូវឃើញក្នុងគណនី",
      usd(paymentSummary.electronicUsd),
      khr(paymentSummary.electronicKhr),
      "",
      "ផ្ទៀងផ្ទាត់តាម ABA / ACLEDA / Bakong / Wing / ផ្សេងៗ",
    ],
    [
      "សរុបលក់បានសុទ្ធ",
      "",
      "",
      usd(paymentSummary.netEquivalentUsd),
      "សរុបលក់បានក្រោយដកសងប្រាក់",
    ],
    [
      "លុយអាប់បានប្រគល់",
      usd(paymentSummary.changeUsd),
      khr(paymentSummary.changeKhr),
      "",
      "មិនមែនលុយលក់បានទេ",
    ],
    [
      "សងប្រាក់អតិថិជន",
      usd(paymentSummary.refundUsd),
      khr(paymentSummary.refundKhr),
      usd(paymentSummary.refundEquivalentUsd),
      "លុយចេញពីការត្រឡប់ទំនិញលក់",
    ],
    [
      "លុយចេញពីការទិញបានបង់",
      usd(purchaseMoney.paidUsd),
      khr(purchaseMoney.paidKhr),
      usd(purchaseMoney.paidEquivalentUsd),
      "ផ្ទៀងផ្ទាត់ជាមួយលុយចេញទៅអ្នកផ្គត់ផ្គង់",
    ],
    [
      "អតិថិជនមិនទាន់ទូទាត់",
      "",
      "",
      usd(outstanding.totalUsd ?? stats.outstanding_balance_usd),
      "លុយមិនទាន់ទទួលពីការលក់",
    ],
    [
      "យើងមិនទាន់បង់អ្នកផ្គត់ផ្គង់",
      usd(purchaseMoney.outstandingUsd),
      khr(purchaseMoney.outstandingKhr),
      usd(purchaseOutstandingEquivalentUsd),
      "លុយទិញចូលដែលមិនទាន់បង់",
    ],
  ];

  const summaryRows = [
    ["ការលក់សរុប", usd(stats.total_sales_usd), number(stats.total_sales_count), "លុយលក់សរុប និងចំនួនវិក្កយបត្រលក់ក្នុងរយៈពេលដែលបានជ្រើស"],
    ["ការទិញសរុប", usd(stats.total_purchases_usd), number(stats.total_purchases_count), "សរុបលុយវិក្កយបត្រទិញក្នុងរយៈពេលដែលបានជ្រើស"],
    ["ការត្រឡប់ទំនិញលក់", usd(stats.sales_returns_usd), number(stats.sales_returns_count), "ទំនិញដែលអតិថិជនត្រឡប់"],
    ["ការត្រឡប់ទំនិញទិញ", usd(stats.purchase_returns_usd), number(stats.purchase_returns_count), "ការទាមទារទៅអ្នកផ្គត់ផ្គង់"],
    ["លុយសុទ្ធ", usd(stats.net_cash_usd), "", "លុយទទួលបានពិត - លុយទិញចូលដែលបានបង់"],
    ["ការត្រឡប់សរុប", usd(stats.gross_return_usd), "", "ការត្រឡប់ទំនិញលក់ + ការត្រឡប់ទំនិញទិញ"],
    ["អតិថិជនមិនទាន់ទូទាត់", usd(stats.outstanding_balance_usd), number(stats.outstanding_balance_count), "វិក្កយបត្រលក់ដែលអតិថិជនមិនទាន់បង់ / បង់ខ្លះ"],
    ["ទំនិញស្តុកស្ទើរអស់", number(stats.low_stock_count), "", "ទំនិញនៅកម្រិតអប្បបរមា ឬក្រោមកម្រិត"],
    ["ការទាមទារអ្នកផ្គត់ផ្គង់", number(stats.pending_claims_count), "", "ការត្រឡប់ទំនិញទិញដែលមិនទាន់ដោះស្រាយ"],
    ["ស្តុកនៅសល់", number(stats.stock_on_hand), "", "ចំនួនស្តុកបច្ចុប្បន្ន"],
  ];

  const salesByTypeRows = Object.entries(salesByType).map(([type, row]) => [
    salesTypeLabel(type),
    number(row?.count),
    usd(row?.totalUsd),
  ]);

  const insightRows = [
    ["ថ្ងៃលក់បានច្រើន", insights.best_sales_day?.day ?? "", insights.best_sales_day ? usd(insights.best_sales_day.amount) : ""],
    ["ថ្ងៃទិញចូលច្រើន", insights.best_purchase_day?.day ?? "", insights.best_purchase_day ? usd(insights.best_purchase_day.amount) : ""],
    ["ថ្ងៃត្រឡប់ច្រើន", insights.most_return_day?.day ?? "", insights.most_return_day ? usd(insights.most_return_day.amount) : ""],
  ];

  const chartRows = chartData.map((row) => [
    row.day,
    row.date_to ? `${row.date} - ${row.date_to}` : row.date,
    usd(row.sales),
    usd(row.purchases),
    usd(row.returns),
    usd(row.sales_returns),
    usd(row.purchase_returns),
  ]);

  const productRows = topProducts.map((item, index) => [
    index + 1,
    item.name,
    item.unit,
    qty(item.soldQty),
    usd(item.revenueUsd),
    number(item.stock),
    statusLabel(item.status),
  ]);

  const paymentSummaryRows = [
    ["សាច់ប្រាក់ទទួល USD", usd(paymentSummary.cashReceivedUsd), "សាច់ប្រាក់ទទួល KHR", khr(paymentSummary.cashReceivedKhr)],
    ["សាច់ប្រាក់អាប់ USD", usd(paymentSummary.cashChangeUsd), "សាច់ប្រាក់អាប់ KHR", khr(paymentSummary.cashChangeKhr)],
    ["សាច់ប្រាក់លក់បាន USD", usd(paymentSummary.cashUsd), "សាច់ប្រាក់លក់បាន KHR", khr(paymentSummary.cashKhr)],
    ["ធនាគារ/QR ទទួល USD", usd(paymentSummary.electronicReceivedUsd), "ធនាគារ/QR ទទួល KHR", khr(paymentSummary.electronicReceivedKhr)],
    ["ធនាគារ/QR អាប់ USD", usd(paymentSummary.electronicChangeUsd), "ធនាគារ/QR អាប់ KHR", khr(paymentSummary.electronicChangeKhr)],
    ["ធនាគារ/QR លក់បាន USD", usd(paymentSummary.electronicUsd), "ធនាគារ/QR លក់បាន KHR", khr(paymentSummary.electronicKhr)],
    ["លុយអាប់សរុប USD", usd(paymentSummary.changeUsd), "លុយអាប់សរុប KHR", khr(paymentSummary.changeKhr)],
    ["សងប្រាក់ USD", usd(paymentSummary.refundUsd), "សងប្រាក់ KHR", khr(paymentSummary.refundKhr)],
    ["សរុបស្មើ USD", usd(paymentSummary.totalEquivalentUsd), "សងប្រាក់ស្មើ USD", usd(paymentSummary.refundEquivalentUsd)],
    ["លក់បានសុទ្ធស្មើ USD", usd(paymentSummary.netEquivalentUsd), "", ""],
  ];

  const paymentRows = paymentBreakdown.map((item) => [
    item.provider || paymentMethodLabel(item.method),
    paymentMethodLabel(item.method),
    usd(item.receivedUsd),
    khr(item.receivedKhr),
    usd(item.changeUsd),
    khr(item.changeKhr),
    usd(item.netUsd),
    khr(item.netKhr),
    usd(item.amountUsd),
  ]);

  const outstandingAgingRows = (outstanding.aging ?? []).map((item) => [
    item.label,
    number(item.count),
    usd(item.totalUsd),
  ]);

  const outstandingRows = (outstanding.customers ?? []).map((item) => [
    item.customerName,
    number(item.count),
    usd(item.totalUsd),
  ]);

  const purchaseRows = [
    ["ចំនួនវិក្កយបត្រទិញ", number(purchaseMoney.count)],
    ["សរុបលុយវិក្កយបត្រ USD", usd(purchaseTotalUsd)],
    ["សរុបលុយវិក្កយបត្រ KHR", khr(purchaseTotalKhr)],
    ["បានបង់ USD", usd(purchaseMoney.paidUsd)],
    ["បានបង់ KHR", khr(purchaseMoney.paidKhr)],
    ["បានបង់ស្មើ USD", usd(purchaseMoney.paidEquivalentUsd)],
    ["មិនទាន់បង់ USD", usd(purchaseMoney.outstandingUsd)],
    ["មិនទាន់បង់ KHR", khr(purchaseMoney.outstandingKhr)],
    ["មិនទាន់បង់ស្មើ USD", usd(purchaseOutstandingEquivalentUsd)],
  ];

  const supplierRows = (purchaseMoney.suppliers ?? []).map((item) => [
    item.supplierName,
    number(item.count),
    usd(item.totalUsd ?? item.outstandingUsd),
    item.totalKhr != null || item.outstandingKhr != null ? khr(item.totalKhr ?? item.outstandingKhr) : "",
  ]);

  const lowStockRows = lowStock.map((item) => [
    item.name,
    number(item.current),
    number(item.threshold),
    item.unit,
  ]);

  const activityRows = recentActivities.map((item) => [
    item.type,
    item.label,
    item.desc,
    item.time,
  ]);

  return {
    filenameBase,
    title: "របាយការណ៍",
    period: `${safeFrom} to ${safeTo}`,
    generatedAt,
    sections: [
      { title: "បិទបញ្ជីលុយ", headers: ["ត្រូវផ្ទៀងផ្ទាត់", "USD", "KHR", "ស្មើ USD", "ចំណាំ"], rows: closingRows },
      { title: "សរុបរបាយការណ៍", headers: ["ប្រភេទទិន្ន័យ", "តម្លៃ", "ចំនួន", "ចំណាំ"], rows: summaryRows },
      { title: "ការលក់តាមប្រភេទ", headers: ["ប្រភេទ", "ចំនួន", "សរុប USD"], rows: salesByTypeRows },
      { title: "ចំណុចសំខាន់ៗ", headers: ["ប្រភេទទិន្ន័យ", "រយៈពេល", "តម្លៃ"], rows: insightRows },
      { title: "ទិន្ន័យក្រាប", note: chartGranularity ? `ការបែងចែក: ${chartGranularityLabel(chartGranularity)}` : "", headers: ["រយៈពេល", "ថ្ងៃ", "ការលក់សរុប USD", "ទិញ USD", "ត្រឡប់ទំនិញសរុប USD", "ត្រឡប់ពីការលក់ USD", "ត្រឡប់ទៅអ្នកផ្គត់ផ្គង់ USD"], rows: chartRows },
      { title: "ទំនិញលក់ដាច់", headers: ["ល.រ", "ទំនិញ", "ខ្នាត", "ចំនួនលក់", "ប្រាក់លក់ USD", "ស្តុក", "ស្ថានភាព"], rows: productRows },
      { title: "សេចក្តីសង្ខេបការទូទាត់", headers: ["ប្រភេទទិន្ន័យ", "តម្លៃ", "ប្រភេទទិន្ន័យ", "តម្លៃ"], rows: paymentSummaryRows },
      { title: "ការទូទាត់តាមប្រភេទ", headers: ["ប្រភព", "វិធីសាស្ត្រ", "ទទួល USD", "ទទួល KHR", "អាប់ USD", "អាប់ KHR", "លក់បាន USD", "លក់បាន KHR", "ស្មើ USD"], rows: paymentRows },
      { title: "អាយុកាលមិនទាន់ទូទាត់", headers: ["អាយុកាល", "វិក្កយបត្រ", "សរុប USD"], rows: outstandingAgingRows },
      { title: "អតិថិជនមិនទាន់ទូទាត់", headers: ["អតិថិជន", "វិក្កយបត្រ", "សរុប USD"], rows: outstandingRows },
      { title: "លុយចេញពីការទិញ", headers: ["ប្រភេទទិន្ន័យ", "តម្លៃ"], rows: purchaseRows },
      { title: "អ្នកផ្គត់ផ្គង់មិនទាន់បង់", headers: ["អ្នកផ្គត់ផ្គង់", "វិក្កយបត្រទិញ", "សរុប USD", "សរុប KHR"], rows: supplierRows },
      { title: "ស្តុកស្ទើរអស់", headers: ["ទំនិញ", "នៅសល់", "កម្រិត", "ខ្នាត"], rows: lowStockRows },
      { title: "សកម្មភាពថ្មីៗ", headers: ["ប្រភេទ", "សកម្មភាព", "លម្អិត", "ពេលវេលា"], rows: activityRows },
    ],
  };
};

export const exportReportCsv = (report) => {
  const csv = [
    report.title,
    `រយៈពេល,${csvCell(report.period)}`,
    `ពេលបង្កើត,${csvCell(report.generatedAt)}`,
    "",
    ...report.sections.map(csvSection),
  ].join("\r\n");

  downloadBlob(`\uFEFF${csv}`, `${report.filenameBase}.csv`, "text/csv;charset=utf-8");
};

export const exportReportExcel = (report) => {
  const html = `
    <html>
      <head>
        <meta charset="utf-8" />
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
        <p>រយៈពេល: ${escapeHtml(report.period)}</p>
        <p>ពេលបង្កើត: ${escapeHtml(report.generatedAt)}</p>
        ${reportPrintSectionsHtml(report)}
      </body>
    </html>
  `;

  downloadBlob(html, `${report.filenameBase}.xls`, "application/vnd.ms-excel;charset=utf-8");
};

export const exportReportPdf = (report) => {
  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(report.title)}</title>
        <style>
          * { box-sizing: border-box; }
          html { background: #ffffff; }
          body {
            font-family: Arial, "Noto Sans Khmer", sans-serif;
            color: #111827;
            margin: 0;
            padding: 14mm;
            font-size: 11px;
            line-height: 1.55;
          }
          .report-header {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 18px;
            border-bottom: 2px solid #ef4444;
            padding-bottom: 10px;
            margin-bottom: 14px;
          }
          h1 { margin: 0; font-size: 24px; font-weight: 800; color: #111827; }
          .meta { text-align: right; color: #4b5563; font-size: 11px; }
          .meta p { margin: 0; }
          section {
            break-inside: avoid;
            page-break-inside: avoid;
            margin: 0 0 14px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            overflow: hidden;
          }
          h2 {
            margin: 0;
            padding: 9px 12px;
            background: #fff1f2;
            color: #b91c1c;
            font-size: 13px;
            font-weight: 800;
            page-break-after: avoid;
          }
          p { margin: 0 0 6px; color: #52525b; }
          .section-note { padding: 8px 12px 0; margin-bottom: 0; font-size: 10px; }
          table {
            border-collapse: collapse;
            width: 100%;
            table-layout: fixed;
            margin: 0;
          }
          th, td {
            border-top: 1px solid #e5e7eb;
            padding: 6px 8px;
            text-align: left;
            vertical-align: top;
            font-size: 9.5px;
            word-break: break-word;
          }
          th {
            background: #dc2626;
            color: #ffffff;
            font-weight: 800;
          }
          tr:nth-child(even) td { background: #fafafa; }
          .empty { color: #71717a; text-align: center; }
          @page { size: A4 landscape; margin: 0; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="report-header">
          <h1>${escapeHtml(report.title)}</h1>
          <div class="meta">
            <p>រយៈពេល: ${escapeHtml(report.period)}</p>
            <p>ពេលបង្កើត: ${escapeHtml(report.generatedAt)}</p>
          </div>
        </div>
        ${reportPrintSectionsHtml(report)}
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
