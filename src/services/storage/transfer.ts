/** JSON import preview/merge and export building. */

import { Purchase } from '../../types/index.ts';
import { validatePurchaseData } from '../calculations.ts';
import { ensureUniqueIds, parsePurchasesList } from './normalize.ts';

export const MAX_IMPORT_CHARS = 5_000_000;

export interface ParsedImport {
  success: boolean;
  error?: string;
  purchases: Purchase[];
  skipped: number;
}

/** Parses and strictly validates a backup file. Never touches storage. */
export function parseImportFile(content: string): ParsedImport {
  const fail = (error: string): ParsedImport => ({ success: false, error, purchases: [], skipped: 0 });
  if (!content || content.trim().length === 0) return fail('הקובץ שהועלה ריק');
  if (content.length > MAX_IMPORT_CHARS) return fail('הקובץ גדול מדי לייבוא (מעל 5MB)');

  const result = parsePurchasesList(content, (p) =>
    Array.isArray(p) ? p : (p as { purchases?: unknown } | null)?.purchases
  );
  if (result.problem === 'invalid_json') return fail('שגיאה בפענוח קובץ ה-JSON: הקובץ אינו JSON תקין');
  if (result.problem === 'not_array') return fail('פורמט הקובץ אינו תקין - לא נמצאה רשימת רכישות');

  const strict = result.purchases.filter(
    (p) => validatePurchaseData({ brand: p.brand, pricePerPack: p.pricePerPack, quantity: p.quantity, date: p.date }).isValid
  );
  if (strict.length === 0) return fail('לא נמצאו רכישות תקינות לייבוא בקובץ');

  const purchases = ensureUniqueIds(strict.map((p) => ({ ...p, isDemo: false })));
  return { success: true, purchases, skipped: result.dropped + (result.purchases.length - strict.length) };
}

/** Merge keeps every existing record; imported records with a known id are counted as duplicates. */
export function mergePurchases(existing: Purchase[], incoming: Purchase[]) {
  const known = new Set(existing.map((p) => p.id));
  const fresh = incoming.filter((p) => !known.has(p.id));
  return { merged: [...fresh, ...existing], added: fresh.length, duplicates: incoming.length - fresh.length };
}

export function buildJsonExport(purchases: Purchase[], currency: string): string {
  return JSON.stringify(
    {
      app: 'כמה זה עולה?',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      currency,
      totalPurchases: purchases.length,
      purchases
    },
    null,
    2
  );
}
