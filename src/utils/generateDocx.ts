import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from 'docx';
import { saveAs } from 'file-saver';
import { checklistSections } from '../data/checklistData';
import type { ResponsesMap, SignaturesState, VisitMeta } from '../types';
import { calculateOverallStatus } from './calculateStatus';

const PAGE_WIDTH_DXA = 12240; // US Letter width
const MARGIN_DXA = 1080;
const CONTENT_WIDTH_DXA = PAGE_WIDTH_DXA - MARGIN_DXA * 2;

const COLORS = {
  headerFill: '1E40AF',
  sectionFill: 'DBEAFE',
  ok: '16A34A',
  bad: 'DC2626',
  border: '9CA3AF',
};

const cellBorder = {
  top: { style: BorderStyle.SINGLE, size: 2, color: COLORS.border },
  bottom: { style: BorderStyle.SINGLE, size: 2, color: COLORS.border },
  left: { style: BorderStyle.SINGLE, size: 2, color: COLORS.border },
  right: { style: BorderStyle.SINGLE, size: 2, color: COLORS.border },
};

function sectionHeaderRow(text: string, colWidths: number[]) {
  return new TableRow({
    children: [
      new TableCell({
        columnSpan: 4,
        width: { size: colWidths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
        borders: cellBorder,
        shading: { type: ShadingType.CLEAR, fill: COLORS.sectionFill },
        children: [
          new Paragraph({
            children: [new TextRun({ text, bold: true, size: 24, color: '1E40AF' })],
            spacing: { before: 150, after: 150 },
          }),
        ],
      }),
    ],
  });
}

function tableHeaderRow(colWidths: [number, number, number, number]) {
  const headers = ['#', 'Check Point', 'Y / N', 'Remarks'];
  return new TableRow({
    tableHeader: true,
    children: headers.map(
      (h, i) =>
        new TableCell({
          width: { size: colWidths[i], type: WidthType.DXA },
          borders: cellBorder,
          shading: { type: ShadingType.CLEAR, fill: COLORS.headerFill },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: i === 0 || i === 2 ? AlignmentType.CENTER : AlignmentType.LEFT,
              children: [new TextRun({ text: h, bold: true, color: 'FFFFFF', size: 22 })],
            }),
          ],
        })
    ),
  });
}

function itemRow(
  no: number,
  label: string,
  status: 'working' | 'not_working' | null,
  remarks: string,
  colWidths: [number, number, number, number]
) {
  const statusText = status === 'working' ? 'Yes' : status === 'not_working' ? 'No' : '';
  const statusColor = status === 'working' ? COLORS.ok : status === 'not_working' ? COLORS.bad : '9CA3AF';

  return new TableRow({
    children: [
      new TableCell({
        width: { size: colWidths[0], type: WidthType.DXA },
        borders: cellBorder,
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, text: String(no), spacing: { before: 120, after: 120 } })],
      }),
      new TableCell({
        width: { size: colWidths[1], type: WidthType.DXA },
        borders: cellBorder,
        verticalAlign: VerticalAlign.TOP,
        children: [new Paragraph({ text: label, spacing: { before: 120, after: 120 } })],
      }),
      new TableCell({
        width: { size: colWidths[2], type: WidthType.DXA },
        borders: cellBorder,
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: statusText, bold: true, color: statusColor, size: 22 })],
            spacing: { before: 120, after: 120 },
          }),
        ],
      }),
      new TableCell({
        width: { size: colWidths[3], type: WidthType.DXA },
        borders: cellBorder,
        verticalAlign: VerticalAlign.TOP,
        children: [new Paragraph({ text: remarks || ' ', spacing: { before: 120, after: 120 } })],
      }),
    ],
  });
}

