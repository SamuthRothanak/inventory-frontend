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

const reportTitle = (report) => {
  if (String(report.filenameBase || "").startsWith("report-all")) return "របាយការណ៍ទាំង 5 ផ្ទាំង";
  return plain(report.title).includes("áž") ? "របាយការណ៍" : report.title;
};

const tableHtml = (section) => `
  <section class="report-section">
    <h3>${escapeHtml(section.title)}</h3>
    ${section.note ? `<p class="section-note">${escapeHtml(section.note)}</p>` : ""}
    <table>
      <thead>
        <tr>${section.headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr>
      </thead>
      <tbody>
        ${section.rows.length
          ? section.rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")
          : `<tr><td colspan="${section.headers.length}" class="empty">គ្មានទិន្នន័យ</td></tr>`}
      </tbody>
    </table>
  </section>
`;

const groupedSectionsHtml = (sections, useGroups) => {
  if (!useGroups) return sections.map(tableHtml).join("");

  const groupOrder = ["សរុប", "ការលក់", "ការទិញ", "ស្តុក", "ហិរញ្ញវត្ថុ"];
  const fallbackGroup = "ផ្សេងៗ";
  const groups = sections.reduce((acc, section) => {
    const group = section.group || fallbackGroup;
    acc[group] = acc[group] || [];
    acc[group].push(section);
    return acc;
  }, {});

  const orderedGroups = [...groupOrder, fallbackGroup];
  const remainingGroups = Object.keys(groups).filter((group) => !orderedGroups.includes(group));

  return [...orderedGroups, ...remainingGroups]
    .filter((group) => groups[group]?.length)
    .map((group) => `
      <div class="group-title"><span>${escapeHtml(group)}</span></div>
      ${groups[group].map(tableHtml).join("")}
    `)
    .join("");
};

export const exportReportPdf = (report) => {
  const title = reportTitle(report);
  const isAllTabs = String(report.filenameBase || "").startsWith("report-all");
  const shopName = report.shopInfo?.name || "Hak Ley Mart";
  const shopKhmerName = report.shopInfo?.khmerName || "";
  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          * { box-sizing: border-box; }
          html { background: #f4f4f5; }
          body {
            font-family: Arial, "Noto Sans Khmer", sans-serif;
            color: #111827;
            margin: 0;
            padding: 12mm;
            font-size: 10px;
            line-height: 1.45;
            background: #ffffff;
          }
          .cover {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 20px;
            padding: 16px 18px;
            margin-bottom: 14px;
            border: 1px solid #fecaca;
            border-left: 6px solid #ef4444;
            border-radius: 14px;
            background: linear-gradient(135deg, #fff1f2 0%, #ffffff 62%);
          }
          .brand { font-size: 11px; font-weight: 800; color: #ef4444; text-transform: uppercase; letter-spacing: .04em; }
          .shop-sub { margin-top: 3px; color: #6b7280; font-size: 10px; font-weight: 700; }
          h1 { margin: 4px 0 0; font-size: 22px; line-height: 1.2; font-weight: 900; color: #111827; }
          .meta {
            min-width: 210px;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            background: #ffffff;
            padding: 10px 12px;
            color: #4b5563;
          }
          .meta p { display: flex; justify-content: space-between; gap: 14px; margin: 0 0 4px; }
          .meta strong { color: #111827; }
          .group-title {
            margin: 14px 0 8px;
            page-break-after: avoid;
            break-after: avoid;
          }
          .group-title span {
            display: inline-flex;
            align-items: center;
            border-radius: 999px;
            background: #ef4444;
            color: #ffffff;
            padding: 6px 12px;
            font-size: 12px;
            font-weight: 900;
          }
          .report-section {
            margin: 0 0 12px;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            overflow: hidden;
            background: #ffffff;
            page-break-inside: auto;
            break-inside: auto;
          }
          h3 {
            margin: 0;
            padding: 8px 10px;
            background: #f9fafb;
            color: #b91c1c;
            font-size: 12px;
            font-weight: 900;
            border-bottom: 1px solid #e5e7eb;
          }
          .section-note { padding: 7px 10px 0; margin: 0; color: #6b7280; font-size: 9px; }
          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }
          thead { display: table-header-group; }
          tr { page-break-inside: avoid; break-inside: avoid; }
          th, td {
            border-top: 1px solid #e5e7eb;
            padding: 5px 6px;
            text-align: left;
            vertical-align: top;
            word-break: break-word;
          }
          th {
            background: #dc2626;
            color: #ffffff;
            font-weight: 900;
            font-size: 8.8px;
          }
          td { font-size: 8.6px; }
          tr:nth-child(even) td { background: #fafafa; }
          .empty { color: #71717a; text-align: center; }
          .footer {
            margin-top: 12px;
            padding-top: 8px;
            border-top: 1px solid #e5e7eb;
            color: #71717a;
            font-size: 9px;
            text-align: right;
          }
          @page { size: A4 landscape; margin: 8mm; }
          @media print {
            html, body { background: #ffffff; }
            body { padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="cover">
          <div>
            <div class="brand">${escapeHtml(shopName)}</div>
            ${shopKhmerName ? `<div class="shop-sub">${escapeHtml(shopKhmerName)}</div>` : ""}
            <h1>${escapeHtml(title)}</h1>
          </div>
          <div class="meta">
            <p><span>រយៈពេល</span><strong>${escapeHtml(report.period)}</strong></p>
            <p><span>បង្កើត</span><strong>${escapeHtml(report.generatedAt)}</strong></p>
            <p><span>ចំនួនផ្នែក</span><strong>${report.sections.length}</strong></p>
          </div>
        </div>
        ${groupedSectionsHtml(report.sections, isAllTabs)}
        <div class="footer">Generated from Reports module</div>
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
