function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

export function buildFilename(name, ext) {
  return `${name}-${timestamp()}.${ext}`;
}

const BRAND_PRIMARY_RGB = [37, 99, 235];
const BRAND_DARK_RGB = [24, 24, 27];
const MUTED_RGB = [113, 113, 122];
const STRIPE_RGB = [248, 250, 252];
const SUCCESS_RGB = [16, 185, 129];
const DANGER_RGB = [239, 68, 68];

export async function exportCSV(report) {
  const { meta, kpis, sections } = report;
  const lines = [];
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const pushRow = (arr) => lines.push(arr.map(esc).join(','));

  pushRow([meta.title]);
  if (meta.subtitle) pushRow([meta.subtitle]);
  pushRow([`Período: ${meta.period}`]);
  pushRow([`Empresa: ${meta.company?.name ?? ''}`]);
  pushRow([`Gerado em: ${meta.generatedAt}`]);
  lines.push('');

  if (kpis?.length) {
    pushRow(['INDICADORES PRINCIPAIS']);
    pushRow(['Indicador', 'Valor', 'Variação']);
    kpis.forEach((k) => pushRow([k.label, k.value, k.delta ?? '—']));
    lines.push('');
  }

  for (const section of sections ?? []) {
    pushRow([section.title.toUpperCase()]);
    if (section.description) pushRow([section.description]);
    if (section.columns) pushRow(section.columns);
    (section.rows ?? []).forEach((r) => pushRow(r));
    if (section.summary?.length) {
      lines.push('');
      section.summary.forEach((s) => pushRow([s.label, s.value]));
    }
    lines.push('');
  }

  const csv = '﻿' + lines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  downloadBlob(blob, buildFilename(report.filename, 'csv'));
}

export async function exportExcel(report) {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  wb.Props = {
    Title: report.meta.title,
    Subject: report.meta.subtitle,
    Author: report.meta.company?.name ?? 'AURORA ERP',
    CreatedDate: new Date(),
  };

  const summary = [
    [report.meta.title],
    [report.meta.subtitle ?? ''],
    [],
    ['Empresa', report.meta.company?.name ?? ''],
    ['CNPJ', report.meta.company?.document ?? ''],
    ['Período', report.meta.period],
    ['Gerado em', report.meta.generatedAt],
    [],
    ['INDICADORES PRINCIPAIS'],
    ['Indicador', 'Valor', 'Variação vs. período anterior'],
    ...(report.kpis ?? []).map((k) => [k.label, k.value, k.delta ?? '—']),
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summary);
  wsSummary['!cols'] = [{ wch: 32 }, { wch: 24 }, { wch: 26 }];
  wsSummary['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } },
  ];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo');

  for (const section of report.sections ?? []) {
    const aoa = [];
    aoa.push([section.title]);
    if (section.description) aoa.push([section.description]);
    aoa.push([]);
    if (section.columns) aoa.push(section.columns);
    for (const row of section.rows ?? []) aoa.push(row);
    if (section.summary?.length) {
      aoa.push([]);
      section.summary.forEach((s) => aoa.push([s.label, s.value]));
    }
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const cols = section.columns?.length ?? 4;
    ws['!cols'] = Array.from({ length: cols }, (_, i) => ({ wch: i === 0 ? 32 : 18 }));
    XLSX.utils.book_append_sheet(wb, ws, (section.sheetName ?? section.title).slice(0, 31));
  }

  XLSX.writeFile(wb, buildFilename(report.filename, 'xlsx'));
}

