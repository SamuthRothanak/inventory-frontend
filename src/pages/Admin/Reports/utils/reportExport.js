const money = (value) => Number(value || 0).toLocaleString("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const number = (value) => Number(value || 0).toLocaleString("en-US");
const qty = (value) => Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });
const usd = (value) => `$${money(value)}`;
const khr = (value) => `${number(Math.round(Number(value || 0)))} KHR`;

const WINDOWS_1252_BYTES = {
  "€": 0x80, "‚": 0x82, "ƒ": 0x83, "„": 0x84, "…": 0x85, "†": 0x86, "‡": 0x87,
  "ˆ": 0x88, "‰": 0x89, "Š": 0x8a, "‹": 0x8b, "Œ": 0x8c, "Ž": 0x8e,
  "‘": 0x91, "’": 0x92, "“": 0x93, "”": 0x94, "•": 0x95, "–": 0x96, "—": 0x97,
  "˜": 0x98, "™": 0x99, "š": 0x9a, "›": 0x9b, "œ": 0x9c, "ž": 0x9e, "Ÿ": 0x9f,
};

const repairMojibake = (value) => {
  const text = String(value ?? "");
  if (!/(?:áž|áŸ|Ã|Â|â)/.test(text)) return text;

  try {
    const bytes = Array.from(text, (char) => {
      const code = char.charCodeAt(0);
      return code <= 0xff ? code : WINDOWS_1252_BYTES[char];
    });

    if (bytes.some((byte) => byte == null)) return text;
    return new TextDecoder("utf-8", { fatal: true }).decode(new Uint8Array(bytes));
  } catch {
    return text;
  }
};

const WINDOWS_1252_BYTE_BY_CODE = {
  0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87,
  0x02c6: 0x88, 0x2030: 0x89, 0x0160: 0x8a, 0x2039: 0x8b, 0x0152: 0x8c, 0x017d: 0x8e,
  0x2018: 0x91, 0x2019: 0x92, 0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
  0x02dc: 0x98, 0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b, 0x0153: 0x9c, 0x017e: 0x9e, 0x0178: 0x9f,
};

const decodeWindows1252AsUtf8 = (text) => {
  const bytes = Array.from(String(text ?? ""), (char) => {
    const code = char.charCodeAt(0);
    return code <= 0xff ? code : WINDOWS_1252_BYTE_BY_CODE[code];
  });

  if (bytes.some((byte) => byte == null)) return text;
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(new Uint8Array(bytes));
  } catch {
    return text;
  }
};

const repairExportText = (value) => {
  let text = String(value ?? "");
  for (let index = 0; index < 3; index += 1) {
    const next = decodeWindows1252AsUtf8(text);
    if (next === text) break;
    text = next;
  }
  return text;
};

const plain = (value) => repairExportText(value).replace(/\s+/g, " ").trim();

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

const BOM = String.fromCharCode(0xfeff);

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
  received: "បានទទួល",
  expiring_soon: "ជិតផុតកំណត់",
  active: "កំពុងប្រើ",
  pending: "រង់ចាំ",
  completed: "បានបញ្ចប់",
  cancelled: "បានបោះបង់",
  expired: "ផុតកំណត់",
}[String(value || "").toLowerCase()] ?? value ?? "");

const paymentMethodLabel = (value) => ({
  cash: "សាច់ប្រាក់",
  bank_transfer: "ធនាគារ / QR",
  qr: "ធនាគារ / QR",
  card: "កាត",
  other: "ផ្សេងៗ",
}[value] ?? value ?? "ផ្សេងៗ");

const readableStatusLabel = (value) => ({
  "in stock": "មានស្តុក",
  "low stock": "ស្តុកស្ទើរអស់",
  "out of stock": "អស់ស្តុក",
  in_stock: "មានស្តុក",
  low_stock: "ស្តុកស្ទើរអស់",
  out_of_stock: "អស់ស្តុក",
  received: "បានទទួល",
  expiring_soon: "ជិតផុតកំណត់",
  active: "កំពុងប្រើ",
  pending: "រង់ចាំ",
  completed: "បានបញ្ចប់",
  cancelled: "បានបោះបង់",
  expired: "ផុតកំណត់",
}[String(value || "").toLowerCase()] ?? value ?? "");

