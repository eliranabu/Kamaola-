/** CSV building with formula-injection protection. */

import { Purchase } from '../../types/index.ts';

/**
 * Sanitizes and formats a field for CSV export.
 * Neutralizes formula injection (=, +, -, @) for text fields,
 * while safely preserving valid numeric values and standard RFC 4180 CSV escaping.
 */
export function sanitizeCsvField(value: any, isNumericField: boolean = false): string {
  if (value === undefined || value === null) {
    return '""';
  }

  // Preserve valid numbers without quote prepending
  if (isNumericField || typeof value === 'number') {
    const num = Number(value);
    if (!isNaN(num)) {
      return `"${num}"`;
    }
  }

  let text = String(value);

  // Check if string begins with dangerous Excel formula triggers (=, +, -, @)
  // Ignoring leading spaces and control characters (ASCII 0-31)
  // eslint-disable-next-line no-control-regex -- control characters are exactly what must be skipped here
  const trimmed = text.replace(/^[\s\x00-\x1f]+/, '');
  if (/^[=+\-@]/.test(trimmed)) {
    // Prepend single quote ' so spreadsheet apps treat it strictly as literal text
    text = `'${text}`;
  }

  // Standard CSV escaping: double any embedded double quotes
  const escaped = text.replace(/"/g, '""');
  return `"${escaped}"`;
}

const CSV_HEADERS = [
  'תאריך',
  'שעה',
  'מותג',
  'מחיר לחפיסה (₪)',
  'מספר חפיסות',
  'סך הכל (₪)',
  'מקום רכישה',
  'הערה'
];

/** Builds the CSV (UTF-8 BOM so Excel opens Hebrew correctly). */
export function buildCsv(purchases: Purchase[]): string {
  const rows = purchases.map((p) =>
    [
      sanitizeCsvField(p.date, false),
      sanitizeCsvField(p.time || '', false),
      sanitizeCsvField(p.brand, false),
      sanitizeCsvField(p.pricePerPack, true),
      sanitizeCsvField(p.quantity, true),
      sanitizeCsvField(p.totalPrice, true),
      sanitizeCsvField(p.location || '', false),
      sanitizeCsvField(p.note || '', false)
    ].join(',')
  );
  return '﻿' + [CSV_HEADERS.join(','), ...rows].join('\r\n');
}
