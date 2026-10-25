/**
 * Local data layer for "כמה זה עולה?".
 * Real user data and the demo sandbox are isolated. Reads are defensive
 * (bad items are dropped, raw data is preserved before any overwrite) and
 * imports are previewed, backed up and undoable. Helpers live in ./storage/*.
 */

import { Purchase, UserSettings, StorageResult } from '../types/index.ts';
import { calculatePurchaseTotal, validatePurchaseData } from './calculations.ts';
import {
  DEMO_PURCHASES_KEY,
  IMPORT_BACKUP_KEY,
  USER_CORRUPT_KEY,
  USER_PURCHASES_KEY,
  USER_SETTINGS_KEY
} from './storage/keys.ts';
import { POPULAR_ISRAELI_BRANDS, SAMPLE_DEMO_PURCHASES } from './storage/demoData.ts';
import { buildCsv } from './storage/csv.ts';
import { parsePurchasesList } from './storage/normalize.ts';
import {
  CorruptBackup,
  hasImportBackup,
  preserveCorruptRaw,
  readCorruptBackups,
  restoreImportBackup,
  saveImportBackup
} from './storage/backups.ts';
import { ParsedImport, buildJsonExport, mergePurchases, parseImportFile } from './storage/transfer.ts';

export { USER_PURCHASES_KEY, USER_SETTINGS_KEY, DEMO_PURCHASES_KEY } from './storage/keys.ts';
export { POPULAR_ISRAELI_BRANDS, SAMPLE_DEMO_PURCHASES } from './storage/demoData.ts';
export { sanitizeCsvField } from './storage/csv.ts';

const DEFAULT_SETTINGS: UserSettings = {
  currency: '₪',
  isDemoModeActive: false,
  lastBrandPrices: {
    'מרלבורו אדום (Marlboro Red)': 39,
    'מרלבורו גולד (Marlboro Gold)': 39,
    'פרלמנט נייט בלו (Parliament Night Blue)': 42,
    'וינסטון כחול (Winston Blue)': 36,
    'קאמל צהוב (Camel Yellow)': 36
  }
};

export type ImportMode = 'merge' | 'replace';

export interface ImportPreview extends ParsedImport {
  existingCount: number;
  newCount: number;
  duplicateCount: number;
}

export interface LoadIssue {
  isDemo: boolean;
  reason: string;
  dropped: number;
  backupSaved: boolean;
}

export class StorageService {
  private loadIssue: LoadIssue | null = null;

  private formatStorageError(e: any): string {
    if (!e) return 'שגיאה בלתי צפויה בשמירת הנתונים בדפדפן.';
    if (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014) {
      return 'שגיאת שטח אחסון: זיכרון הדפדפן מלא (Quota Exceeded). לא ניתן לשמור את הרכישה ללא פינוי מקום במכשיר.';
    }
    if (e.name === 'SecurityError') {
      return 'שגיאת הרשאה: הדפדפן חוסם גישה לאחסון מקומי (למשל במצב גלישה פרטית מחמיר).';
    }
    return `שגיאת שמירה באחסון המקומי: ${e.message || 'הפעולה נכשלה'}`;
  }

  /** Last problem found while reading storage (null if the data was clean). */
  getLoadIssue(): LoadIssue | null {
    return this.loadIssue;
  }

  getCorruptBackups(isDemo: boolean = false): CorruptBackup[] {
    return readCorruptBackups(isDemo);
  }

  /** Loads purchases; demo=true reads strictly from the demo sandbox. */
  getPurchases(isDemo: boolean = false): Purchase[] {
    try {
      const raw = localStorage.getItem(isDemo ? DEMO_PURCHASES_KEY : USER_PURCHASES_KEY);
      if (raw === null) {
        if (isDemo) {
          this.seedDemoData();
          return [...SAMPLE_DEMO_PURCHASES];
        }
        return [];
      }
      const parsed = parsePurchasesList(raw);
      if (parsed.problem !== 'none') {
        const backupSaved = preserveCorruptRaw(isDemo, raw, parsed.problem);
        this.loadIssue = { isDemo, reason: parsed.problem, dropped: parsed.dropped, backupSaved };
        console.error('Purchases storage problem:', parsed.problem, 'dropped:', parsed.dropped);
      } else if (this.loadIssue?.isDemo === isDemo) {
        this.loadIssue = null;
      }
      return isDemo ? parsed.purchases : parsed.purchases.filter((p) => !p.isDemo);
    } catch (e) {
      console.error('Error loading purchases from storage:', e);
      return [];
    }
  }

  private savePurchasesDirect(purchases: Purchase[], isDemo: boolean = false): StorageResult<void> {
    try {
      localStorage.setItem(isDemo ? DEMO_PURCHASES_KEY : USER_PURCHASES_KEY, JSON.stringify(purchases));
      return { success: true, data: undefined };
    } catch (e: any) {
      console.error('Failed to write purchases to localStorage:', e);
      return { success: false, error: this.formatStorageError(e) };
    }
  }

