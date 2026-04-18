import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/** @typedef {import('../../../shared/contracts/reports.js').ReportProvider} ReportProvider */
/** @typedef {import('../../../shared/contracts/reports.js').ReportRow} ReportRow */

/**
 * Create and download a print-ready PDF (US Letter) for a tabular report.
 *
 * Notes:
 * - Designed to be easy to extend later (branding, headers, footer text, column labels).
 * - Uses jsPDF-AutoTable for robust multi-page tables.
 * - Wide reports are exported in landscape for readability.
 *
 * @param {{
 *   title?: string,
 *   rows?: ReportRow[],
 *   provider?: ReportProvider | string,
 *   filtersSummary?: string[]
 * }} [options={}]
 */
export function downloadReportPdf({
  title = 'Report',
  rows = [],
  provider = '',
  filtersSummary = []
} = {}) {
  // Wide reports (many columns) are much more readable in landscape.
  const columnsPreview = rows && rows.length ? Object.keys(rows[0] || {}) : [];
  const isWideReport = columnsPreview.length >= 8;
  const orientation = isWideReport ? 'landscape' : 'portrait';

  const doc = new jsPDF({ orientation, unit: 'pt', format: 'letter' });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Layout constants (points). Letter is 612 x 792 pt.
  // Slightly smaller margins give the table more room without hurting printability.
  const marginLeft = 40; // ~0.55in
  const marginRight = 40;
  const marginTop = 40;
  const marginBottom = 40;

  const now = new Date();
  const generatedAt = now.toLocaleString();

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(title, marginLeft, marginTop);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  let y = marginTop + 18;
  doc.text(`Generated: ${generatedAt}`, marginLeft, y);
  y += 14;

  if (provider) {
    doc.text(`Source: ${provider}`, marginLeft, y);
    y += 14;
  }

  if (filtersSummary && filtersSummary.length) {
    // Wrap filter summary lines if they are too long
    const maxWidth = pageWidth - marginLeft - marginRight;
    const lines = doc.splitTextToSize(`Filters: ${filtersSummary.join('  |  ')}`, maxWidth);
    doc.text(lines, marginLeft, y);
    y += 14 * lines.length;
  }

  y += 8;

  if (!rows || rows.length === 0) {
    doc.setFontSize(11);
    doc.text('No rows returned.', marginLeft, y);
    stampPageNumbers(doc, marginRight, pageHeight, marginBottom);
    doc.save(makeFilename(title, now));
    return;
  }

  // Table
  const columns = columnsPreview;
  const headLabels = columns.map((c) => makeHeaderLabel(c, columns.length));
  const head = [headLabels];
  const body = rows.map((r) => columns.map((c) => formatCell(r?.[c])));

  const availableWidth = pageWidth - marginLeft - marginRight;

  // When there are lots of columns, shrink font/padding slightly to avoid squishing.
  const tableFontSize = columns.length >= 10 ? 7 : 8;
  const cellPadding = columns.length >= 10 ? 2.5 : 3;

  const columnStyles = computeColumnStyles({
    doc,
    columns,
    headLabels,
    rows,
    availableWidth,
    fontSize: tableFontSize,
    cellPadding
  });

  autoTable(doc, {
    head,
    body,
    startY: y,
    margin: { left: marginLeft, right: marginRight, top: marginTop, bottom: marginBottom },
    tableWidth: availableWidth,
    styles: { font: 'helvetica', fontSize: tableFontSize, cellPadding, overflow: 'linebreak' },
    headStyles: { fontStyle: 'bold', fontSize: tableFontSize },
    columnStyles,
    // Let AutoTable paginate naturally (avoids big blank areas when a row is tall).
    rowPageBreak: 'auto'
  });

  // Footer page numbers
  stampPageNumbers(doc, marginRight, pageHeight, marginBottom);

  doc.save(makeFilename(title, now));
}

function stampPageNumbers(doc, marginRight, pageHeight, marginBottom) {
  const pageCount = doc.internal.getNumberOfPages();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const text = `Page ${i} of ${pageCount}`;
    doc.text(text, doc.internal.pageSize.getWidth() - marginRight, pageHeight - marginBottom / 2, {
      align: 'right'
    });
  }
}