function overallStatusBox(status: 'OK' | 'Issues Found' | 'Critical') {
  const options: Array<'OK' | 'Issues Found' | 'Critical'> = ['OK', 'Issues Found', 'Critical'];
  const runs: TextRun[] = [new TextRun({ text: 'Overall Status:  ', bold: true, size: 26, color: '1E40AF' })];
  options.forEach((opt, idx) => {
    const checked = opt === status;
    runs.push(new TextRun({ text: checked ? '[X] ' : '[ ] ', bold: true, size: 24, color: checked ? (opt === 'OK' ? COLORS.ok : opt === 'Critical' ? COLORS.bad : 'CA8A04') : '9CA3AF' }));
    runs.push(new TextRun({ text: opt + (idx < options.length - 1 ? '     ' : ''), bold: checked, size: 24, color: checked ? (opt === 'OK' ? COLORS.ok : opt === 'Critical' ? COLORS.bad : 'CA8A04') : '6B7280' }));
  });
  return new Paragraph({ spacing: { before: 400, after: 400, line: 360 }, children: runs, border: { top: { color: COLORS.border, space: 1, style: BorderStyle.SINGLE, size: 6 }, bottom: { color: COLORS.border, space: 1, style: BorderStyle.SINGLE, size: 6 } } });
}