export async function exportPDF(report) {
  const { default: jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 40;

  doc.setFillColor(...BRAND_PRIMARY_RGB);
  doc.rect(0, 0, pageWidth, 90, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('AURORA ERP', margin, 32);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(report.meta.title, margin, 60);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(220, 230, 245);
  doc.text(report.meta.subtitle ?? '', margin, 78);

  doc.setTextColor(...BRAND_DARK_RGB);

  let y = 120;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text((report.meta.company?.name ?? '').toUpperCase(), margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED_RGB);
  const metaLine = [
    report.meta.company?.document && `CNPJ ${report.meta.company.document}`,
    `Período: ${report.meta.period}`,
    `Gerado em ${report.meta.generatedAt}`,
  ]
    .filter(Boolean)
    .join('  ·  ');
  doc.text(metaLine, margin, y + 14);
  doc.setTextColor(...BRAND_DARK_RGB);
  y += 36;

  if (report.kpis?.length) {
    const cardW = (pageWidth - margin * 2 - 12 * (report.kpis.length - 1)) / report.kpis.length;
    const cardH = 70;
    report.kpis.forEach((kpi, idx) => {
      const x = margin + idx * (cardW + 12);
      doc.setFillColor(...STRIPE_RGB);
      doc.roundedRect(x, y, cardW, cardH, 6, 6, 'F');
      doc.setDrawColor(228, 228, 231);
      doc.setLineWidth(0.5);
      doc.roundedRect(x, y, cardW, cardH, 6, 6, 'S');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...MUTED_RGB);
      doc.text(kpi.label.toUpperCase(), x + 10, y + 16);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(...BRAND_DARK_RGB);
      doc.text(kpi.value, x + 10, y + 38);

      if (kpi.delta) {
        const isPositive = !kpi.delta.startsWith('-') && kpi.delta !== '0,0%' && kpi.delta !== '—';
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...(kpi.delta === '—' ? MUTED_RGB : isPositive ? SUCCESS_RGB : DANGER_RGB));
        doc.text(kpi.delta, x + 10, y + 56);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...MUTED_RGB);
        doc.text('vs. período anterior', x + 38, y + 56);
      }
    });
    y += cardH + 24;
    doc.setTextColor(...BRAND_DARK_RGB);
  }

  for (const section of report.sections ?? []) {
    if (y > pageHeight - 150) {
      doc.addPage();
      y = 60;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...BRAND_DARK_RGB);
    doc.text(section.title, margin, y);
    y += 6;
    doc.setDrawColor(...BRAND_PRIMARY_RGB);
    doc.setLineWidth(2);
    doc.line(margin, y, margin + 36, y);
    y += 6;
    if (section.description) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...MUTED_RGB);
      doc.text(section.description, margin, y + 10);
      y += 16;
    } else {
      y += 6;
    }

    if (section.rows?.length) {
      autoTable(doc, {
        startY: y,
        head: section.columns ? [section.columns] : undefined,
        body: section.rows,
        styles: { fontSize: 9, cellPadding: 6, textColor: BRAND_DARK_RGB },
        headStyles: {
          fillColor: BRAND_PRIMARY_RGB,
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9,
        },
        alternateRowStyles: { fillColor: STRIPE_RGB },
        margin: { left: margin, right: margin },
        theme: 'grid',
      });
      y = doc.lastAutoTable.finalY + 18;
    }

    if (section.summary?.length) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      section.summary.forEach((s) => {
        doc.setTextColor(...MUTED_RGB);
        doc.text(s.label + ':', margin, y);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...BRAND_DARK_RGB);
        doc.text(s.value, margin + 200, y);
        doc.setFont('helvetica', 'normal');
        y += 14;
      });
      y += 6;
    }
  }

  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i += 1) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...MUTED_RGB);
    doc.text(
      `${report.meta.company?.name ?? 'AURORA ERP'}  ·  Confidencial`,
      margin,
      pageHeight - 22,
    );
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 22, {
      align: 'right',
    });
  }

  doc.save(buildFilename(report.filename, 'pdf'));
}

