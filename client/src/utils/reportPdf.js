import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Create and download a print-ready PDF (US Letter, portrait) for a tabular report.
 *
 * Notes:
 * - Designed to be easy to extend later (branding, headers, footer text, column labels).
 * - Uses jsPDF-AutoTable for robust multi-page tables.
 */
export function downloadReportPdf({
  title = 'Report',
  rows = [],
  provider = '',
  filtersSummary = []
} = {}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Layout constants (points). Letter is 612 x 792 pt.
  const marginLeft = 54; // 0.75in
  const marginRight = 54;
  const marginTop = 54;
  const marginBottom = 54;

  const now = new Date();
  const generatedAt = now.toLocaleString();

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(title, marginLeft, marginTop);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

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
  const columns = Object.keys(rows[0] || {});
  const head = [columns.map((c) => toTitle(c))];
  const body = rows.map((r) => columns.map((c) => formatCell(r?.[c])));

  autoTable(doc, {
    head,
    body,
    startY: y,
    margin: { left: marginLeft, right: marginRight, top: marginTop, bottom: marginBottom },
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 4, overflow: 'linebreak' },
    headStyles: { fontStyle: 'bold' },
    // Avoid splitting a row if possible
    rowPageBreak: 'avoid'
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
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
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
