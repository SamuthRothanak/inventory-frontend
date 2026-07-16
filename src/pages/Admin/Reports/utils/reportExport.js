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
  "In Stock": "áž˜áž¶áž“ážŸáŸ’ážáž»áž€",
  "Low Stock": "ážŸáŸ’ážáž»áž€ážŸáŸ’áž‘áž¾ážšáž¢ážŸáŸ‹",
  "Out of Stock": "áž¢ážŸáŸ‹ážŸáŸ’ážáž»áž€",
  received: "áž”áž¶áž“áž‘áž‘áž½áž›",
  expiring_soon: "áž‡áž·ážáž•áž»ážáž€áŸ†ážŽážáŸ‹",
  active: "áž€áŸ†áž–áž»áž„áž”áŸ’ážšáž¾",
  pending: "ážšáž„áŸ‹áž…áž¶áŸ†",
  completed: "áž”áž¶áž“áž”áž‰áŸ’áž…áž”áŸ‹",
  cancelled: "áž”áž¶áž“áž”áŸ„áŸ‡áž”áž„áŸ‹",
  expired: "áž•áž»ážáž€áŸ†ážŽážáŸ‹",
}[String(value || "").toLowerCase()] ?? value ?? "");

const paymentMethodLabel = (value) => ({
  cash: "ážŸáž¶áž…áŸ‹áž”áŸ’ážšáž¶áž€áŸ‹",
  bank_transfer: "áž’áž“áž¶áž‚áž¶ážš / QR",
  qr: "áž’áž“áž¶áž‚áž¶ážš / QR",
  card: "áž€áž¶áž",
  other: "áž•áŸ’ážŸáŸáž„áŸ—",
}[value] ?? value ?? "áž•áŸ’ážŸáŸáž„áŸ—");

const readableStatusLabel = (value) => ({
  "in stock": "áž˜áž¶áž“ážŸáŸ’ážáž»áž€",
  "low stock": "ážŸáŸ’ážáž»áž€ážŸáŸ’áž‘áž¾ážšáž¢ážŸáŸ‹",
  "out of stock": "ážŸáŸ’ážáž»áž€áž¢ážŸáŸ‹",
  in_stock: "áž˜áž¶áž“ážŸáŸ’ážáž»áž€",
  low_stock: "ážŸáŸ’ážáž»áž€ážŸáŸ’áž‘áž¾ážšáž¢ážŸáŸ‹",
  out_of_stock: "ážŸáŸ’ážáž»áž€áž¢ážŸáŸ‹",
  received: "áž”áž¶áž“áž‘áž‘áž½áž›",
  expiring_soon: "áž‡áž·ážáž•áž»ážáž€áŸ†ážŽážáŸ‹",
  active: "áž€áŸ†áž–áž»áž„áž”áŸ’ážšáž¾",
  pending: "ážšáž„áŸ‹áž…áž¶áŸ†",
  completed: "áž”áž¶áž“áž”áž‰áŸ’áž…áž”áŸ‹",
  cancelled: "áž”áž¶áž“áž”áŸ„áŸ‡áž”áž„áŸ‹",
  expired: "áž•áž»ážáž€áŸ†ážŽážáŸ‹",
}[String(value || "").toLowerCase()] ?? value ?? "");

const paymentStatusLabel = (value) => ({
  paid: "áž”áž¶áž“áž”áž„áŸ‹",
  unpaid: "áž˜áž·áž“áž‘áž¶áž“áŸ‹áž”áž„áŸ‹",
  partial: "áž”áž„áŸ‹ážáŸ’áž›áŸ‡",
  pending: "ážšáž„áŸ‹áž…áž¶áŸ†áž”áž„áŸ‹",
  refunded: "áž”áž¶áž“ážŸáž„áž”áŸ’ážšáž¶áž€áŸ‹",
}[String(value || "").toLowerCase()] ?? value ?? "");

const salesTypeLabel = (value) => ({
  retail: "áž›áž€áŸ‹ážšáž¶áž™",
  wholesale: "áž›áž€áŸ‹áž”áŸ„áŸ‡ážŠáž»áŸ†",
}[value] ?? value ?? "");