const paymentStatusLabel = (value) => ({
  paid: "បានបង់",
  unpaid: "មិនទាន់បង់",
  partial: "បង់ខ្លះ",
  pending: "រង់ចាំបង់",
  refunded: "បានសងប្រាក់",
}[String(value || "").toLowerCase()] ?? value ?? "");

const salesTypeLabel = (value) => ({
  retail: "លក់រាយ",
  wholesale: "លក់ដុំ",
}[value] ?? value ?? "");

const activityTypeLabel = (value) => ({
  sale: "លក់",
  purchase: "ទិញ",
}[value] ?? value ?? "");

const chartGranularityLabel = (value) => ({
  hour: "តាមម៉ោង",
  day: "តាមថ្ងៃ",
  week: "តាមសប្ដាហ៍",
  month: "តាមខែ",
  month_week: "តាមសប្ដាហ៍ក្នុងខែ",
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
          : `<tr><td colspan="${section.headers.length}" class="empty">${escapeHtml("គ្មានទិន្នន័យ")}</td></tr>`}
      </tbody>
    </table>
  </section>
`;

const reportPrintSectionsHtml = (report) => report.sections.map(tableHtml).join("");

const csvSection = (section) => [
  plain(section.title),
  ...(section.note ? [plain(section.note)] : []),
  section.headers.map(csvCell).join(","),
  ...(section.rows.length ? section.rows.map((row) => row.map(csvCell).join(",")) : [plain("គ្មានទិន្នន័យ")]),
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
  topPurchaseItems = [],
  salesProfit = {},
  salesDetails = [],
  salesByCustomer = [],
  salesByCashier = [],
  purchaseDetails = [],
  purchasesBySupplier = [],
  purchaseReturns = [],
  paymentSummary = {},
  paymentBreakdown = [],
  paymentTransactions = [],
  lowStock = [],
  outstanding = {},
  purchaseMoney = {},
  stockReport = {},
  insights = {},
  recentActivities = [],
  reportTab = "overview",
  reportType = "",
}) => {
  const safeFrom = dateFrom || "from";
  const safeTo = dateTo || "to";
  const generatedAt = new Date().toLocaleString("en-US");
  const filenameBase = `report-${reportTab}${reportType ? `-${reportType}` : ""}-${safeFrom}-to-${safeTo}`;

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
      "ផ្ទេរផ្ទាត់តាម ABA / ACLEDA / Bakong / Wing / ផ្សេងៗ",
    ],
    [
      "សរុបលក់បានសុទ្ធ",
      "",
      "",
      usd(paymentSummary.netEquivalentUsd),
      "លុយទទួលសរុបគិតជា USD",
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
      "លុយចេញទិញបានបង់",
      usd(purchaseMoney.paidUsd),
      khr(purchaseMoney.paidKhr),
      usd(purchaseMoney.paidEquivalentUsd),
      "ផ្ទេរផ្ទាត់ជាមួយលុយចេញទៅអ្នកផ្គត់ផ្គង់",
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
    ["ការលក់សរុប", usd(stats.total_sales_usd), number(stats.total_sales_count), "តម្លៃលក់សរុប និងចំនួនវិក្កយបត្រក្នុងរយៈពេលដែលបានជ្រើសរើស"],
    ["ការទិញសរុប", usd(stats.total_purchases_usd), number(stats.total_purchases_count), "សរុបលុយវិក្កយបត្រទិញក្នុងរយៈពេលដែលបានជ្រើសរើស"],
    ["ការត្រឡប់ទំនិញលក់", usd(stats.sales_returns_usd), number(stats.sales_returns_count), "ទំនិញដែលអតិថិជនត្រឡប់"],
    ["ការត្រឡប់ទំនិញទិញ", usd(stats.purchase_returns_usd), number(stats.purchase_returns_count), "ការទាមទារទៅអ្នកផ្គត់ផ្គង់"],
    ["លុយសុទ្ធ", usd(stats.net_cash_usd), "", "លុយទទួលបានពិត − លុយទិញចូលដែលបានបង់"],
    ["ការត្រឡប់សរុប", usd(stats.gross_return_usd), "", "ការត្រឡប់ទំនិញលក់ + ការត្រឡប់ទំនិញទិញ"],
    ["អតិថិជនមិនទាន់ទូទាត់", usd(stats.outstanding_balance_usd), number(stats.outstanding_balance_count), "វិក្កយបត្រលក់ដែលអតិថិជនមិនទាន់បង់ / បង់ខ្លះ"],
    ["ទំនិញស្តុកស្ទើរអស់", number(stats.low_stock_count), "", "ទំនិញនៅក្រិតអប្បបរមា ឬក្រោមកម្រិត"],
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
    ["ថ្ងៃទិញច្រើន", insights.best_purchase_day?.day ?? "", insights.best_purchase_day ? usd(insights.best_purchase_day.amount) : ""],
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
    readableStatusLabel(item.status),
  ]);

  const salesProfitRows = [
    ["ប្រាក់ចំណូល", usd(salesProfit.revenueUsd ?? stats.sales_revenue_usd)],
    ["ថ្លៃដើម", usd(salesProfit.costUsd ?? stats.sales_cost_usd)],
    ["ប្រាក់ចំណេញដុល", usd(salesProfit.grossProfitUsd ?? stats.gross_profit_usd)],
    ["ផលប៉ះពាល់ពីការត្រឡប់", usd(salesProfit.returnProfitImpactUsd ?? stats.sales_return_profit_impact_usd)],
    ["ប្រាក់ចំណេញដុលសុទ្ធ", usd(salesProfit.netGrossProfitUsd ?? stats.net_gross_profit_usd)],
  ];

  const salesDetailRows = salesDetails.map((item) => [
    item.saleNo,
    item.date,
    item.customerName,
    item.cashierName,
    usd(item.totalUsd),
    usd(item.paidUsd),
    usd(item.dueUsd),
    paymentStatusLabel(item.paymentStatus),
  ]);

  const salesCustomerRows = salesByCustomer.map((item) => [
    item.customerName,
    number(item.count),
    usd(item.totalUsd),
    usd(item.paidUsd),
    usd(item.dueUsd),
  ]);

  const salesCashierRows = salesByCashier.map((item) => [
    item.cashierName,
    number(item.count),
    usd(item.totalUsd),
    usd(item.paidUsd),
    usd(item.dueUsd),
  ]);

  const purchaseProductRows = topPurchaseItems.map((item, index) => [
    index + 1,
    item.name,
    item.unit,
    qty(item.qty),
    number(item.count),
    usd(item.totalUsd),
  ]);

  const paymentSummaryRows = [
    ["សាច់ប្រាក់ទទួល USD", usd(paymentSummary.cashReceivedUsd), "សាច់ប្រាក់ទទួល KHR", khr(paymentSummary.cashReceivedKhr)],
    ["សាច់ប្រាក់អាប់ USD", usd(paymentSummary.cashChangeUsd), "សាច់ប្រាក់អាប់ KHR", khr(paymentSummary.cashChangeKhr)],
    ["សាច់ប្រាក់ទទួលពិត USD", usd(paymentSummary.cashUsd), "សាច់ប្រាក់ទទួលពិត KHR", khr(paymentSummary.cashKhr)],
    ["ធនាគារ/QR ទទួល USD", usd(paymentSummary.electronicReceivedUsd), "ធនាគារ/QR ទទួល KHR", khr(paymentSummary.electronicReceivedKhr)],
    ["ធនាគារ/QR អាប់ USD", usd(paymentSummary.electronicChangeUsd), "ធនាគារ/QR អាប់ KHR", khr(paymentSummary.electronicChangeKhr)],
    ["ធនាគារ/QR ទទួលពិត USD", usd(paymentSummary.electronicUsd), "ធនាគារ/QR ទទួលពិត KHR", khr(paymentSummary.electronicKhr)],
    ["លុយអាប់សរុប USD", usd(paymentSummary.changeUsd), "លុយអាប់សរុប KHR", khr(paymentSummary.changeKhr)],
    ["សងប្រាក់ USD", usd(paymentSummary.refundUsd), "សងប្រាក់ KHR", khr(paymentSummary.refundKhr)],
    ["សរុបស្មើ USD", usd(paymentSummary.totalEquivalentUsd), "សងប្រាក់ស្មើ USD", usd(paymentSummary.refundEquivalentUsd)],
    ["លុយទទួលសរុបគិតជា USD", usd(paymentSummary.netEquivalentUsd), "", ""],
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

  const purchaseDetailRows = purchaseDetails.map((item) => [
    item.purchaseNo,
    item.date,
    item.supplierName,
    usd(item.totalUsd),
    usd(item.paidUsd),
    usd(item.dueUsd),
    paymentStatusLabel(item.paymentStatus),
    readableStatusLabel(item.status),
  ]);

  const purchasesBySupplierRows = purchasesBySupplier.map((item) => [
    item.supplierName,
    number(item.count),
    usd(item.totalUsd),
    usd(item.paidUsd),
    usd(item.dueUsd),
  ]);

  const purchaseReturnRows = purchaseReturns.map((item) => [
    item.returnNo,
    item.date,
    item.purchaseNo,
    item.supplierName,
    item.reason,
    item.resolutionType,
    usd(item.totalUsd),
    usd(item.refundUsd),
    usd(item.creditUsd),
    readableStatusLabel(item.resolutionStatus),
  ]);

  const paymentTransactionRows = paymentTransactions.map((item) => [
    item.date,
    item.saleNo,
    item.customerName,
    item.method,
    item.provider,
    `${number(item.receivedAmount)} ${item.currency ?? ""}`,
    usd(item.amountUsd),
    item.receiverName,
    item.referenceNo,
  ]);

  const lowStockRows = lowStock.map((item) => [
    item.name,
    number(item.current),
    number(item.threshold),
    item.unit,
  ]);

  const stockSummaryRows = [
    ["តម្លៃស្តុក USD", usd(stockReport.valueUsd)],
    ["តម្លៃស្តុក KHR", khr(stockReport.valueKhr)],
    ["ចំនួនស្តុកសរុប", number(stockReport.stockOnHand)],
    ["ចំនួនមុខទំនិញ", number(stockReport.stockItemCount)],
    ["ស្តុកស្ទើរអស់", number(stockReport.lowStockCount ?? stats.low_stock_count)],
    ["ស្តុកអស់", number(stockReport.outOfStockCount)],
    ["ចលនាស្តុក", number(stockReport.movementCount)],
    ["ចូលស្តុក", number(stockReport.stockInQty)],
    ["ចេញស្តុក", number(stockReport.stockOutQty)],
  ];

  const stockMovementRows = [
    ...(stockReport.stockInItems ?? []).map((item) => [
      "ចូលស្តុក",
      item.name,
      qty(item.qty),
      item.unit,
      number(item.count),
    ]),
    ...(stockReport.stockOutItems ?? []).map((item) => [
      "ចេញស្តុក",
      item.name,
      qty(item.qty),
      item.unit,
      number(item.count),
    ]),
  ];

  const outOfStockRows = (stockReport.outOfStockItems ?? []).map((item) => [
    item.name,
    qty(item.current),
    number(item.threshold),
    item.unit,
  ]);

  const batchExpiryRows = (stockReport.batchExpiry ?? []).map((item) => [
    item.batchNo,
    item.lotNo,
    item.name,
    item.expiredDate,
    qty(item.qtyRemaining),
    usd(item.valueUsd),
    readableStatusLabel(item.status),
  ]);

  const stockAdjustmentRows = (stockReport.stockAdjustments ?? []).map((item) => [
    item.adjustmentNo,
    item.date,
    item.type,
    item.reason,
    readableStatusLabel(item.status),
    number(item.itemCount),
    qty(item.qty),
    usd(item.cost),
    item.createdBy,
  ]);

  const damagedStockRows = (stockReport.damagedStock ?? []).map((item) => [
    item.source,
    item.referenceNo,
    item.partyName,
    item.name,
    qty(item.qty),
    item.unit,
    usd(item.valueUsd),
  ]);

  const activityRows = recentActivities.map((item) => [
    activityTypeLabel(item.type),
    item.label,
    item.desc,
    item.time,
  ]);

  const sectionsByKey = {
    salesProfit: { title: "ប្រាក់ចំណេញ", headers: ["ប្រភេទ", "តម្លៃ"], rows: salesProfitRows },
    salesDetails: { title: "លម្អិតការលក់", headers: ["លេខវិក្កយបត្រ", "ថ្ងៃ", "អតិថិជន", "អ្នកលក់", "សរុប", "បានបង់", "នៅខ្វះ", "ស្ថានភាពបង់"], rows: salesDetailRows },
    salesCustomers: { title: "លក់តាមអតិថិជន", headers: ["អតិថិជន", "វិក្កយបត្រ", "សរុប", "បានបង់", "នៅខ្វះ"], rows: salesCustomerRows },
    salesCashiers: { title: "លក់តាមអ្នកលក់", headers: ["អ្នកលក់", "វិក្កយបត្រ", "សរុប", "បានបង់", "នៅខ្វះ"], rows: salesCashierRows },
    purchaseDetails: { title: "លម្អិតការទិញ", headers: ["លេខទិញ", "ថ្ងៃ", "អ្នកផ្គត់ផ្គង់", "សរុប", "បានបង់", "នៅខ្វះ", "ស្ថានភាពបង់", "ស្ថានភាព"], rows: purchaseDetailRows },
    purchasesBySupplier: { title: "ទិញតាមអ្នកផ្គត់ផ្គង់", headers: ["អ្នកផ្គត់ផ្គង់", "វិក្កយបត្រ", "សរុប", "បានបង់", "នៅខ្វះ"], rows: purchasesBySupplierRows },
    purchaseReturns: { title: "លម្អិតការត្រឡប់ការទិញ", headers: ["លេខត្រឡប់", "ថ្ងៃ", "លេខទិញ", "អ្នកផ្គត់ផ្គង់", "មូលហេតុ", "ដំណោះស្រាយ", "សរុប", "ប្រាក់សង", "Credit", "ស្ថានភាព"], rows: purchaseReturnRows },
    paymentTransactions: { title: "ប្រតិបត្តិការទូទាត់", headers: ["ថ្ងៃ", "វិក្កយបត្រ", "អតិថិជន", "វិធី", "ប្រភព", "បានទទួល", "ស្មើ USD", "អ្នកទទួល", "យោង"], rows: paymentTransactionRows },
    outOfStock: { title: "ស្តុកអស់", headers: ["ទំនិញ", "នៅសល់", "កម្រិត", "ខ្នាតទំនិញ"], rows: outOfStockRows },
    batchExpiry: { title: "Batch និងថ្ងៃផុតកំណត់", headers: ["Batch", "Lot", "ទំនិញ", "ផុតកំណត់", "នៅសល់", "តម្លៃ", "ស្ថានភាព"], rows: batchExpiryRows },
    stockAdjustments: { title: "កែតម្រូវស្តុក", headers: ["លេខ", "ថ្ងៃ", "ប្រភេទ", "មូលហេតុ", "ស្ថានភាព", "មុខទំនិញ", "ចំនួន", "តម្លៃ", "បង្កើតដោយ"], rows: stockAdjustmentRows },
    damagedStock: { title: "ស្តុកខូច", headers: ["ប្រភព", "លេខសំគាល់", "ភាគី", "ទំនិញ", "ចំនួន", "ខ្នាតទំនិញ", "តម្លៃ"], rows: damagedStockRows },
    closing: { title: "បិទបញ្ជីលុយ", headers: ["ក្រុមផ្ទាត់ប្រាក់", "USD", "KHR", "ស្មើ USD", "ចំណាំ"], rows: closingRows },
    summary: { title: "សរុបរបាយការណ៍", headers: ["ប្រភេទទិន្នន័យ", "តម្លៃ", "ចំនួន", "ចំណាំ"], rows: summaryRows },
    salesType: { title: "ការលក់តាមប្រភេទ", headers: ["ប្រភេទ", "ចំនួន", "សរុប USD"], rows: salesByTypeRows },
    insights: { title: "ចំណុចសំខាន់ៗ", headers: ["ប្រភេទទិន្នន័យ", "រយៈពេល", "តម្លៃ"], rows: insightRows },
    chart: { title: "ទិន្នន័យក្រាប", note: chartGranularity ? `ការបែងចែក: ${chartGranularityLabel(chartGranularity)}` : "", headers: ["រយៈពេល", "ថ្ងៃ", "ការលក់សរុប USD", "ទិញ USD", "ត្រឡប់ទំនិញសរុប USD", "ត្រឡប់ពីការលក់ USD", "ត្រឡប់ទៅអ្នកផ្គត់ផ្គង់ USD"], rows: chartRows },
    topProducts: { title: "ទំនិញលក់ដាច់", headers: ["ល.រ", "ទំនិញ", "ខ្នាតទំនិញ", "ចំនួនលក់", "ប្រាក់លក់ USD", "ស្តុក", "ស្ថានភាព"], rows: productRows },
    paymentSummary: { title: "សេចក្តីសង្ខេបការទូទាត់", headers: ["ប្រភេទទិន្នន័យ", "តម្លៃ", "ប្រភេទទិន្នន័យ", "តម្លៃ"], rows: paymentSummaryRows },
    paymentTypes: { title: "ការទូទាត់តាមប្រភេទ", headers: ["ប្រភព", "វិធីសាស្ត្រ", "ទទួល USD", "ទទួល KHR", "អាប់ USD", "អាប់ KHR", "ទទួលពិត USD", "ទទួលពិត KHR", "ស្មើ USD"], rows: paymentRows },
    outstandingAging: { title: "អាយុកាលមិនទាន់ទូទាត់", headers: ["អាយុកាល", "វិក្កយបត្រ", "សរុប USD"], rows: outstandingAgingRows },
    outstandingCustomers: { title: "អតិថិជនមិនទាន់ទូទាត់", headers: ["អតិថិជន", "វិក្កយបត្រ", "សរុប USD"], rows: outstandingRows },
    purchases: { title: "លុយចេញការទិញ", headers: ["ប្រភេទទិន្នន័យ", "តម្លៃ"], rows: purchaseRows },
    purchaseProducts: { title: "ទំនិញទិញច្រើន", headers: ["ល.រ", "ទំនិញ", "ខ្នាតទំនិញ", "ចំនួនទិញ", "វិក្កយបត្រទិញ", "តម្លៃទិញ USD"], rows: purchaseProductRows },
    supplierDue: { title: "អ្នកផ្គត់ផ្គង់មិនទាន់បង់", headers: ["អ្នកផ្គត់ផ្គង់", "វិក្កយបត្រទិញ", "សរុប USD", "សរុប KHR"], rows: supplierRows },
    stockSummary: { title: "សង្ខេបស្តុក", headers: ["ប្រភេទទិន្នន័យ", "តម្លៃ"], rows: stockSummaryRows },
    stockMovement: { title: "ចលនាស្តុក", headers: ["ប្រភេទ", "ទំនិញ", "ចំនួន", "ខ្នាតទំនិញ", "ចំនួនចលនា"], rows: stockMovementRows },
    lowStock: { title: "ស្តុកស្ទើរអស់", headers: ["ទំនិញ", "នៅសល់", "កម្រិត", "ខ្នាតទំនិញ"], rows: lowStockRows },
    activities: { title: "សកម្មភាពថ្មីៗ", headers: ["ប្រភេទ", "សកម្មភាព", "លម្អិត", "ពេលវេលា"], rows: activityRows },
  };

  const sectionKeysByReport = {
    all: [
      "summary", "insights", "chart", "activities",
      "topProducts", "salesProfit", "salesType", "salesDetails", "salesCustomers", "salesCashiers", "outstandingAging", "outstandingCustomers",
      "purchases", "purchaseDetails", "purchaseProducts", "purchasesBySupplier", "supplierDue", "purchaseReturns",
      "stockSummary", "stockMovement", "lowStock", "outOfStock", "batchExpiry", "stockAdjustments", "damagedStock",
      "paymentSummary", "paymentTypes", "paymentTransactions", "closing",
    ],
    overview: ["summary", "insights", "chart", "topProducts", "purchases", "lowStock", "activities"],
    sales: {
      all: ["summary", "salesProfit", "salesType", "salesDetails", "topProducts", "salesCustomers", "salesCashiers", "paymentSummary", "paymentTypes", "outstandingAging", "outstandingCustomers", "chart"],
      summary: ["summary", "salesProfit", "salesType", "paymentSummary", "paymentTypes", "outstandingAging", "outstandingCustomers"],
      details: ["salesDetails"],
      product: ["topProducts"],
      customer: ["salesCustomers"],
      cashier: ["salesCashiers"],
      return: ["summary", "chart"],
      profit: ["salesProfit", "topProducts", "chart", "paymentSummary"],
    },
    purchases: {
      all: ["purchases", "purchaseDetails", "purchaseProducts", "purchasesBySupplier", "supplierDue", "purchaseReturns", "summary", "chart"],
      summary: ["purchases", "purchaseProducts", "supplierDue"],
      details: ["purchaseDetails"],
      product: ["purchaseProducts"],
      supplier: ["purchasesBySupplier"],
      supplier_due: ["supplierDue"],
      return: ["purchaseReturns", "summary", "chart"],
    },
    inventory: {
      all: ["stockSummary", "stockMovement", "lowStock", "outOfStock", "batchExpiry", "stockAdjustments", "damagedStock"],
      current: ["stockSummary"],
      movement: ["stockMovement"],
      low_stock: ["lowStock"],
      out_of_stock: ["outOfStock"],
      valuation: ["stockSummary", "lowStock"],
      batch_expiry: ["batchExpiry"],
      adjustment: ["stockAdjustments"],
      damaged: ["damagedStock"],
    },
    financial: {
      all: ["salesProfit", "paymentSummary", "paymentTransactions", "paymentTypes", "closing", "outstandingAging", "outstandingCustomers", "supplierDue", "purchases"],
      profit: ["salesProfit", "paymentSummary", "purchases"],
      customer_due: ["outstandingAging", "outstandingCustomers"],
      supplier_due: ["supplierDue"],
      payments: ["paymentTransactions", "paymentTypes"],
      cash_flow: ["closing", "paymentTypes", "purchases"],
    },
  };

  const selectedKeys = Array.isArray(sectionKeysByReport[reportTab])
    ? sectionKeysByReport[reportTab]
    : sectionKeysByReport[reportTab]?.[reportType] ?? sectionKeysByReport.overview;

  const sectionGroupByKey = {
    summary: "សរុប",
    insights: "សរុប",
    chart: "សរុប",
    activities: "សរុប",
    topProducts: "ការលក់",
    salesProfit: "ការលក់",
    salesType: "ការលក់",
    salesDetails: "ការលក់",
    salesCustomers: "ការលក់",
    salesCashiers: "ការលក់",
    outstandingAging: "ការលក់",
    outstandingCustomers: "ការលក់",
    purchases: "ការទិញ",
    purchaseDetails: "ការទិញ",
    purchaseProducts: "ការទិញ",
    purchasesBySupplier: "ការទិញ",
    supplierDue: "ការទិញ",
    purchaseReturns: "ការទិញ",
    stockSummary: "ស្តុក",
    stockMovement: "ស្តុក",
    lowStock: "ស្តុក",
    outOfStock: "ស្តុក",
    batchExpiry: "ស្តុក",
    stockAdjustments: "ស្តុក",
    damagedStock: "ស្តុក",
    paymentSummary: "ហិរញ្ញវត្ថុ",
    paymentTypes: "ហិរញ្ញវត្ថុ",
    paymentTransactions: "ហិរញ្ញវត្ថុ",
    closing: "ហិរញ្ញវត្ថុ",
  };

  return {
    filenameBase,
    title: "របាយការណ៍",
    period: `${safeFrom} to ${safeTo}`,
    generatedAt,
    sections: selectedKeys.map((key) => {
      const section = sectionsByKey[key];
      return section ? { ...section, group: sectionGroupByKey[key] } : null;
    }).filter(Boolean),
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

  downloadBlob(BOM + csv, `${report.filenameBase}.csv`, "text/csv;charset=utf-8");
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