function makeHeaderLabel(key, columnCount) {
  const label = toTitle(key);

  // If the report is wide, abbreviate very long header labels to reduce wrapping.
  if (columnCount < 8 || label.length <= 16) return label;

  // Common abbreviations (kept conservative so PDFs still make sense).
  const rules = [
    [/\bManagement\b/gi, 'Mgmt'],
    [/\bRecommendation\b/gi, 'Recomm.'],
    [/\bEstimated\b/gi, 'Est.'],
    [/\bApproved\b/gi, 'Appr.'],
    [/\bApproval\b/gi, 'Appr.'],
    [/\bProperty\b/gi, 'Prop'],
    [/\bProject\b/gi, 'Proj'],
    [/\bNumber\b/gi, '#'],
    [/\bReported\b/gi, 'Rptd'],
    [/\bRequested\b/gi, 'Req.'],
    [/\bDescription\b/gi, 'Desc.'],
    [/\bCategory\b/gi, 'Cat.']
  ];

  let out = label;
  for (const [re, rep] of rules) out = out.replace(re, rep);
  out = out.replace(/\s+/g, ' ').trim();

  return out;
}

function computeColumnStyles({ doc, columns, headLabels, rows, availableWidth, fontSize, cellPadding }) {
  // Measure text widths using jsPDF at the same font size the table will use.
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(fontSize);

  const sample = (rows || []).slice(0, 25);
  const baseMin = columns.length >= 10 ? 42 : 48;

  const minWidthFor = (key) => {
    const k = String(key || '').toLowerCase();
    if (k === 'id' || k.endsWith('_id') || k.includes(' id')) return 40;
    if (k.includes('date') || k.includes('time')) return 62;
    if (k.includes('amount') || k.includes('cost') || k.includes('budget') || k.includes('price')) return 58;
    if (k.includes('status')) return 56;
    if (k.includes('type')) return 54;
    if (k.includes('number') || k.includes('count') || k.includes('qty')) return 48;
    return baseMin;
  };

  const paddingPts = cellPadding * 2 + 6;
  const maxCap = Math.max(160, availableWidth * 0.35); // prevent one column from hogging too much width

  const desired = columns.map((colKey, i) => {
    const header = String(headLabels?.[i] ?? toTitle(colKey));
    let maxW = doc.getTextWidth(header);

    for (const r of sample) {
      const s = String(formatCell(r?.[colKey]) || '');
      // Cap measured string length so one long paragraph doesn't dominate sizing.
      const capped = s.length > 60 ? `${s.slice(0, 60)}…` : s;
      const w = doc.getTextWidth(capped);
      if (w > maxW) maxW = w;
    }

    const minW = minWidthFor(colKey);
    const target = Math.min(maxCap, maxW + paddingPts);
    return Math.max(minW, target);
  });

  const minWidths = columns.map((c) => minWidthFor(c));
  const fitted = fitWidths(desired, availableWidth, minWidths);

  const out = {};
  fitted.forEach((w, idx) => {
    out[idx] = { cellWidth: w };
  });
  return out;
}

function fitWidths(widths, availableWidth, minWidths) {
  // Iteratively reduce widths (only where possible) until the total fits.
  const w = widths.slice();
  for (let iter = 0; iter < 12; iter++) {
    const total = w.reduce((a, b) => a + b, 0);
    if (total <= availableWidth + 0.5) break;

    const excess = total - availableWidth;
    const reducible = w.map((val, i) => Math.max(0, val - (minWidths?.[i] ?? 40)));
    const reducibleSum = reducible.reduce((a, b) => a + b, 0);
    if (reducibleSum <= 0) break;

    for (let i = 0; i < w.length; i++) {
      const share = reducible[i] / reducibleSum;
      w[i] = w[i] - excess * share;
      const minW = minWidths?.[i] ?? 40;
      if (w[i] < minW) w[i] = minW;
    }
  }
  return w;
}

function toTitle(key) {
  return String(key)
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1));
}

function formatCell(value) {
  if (value === null || value === undefined) return '';
  // Strings, numbers, booleans: render as-is
  if (typeof value === 'string') {
    // Compact ISO-ish date strings (common in report data) to avoid overly-wide cells.
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    }
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  // Dates
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value.toLocaleString();
  }
  // Objects/arrays
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function makeFilename(title, date) {
  const safeTitle = String(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

  const pad = (n) => String(n).padStart(2, '0');
  const ts = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(
    date.getHours()
  )}${pad(date.getMinutes())}`;

  return `${safeTitle || 'report'}_${ts}.pdf`;
}