const chartGranularityLabel = (value) => ({
  hour: "ážáž¶áž˜áž˜áŸ‰áŸ„áž„",
  day: "ážáž¶áž˜ážáŸ’áž„áŸƒ",
  week: "ážáž¶áž˜ážŸáž”áŸ’ážáž¶áž áŸ",
  month: "ážáž¶áž˜ážáŸ‚",
  month_week: "ážáž¶áž˜ážŸáž”áŸ’ážáž¶áž áŸáž€áŸ’áž“áž»áž„ážáŸ‚",
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
      "ážŸáž¶áž…áŸ‹áž”áŸ’ážšáž¶áž€áŸ‹ážáŸ’ážšáž¼ážœáž˜áž¶áž“áž€áŸ’áž“áž»áž„ážážáž›áž»áž™",
      usd(paymentSummary.cashUsd),
      khr(paymentSummary.cashKhr),
      "",
      "áž…áŸ†áž“áž½áž“ážŸáž»áž‘áŸ’áž’áž€áŸ’ážšáŸ„áž™ážŠáž€áž›áž»áž™áž¢áž¶áž”áŸ‹",
    ],
    [
      "áž›áž»áž™áž’áž“áž¶áž‚áž¶ážš / QR ážáŸ’ážšáž¼ážœážƒáž¾áž‰áž€áŸ’áž“áž»áž„áž‚ážŽáž“áž¸",
      usd(paymentSummary.electronicUsd),
      khr(paymentSummary.electronicKhr),
      "",
      "áž•áŸ’áž‘áŸ€áž„áž•áŸ’áž‘áž¶ážáŸ‹ážáž¶áž˜ ABA / ACLEDA / Bakong / Wing / áž•áŸ’ážŸáŸáž„áŸ—",
    ],
    [
      "ážŸážšáž»áž”áž›áž€áŸ‹áž”áž¶áž“ážŸáž»áž‘áŸ’áž’",
      "",
      "",
      usd(paymentSummary.netEquivalentUsd),
      "áž›áž»áž™áž‘áž‘áž½áž›ážŸážšáž»áž”áž‚áž·ážáž‡áž¶ USD",
    ],
    [
      "áž›áž»áž™áž¢áž¶áž”áŸ‹áž”áž¶áž“áž”áŸ’ážšáž‚áž›áŸ‹",
      usd(paymentSummary.changeUsd),
      khr(paymentSummary.changeKhr),
      "",
      "áž˜áž·áž“áž˜áŸ‚áž“áž›áž»áž™áž›áž€áŸ‹áž”áž¶áž“áž‘áŸ",
    ],
    [
      "ážŸáž„áž”áŸ’ážšáž¶áž€áŸ‹áž¢ážáž·ážáž·áž‡áž“",
      usd(paymentSummary.refundUsd),
      khr(paymentSummary.refundKhr),
      usd(paymentSummary.refundEquivalentUsd),
      "áž›áž»áž™áž…áŸáž‰áž–áž¸áž€áž¶ážšážáŸ’ážšáž¡áž”áŸ‹áž‘áŸ†áž“áž·áž‰áž›áž€áŸ‹",
    ],
    [
      "áž›áž»áž™áž…áŸáž‰áž–áž¸áž€áž¶ážšáž‘áž·áž‰áž”áž¶áž“áž”áž„áŸ‹",
      usd(purchaseMoney.paidUsd),
      khr(purchaseMoney.paidKhr),
      usd(purchaseMoney.paidEquivalentUsd),
      "áž•áŸ’áž‘áŸ€áž„áž•áŸ’áž‘áž¶ážáŸ‹áž‡áž¶áž˜áž½áž™áž›áž»áž™áž…áŸáž‰áž‘áŸ…áž¢áŸ’áž“áž€áž•áŸ’áž‚ážáŸ‹áž•áŸ’áž‚áž„áŸ‹",
    ],
    [
      "áž¢ážáž·ážáž·áž‡áž“áž˜áž·áž“áž‘áž¶áž“áŸ‹áž‘áž¼áž‘áž¶ážáŸ‹",
      "",
      "",
      usd(outstanding.totalUsd ?? stats.outstanding_balance_usd),
      "áž›áž»áž™áž˜áž·áž“áž‘áž¶áž“áŸ‹áž‘áž‘áž½áž›áž–áž¸áž€áž¶ážšáž›áž€áŸ‹",
    ],
    [
      "áž™áž¾áž„áž˜áž·áž“áž‘áž¶áž“áŸ‹áž”áž„áŸ‹áž¢áŸ’áž“áž€áž•áŸ’áž‚ážáŸ‹áž•áŸ’áž‚áž„áŸ‹",
      usd(purchaseMoney.outstandingUsd),
      khr(purchaseMoney.outstandingKhr),
      usd(purchaseOutstandingEquivalentUsd),
      "áž›áž»áž™áž‘áž·áž‰áž…áž¼áž›ážŠáŸ‚áž›áž˜áž·áž“áž‘áž¶áž“áŸ‹áž”áž„áŸ‹",
    ],
  ];

  const summaryRows = [
    ["áž€áž¶ážšáž›áž€áŸ‹ážŸážšáž»áž”", usd(stats.total_sales_usd), number(stats.total_sales_count), "áž›áž»áž™áž›áž€áŸ‹ážŸážšáž»áž” áž“áž·áž„áž…áŸ†áž“áž½áž“ážœáž·áž€áŸ’áž€áž™áž”ážáŸ’ážšáž›áž€áŸ‹áž€áŸ’áž“áž»áž„ážšáž™áŸˆáž–áŸáž›ážŠáŸ‚áž›áž”áž¶áž“áž‡áŸ’ážšáž¾ážŸ"],
    ["áž€áž¶ážšáž‘áž·áž‰ážŸážšáž»áž”", usd(stats.total_purchases_usd), number(stats.total_purchases_count), "ážŸážšáž»áž”áž›áž»áž™ážœáž·áž€áŸ’áž€áž™áž”ážáŸ’ážšáž‘áž·áž‰áž€áŸ’áž“áž»áž„ážšáž™áŸˆáž–áŸáž›ážŠáŸ‚áž›áž”áž¶áž“áž‡áŸ’ážšáž¾ážŸ"],
    ["áž€áž¶ážšážáŸ’ážšáž¡áž”áŸ‹áž‘áŸ†áž“áž·áž‰áž›áž€áŸ‹", usd(stats.sales_returns_usd), number(stats.sales_returns_count), "áž‘áŸ†áž“áž·áž‰ážŠáŸ‚áž›áž¢ážáž·ážáž·áž‡áž“ážáŸ’ážšáž¡áž”áŸ‹"],
    ["áž€áž¶ážšážáŸ’ážšáž¡áž”áŸ‹áž‘áŸ†áž“áž·áž‰áž‘áž·áž‰", usd(stats.purchase_returns_usd), number(stats.purchase_returns_count), "áž€áž¶ážšáž‘áž¶áž˜áž‘áž¶ážšáž‘áŸ…áž¢áŸ’áž“áž€áž•áŸ’áž‚ážáŸ‹áž•áŸ’áž‚áž„áŸ‹"],
    ["áž›áž»áž™ážŸáž»áž‘áŸ’áž’", usd(stats.net_cash_usd), "", "áž›áž»áž™áž‘áž‘áž½áž›áž”áž¶áž“áž–áž·áž - áž›áž»áž™áž‘áž·áž‰áž…áž¼áž›ážŠáŸ‚áž›áž”áž¶áž“áž”áž„áŸ‹"],
    ["áž€áž¶ážšážáŸ’ážšáž¡áž”áŸ‹ážŸážšáž»áž”", usd(stats.gross_return_usd), "", "áž€áž¶ážšážáŸ’ážšáž¡áž”áŸ‹áž‘áŸ†áž“áž·áž‰áž›áž€áŸ‹ + áž€áž¶ážšážáŸ’ážšáž¡áž”áŸ‹áž‘áŸ†áž“áž·áž‰áž‘áž·áž‰"],
    ["áž¢ážáž·ážáž·áž‡áž“áž˜áž·áž“áž‘áž¶áž“áŸ‹áž‘áž¼áž‘áž¶ážáŸ‹", usd(stats.outstanding_balance_usd), number(stats.outstanding_balance_count), "ážœáž·áž€áŸ’áž€áž™áž”ážáŸ’ážšáž›áž€áŸ‹ážŠáŸ‚áž›áž¢ážáž·ážáž·áž‡áž“áž˜áž·áž“áž‘áž¶áž“áŸ‹áž”áž„áŸ‹ / áž”áž„áŸ‹ážáŸ’áž›áŸ‡"],
    ["áž‘áŸ†áž“áž·áž‰ážŸáŸ’ážáž»áž€ážŸáŸ’áž‘áž¾ážšáž¢ážŸáŸ‹", number(stats.low_stock_count), "", "áž‘áŸ†áž“áž·áž‰áž“áŸ…áž€áž˜áŸ’ážšáž·ážáž¢áž”áŸ’áž”áž”ážšáž˜áž¶ áž¬áž€áŸ’ážšáŸ„áž˜áž€áž˜áŸ’ážšáž·áž"],
    ["áž€áž¶ážšáž‘áž¶áž˜áž‘áž¶ážšáž¢áŸ’áž“áž€áž•áŸ’áž‚ážáŸ‹áž•áŸ’áž‚áž„áŸ‹", number(stats.pending_claims_count), "", "áž€áž¶ážšážáŸ’ážšáž¡áž”áŸ‹áž‘áŸ†áž“áž·áž‰áž‘áž·áž‰ážŠáŸ‚áž›áž˜áž·áž“áž‘áž¶áž“áŸ‹ážŠáŸ„áŸ‡ážŸáŸ’ážšáž¶áž™"],
    ["ážŸáŸ’ážáž»áž€áž“áŸ…ážŸáž›áŸ‹", number(stats.stock_on_hand), "", "áž…áŸ†áž“áž½áž“ážŸáŸ’ážáž»áž€áž”áž…áŸ’áž…áž»áž”áŸ’áž”áž“áŸ’áž“"],
  ];

  const salesByTypeRows = Object.entries(salesByType).map(([type, row]) => [
    salesTypeLabel(type),
    number(row?.count),
    usd(row?.totalUsd),
  ]);

  const insightRows = [
    ["ážáŸ’áž„áŸƒáž›áž€áŸ‹áž”áž¶áž“áž…áŸ’ážšáž¾áž“", insights.best_sales_day?.day ?? "", insights.best_sales_day ? usd(insights.best_sales_day.amount) : ""],
    ["ážáŸ’áž„áŸƒáž‘áž·áž‰áž…áž¼áž›áž…áŸ’ážšáž¾áž“", insights.best_purchase_day?.day ?? "", insights.best_purchase_day ? usd(insights.best_purchase_day.amount) : ""],
    ["ážáŸ’áž„áŸƒážáŸ’ážšáž¡áž”áŸ‹áž…áŸ’ážšáž¾áž“", insights.most_return_day?.day ?? "", insights.most_return_day ? usd(insights.most_return_day.amount) : ""],
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
    ["áž”áŸ’ážšáž¶áž€áŸ‹áž›áž€áŸ‹", usd(salesProfit.revenueUsd ?? stats.sales_revenue_usd)],
    ["ážáŸ’áž›áŸƒážŠáž¾áž˜", usd(salesProfit.costUsd ?? stats.sales_cost_usd)],
    ["áž”áŸ’ážšáž¶áž€áŸ‹áž…áŸ†ážŽáŸáž‰ážŠáž»áž›", usd(salesProfit.grossProfitUsd ?? stats.gross_profit_usd)],
    ["áž•áž›áž”áŸ‰áŸ‡áž–áž¶áž›áŸ‹áž–áž¸áž€áž¶ážšážáŸ’ážšáž¡áž”áŸ‹", usd(salesProfit.returnProfitImpactUsd ?? stats.sales_return_profit_impact_usd)],
    ["áž”áŸ’ážšáž¶áž€áŸ‹áž…áŸ†ážŽáŸáž‰ážŠáž»áž›ážŸáž»áž‘áŸ’áž’", usd(salesProfit.netGrossProfitUsd ?? stats.net_gross_profit_usd)],
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
    ["ážŸáž¶áž…áŸ‹áž”áŸ’ážšáž¶áž€áŸ‹áž‘áž‘áž½áž› USD", usd(paymentSummary.cashReceivedUsd), "ážŸáž¶áž…áŸ‹áž”áŸ’ážšáž¶áž€áŸ‹áž‘áž‘áž½áž› KHR", khr(paymentSummary.cashReceivedKhr)],
    ["ážŸáž¶áž…áŸ‹áž”áŸ’ážšáž¶áž€áŸ‹áž¢áž¶áž”áŸ‹ USD", usd(paymentSummary.cashChangeUsd), "ážŸáž¶áž…áŸ‹áž”áŸ’ážšáž¶áž€áŸ‹áž¢áž¶áž”áŸ‹ KHR", khr(paymentSummary.cashChangeKhr)],
    ["ážŸáž¶áž…áŸ‹áž”áŸ’ážšáž¶áž€áŸ‹áž‘áž‘áž½áž›áž–áž·áž USD", usd(paymentSummary.cashUsd), "ážŸáž¶áž…áŸ‹áž”áŸ’ážšáž¶áž€áŸ‹áž‘áž‘áž½áž›áž–áž·áž KHR", khr(paymentSummary.cashKhr)],
    ["áž’áž“áž¶áž‚áž¶ážš/QR áž‘áž‘áž½áž› USD", usd(paymentSummary.electronicReceivedUsd), "áž’áž“áž¶áž‚áž¶ážš/QR áž‘áž‘áž½áž› KHR", khr(paymentSummary.electronicReceivedKhr)],
    ["áž’áž“áž¶áž‚áž¶ážš/QR áž¢áž¶áž”áŸ‹ USD", usd(paymentSummary.electronicChangeUsd), "áž’áž“áž¶áž‚áž¶ážš/QR áž¢áž¶áž”áŸ‹ KHR", khr(paymentSummary.electronicChangeKhr)],
    ["áž’áž“áž¶áž‚áž¶ážš/QR áž‘áž‘áž½áž›áž–áž·áž USD", usd(paymentSummary.electronicUsd), "áž’áž“áž¶áž‚áž¶ážš/QR áž‘áž‘áž½áž›áž–áž·áž KHR", khr(paymentSummary.electronicKhr)],
    ["áž›áž»áž™áž¢áž¶áž”áŸ‹ážŸážšáž»áž” USD", usd(paymentSummary.changeUsd), "áž›áž»áž™áž¢áž¶áž”áŸ‹ážŸážšáž»áž” KHR", khr(paymentSummary.changeKhr)],
    ["ážŸáž„áž”áŸ’ážšáž¶áž€áŸ‹ USD", usd(paymentSummary.refundUsd), "ážŸáž„áž”áŸ’ážšáž¶áž€áŸ‹ KHR", khr(paymentSummary.refundKhr)],
    ["ážŸážšáž»áž”ážŸáŸ’áž˜áž¾ USD", usd(paymentSummary.totalEquivalentUsd), "ážŸáž„áž”áŸ’ážšáž¶áž€áŸ‹ážŸáŸ’áž˜áž¾ USD", usd(paymentSummary.refundEquivalentUsd)],
    ["áž›áž»áž™áž‘áž‘áž½áž›ážŸážšáž»áž”áž‚áž·ážáž‡áž¶ USD", usd(paymentSummary.netEquivalentUsd), "", ""],
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
    ["áž…áŸ†áž“áž½áž“ážœáž·áž€áŸ’áž€áž™áž”ážáŸ’ážšáž‘áž·áž‰", number(purchaseMoney.count)],
    ["ážŸážšáž»áž”áž›áž»áž™ážœáž·áž€áŸ’áž€áž™áž”ážáŸ’ážš USD", usd(purchaseTotalUsd)],
    ["ážŸážšáž»áž”áž›áž»áž™ážœáž·áž€áŸ’áž€áž™áž”ážáŸ’ážš KHR", khr(purchaseTotalKhr)],
    ["áž”áž¶áž“áž”áž„áŸ‹ USD", usd(purchaseMoney.paidUsd)],
    ["áž”áž¶áž“áž”áž„áŸ‹ KHR", khr(purchaseMoney.paidKhr)],
    ["áž”áž¶áž“áž”áž„áŸ‹ážŸáŸ’áž˜áž¾ USD", usd(purchaseMoney.paidEquivalentUsd)],
    ["áž˜áž·áž“áž‘áž¶áž“áŸ‹áž”áž„áŸ‹ USD", usd(purchaseMoney.outstandingUsd)],
    ["áž˜áž·áž“áž‘áž¶áž“áŸ‹áž”áž„áŸ‹ KHR", khr(purchaseMoney.outstandingKhr)],
    ["áž˜áž·áž“áž‘áž¶áž“áŸ‹áž”áž„áŸ‹ážŸáŸ’áž˜áž¾ USD", usd(purchaseOutstandingEquivalentUsd)],
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
    ["ážáž˜áŸ’áž›áŸƒážŸáŸ’ážáž»áž€ USD", usd(stockReport.valueUsd)],
    ["ážáž˜áŸ’áž›áŸƒážŸáŸ’ážáž»áž€ KHR", khr(stockReport.valueKhr)],
    ["áž…áŸ†áž“áž½áž“ážŸáŸ’ážáž»áž€ážŸážšáž»áž”", number(stockReport.stockOnHand)],
    ["áž…áŸ†áž“áž½áž“áž˜áž»ážáž‘áŸ†áž“áž·áž‰", number(stockReport.stockItemCount)],
    ["ážŸáŸ’ážáž»áž€ážŸáŸ’áž‘áž¾ážšáž¢ážŸáŸ‹", number(stockReport.lowStockCount ?? stats.low_stock_count)],
    ["ážŸáŸ’ážáž»áž€áž¢ážŸáŸ‹", number(stockReport.outOfStockCount)],
    ["áž…áž›áž“áž¶ážŸáŸ’ážáž»áž€", number(stockReport.movementCount)],
    ["áž…áž¼áž›ážŸáŸ’ážáž»áž€", number(stockReport.stockInQty)],
    ["áž…áŸáž‰ážŸáŸ’ážáž»áž€", number(stockReport.stockOutQty)],
  ];

  const stockMovementRows = [
    ...(stockReport.stockInItems ?? []).map((item) => [
      "áž…áž¼áž›ážŸáŸ’ážáž»áž€",
      item.name,
      qty(item.qty),
      item.unit,
      number(item.count),
    ]),
    ...(stockReport.stockOutItems ?? []).map((item) => [
      "áž…áŸáž‰ážŸáŸ’ážáž»áž€",
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
    item.type,
    item.label,
    item.desc,
    item.time,
  ]);

  const sectionsByKey = {
    salesProfit: { title: "áž”áŸ’ážšáž¶áž€áŸ‹áž…áŸ†ážŽáŸáž‰", headers: ["áž”áŸ’ážšáž—áŸáž‘", "ážáž˜áŸ’áž›áŸƒ"], rows: salesProfitRows },
    salesDetails: { title: "áž›áž˜áŸ’áž¢áž·ážáž€áž¶ážšáž›áž€áŸ‹", headers: ["áž›áŸážážœáž·áž€áŸ’áž€áž™áž”ážáŸ’ážš", "ážáŸ’áž„áŸƒ", "áž¢ážáž·ážáž·áž‡áž“", "áž¢áŸ’áž“áž€áž›áž€áŸ‹", "ážŸážšáž»áž”", "áž”áž¶áž“áž”áž„áŸ‹", "áž“áŸ…ážáŸ’ážœáŸ‡", "ážŸáŸ’ážáž¶áž“áž—áž¶áž–áž”áž„áŸ‹"], rows: salesDetailRows },
    salesCustomers: { title: "áž›áž€áŸ‹ážáž¶áž˜áž¢ážáž·ážáž·áž‡áž“", headers: ["áž¢ážáž·ážáž·áž‡áž“", "ážœáž·áž€áŸ’áž€áž™áž”ážáŸ’ážš", "ážŸážšáž»áž”", "áž”áž¶áž“áž”áž„áŸ‹", "áž“áŸ…ážáŸ’ážœáŸ‡"], rows: salesCustomerRows },
    salesCashiers: { title: "áž›áž€áŸ‹ážáž¶áž˜áž¢áŸ’áž“áž€áž›áž€áŸ‹", headers: ["áž¢áŸ’áž“áž€áž›áž€áŸ‹", "ážœáž·áž€áŸ’áž€áž™áž”ážáŸ’ážš", "ážŸážšáž»áž”", "áž”áž¶áž“áž”áž„áŸ‹", "áž“áŸ…ážáŸ’ážœáŸ‡"], rows: salesCashierRows },
    purchaseDetails: { title: "áž›áž˜áŸ’áž¢áž·ážáž€áž¶ážšáž‘áž·áž‰", headers: ["áž›áŸážáž‘áž·áž‰", "ážáŸ’áž„áŸƒ", "áž¢áŸ’áž“áž€áž•áŸ’áž‚ážáŸ‹áž•áŸ’áž‚áž„áŸ‹", "ážŸážšáž»áž”", "áž”áž¶áž“áž”áž„áŸ‹", "áž“áŸ…ážáŸ’ážœáŸ‡", "ážŸáŸ’ážáž¶áž“áž—áž¶áž–áž”áž„áŸ‹", "ážŸáŸ’ážáž¶áž“áž—áž¶áž–"], rows: purchaseDetailRows },
    purchasesBySupplier: { title: "áž‘áž·áž‰ážáž¶áž˜áž¢áŸ’áž“áž€áž•áŸ’áž‚ážáŸ‹áž•áŸ’áž‚áž„áŸ‹", headers: ["áž¢áŸ’áž“áž€áž•áŸ’áž‚ážáŸ‹áž•áŸ’áž‚áž„áŸ‹", "ážœáž·áž€áŸ’áž€áž™áž”ážáŸ’ážš", "ážŸážšáž»áž”", "áž”áž¶áž“áž”áž„áŸ‹", "áž“áŸ…ážáŸ’ážœáŸ‡"], rows: purchasesBySupplierRows },
    purchaseReturns: { title: "áž›áž˜áŸ’áž¢áž·ážáž€áž¶ážšážáŸ’ážšáž¡áž”áŸ‹áž€áž¶ážšáž‘áž·áž‰", headers: ["áž›áŸážážáŸ’ážšáž¡áž”áŸ‹", "ážáŸ’áž„áŸƒ", "áž›áŸážáž‘áž·áž‰", "áž¢áŸ’áž“áž€áž•áŸ’áž‚ážáŸ‹áž•áŸ’áž‚áž„áŸ‹", "áž˜áž¼áž›áž áŸážáž»", "ážŠáŸ†ážŽáŸ„áŸ‡ážŸáŸ’ážšáž¶áž™", "ážŸážšáž»áž”", "áž”áŸ’ážšáž¶áž€áŸ‹ážŸáž„", "Credit", "ážŸáŸ’ážáž¶áž“áž—áž¶áž–"], rows: purchaseReturnRows },
    paymentTransactions: { title: "áž”áŸ’ážšážáž·áž”ážáŸ’ážáž·áž€áž¶ážšáž‘áž¼áž‘áž¶ážáŸ‹", headers: ["ážáŸ’áž„áŸƒ", "ážœáž·áž€áŸ’áž€áž™áž”ážáŸ’ážš", "áž¢ážáž·ážáž·áž‡áž“", "ážœáž·áž’áž¸", "áž”áŸ’ážšáž—áž–", "áž”áž¶áž“áž‘áž‘áž½áž›", "ážŸáŸ’áž˜áž¾ USD", "áž¢áŸ’áž“áž€áž‘áž‘áž½áž›", "áž™áŸ„áž„"], rows: paymentTransactionRows },
    outOfStock: { title: "ážŸáŸ’ážáž»áž€áž¢ážŸáŸ‹", headers: ["áž‘áŸ†áž“áž·áž‰", "áž“áŸ…ážŸáž›áŸ‹", "áž€áž˜áŸ’ážšáž·áž", "ážáŸ’áž“áž¶ážáž‘áŸ†áž“áž·áž‰"], rows: outOfStockRows },
    batchExpiry: { title: "Batch áž“áž·áž„ážáŸ’áž„áŸƒáž•áž»ážáž€áŸ†ážŽážáŸ‹", headers: ["Batch", "Lot", "áž‘áŸ†áž“áž·áž‰", "áž•áž»ážáž€áŸ†ážŽážáŸ‹", "áž“áŸ…ážŸáž›áŸ‹", "ážáž˜áŸ’áž›áŸƒ", "ážŸáŸ’ážáž¶áž“áž—áž¶áž–"], rows: batchExpiryRows },
    stockAdjustments: { title: "áž€áŸ‚ážáž˜áŸ’ážšáž¼ážœážŸáŸ’ážáž»áž€", headers: ["áž›áŸáž", "ážáŸ’áž„áŸƒ", "áž”áŸ’ážšáž—áŸáž‘", "áž˜áž¼áž›áž áŸážáž»", "ážŸáŸ’ážáž¶áž“áž—áž¶áž–", "áž˜áž»ážáž‘áŸ†áž“áž·áž‰", "áž…áŸ†áž“áž½áž“", "ážáž˜áŸ’áž›áŸƒ", "áž”áž„áŸ’áž€áž¾ážážŠáŸ„áž™"], rows: stockAdjustmentRows },
    damagedStock: { title: "ážŸáŸ’ážáž»áž€ážáž¼áž…", headers: ["áž”áŸ’ážšáž—áž–", "áž¯áž€ážŸáž¶ážš", "áž—áž¶áž‚áž¸", "áž‘áŸ†áž“áž·áž‰", "áž…áŸ†áž“áž½áž“", "ážáŸ’áž“áž¶ážáž‘áŸ†áž“áž·áž‰", "ážáž˜áŸ’áž›áŸƒ"], rows: damagedStockRows },
    closing: { title: "áž”áž·áž‘áž”áž‰áŸ’áž‡áž¸áž›áž»áž™", headers: ["ážáŸ’ážšáž¼ážœáž•áŸ’áž‘áŸ€áž„áž•áŸ’áž‘áž¶ážáŸ‹", "USD", "KHR", "ážŸáŸ’áž˜áž¾ USD", "áž…áŸ†ážŽáž¶áŸ†"], rows: closingRows },
    summary: { title: "ážŸážšáž»áž”ážšáž”áž¶áž™áž€áž¶ážšážŽáŸ", headers: ["áž”áŸ’ážšáž—áŸáž‘áž‘áž·áž“áŸ’áž“áŸáž™", "ážáž˜áŸ’áž›áŸƒ", "áž…áŸ†áž“áž½áž“", "áž…áŸ†ážŽáž¶áŸ†"], rows: summaryRows },
    salesType: { title: "áž€áž¶ážšáž›áž€áŸ‹ážáž¶áž˜áž”áŸ’ážšáž—áŸáž‘", headers: ["áž”áŸ’ážšáž—áŸáž‘", "áž…áŸ†áž“áž½áž“", "ážŸážšáž»áž” USD"], rows: salesByTypeRows },
    insights: { title: "áž…áŸ†ážŽáž»áž…ážŸáŸ†ážáž¶áž“áŸ‹áŸ—", headers: ["áž”áŸ’ážšáž—áŸáž‘áž‘áž·áž“áŸ’áž“áŸáž™", "ážšáž™áŸˆáž–áŸáž›", "ážáž˜áŸ’áž›áŸƒ"], rows: insightRows },
    chart: { title: "áž‘áž·áž“áŸ’áž“áŸáž™áž€áŸ’ážšáž¶áž”", note: chartGranularity ? `áž€áž¶ážšáž”áŸ‚áž„áž…áŸ‚áž€: ${chartGranularityLabel(chartGranularity)}` : "", headers: ["ážšáž™áŸˆáž–áŸáž›", "ážáŸ’áž„áŸƒ", "áž€áž¶ážšáž›áž€áŸ‹ážŸážšáž»áž” USD", "áž‘áž·áž‰ USD", "ážáŸ’ážšáž¡áž”áŸ‹áž‘áŸ†áž“áž·áž‰ážŸážšáž»áž” USD", "ážáŸ’ážšáž¡áž”áŸ‹áž–áž¸áž€áž¶ážšáž›áž€áŸ‹ USD", "ážáŸ’ážšáž¡áž”áŸ‹áž‘áŸ…áž¢áŸ’áž“áž€áž•áŸ’áž‚ážáŸ‹áž•áŸ’áž‚áž„áŸ‹ USD"], rows: chartRows },
    topProducts: { title: "áž‘áŸ†áž“áž·áž‰áž›áž€áŸ‹ážŠáž¶áž…áŸ‹", headers: ["áž›.ážš", "áž‘áŸ†áž“áž·áž‰", "ážáŸ’áž“áž¶ážáž‘áŸ†áž“áž·áž‰", "áž…áŸ†áž“áž½áž“áž›áž€áŸ‹", "áž”áŸ’ážšáž¶áž€áŸ‹áž›áž€áŸ‹ USD", "ážŸáŸ’ážáž»áž€", "ážŸáŸ’ážáž¶áž“áž—áž¶áž–"], rows: productRows },
    paymentSummary: { title: "ážŸáŸáž…áž€áŸ’ážáž¸ážŸáž„áŸ’ážáŸáž”áž€áž¶ážšáž‘áž¼áž‘áž¶ážáŸ‹", headers: ["áž”áŸ’ážšáž—áŸáž‘áž‘áž·áž“áŸ’áž“áŸáž™", "ážáž˜áŸ’áž›áŸƒ", "áž”áŸ’ážšáž—áŸáž‘áž‘áž·áž“áŸ’áž“áŸáž™", "ážáž˜áŸ’áž›áŸƒ"], rows: paymentSummaryRows },
    paymentTypes: { title: "áž€áž¶ážšáž‘áž¼áž‘áž¶ážáŸ‹ážáž¶áž˜áž”áŸ’ážšáž—áŸáž‘", headers: ["áž”áŸ’ážšáž—áž–", "ážœáž·áž’áž¸ážŸáž¶ážŸáŸ’ážáŸ’ážš", "áž‘áž‘áž½áž› USD", "áž‘áž‘áž½áž› KHR", "áž¢áž¶áž”áŸ‹ USD", "áž¢áž¶áž”áŸ‹ KHR", "áž‘áž‘áž½áž›áž–áž·áž USD", "áž‘áž‘áž½áž›áž–áž·áž KHR", "ážŸáŸ’áž˜áž¾ USD"], rows: paymentRows },
    outstandingAging: { title: "áž¢áž¶áž™áž»áž€áž¶áž›áž˜áž·áž“áž‘áž¶áž“áŸ‹áž‘áž¼áž‘áž¶ážáŸ‹", headers: ["áž¢áž¶áž™áž»áž€áž¶áž›", "ážœáž·áž€áŸ’áž€áž™áž”ážáŸ’ážš", "ážŸážšáž»áž” USD"], rows: outstandingAgingRows },
    outstandingCustomers: { title: "áž¢ážáž·ážáž·áž‡áž“áž˜áž·áž“áž‘áž¶áž“áŸ‹áž‘áž¼áž‘áž¶ážáŸ‹", headers: ["áž¢ážáž·ážáž·áž‡áž“", "ážœáž·áž€áŸ’áž€áž™áž”ážáŸ’ážš", "ážŸážšáž»áž” USD"], rows: outstandingRows },
    purchases: { title: "áž›áž»áž™áž…áŸáž‰áž–áž¸áž€áž¶ážšáž‘áž·áž‰", headers: ["áž”áŸ’ážšáž—áŸáž‘áž‘áž·áž“áŸ’áž“áŸáž™", "ážáž˜áŸ’áž›áŸƒ"], rows: purchaseRows },
    purchaseProducts: { title: "áž‘áŸ†áž“áž·áž‰áž‘áž·áž‰áž…áž¼áž›", headers: ["áž›.ážš", "áž‘áŸ†áž“áž·áž‰", "ážáŸ’áž“áž¶ážáž‘áŸ†áž“áž·áž‰", "áž…áŸ†áž“áž½áž“áž‘áž·áž‰", "ážœáž·áž€áŸ’áž€áž™áž”ážáŸ’ážšáž‘áž·áž‰", "តម្លៃទិញ USD"], rows: purchaseProductRows },
    supplierDue: { title: "áž¢áŸ’áž“áž€áž•áŸ’áž‚ážáŸ‹áž•áŸ’áž‚áž„áŸ‹áž˜áž·áž“áž‘áž¶áž“áŸ‹áž”áž„áŸ‹", headers: ["áž¢áŸ’áž“áž€áž•áŸ’áž‚ážáŸ‹áž•áŸ’áž‚áž„áŸ‹", "ážœáž·áž€áŸ’áž€áž™áž”ážáŸ’ážšáž‘áž·áž‰", "ážŸážšáž»áž” USD", "ážŸážšáž»áž” KHR"], rows: supplierRows },
    stockSummary: { title: "ážŸáž„áŸ’ážáŸáž”ážŸáŸ’ážáž»áž€", headers: ["áž”áŸ’ážšáž—áŸáž‘áž‘áž·áž“áŸ’áž“áŸáž™", "ážáž˜áŸ’áž›áŸƒ"], rows: stockSummaryRows },
    stockMovement: { title: "áž…áž›áž“áž¶ážŸáŸ’ážáž»áž€", headers: ["áž”áŸ’ážšáž—áŸáž‘", "áž‘áŸ†áž“áž·áž‰", "áž…áŸ†áž“áž½áž“", "ážáŸ’áž“áž¶ážáž‘áŸ†áž“áž·áž‰", "áž…áŸ†áž“áž½áž“áž…áž›áž“áž¶"], rows: stockMovementRows },
    lowStock: { title: "ážŸáŸ’ážáž»áž€ážŸáŸ’áž‘áž¾ážšáž¢ážŸáŸ‹", headers: ["áž‘áŸ†áž“áž·áž‰", "áž“áŸ…ážŸáž›áŸ‹", "áž€áž˜áŸ’ážšáž·áž", "ážáŸ’áž“áž¶ážáž‘áŸ†áž“áž·áž‰"], rows: lowStockRows },
    activities: { title: "ážŸáž€áž˜áŸ’áž˜áž—áž¶áž–ážáŸ’áž˜áž¸áŸ—", headers: ["áž”áŸ’ážšáž—áŸáž‘", "ážŸáž€áž˜áŸ’áž˜áž—áž¶áž–", "áž›áž˜áŸ’áž¢áž·áž", "áž–áŸáž›ážœáŸáž›áž¶"], rows: activityRows },
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
    summary: "ážŸážšáž»áž”",
    insights: "ážŸážšáž»áž”",
    chart: "ážŸážšáž»áž”",
    activities: "ážŸážšáž»áž”",
    topProducts: "áž€áž¶ážšáž›áž€áŸ‹",
    salesProfit: "áž€áž¶ážšáž›áž€áŸ‹",
    salesType: "áž€áž¶ážšáž›áž€áŸ‹",
    salesDetails: "áž€áž¶ážšáž›áž€áŸ‹",
    salesCustomers: "áž€áž¶ážšáž›áž€áŸ‹",
    salesCashiers: "áž€áž¶ážšáž›áž€áŸ‹",
    outstandingAging: "áž€áž¶ážšáž›áž€áŸ‹",
    outstandingCustomers: "áž€áž¶ážšáž›áž€áŸ‹",
    purchases: "áž€áž¶ážšáž‘áž·áž‰",
    purchaseDetails: "áž€áž¶ážšáž‘áž·áž‰",
    purchaseProducts: "áž€áž¶ážšáž‘áž·áž‰",
    purchasesBySupplier: "áž€áž¶ážšáž‘áž·áž‰",
    supplierDue: "áž€áž¶ážšáž‘áž·áž‰",
    purchaseReturns: "áž€áž¶ážšáž‘áž·áž‰",
    stockSummary: "ážŸáŸ’ážáž»áž€",
    stockMovement: "ážŸáŸ’ážáž»áž€",
    lowStock: "ážŸáŸ’ážáž»áž€",
    outOfStock: "ážŸáŸ’ážáž»áž€",
    batchExpiry: "ážŸáŸ’ážáž»áž€",
    stockAdjustments: "ážŸáŸ’ážáž»áž€",
    damagedStock: "ážŸáŸ’ážáž»áž€",
    paymentSummary: "áž áž·ážšáž‰áŸ’áž‰ážœážáŸ’ážáž»",
    paymentTypes: "áž áž·ážšáž‰áŸ’áž‰ážœážáŸ’ážáž»",
    paymentTransactions: "áž áž·ážšáž‰áŸ’áž‰ážœážáŸ’ážáž»",
    closing: "áž áž·ážšáž‰áŸ’áž‰ážœážáŸ’ážáž»",
  };

  return {
    filenameBase,
    title: "ážšáž”áž¶áž™áž€áž¶ážšážŽáŸ",
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
    `ážšáž™áŸˆáž–áŸáž›,${csvCell(report.period)}`,
    `áž–áŸáž›áž”áž„áŸ’áž€áž¾áž,${csvCell(report.generatedAt)}`,
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
        <p>ážšáž™áŸˆáž–áŸáž›: ${escapeHtml(report.period)}</p>
        <p>áž–áŸáž›áž”áž„áŸ’áž€áž¾áž: ${escapeHtml(report.generatedAt)}</p>
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
            <p>ážšáž™áŸˆáž–áŸáž›: ${escapeHtml(report.period)}</p>
            <p>áž–áŸáž›áž”áž„áŸ’áž€áž¾áž: ${escapeHtml(report.generatedAt)}</p>
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