async function dataUrlToUint8Array(dataUrl: string): Promise<Uint8Array> {
  const res = await fetch(dataUrl);
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

async function loadLogoImage(logoPath: string): Promise<Uint8Array | null> {
  try {
    const response = await fetch(logoPath);
    if (!response.ok) return null;
    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
  } catch (error) {
    console.warn(`Could not load logo from ${logoPath}:`, error);
    return null;
  }
}

function signatureCell(title: string, name: string, designation: string, date: string) {
  return [
    new Paragraph({ children: [new TextRun({ text: title, bold: true, size: 22, color: '1E40AF' })], spacing: { after: 300 } }),
    new Paragraph({ text: '_____________________________', spacing: { after: 150 } }),
    new Paragraph({ children: [new TextRun({ text: `Name: `, bold: true }), new TextRun(name || ' ')], spacing: { after: 100 } }),
    new Paragraph({ children: [new TextRun({ text: `Designation: `, bold: true }), new TextRun(designation || ' ')], spacing: { after: 100 } }),
    new Paragraph({ children: [new TextRun({ text: `Date: `, bold: true }), new TextRun(date || ' ')], spacing: { after: 100 } }),
  ];
}

export async function generateDocumentBlob(
  meta: VisitMeta,
  responses: ResponsesMap,
  signatures: SignaturesState
): Promise<{ blob: Blob; filename: string }> {
  const breakdown = calculateOverallStatus(responses);

  const colWidths: [number, number, number, number] = [
    Math.round(CONTENT_WIDTH_DXA * 0.05),
    Math.round(CONTENT_WIDTH_DXA * 0.52),
    Math.round(CONTENT_WIDTH_DXA * 0.12),
    Math.round(CONTENT_WIDTH_DXA * 0.31),
  ];

  const metaColWidths: [number, number, number, number] = [
    Math.round(CONTENT_WIDTH_DXA * 0.18),
    Math.round(CONTENT_WIDTH_DXA * 0.32),
    Math.round(CONTENT_WIDTH_DXA * 0.18),
    Math.round(CONTENT_WIDTH_DXA * 0.32),
  ];

  const metaTable = new Table({
    width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
    columnWidths: [metaColWidths[0], metaColWidths[1], metaColWidths[2], metaColWidths[3]],
    rows: [
      new TableRow({
        children: [
          new TableCell({ width: { size: metaColWidths[0], type: WidthType.DXA }, borders: cellBorder, shading: { type: ShadingType.CLEAR, fill: 'E0E7FF' }, children: [new Paragraph({ children: [new TextRun({ text: 'Hospital:', bold: true, size: 20, color: '1E40AF' })], spacing: { before: 100, after: 100 } })] }),
          new TableCell({ width: { size: metaColWidths[1], type: WidthType.DXA }, borders: cellBorder, children: [new Paragraph({ text: meta.hospital || ' ', spacing: { before: 100, after: 100 } })] }),
          new TableCell({ width: { size: metaColWidths[2], type: WidthType.DXA }, borders: cellBorder, shading: { type: ShadingType.CLEAR, fill: 'E0E7FF' }, children: [new Paragraph({ children: [new TextRun({ text: 'Visit Date:', bold: true, size: 20, color: '1E40AF' })], spacing: { before: 100, after: 100 } })] }),
          new TableCell({ width: { size: metaColWidths[3], type: WidthType.DXA }, borders: cellBorder, children: [new Paragraph({ text: meta.visitDate || ' ', spacing: { before: 100, after: 100 } })] }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ width: { size: metaColWidths[0], type: WidthType.DXA }, borders: cellBorder, shading: { type: ShadingType.CLEAR, fill: 'E0E7FF' }, children: [new Paragraph({ children: [new TextRun({ text: 'Location:', bold: true, size: 20, color: '1E40AF' })], spacing: { before: 100, after: 100 } })] }),
          new TableCell({ width: { size: metaColWidths[1], type: WidthType.DXA }, borders: cellBorder, children: [new Paragraph({ text: meta.location || ' ', spacing: { before: 100, after: 100 } })] }),
          new TableCell({ width: { size: metaColWidths[2], type: WidthType.DXA }, borders: cellBorder, shading: { type: ShadingType.CLEAR, fill: 'E0E7FF' }, children: [new Paragraph({ children: [new TextRun({ text: 'Visited By:', bold: true, size: 20, color: '1E40AF' })], spacing: { before: 100, after: 100 } })] }),
          new TableCell({ width: { size: metaColWidths[3], type: WidthType.DXA }, borders: cellBorder, children: [new Paragraph({ text: meta.visitedBy || ' ', spacing: { before: 100, after: 100 } })] }),
        ],
      }),
    ],
  });

  const table1Sections = checklistSections.filter((s) => s.table === 1);
  const table2Sections = checklistSections.filter((s) => s.table === 2);

  function buildTable(sections: typeof checklistSections) {
    const rows: TableRow[] = [tableHeaderRow(colWidths)];
    for (const section of sections) {
      rows.push(sectionHeaderRow(`${section.code}. ${section.title.toUpperCase()}`, colWidths));
      for (const item of section.items) {
        const r = responses[item.id];
        rows.push(itemRow(item.no, item.label, r?.status ?? null, r?.remarks ?? '', colWidths));
      }
    }
    return new Table({
      width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
      columnWidths: colWidths,
      rows,
    });
  }

  // Load logos
  const teleicuLogo = await loadLogoImage('/teleicu-logo.png');
  const egovLogo = await loadLogoImage('/egov-logo.png');

  const children: (Paragraph | Table)[] = [];

  // Add header with logos
  const headerRows: TableRow[] = [];
  const logoWidth = Math.round(CONTENT_WIDTH_DXA * 0.15);
  const titleWidth = CONTENT_WIDTH_DXA - logoWidth * 2;

  const headerCells = [];

  // Left logo cell
  const leftLogoContent = [];
  if (teleicuLogo) {
    leftLogoContent.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new ImageRun({ data: teleicuLogo, type: 'png', transformation: { width: 80, height: 60 } })],
      })
    );
  }
  headerCells.push(
    new TableCell({
      width: { size: logoWidth, type: WidthType.DXA },
      borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
      verticalAlign: VerticalAlign.CENTER,
      children: leftLogoContent.length > 0 ? leftLogoContent : [new Paragraph({ text: '' })],
    })
  );

  // Center title cell
  headerCells.push(
    new TableCell({
      width: { size: titleWidth, type: WidthType.DXA },
      borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
      verticalAlign: VerticalAlign.CENTER,
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [new TextRun({ text: 'TeleICU SPOKE HOSPITAL – FIELD VISIT CHECKLIST', bold: true, size: 28 })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: 'TeleICU Systems & Infrastructure', size: 22 })],
        }),
      ],
    })
  );

  // Right logo cell
  const rightLogoContent = [];
  if (egovLogo) {
    rightLogoContent.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new ImageRun({ data: egovLogo, type: 'png', transformation: { width: 100, height: 50 } })],
      })
    );
  }
  headerCells.push(
    new TableCell({
      width: { size: logoWidth, type: WidthType.DXA },
      borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
      verticalAlign: VerticalAlign.CENTER,
      children: rightLogoContent.length > 0 ? rightLogoContent : [new Paragraph({ text: '' })],
    })
  );

  headerRows.push(new TableRow({ children: headerCells }));

  const noBorders = {
    top: { style: BorderStyle.NONE, size: 0 },
    bottom: { style: BorderStyle.NONE, size: 0 },
    left: { style: BorderStyle.NONE, size: 0 },
    right: { style: BorderStyle.NONE, size: 0 },
    insideHorizontal: { style: BorderStyle.NONE, size: 0 },
    insideVertical: { style: BorderStyle.NONE, size: 0 },
  };

  const headerTable = new Table({
    width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
    columnWidths: [logoWidth, titleWidth, logoWidth],
    rows: headerRows,
    borders: noBorders,
  });

  children.push(headerTable);
  children.push(new Paragraph({ text: '', spacing: { after: 300 } }));

  // Add metadata table
  children.push(metaTable);
  children.push(new Paragraph({ text: '', spacing: { before: 300, after: 250 } }));
  children.push(buildTable(table1Sections));
  children.push(new Paragraph({ text: '', spacing: { before: 500, after: 300 } }));
  children.push(buildTable(table2Sections));
  children.push(new Paragraph({ text: '', spacing: { before: 400, after: 300 } }));
  children.push(overallStatusBox(breakdown.overall));
  children.push(
    new Paragraph({
      spacing: { before: 200, after: 300 },
      children: [
        new TextRun({
          text: `Summary: ${breakdown.workingCount} Yes / ${breakdown.notWorkingCount} No out of ${breakdown.totalItems} checkpoints (${breakdown.answered} answered)`,
          italics: true,
          size: 22,
          color: '6B7280',
        }),
      ],
    })
  );

  if (breakdown.criticalFailures.length > 0) {
    children.push(
      new Paragraph({
        spacing: { before: 200, after: 400, line: 300 },
        border: { left: { color: '#DC2626', space: 1, style: BorderStyle.SINGLE, size: 12 } },
        indent: { left: 300 },
        children: [
          new TextRun({ text: 'Critical Failures: ', bold: true, color: 'DC2626', size: 24 }),
          new TextRun({ text: breakdown.criticalFailures.map((f) => f.label).join('; '), color: 'DC2626', size: 20 }),
        ],
      })
    );
  }

  children.push(new Paragraph({ text: '', spacing: { before: 500, after: 250 } }));

  // Signature table (two columns)
  const sigLeft = signatureCell(
    'Field Engineer / Manager',
    signatures.fieldEngineer.name,
    signatures.fieldEngineer.designation,
    signatures.fieldEngineer.date
  );
  const sigRight = signatureCell(
    'AMO / AAO / In-Charge Staff',
    signatures.inCharge.name,
    signatures.inCharge.designation,
    signatures.inCharge.date
  );

  if (signatures.fieldEngineer.signatureDataUrl) {
    const bytes = await dataUrlToUint8Array(signatures.fieldEngineer.signatureDataUrl);
    sigLeft.splice(
      1,
      1,
      new Paragraph({
        children: [new ImageRun({ data: bytes, type: 'png', transformation: { width: 180, height: 70 } })],
      })
    );
  }
  if (signatures.inCharge.signatureDataUrl) {
    const bytes = await dataUrlToUint8Array(signatures.inCharge.signatureDataUrl);
    sigRight.splice(
      1,
      1,
      new Paragraph({
        children: [new ImageRun({ data: bytes, type: 'png', transformation: { width: 180, height: 70 } })],
      })
    );
  }

  const sigTable = new Table({
    width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
    columnWidths: [Math.round(CONTENT_WIDTH_DXA / 2), Math.round(CONTENT_WIDTH_DXA / 2)],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: Math.round(CONTENT_WIDTH_DXA / 2), type: WidthType.DXA },
            borders: cellBorder,
            shading: { type: ShadingType.CLEAR, fill: 'F9FAFB' },
            children: sigLeft,
          }),
          new TableCell({
            width: { size: Math.round(CONTENT_WIDTH_DXA / 2), type: WidthType.DXA },
            borders: cellBorder,
            shading: { type: ShadingType.CLEAR, fill: 'F9FAFB' },
            children: sigRight,
          }),
        ],
      }),
    ],
  });

  children.push(sigTable);

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: PAGE_WIDTH_DXA, height: 15840 },
            margin: { top: MARGIN_DXA, bottom: MARGIN_DXA, left: MARGIN_DXA, right: MARGIN_DXA },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const filename = `TeleICU_Field_Visit_${(meta.hospital || 'report').replace(/\s+/g, '_')}_${meta.visitDate || ''}.docx`;

  return { blob, filename };
}

export async function generateFilledReport(
  meta: VisitMeta,
  responses: ResponsesMap,
  signatures: SignaturesState
): Promise<void> {
  const { blob, filename } = await generateDocumentBlob(meta, responses, signatures);
  saveAs(blob, filename);
}
