/** Single-purchase math and validation (shared limits for form, storage and import). */

import { ValidationResult } from '../../types/index.ts';
import { isValidIsoDate } from './dates.ts';

export const MAX_PRICE_PER_PACK = 500;
export const MAX_QUANTITY = 500;

/** Calculates total purchase price avoiding floating point inaccuracies. */
export function calculatePurchaseTotal(pricePerPack: number, quantity: number): number {
  if (isNaN(pricePerPack) || isNaN(quantity) || pricePerPack <= 0 || quantity <= 0) {
    return 0;
  }
  return Math.round(pricePerPack * quantity * 100) / 100;
}

/** Validates purchase fields before saving. */
export function validatePurchaseData(data: {
  brand?: string;
  pricePerPack?: number;
  quantity?: number;
  date?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.brand || data.brand.trim().length === 0) {
    errors.brand = 'נא להזין או לבחור מותג סיגריות';
  }

  if (data.pricePerPack === undefined || isNaN(data.pricePerPack)) {
    errors.pricePerPack = 'נא להזין מחיר לחפיסה';
  } else if (data.pricePerPack <= 0) {
    errors.pricePerPack = 'המחיר לחפיסה חייב להיות גדול מ-0';
  } else if (data.pricePerPack > MAX_PRICE_PER_PACK) {
    errors.pricePerPack = 'המחיר שהוזן גבוה מטווח סביר לחפיסה';
  }

  if (data.quantity === undefined || isNaN(data.quantity)) {
    errors.quantity = 'נא להזין מספר חפיסות';
  } else if (!Number.isInteger(data.quantity) || data.quantity < 1) {
    errors.quantity = 'כמות החפיסות חייבת להיות מספר שלם וחיובי (לפחות 1)';
  } else if (data.quantity > MAX_QUANTITY) {
    errors.quantity = 'כמות החפיסות חורגת מגבול הגיוני לרכישה בודדת';
  }

  if (!isValidIsoDate(data.date)) {
    errors.date = 'נא לבחור תאריך תקין';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}