export async function exportWord(report) {
  const docx = await import('docx');
  const {
    Document,
    Packer,
    Paragraph,
    Table,
    TableRow,
    TableCell,
    TextRun,
    WidthType,
    AlignmentType,
    ShadingType,
  } = docx;

  const accent = '2563EB';
  const muted = '71717A';
  const ink = '18181B';

  const styledHeader = (text, color = accent) =>
    new Paragraph({
      spacing: { before: 240, after: 120 },
      children: [
        new TextRun({ text: text.toUpperCase(), bold: true, color, size: 18, font: 'Calibri' }),
      ],
    });

  const cell = (text, opts = {}) =>
    new TableCell({
      shading: opts.head ? { fill: accent, type: ShadingType.CLEAR, color: 'auto' } : undefined,
      margins: { top: 80, bottom: 80, left: 100, right: 100 },
      children: [
        new Paragraph({
          alignment: opts.right ? AlignmentType.RIGHT : AlignmentType.LEFT,
          children: [
            new TextRun({
              text: String(text ?? ''),
              bold: opts.head || opts.bold,
              color: opts.head ? 'FFFFFF' : opts.muted ? muted : ink,
              size: 18,
              font: 'Calibri',
            }),
          ],
        }),
      ],
    });

  const sectionBlocks = [];

  sectionBlocks.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 60 },
      children: [
        new TextRun({ text: 'AURORA ERP', bold: true, color: accent, size: 20, font: 'Calibri' }),
      ],
    }),
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: report.meta.title,
          bold: true,
          size: 40,
          color: ink,
          font: 'Calibri',
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 240 },
      children: [
        new TextRun({
          text: report.meta.subtitle ?? '',
          italics: true,
          color: muted,
          size: 20,
          font: 'Calibri',
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 240 },
      children: [
        new TextRun({
          text: `${report.meta.company?.name ?? ''}  ·  ${report.meta.company?.document ? 'CNPJ ' + report.meta.company.document + '  ·  ' : ''}Período: ${report.meta.period}  ·  Gerado em ${report.meta.generatedAt}`,
          color: muted,
          size: 18,
          font: 'Calibri',
        }),
      ],
    }),
  );

  if (report.kpis?.length) {
    sectionBlocks.push(styledHeader('Indicadores principais'));
    sectionBlocks.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            tableHeader: true,
            children: [
              cell('Indicador', { head: true }),
              cell('Valor', { head: true }),
              cell('Variação vs. período anterior', { head: true }),
            ],
          }),
          ...report.kpis.map(
            (k) =>
              new TableRow({
                children: [cell(k.label), cell(k.value, { bold: true }), cell(k.delta ?? '—')],
              }),
          ),
        ],
      }),
    );
  }

  for (const section of report.sections ?? []) {
    sectionBlocks.push(styledHeader(section.title));
    if (section.description) {
      sectionBlocks.push(
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: section.description,
              italics: true,
              color: muted,
              size: 18,
              font: 'Calibri',
            }),
          ],
        }),
      );
    }
    if (section.rows?.length) {
      const rows = [];
      if (section.columns) {
        rows.push(
          new TableRow({
            tableHeader: true,
            children: section.columns.map((c) => cell(c, { head: true })),
          }),
        );
      }
      section.rows.forEach((r) => {
        rows.push(new TableRow({ children: r.map((v) => cell(v)) }));
      });
      sectionBlocks.push(
        new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE } }),
      );
    }
    if (section.summary?.length) {
      sectionBlocks.push(new Paragraph({ text: '', spacing: { before: 80 } }));
      section.summary.forEach((s) => {
        sectionBlocks.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({ text: s.label + ': ', color: muted, size: 18, font: 'Calibri' }),
              new TextRun({ text: s.value, bold: true, color: ink, size: 18, font: 'Calibri' }),
            ],
          }),
        );
      });
    }
  }

  const doc = new Document({
    creator: report.meta.company?.name ?? 'AURORA ERP',
    title: report.meta.title,
    description: report.meta.subtitle ?? '',
    styles: {
      default: {
        document: { run: { font: 'Calibri', size: 20 } },
      },
    },
    sections: [
      {
        properties: {},
        children: sectionBlocks,
      },
    ],
  });
  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, buildFilename(report.filename, 'docx'));
}

export async function exportData(format, report) {
  switch (format) {
    case 'csv':
      return exportCSV(report);
    case 'xlsx':
      return exportExcel(report);
    case 'pdf':
      return exportPDF(report);
    case 'docx':
      return exportWord(report);
    default:
      throw new Error(`Formato não suportado: ${format}`);
  }
}
