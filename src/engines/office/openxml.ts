import JSZip from "jszip";

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case "\"":
        return "&quot;";
      default:
        return c;
    }
  });
}

function unescapeXml(safe: string): string {
  return safe
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function columnName(index: number): string {
  let name = "";
  let temp = index;
  while (temp >= 0) {
    name = String.fromCharCode((temp % 26) + 65) + name;
    temp = Math.floor(temp / 26) - 1;
  }
  return name;
}

// ----------------------------------------------------------------------------
// DOCX
// ----------------------------------------------------------------------------

export async function extractTextFromDocx(buffer: Uint8Array): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const docXmlFile = zip.file("word/document.xml");
  if (!docXmlFile) {
    return "";
  }
  const xml = await docXmlFile.async("string");
  const paragraphs: string[] = [];
  const pRegex = /<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g;
  let pMatch: RegExpExecArray | null;
  while ((pMatch = pRegex.exec(xml)) !== null) {
    const pContent = pMatch[1] ?? "";
    const tRegex = /<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g;
    let tMatch: RegExpExecArray | null;
    let line = "";
    while ((tMatch = tRegex.exec(pContent)) !== null) {
      line += tMatch[1] ?? "";
    }
    if (line.trim()) {
      paragraphs.push(unescapeXml(line.trim()));
    }
  }
  return paragraphs.join("\n\n");
}

export async function createDocx(paragraphs: readonly string[]): Promise<Uint8Array> {
  const zip = new JSZip();

  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
  );

  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
  );

  const safeParagraphs = paragraphs.length > 0 ? paragraphs : [""];
  const bodyXml = safeParagraphs
    .map((p) => `<w:p><w:r><w:t>${escapeXml(p)}</w:t></w:r></w:p>`)
    .join("\n    ");

  zip.file(
    "word/document.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${bodyXml}
  </w:body>
</w:document>`
  );

  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}

// ----------------------------------------------------------------------------
// PPTX
// ----------------------------------------------------------------------------

export async function extractTextFromPptx(buffer: Uint8Array): Promise<string[]> {
  const zip = await JSZip.loadAsync(buffer);
  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ""), 10);
      const numB = parseInt(b.replace(/\D/g, ""), 10);
      return numA - numB;
    });

  const slides: string[] = [];
  for (const slidePath of slideFiles) {
    const file = zip.file(slidePath);
    if (!file) continue;
    const xml = await file.async("string");
    const tRegex = /<a:t\b[^>]*>([\s\S]*?)<\/a:t>/g;
    let match: RegExpExecArray | null;
    const textPieces: string[] = [];
    while ((match = tRegex.exec(xml)) !== null) {
      if (match[1]?.trim()) {
        textPieces.push(unescapeXml(match[1].trim()));
      }
    }
    slides.push(textPieces.join("\n"));
  }
  return slides;
}

export async function createPptx(slides: readonly string[]): Promise<Uint8Array> {
  const zip = new JSZip();
  const safeSlides = slides.length > 0 ? slides : [""];

  const slideOverrides = safeSlides
    .map(
      (_, i) =>
        `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`
    )
    .join("\n  ");

  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  ${slideOverrides}
</Types>`
  );

  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`
  );

  const sldIdLst = safeSlides
    .map((_, i) => `<p:sldId id="${256 + i}" r:id="rId${i + 1}"/>`)
    .join("\n    ");

  zip.file(
    "ppt/presentation.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldIdLst>
    ${sldIdLst}
  </p:sldIdLst>
</p:presentation>`
  );

  const presRels = safeSlides
    .map(
      (_, i) =>
        `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i + 1}.xml"/>`
    )
    .join("\n  ");

  zip.file(
    "ppt/_rels/presentation.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${presRels}
</Relationships>`
  );

  safeSlides.forEach((slideText, i) => {
    zip.file(
      `ppt/slides/slide${i + 1}.xml`,
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr/>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="2" name="Slide Content"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
        <p:spPr/>
        <p:txBody>
          <a:bodyPr/>
          <a:p><a:r><a:t>${escapeXml(slideText)}</a:t></a:r></a:p>
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`
    );
  });

  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}

