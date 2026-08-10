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

const escapeXml = (value) => plain(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&apos;");

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

const cleanTitle = (value, fallback = "Report") => {
  const text = plain(value);
  return text && !text.includes("áž") ? text : fallback;
};

const sheetName = (value, fallback, usedNames) => {
  const base = cleanTitle(value, fallback)
    .replace(/[\\/?*[\]:]/g, " ")
    .slice(0, 28)
    .trim() || fallback;

  let name = base;
  let index = 2;
  while (usedNames.has(name)) {
    name = `${base.slice(0, 25)} ${index}`;
    index += 1;
  }
  usedNames.add(name);
  return name;
};

const isNumberLike = (value) => {
  const text = plain(value).replaceAll(",", "");
  return /^-?\$?\d+(\.\d+)?$/.test(text) || /^-?\d+(\.\d+)? KHR$/.test(text);
};

const cellValue = (value, styleId = "sCell") => {
  const text = plain(value);
  const numeric = isNumberLike(text);
  const numberValue = numeric
    ? Number(text.replaceAll(",", "").replace("$", "").replace(" KHR", ""))
    : null;

  return `
    <Cell ss:StyleID="${styleId}">
      <Data ss:Type="${numeric ? "Number" : "String"}">${escapeXml(numeric ? numberValue : text)}</Data>
    </Cell>`;
};

const emptyRow = (columns) => `
  <Row>
    <Cell ss:MergeAcross="${Math.max(columns - 1, 0)}" ss:StyleID="sEmpty">
      <Data ss:Type="String">គ្មានទិន្នន័យ</Data>
    </Cell>
  </Row>`;

const sectionRows = (section, sheetColumns) => {
  const columns = Math.max(
    section.headers.length,
    ...section.rows.map((row) => row.length),
    1,
  );
  const titleColumns = Math.max(sheetColumns, columns);
  return `
    <Row ss:Height="24">
      <Cell ss:MergeAcross="${titleColumns - 1}" ss:StyleID="sSection">
        <Data ss:Type="String">${escapeXml(cleanTitle(section.title, "Section"))}</Data>
      </Cell>
    </Row>
    ${section.note ? `
      <Row ss:Height="20">
        <Cell ss:MergeAcross="${titleColumns - 1}" ss:StyleID="sNote">
          <Data ss:Type="String">${escapeXml(section.note)}</Data>
        </Cell>
      </Row>` : ""}
    <Row ss:Height="22">
      ${section.headers.map((header) => cellValue(header, "sHeader")).join("")}
    </Row>
    ${section.rows.length ? section.rows.map((row) => `
      <Row ss:AutoFitHeight="1">
        ${row.map((cell) => cellValue(cell)).join("")}
      </Row>`).join("") : emptyRow(columns)}
    <Row ss:Height="8" />
  `;
};

const worksheetXml = (name, sections) => {
  const maxColumns = Math.max(
    ...sections.flatMap((section) => [
      section.headers.length,
      ...section.rows.map((row) => row.length),
    ]),
    1,
  );
  const columns = Array.from({ length: maxColumns }, (_, index) => {
    const width = index === 0 ? 150 : index === 1 ? 130 : 110;
    return `<Column ss:Width="${width}" />`;
  }).join("");

  return `
    <Worksheet ss:Name="${escapeXml(name)}">
      <Table>
        ${columns}
        ${sections.map((section) => sectionRows(section, maxColumns)).join("")}
      </Table>
    </Worksheet>`;
};

const sectionsToSheets = (report) => {
  const usedNames = new Set();
  const isAllTabs = String(report.filenameBase || "").startsWith("report-all");

  if (isAllTabs) {
    const order = ["សរុប", "ការលក់", "ការទិញ", "ស្តុក", "ហិរញ្ញវត្ថុ"];
    const grouped = report.sections.reduce((acc, section) => {
      const group = section.group || "ផ្សេងៗ";
      acc[group] = acc[group] || [];
      acc[group].push(section);
      return acc;
    }, {});

    const sheets = order
      .filter((group) => grouped[group]?.length)
      .map((group) => ({ name: sheetName(group, "Report", usedNames), sections: grouped[group] }));
    const extraGroups = Object.keys(grouped).filter((group) => !order.includes(group));

    return [
      ...sheets,
      ...extraGroups.map((group) => ({ name: sheetName(group, "Report", usedNames), sections: grouped[group] })),
    ];
  }

  return [{
    name: sheetName(report.title, "Report", usedNames),
    sections: report.sections,
  }];
};

export const exportReportExcel = (report) => {
  const title = String(report.filenameBase || "").startsWith("report-all")
    ? "របាយការណ៍ទាំង 5 ផ្ទាំង"
    : cleanTitle(report.title, "របាយការណ៍");
  const shopName = report.shopInfo?.name || "Hak Ley Mart";
  const sheets = sectionsToSheets(report);
  const workbook = `<?xml version="1.0" encoding="UTF-8"?>
    <?mso-application progid="Excel.Sheet"?>
    <Workbook
      xmlns="urn:schemas-microsoft-com:office:spreadsheet"
      xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
      <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
        <Title>${escapeXml(title)}</Title>
        <Author>${escapeXml(shopName)}</Author>
        <Created>${new Date().toISOString()}</Created>
      </DocumentProperties>
      <Styles>
        <Style ss:ID="Default" ss:Name="Normal">
          <Alignment ss:Vertical="Top" ss:WrapText="1"/>
          <Font ss:FontName="Arial" ss:Size="10" ss:Color="#111827"/>
        </Style>
        <Style ss:ID="sSection">
          <Alignment ss:Vertical="Center" ss:WrapText="1"/>
          <Font ss:FontName="Arial" ss:Size="14" ss:Bold="1" ss:Color="#B91C1C"/>
          <Interior ss:Color="#FFF1F2" ss:Pattern="Solid"/>
          <Borders>
            <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FCA5A5"/>
          </Borders>
        </Style>
        <Style ss:ID="sNote">
          <Font ss:FontName="Arial" ss:Size="9" ss:Color="#6B7280"/>
          <Interior ss:Color="#FAFAFA" ss:Pattern="Solid"/>
        </Style>
        <Style ss:ID="sHeader">
          <Alignment ss:Vertical="Center" ss:WrapText="1"/>
          <Font ss:FontName="Arial" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/>
          <Interior ss:Color="#DC2626" ss:Pattern="Solid"/>
          <Borders>
            <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#991B1B"/>
          </Borders>
        </Style>
        <Style ss:ID="sCell">
          <Alignment ss:Vertical="Top" ss:WrapText="1"/>
          <Borders>
            <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/>
          </Borders>
        </Style>
        <Style ss:ID="sEmpty">
          <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
          <Font ss:FontName="Arial" ss:Size="10" ss:Color="#71717A"/>
          <Interior ss:Color="#F9FAFB" ss:Pattern="Solid"/>
        </Style>
      </Styles>
      ${sheets.map((sheet) => worksheetXml(sheet.name, sheet.sections)).join("")}
    </Workbook>`;

  downloadBlob(workbook, `${report.filenameBase}.xls`, "application/vnd.ms-excel;charset=utf-8");
};