  /** Adds or updates a purchase. Never leaves state inconsistent on failure. */
  savePurchase(
    data: Omit<Purchase, 'id' | 'totalPrice' | 'createdAt'> & { id?: string; createdAt?: number },
    isDemo: boolean = false
  ): StorageResult<Purchase> {
    const validation = validatePurchaseData(data);
    if (!validation.isValid) {
      return { success: false, error: Object.values(validation.errors)[0] || 'נתוני הרכישה אינם תקינים' };
    }

    const list = this.getPurchases(isDemo);
    const totalPrice = calculatePurchaseTotal(data.pricePerPack, data.quantity);
    const now = Date.now();
    let savedItem: Purchase;
    let updatedList: Purchase[];

    const existingIndex = data.id ? list.findIndex((p) => p.id === data.id) : -1;
    if (data.id && existingIndex !== -1) {
      savedItem = { ...list[existingIndex], ...data, id: data.id, totalPrice, updatedAt: now, isDemo };
      updatedList = [...list];
      updatedList[existingIndex] = savedItem;
    } else {
      savedItem = {
        ...data,
        id: data.id || `purch_${now}_${Math.random().toString(36).substring(2, 7)}`,
        totalPrice,
        createdAt: data.createdAt || now,
        isDemo
      };
      updatedList = [savedItem, ...list];
    }

    const writeResult = this.savePurchasesDirect(updatedList, isDemo);
    if (!writeResult.success) return { success: false, error: writeResult.error };

    if (!isDemo && data.brand && data.pricePerPack) {
      this.updateLastBrandPrice(data.brand, data.pricePerPack);
    }
    return { success: true, data: savedItem };
  }

  deletePurchase(id: string, isDemo: boolean = false): StorageResult<boolean> {
    const list = this.getPurchases(isDemo);
    const filtered = list.filter((p) => p.id !== id);
    if (filtered.length === list.length) {
      return { success: false, error: 'הרכישה המבוקשת למחיקה לא נמצאה' };
    }
    const writeResult = this.savePurchasesDirect(filtered, isDemo);
    if (!writeResult.success) return { success: false, error: writeResult.error };
    return { success: true, data: true };
  }

  getSettings(): UserSettings {
    try {
      const raw = localStorage.getItem(USER_SETTINGS_KEY);
      if (!raw) return { ...DEFAULT_SETTINGS };
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch (e) {
      console.error('Error loading user settings:', e);
      return { ...DEFAULT_SETTINGS };
    }
  }

  saveSettings(partial: Partial<UserSettings>): StorageResult<UserSettings> {
    try {
      const updated = { ...this.getSettings(), ...partial };
      localStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(updated));
      return { success: true, data: updated };
    } catch (e: any) {
      console.error('Failed to save settings:', e);
      return { success: false, error: this.formatStorageError(e) };
    }
  }

  private updateLastBrandPrice(brand: string, price: number): void {
    const lastBrandPrices = { ...this.getSettings().lastBrandPrices, [brand]: price };
    this.saveSettings({ lastBrandPrices });
  }

  exportToJson(isDemo: boolean = false): string {
    return buildJsonExport(this.getPurchases(isDemo), this.getSettings().currency);
  }

  exportToCsv(isDemo: boolean = false): string {
    return buildCsv(this.getPurchases(isDemo));
  }

  /** Step 1 of import: validate a file and report what would change. Writes nothing. */
  previewImport(content: string): ImportPreview {
    const parsed = parseImportFile(content);
    const existing = this.getPurchases(false);
    if (!parsed.success) return { ...parsed, existingCount: existing.length, newCount: 0, duplicateCount: 0 };
    const { added, duplicates } = mergePurchases(existing, parsed.purchases);
    return { ...parsed, existingCount: existing.length, newCount: added, duplicateCount: duplicates };
  }

  /**
   * Step 2 of import: snapshot current data (abort if impossible), then merge or replace.
   * Always targets real user data - callers must not offer it in demo mode.
   */
  applyImport(purchases: Purchase[], mode: ImportMode): StorageResult<{ count: number; added: number }> {
    const backup = saveImportBackup();
    if (!backup.success) return { success: false, error: backup.error };

    const existing = mode === 'merge' ? this.getPurchases(false) : [];
    const { merged, added } = mergePurchases(existing, purchases);
    const write = this.savePurchasesDirect(merged, false);
    if (!write.success) return { success: false, error: write.error };
    return { success: true, data: { count: merged.length, added } };
  }

  hasImportBackup(): boolean {
    return hasImportBackup();
  }

  undoLastImport(): StorageResult<void> {
    return restoreImportBackup();
  }

  /** Legacy one-shot import (replace semantics, with backup). */
  importFromJson(jsonString: string): { success: boolean; count: number; error?: string } {
    const parsed = parseImportFile(jsonString);
    if (!parsed.success) return { success: false, count: 0, error: parsed.error };
    const result = this.applyImport(parsed.purchases, 'replace');
    if (!result.success) return { success: false, count: 0, error: result.error };
    return { success: true, count: result.data.count };
  }

  /**
   * Clears real user data only (purchases, settings and the safety copies that contain
   * purchase data - the user asked for a full delete). Demo sandbox is untouched.
   */
  resetAllUserData(): StorageResult<void> {
    try {
      localStorage.removeItem(USER_PURCHASES_KEY);
      localStorage.removeItem(USER_SETTINGS_KEY);
      localStorage.removeItem(USER_CORRUPT_KEY);
      localStorage.removeItem(IMPORT_BACKUP_KEY);
      this.loadIssue = null;
      return { success: true, data: undefined };
    } catch (e: any) {
      return { success: false, error: this.formatStorageError(e) };
    }
  }

  /** Clears the demo sandbox only (explicit empty array so it is not re-seeded). */
  resetDemoData(): StorageResult<void> {
    try {
      localStorage.setItem(DEMO_PURCHASES_KEY, JSON.stringify([]));
      return { success: true, data: undefined };
    } catch (e: any) {
      return { success: false, error: this.formatStorageError(e) };
    }
  }

  seedDemoData(): StorageResult<void> {
    try {
      localStorage.setItem(DEMO_PURCHASES_KEY, JSON.stringify(SAMPLE_DEMO_PURCHASES));
      return { success: true, data: undefined };
    } catch (e: any) {
      return { success: false, error: this.formatStorageError(e) };
    }
  }
}

export const storage = new StorageService();