// ----------------------------------------------------------------------------
// XLSX
// ----------------------------------------------------------------------------

export async function extractDataFromXlsx(buffer: Uint8Array): Promise<string[][]> {
  const zip = await JSZip.loadAsync(buffer);

  // Parse shared strings if present
  const sharedStrings: string[] = [];
  const sstFile = zip.file("xl/sharedStrings.xml");
  if (sstFile) {
    const sstXml = await sstFile.async("string");
    const siRegex = /<si>([\s\S]*?)<\/si>/g;
    let siMatch: RegExpExecArray | null;
    while ((siMatch = siRegex.exec(sstXml)) !== null) {
      const siContent = siMatch[1] ?? "";
      const tRegex = /<t\b[^>]*>([\s\S]*?)<\/t>/g;
      let tMatch: RegExpExecArray | null;
      let text = "";
      while ((tMatch = tRegex.exec(siContent)) !== null) {
        text += tMatch[1] ?? "";
      }
      sharedStrings.push(unescapeXml(text));
    }
  }

  // Parse first sheet
  const sheetFile = zip.file("xl/worksheets/sheet1.xml") ?? zip.file(/xl\/worksheets\/sheet\d+\.xml/)[0];
  if (!sheetFile) return [];

  const sheetXml = await sheetFile.async("string");
  const rows: string[][] = [];
  const rowRegex = /<row\b[^>]*>([\s\S]*?)<\/row>/g;
  let rowMatch: RegExpExecArray | null;

  while ((rowMatch = rowRegex.exec(sheetXml)) !== null) {
    const rowContent = rowMatch[1] ?? "";
    const cells: string[] = [];
    const cellRegex = /<c\b([^>]*)>([\s\S]*?)<\/c>/g;
    let cellMatch: RegExpExecArray | null;

    while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
      const attrs = cellMatch[1] ?? "";
      const inner = cellMatch[2] ?? "";
      const isSharedString = /t="s"/.test(attrs);
      const isInlineStr = /t="inlineStr"/.test(attrs);

      if (isSharedString) {
        const vMatch = /<v>(\d+)<\/v>/.exec(inner);
        const idx = vMatch ? parseInt(vMatch[1]!, 10) : -1;
        cells.push(sharedStrings[idx] ?? "");
      } else if (isInlineStr) {
        const tMatch = /<t\b[^>]*>([\s\S]*?)<\/t>/.exec(inner);
        cells.push(unescapeXml(tMatch?.[1] ?? ""));
      } else {
        const vMatch = /<v>([\s\S]*?)<\/v>/.exec(inner);
        cells.push(unescapeXml(vMatch?.[1] ?? ""));
      }
    }
    if (cells.length > 0) {
      rows.push(cells);
    }
  }

  return rows;
}

export async function createXlsx(rows: readonly (readonly string[])[]): Promise<Uint8Array> {
  const zip = new JSZip();

  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`
  );

  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`
  );

  zip.file(
    "xl/workbook.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Sheet1" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`
  );

  zip.file(
    "xl/_rels/workbook.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`
  );

  const safeRows = rows.length > 0 ? rows : [[""]];
  const rowXml = safeRows
    .map((row, rIdx) => {
      const cellsXml = row
        .map(
          (cell, cIdx) =>
            `<c r="${columnName(cIdx)}${rIdx + 1}" t="inlineStr"><is><t>${escapeXml(cell)}</t></is></c>`
        )
        .join("");
      return `<row r="${rIdx + 1}">${cellsXml}</row>`;
    })
    .join("\n    ");

  zip.file(
    "xl/worksheets/sheet1.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    ${rowXml}
  </sheetData>
</worksheet>`
  );

  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}
