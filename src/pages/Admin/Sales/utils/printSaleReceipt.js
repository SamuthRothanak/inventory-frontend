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

const fmtKhr = (n, rate) =>
  rate > 0 ? Math.round(Number(n || 0) * rate).toLocaleString("en-US") + " ៛" : null;

export function printSaleReceipt(sale, storeName = "Hak Ley Mart") {
  const rate = Number(sale.exchangeRateKhrPerUsd || 0);
  const now = new Date().toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const itemsRows = sale.items
    .map((item) => {
      const hasDiscount = Number(item.discountAmount || 0) > 0;
      return `
        <tr>
          <td class="td-name">
            <span class="item-name">${item.variantNameSnapshot || item.productNameSnapshot || "—"}</span>
            ${item.productNameSnapshot && item.variantNameSnapshot && item.variantNameSnapshot !== item.productNameSnapshot
              ? `<span class="item-sub">${item.productNameSnapshot}</span>` : ""}
          </td>
          <td class="td-center">${item.unitNameSnapshot || "—"}</td>
          <td class="td-center">${Number(item.qty || 0).toLocaleString()}</td>
          <td class="td-right">${fmtUsd(item.unitPrice)}</td>
          <td class="td-right ${hasDiscount ? "text-red" : "text-muted"}">${hasDiscount ? "-" + fmtUsd(item.discountAmount) : "—"}</td>
          <td class="td-right td-bold">${fmtUsd(item.lineTotal)}</td>
        </tr>`;
    })
    .join("");

  const paymentsBlock = sale.payments
    .map((p) => {
      const label = p.providerName || METHOD_LABEL[p.paymentMethod] || p.paymentMethod;
      const isCash = p.paymentMethod === "cash";
      const received =
        p.currencyCode === "KHR"
          ? Math.round(Number(p.amountReceived || 0)).toLocaleString("en-US") + " ៛"
          : fmtUsd(p.amountReceived);
      const change =
        Number(p.changeAmount || 0) > 0
          ? p.changeCurrency === "KHR"
            ? Math.round(Number(p.changeAmount)).toLocaleString("en-US") + " ៛"
            : fmtUsd(p.changeAmount)
          : null;
      return `
        <div class="pay-row">
          <span class="pay-label">${label}</span>
          <span class="pay-val">${received}</span>
        </div>
        ${isCash && change ? `<div class="pay-row pay-change"><span class="pay-label">អាប់ (${p.changeCurrency || "USD"})</span><span class="pay-val">${change}</span></div>` : ""}`;
    })
    .join("");

  const grandTotalKhr = fmtKhr(sale.grandTotal, rate);

  const html = `<!DOCTYPE html>
<html lang="km">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Invoice · ${sale.saleNo}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Khmer:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
      font-size: 13px;
      color: #18181b;
      background: #f4f4f5;
      padding: 32px 16px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page {
      max-width: 780px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
      overflow: hidden;
    }

    /* ── Header ── */
    .header {
      background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
      color: white;
      padding: 28px 32px 24px;
    }
    .header-inner { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
    .store-logo {
      width: 52px; height: 52px;
      background: rgba(255,255,255,0.2);
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-size: 24px; font-weight: 700; color: white;
      flex-shrink: 0;
    }
    .store-info { flex: 1; }
    .store-name { font-size: 22px; font-weight: 700; letter-spacing: 0.3px; }
    .store-sub { font-size: 13px; opacity: 0.85; margin-top: 2px; font-family: 'Noto Sans Khmer', sans-serif; }
    .store-contact { font-size: 11px; opacity: 0.75; margin-top: 6px; }

    .invoice-badge {
      background: rgba(255,255,255,0.15);
      border: 1px solid rgba(255,255,255,0.3);
      border-radius: 8px;
      padding: 8px 14px;
      text-align: right;
      flex-shrink: 0;
    }
    .invoice-badge .inv-label { font-size: 10px; opacity: 0.8; letter-spacing: 1px; text-transform: uppercase; }
    .invoice-badge .inv-no { font-size: 15px; font-weight: 700; margin-top: 2px; letter-spacing: 0.5px; }
    .invoice-badge .inv-date { font-size: 11px; opacity: 0.85; margin-top: 2px; }

    /* ── Meta grid ── */
    .meta-section { display: grid; grid-template-columns: 1fr 1fr; gap: 0; border-bottom: 1px solid #f3f4f6; }
    .meta-block { padding: 18px 24px; border-right: 1px solid #f3f4f6; }
    .meta-block:last-child { border-right: none; }
    .meta-block-title {
      font-size: 10px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.8px; color: #9ca3af; margin-bottom: 10px;
    }
    .meta-row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 5px; }
    .meta-label { font-size: 12px; color: #6b7280; }
    .meta-value { font-size: 12px; font-weight: 600; color: #18181b; text-align: right; max-width: 55%; }

    .status-pill {
      display: inline-flex; align-items: center;
      padding: 2px 8px; border-radius: 20px;
      font-size: 11px; font-weight: 600;
    }
    .status-paid { background: #dcfce7; color: #15803d; }
    .status-partial { background: #fef9c3; color: #a16207; }
    .status-unpaid { background: #fee2e2; color: #dc2626; }
    .status-refunded { background: #f3e8ff; color: #7c3aed; }

    /* ── Items table ── */
    .items-section { padding: 20px 24px; border-bottom: 1px solid #f3f4f6; }
    .section-heading { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #6b7280; margin-bottom: 12px; }

    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #18181b; color: white; }
    th {
      padding: 9px 10px; font-size: 11px; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.5px;
    }
    th:first-child { border-radius: 6px 0 0 6px; padding-left: 14px; }
    th:last-child { border-radius: 0 6px 6px 0; }
    .td-center { text-align: center; }
    .td-right { text-align: right; }
    .td-bold { font-weight: 700; }
    .td-name { padding-left: 14px; }
    .text-red { color: #dc2626; font-weight: 600; }
    .text-muted { color: #9ca3af; }

    tbody tr { border-bottom: 1px solid #f9fafb; }
    tbody tr:nth-child(even) { background: #fafafa; }
    td { padding: 10px 10px; font-size: 12px; vertical-align: middle; }
    .item-name { display: block; font-weight: 600; color: #18181b; font-family: 'Noto Sans Khmer', sans-serif; }
    .item-sub { display: block; font-size: 11px; color: #9ca3af; margin-top: 1px; }

    /* ── Totals + Payment ── */
    .bottom-section { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
    .payment-block, .totals-block { padding: 20px 24px; }
    .payment-block { border-right: 1px solid #f3f4f6; }

    .pay-row { display: flex; justify-content: space-between; align-items: center; padding: 5px 0; font-size: 12px; border-bottom: 1px solid #f9fafb; }
    .pay-label { color: #6b7280; }
    .pay-val { font-weight: 600; color: #18181b; }
    .pay-change { color: #dc2626; }
    .pay-change .pay-label, .pay-change .pay-val { color: #dc2626; font-weight: 700; }

    .total-row { display: flex; justify-content: space-between; align-items: center; padding: 5px 0; font-size: 12px; border-bottom: 1px solid #f9fafb; }
    .total-label { color: #6b7280; }
    .total-value { font-weight: 600; }
    .total-discount .total-value { color: #dc2626; }
    .total-grand {
      display: flex; justify-content: space-between; align-items: baseline;
      margin-top: 10px; padding-top: 10px;
      border-top: 2px solid #dc2626;
    }
    .grand-label { font-size: 14px; font-weight: 700; color: #18181b; }
    .grand-value { font-size: 18px; font-weight: 700; color: #dc2626; }
    .grand-khr { font-size: 11px; color: #9ca3af; text-align: right; margin-top: 2px; }

    /* ── Note ── */
    .note-section { padding: 12px 24px; background: #fffbeb; border-top: 1px solid #fde68a; font-size: 12px; color: #92400e; }

    /* ── Footer ── */
    .footer { text-align: center; padding: 20px 24px; border-top: 1px dashed #e5e7eb; }
    .footer-thank { font-size: 17px; font-weight: 700; color: #dc2626; margin-bottom: 4px; font-family: 'Noto Sans Khmer', sans-serif; }
    .footer-sub { font-size: 12px; color: #6b7280; }
    .footer-printed { font-size: 10px; color: #d1d5db; margin-top: 8px; }

    /* ── Print button (hidden on print) ── */
    .print-btn-wrap { text-align: center; padding: 20px; }
    .print-btn {
      padding: 11px 32px; background: #dc2626; color: white;
      border: none; border-radius: 10px; font-size: 14px; font-weight: 600;
      cursor: pointer; font-family: inherit; letter-spacing: 0.3px;
      transition: background 0.15s;
    }
    .print-btn:hover { background: #b91c1c; }
    .close-btn {
      margin-left: 12px; padding: 11px 24px;
      background: #f4f4f5; color: #3f3f46;
      border: 1px solid #e4e4e7; border-radius: 10px;
      font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit;
    }
    .close-btn:hover { background: #e4e4e7; }

    @media print {
      body { background: white; padding: 0; }
      .page { box-shadow: none; border-radius: 0; }
      .print-btn-wrap { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <div class="header-inner">
        <div style="display:flex;align-items:center;gap:14px">
          <div class="store-logo">H</div>
          <div class="store-info">
            <div class="store-name">${storeName}</div>
            <div class="store-sub">ហាក់ ឡេ ម៉ាត</div>
          </div>
        </div>
        <div class="invoice-badge">
          <div class="inv-label">Invoice</div>
          <div class="inv-no">${sale.saleNo}</div>
          <div class="inv-date">${sale.displayDate}</div>
        </div>
      </div>
    </div>

    <!-- Meta -->
    <div class="meta-section">
      <div class="meta-block">
        <div class="meta-block-title">ព័ត៌មានវិក្កយបត្រ</div>
        <div class="meta-row">
          <span class="meta-label">ប្រភេទ</span>
          <span class="meta-value">${SALE_TYPE_LABEL[sale.saleType] || sale.saleType}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">អ្នកលក់</span>
          <span class="meta-value">${sale.cashierName || "—"}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">ស្ថានភាព</span>
          <span class="meta-value">
            <span class="status-pill status-${sale.paymentStatus}">
              ${PAYMENT_STATUS_LABEL[sale.paymentStatus] || sale.paymentStatus}
            </span>
          </span>
        </div>
      </div>
      <div class="meta-block">
        <div class="meta-block-title">ព័ត៌មានអតិថិជន</div>
        <div class="meta-row">
          <span class="meta-label">អតិថិជន</span>
          <span class="meta-value">${sale.customerName}</span>
        </div>
        ${sale.deliveryRequired ? `
        <div class="meta-row">
          <span class="meta-label">ការដឹក</span>
          <span class="meta-value">${sale.deliveryOption?.replaceAll("_", " ") || "—"}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">អាសយដ្ឋាន</span>
          <span class="meta-value">${sale.deliveryAddress || "—"}</span>
        </div>` : `
        <div class="meta-row">
          <span class="meta-label">ការទូទាត់</span>
          <span class="meta-value">${sale.payments.map(p => p.providerName || METHOD_LABEL[p.paymentMethod] || p.paymentMethod).join(", ") || "—"}</span>
        </div>`}
      </div>
    </div>

    <!-- Items -->
    <div class="items-section">
      <div class="section-heading">ទំនិញ · ${sale.items.length} មុខ</div>
      <table>
        <thead>
          <tr>
            <th style="text-align:left">ផលិតផល</th>
            <th class="td-center">ខ្នាត</th>
            <th class="td-center">ចំនួន</th>
            <th class="td-right">តម្លៃ/ខ្នាត</th>
            <th class="td-right">បញ្ចុះ</th>
            <th class="td-right">សរុប</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>
    </div>

    <!-- Bottom: Payment + Totals -->
    <div class="bottom-section">
      <div class="payment-block">
        <div class="section-heading">ការទូទាត់</div>
        ${sale.payments.length > 0 ? paymentsBlock : '<p style="color:#9ca3af;font-size:12px">មិនទាន់មានការទូទាត់</p>'}
      </div>

      <div class="totals-block">
        <div class="section-heading">សរុប</div>
        <div class="total-row">
          <span class="total-label">សរុបរង</span>
          <span class="total-value">${fmtUsd(sale.subtotal)}</span>
        </div>
        ${Number(sale.discountTotal || 0) > 0 ? `
        <div class="total-row total-discount">
          <span class="total-label">បញ្ចុះតម្លៃ</span>
          <span class="total-value">-${fmtUsd(sale.discountTotal)}</span>
        </div>` : ""}
        ${sale.deliveryRequired ? `
        <div class="total-row">
          <span class="total-label">ការដឹក</span>
          <span class="total-value">${fmtUsd(sale.deliveryFee)}</span>
        </div>` : ""}
        ${Number(sale.returnsTotalUsd || 0) > 0 ? `
        <div class="total-row" style="color:#7c3aed">
          <span>ត្រឡប់ (${sale.returnsCount}x)</span>
          <span>-${fmtUsd(sale.returnsTotalUsd)}</span>
        </div>` : ""}
        <div class="total-grand">
          <span class="grand-label">សរុបទូទៅ</span>
          <div>
            <div class="grand-value">${fmtUsd(sale.grandTotal)}</div>
            ${grandTotalKhr ? `<div class="grand-khr">≈ ${grandTotalKhr}</div>` : ""}
          </div>
        </div>
      </div>
    </div>

    ${sale.note ? `<div class="note-section">📝 ${sale.note}</div>` : ""}

    <!-- Footer -->
    <div class="footer">
      <div class="footer-thank">🙏 អរគុណ!</div>
      <div class="footer-sub">សូមមកទិញទៀតណា · Thank you for your purchase</div>
      <div class="footer-printed">បោះពុម្ព: ${now}</div>
    </div>
  </div>

  <!-- Print button (hidden on print) -->
  <div class="print-btn-wrap">
    <button class="print-btn" onclick="window.print()">🖨 បោះពុម្ព / Print</button>
    <button class="close-btn" onclick="window.close()">បិទ</button>
  </div>

  <script>
    window.onload = function() { window.print(); };
  </script>
</body>
</html>`;

  const w = window.open("", "_blank", "width=900,height=750,scrollbars=yes");
  if (w) {
    w.document.write(html);
    w.document.close();
  }
}
