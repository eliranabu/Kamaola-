/**
 * Safety copies. A raw string is persisted BEFORE anything may overwrite it,
 * so corrupt data and replaced data can always be recovered.
 */

import { StorageResult } from '../../types/index.ts';
import { DEMO_CORRUPT_KEY, IMPORT_BACKUP_KEY, USER_CORRUPT_KEY, USER_PURCHASES_KEY } from './keys.ts';

export interface CorruptBackup {
  at: number;
  reason: string;
  raw: string;
}

const MAX_CORRUPT_COPIES = 3;

const corruptKey = (isDemo: boolean) => (isDemo ? DEMO_CORRUPT_KEY : USER_CORRUPT_KEY);

export function readCorruptBackups(isDemo: boolean): CorruptBackup[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(corruptKey(isDemo)) || '[]');
    return Array.isArray(parsed) ? parsed.filter((b) => b && typeof b.raw === 'string') : [];
  } catch {
    return [];
  }
}

/** Keeps a copy of raw data we could not fully read. Returns false if it could not be saved. */
export function preserveCorruptRaw(isDemo: boolean, raw: string, reason: string): boolean {
  const existing = readCorruptBackups(isDemo);
  if (existing.some((b) => b.raw === raw)) return true;
  const next = [...existing, { at: Date.now(), reason, raw }].slice(-MAX_CORRUPT_COPIES);
  try {
    localStorage.setItem(corruptKey(isDemo), JSON.stringify(next));
    return true;
  } catch {
    return false;
  }
}

/** Snapshot of current user purchases (raw, even if null) taken before an import. */
export function saveImportBackup(): StorageResult<void> {
  try {
    const raw = localStorage.getItem(USER_PURCHASES_KEY);
    localStorage.setItem(IMPORT_BACKUP_KEY, JSON.stringify({ at: Date.now(), raw }));
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: 'לא ניתן ליצור גיבוי לפני הייבוא (אין מקום באחסון). הייבוא בוטל והנתונים שלך לא שונו.' };
  }
}

export function hasImportBackup(): boolean {
  return localStorage.getItem(IMPORT_BACKUP_KEY) !== null;
}

/** Restores the pre-import snapshot. */
export function restoreImportBackup(): StorageResult<void> {
  try {
    const stored = localStorage.getItem(IMPORT_BACKUP_KEY);
    if (stored === null) return { success: false, error: 'אין גיבוי לשחזור' };
    const { raw } = JSON.parse(stored);
    if (typeof raw === 'string') localStorage.setItem(USER_PURCHASES_KEY, raw);
    else localStorage.removeItem(USER_PURCHASES_KEY);
    localStorage.removeItem(IMPORT_BACKUP_KEY);
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: 'שחזור הגיבוי נכשל' };
  }
}
