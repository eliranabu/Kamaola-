/**
 * Defensive reading of stored/imported purchases. One bad item must never
 * hide (or destroy) the good ones, and never crash the calculations.
 */

import { Purchase } from '../../types/index.ts';
import { calculatePurchaseTotal, isValidIsoDate } from '../calculations.ts';

const MAX_LOCATION = 200;
const MAX_NOTE = 500;
const MAX_BRAND = 100;

const text = (v: unknown, max: number): string | undefined => {
  if (typeof v !== 'string') return undefined;
  const t = v.trim().slice(0, max);
  return t.length > 0 ? t : undefined;
};

/** Returns a clean Purchase, or null if the item is unusable. */
export function normalizePurchase(raw: unknown, index: number): Purchase | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;

  const brand = text(item.brand, MAX_BRAND);
  const pricePerPack = Number(item.pricePerPack);
  const quantity = Number(item.quantity);
  if (!brand) return null;
  if (!Number.isFinite(pricePerPack) || pricePerPack <= 0) return null;
  if (!Number.isInteger(quantity) || quantity < 1) return null;
  if (!isValidIsoDate(item.date)) return null;

  const time = typeof item.time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(item.time) ? item.time : undefined;

  return {
    id: typeof item.id === 'string' && item.id.length > 0 ? item.id : `purch_rec_${index}`,
    brand,
    pricePerPack,
    quantity,
    totalPrice: calculatePurchaseTotal(pricePerPack, quantity),
    date: item.date,
    time,
    location: text(item.location, MAX_LOCATION),
    note: text(item.note, MAX_NOTE),
    createdAt: typeof item.createdAt === 'number' && Number.isFinite(item.createdAt) ? item.createdAt : 0,
    updatedAt: typeof item.updatedAt === 'number' && Number.isFinite(item.updatedAt) ? item.updatedAt : undefined,
    isDemo: item.isDemo === true ? true : undefined
  };
}

/** Makes ids unique (deterministically) so edit/delete hit exactly one record. */
export function ensureUniqueIds(list: Purchase[]): Purchase[] {
  const seen = new Map<string, number>();
  return list.map((p) => {
    const count = seen.get(p.id) ?? 0;
    seen.set(p.id, count + 1);
    return count === 0 ? p : { ...p, id: `${p.id}~${count}` };
  });
}

export interface ParsedList {
  purchases: Purchase[];
  dropped: number;
  problem: 'none' | 'invalid_json' | 'not_array' | 'dropped_items';
}

/** Parses a raw stored string into valid purchases, reporting what was lost. */
export function parsePurchasesList(raw: string, extractor?: (parsed: unknown) => unknown): ParsedList {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { purchases: [], dropped: 0, problem: 'invalid_json' };
  }
  const arr = extractor ? extractor(parsed) : parsed;
  if (!Array.isArray(arr)) return { purchases: [], dropped: 0, problem: 'not_array' };

  const valid: Purchase[] = [];
  arr.forEach((item, i) => {
    const n = normalizePurchase(item, i);
    if (n) valid.push(n);
  });
  const dropped = arr.length - valid.length;
  return {
    purchases: ensureUniqueIds(valid),
    dropped,
    problem: dropped > 0 ? 'dropped_items' : 'none'
  };
}
