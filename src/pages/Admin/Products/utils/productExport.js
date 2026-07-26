const money = (value) => Number(value || 0).toLocaleString("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const number = (value) => Number(value || 0).toLocaleString("en-US");

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

const statusLabel = (status) => {
  const normalized = String(status ?? "").toLowerCase();
  return normalized === "active" || normalized === "1" ? "ដំណើរការ" : "មិនដំណើរការ";
};

const yesNoLabel = (value) => (value ? "បាទ/ចាស" : "ទេ");

const filterValueLabel = (value, labels = {}) => {
  const key = String(value || "All");
  return labels[key] || labels[key.toLowerCase()] || key || "ទាំងអស់";
};

const statusFilterLabel = (value) => filterValueLabel(value, {
  All: "ទាំងអស់",
  Active: "ដំណើរការ",
  Inactive: "មិនដំណើរការ",
});

const priceFilterLabel = (value) => filterValueLabel(value, {
  All: "ទាំងអស់",
  priced: "មានតម្លៃ",
  unpriced: "អត់តម្លៃ",
});

const appliesToLabel = (value) => filterValueLabel(value, {
  retail: "លក់រាយ",
  wholesale: "លក់ដុំ",
  all: "ទាំងអស់",
});

const currencyLabel = (value) => filterValueLabel(value, {
  USD: "USD",
  KHR: "KHR",
  usd: "USD",
  khr: "KHR",
});

const priceRange = (product) => {
  const min = product.min_price_usd ?? product.minPriceUsd ?? product.minPrice ?? null;
  const max = product.max_price_usd ?? product.maxPriceUsd ?? product.maxPrice ?? null;
  const minNumber = min !== null ? Number(min) : null;
  const maxNumber = max !== null ? Number(max) : null;

  if (minNumber === null || maxNumber === null || Number.isNaN(minNumber) || Number.isNaN(maxNumber)) {
    return "អត់តម្លៃ";
  }

  if (minNumber === maxNumber) return `$${money(minNumber)}`;
  return `$${money(minNumber)} - $${money(maxNumber)}`;
};

const tableHtml = (section) => `
  <section class="report-section">
    <h2>${escapeHtml(section.title)}</h2>
    ${section.note ? `<p class="section-note">${escapeHtml(section.note)}</p>` : ""}
    <table>
      <thead><tr>${section.headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>
      <tbody>
        ${section.rows.length
          ? section.rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")
          : `<tr><td colspan="${section.headers.length}" class="empty">គ្មានទិន្នន័យ</td></tr>`}
      </tbody>
    </table>
  </section>
`;

const csvSection = (section) => [
  section.title,
  ...(section.note ? [section.note] : []),
  section.headers.map(csvCell).join(","),
  ...(section.rows.length ? section.rows.map((row) => row.map(csvCell).join(",")) : ["គ្មានទិន្នន័យ"]),
  "",
].join("\r\n");

export const buildProductExport = ({
  products = [],
  productStats = {},
  pagination = {},
  filters = {},
}) => {
  const generatedAt = new Date().toLocaleString("en-US");
  const filterSummary = [
    `ស្វែងរក: ${filters.search || "ទាំងអស់"}`,
    `ប្រភេទ: ${filters.category || "ទាំងអស់"}`,
    `ស្ថានភាព: ${statusFilterLabel(filters.status)}`,
    `តម្លៃ: ${priceFilterLabel(filters.price)}`,
    `ទំព័រ: ${pagination.currentPage || filters.page || "ទាំងអស់"}`,
    `ក្នុងមួយទំព័រ: ${pagination.perPage || filters.perPage || products.length}`,
  ].join(" | ");

  const statRows = [
    ["ផលិតផលសរុប", number(productStats.total)],
    ["ផលិតផលដំណើរការ", number(productStats.active)],
    ["ផលិតផលមិនដំណើរការ", number(productStats.inactive)],
    ["មុខទំនិញ/Variants", number(productStats.variants)],
    ["កំណត់តម្លៃលក់", number(productStats.priceRules)],
    ["ផលិតផលគ្មាន Variant", number(productStats.noVariant)],
    ["សរុបតាមតម្រង", number(pagination.total ?? products.length)],
    ["ចំនួនបាន Export", number(products.length)],
  ];

  const productRows = products.map((product, index) => [
    index + 1,
    product.id,
    product.name,
    product.categoryName || product.category_name || product.category?.name || "-",
    number(product.variantsCount ?? product.variants_count ?? product.variants?.length),
    product.unitsText || product.units_text || "-",
    number(product.priceRulesCount ?? product.price_rules_count),
    priceRange(product),
    statusLabel(product.status),
    plain(product.description || ""),
  ]);

  const variantRows = products.flatMap((product) => {
    const variants = Array.isArray(product.variants) ? product.variants : [];
    return variants.map((variant) => [
      product.name,
      variant.variantName || variant.variant_name || "-",
      variant.variantCode || variant.variant_code || "-",
      variant.packageType || variant.package_type || "-",
      variant.color || "-",
      [variant.sizeValue || variant.size_value, variant.sizeUnit || variant.size_unit].filter(Boolean).join(" ") || "-",
      number(variant.lowStockThreshold ?? variant.low_stock_threshold),
      statusLabel(variant.status),
    ]);
  });

  const unitRows = products.flatMap((product) => {
    const variants = Array.isArray(product.variants) ? product.variants : [];
    return variants.flatMap((variant) => {
      const units = Array.isArray(variant.units) ? variant.units : [];
      return units.map((unit) => [
        product.name,
        variant.variantName || variant.variant_name || "-",
        unit.unitName || unit.unit_name || "-",
        unit.unitCode || unit.unit_code || "-",
        number(unit.conversionQty ?? unit.conversion_qty ?? 1),
        yesNoLabel(unit.isBaseUnit || unit.is_base_unit),
        yesNoLabel(unit.isDefaultSaleUnit || unit.is_default_sale_unit),
        yesNoLabel(unit.isDefaultPurchaseUnit || unit.is_default_purchase_unit),
      ]);
    });
  });

  const priceRows = products.flatMap((product) => {
    const variants = Array.isArray(product.variants) ? product.variants : [];
    return variants.flatMap((variant) => {
      const rules = Array.isArray(variant.priceRules) ? variant.priceRules : [];
      return rules.map((rule) => [
        product.name,
        variant.variantName || variant.variant_name || "-",
        rule.unitName || rule.unit_name || "-",
        appliesToLabel(rule.appliesTo || rule.applies_to || "-"),
        number(rule.minQty ?? rule.min_qty ?? 1),
        `$${money(rule.usd ?? rule.unit_price_usd)}`,
        number(rule.khr ?? rule.unit_price_khr),
        currencyLabel(rule.inputCurrency || rule.input_currency || "-"),
        money(rule.inputPrice ?? rule.input_price),
        statusLabel(rule.status),
      ]);
    });
  });

  const sections = [
    { title: "សង្ខេប", headers: ["ប្រភេទទិន្នន័យ", "តម្លៃ"], rows: statRows },
    {
      title: "បញ្ជីផលិតផល",
      note: filterSummary,
      headers: ["ល.រ", "ID", "ផលិតផល", "ប្រភេទ", "មុខទំនិញ", "ខ្នាតទំនិញ", "ចំនួនកំណត់តម្លៃ", "ជួរតម្លៃ", "ស្ថានភាព", "ពិពណ៌នា"],
      rows: productRows,
    },
    { title: "Variants", headers: ["ផលិតផល", "Variant", "លេខកូដ", "ប្រភេទកញ្ចប់", "ពណ៌", "ទំហំ", "កម្រិតស្តុកទាប", "ស្ថានភាព"], rows: variantRows },
    { title: "ខ្នាតទំនិញ Variant", headers: ["ផលិតផល", "Variant", "ខ្នាតទំនិញ", "លេខកូដ", "បម្លែង", "ខ្នាតគោល", "លក់លំនាំដើម", "ទិញលំនាំដើម"], rows: unitRows },
    { title: "កំណត់តម្លៃលក់", headers: ["ផលិតផល", "Variant", "ខ្នាតទំនិញ", "អនុវត្តលើ", "ចំនួនអប្បបរមា", "USD", "KHR", "រូបិយប័ណ្ណបញ្ចូល", "តម្លៃបញ្ចូល", "ស្ថានភាព"], rows: priceRows },
  ].filter((section) => section.title === "សង្ខេប" || section.title === "បញ្ជីផលិតផល" || section.rows.length > 0);

  return {
    title: "Export ផលិតផល",
    filenameBase: `products-${new Date().toISOString().slice(0, 10)}`,
    generatedAt,
    filterSummary,
    sections,
  };
};

export const exportProductCsv = (report) => {
  const csv = [
    report.title,
    `បង្កើតនៅ,${csvCell(report.generatedAt)}`,
    `តម្រង,${csvCell(report.filterSummary)}`,
    "",
    ...report.sections.map(csvSection),
  ].join("\r\n");

  downloadBlob(`\uFEFF${csv}`, `${report.filenameBase}.csv`, "text/csv;charset=utf-8");
};

export const exportProductExcel = (report) => {
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
        <p>បង្កើតនៅ: ${escapeHtml(report.generatedAt)}</p>
        <p>តម្រង: ${escapeHtml(report.filterSummary)}</p>
        ${report.sections.map(tableHtml).join("")}
      </body>
    </html>
  `;

  downloadBlob(html, `${report.filenameBase}.xls`, "application/vnd.ms-excel;charset=utf-8");
};

export const exportProductPdf = (report, targetWindow = null) => {
  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(report.title)}</title>
        <style>
          body { font-family: Arial, "Noto Sans Khmer", sans-serif; color: #18181b; margin: 24px; font-size: 10.5px; }
          h1 { margin: 0 0 4px; font-size: 22px; }
          h2 { margin: 20px 0 8px; color: #b91c1c; font-size: 15px; page-break-after: avoid; }
          p { margin: 0 0 6px; color: #52525b; font-size: 12px; }
          table { border-collapse: collapse; width: 100%; margin-bottom: 16px; page-break-inside: avoid; }
          th, td { border: 1px solid #d4d4d8; padding: 6px 7px; text-align: left; vertical-align: top; }
          th { background: #dc2626; color: white; }
          tr:nth-child(even) td { background: #fafafa; }
          .empty { color: #71717a; text-align: center; }
          @page { size: A4 landscape; margin: 10mm; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(report.title)}</h1>
        <p>បង្កើតនៅ: ${escapeHtml(report.generatedAt)}</p>
        <p>តម្រង: ${escapeHtml(report.filterSummary)}</p>
        ${report.sections.map(tableHtml).join("")}
        <script>window.onload = function () { window.focus(); window.print(); };</script>
      </body>
    </html>
  `;

  const printWindow = targetWindow || window.open("", "_blank");
  if (!printWindow) return false;
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  return true;
};
