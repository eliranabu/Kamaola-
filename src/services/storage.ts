/**
 * Local Data Storage Layer for "כמה זה עולה?"
 * Provides isolated storage for real user data, separate demo mode sandbox,
 * CSV/JSON export & import, robust error handling, and CSV injection protection.
 */

import { Purchase, UserSettings, StorageResult } from '../types/index.ts';
import { calculatePurchaseTotal, validatePurchaseData } from './calculations.ts';

export const USER_PURCHASES_KEY = 'kama_ze_ole_user_purchases_v1';
export const USER_SETTINGS_KEY = 'kama_ze_ole_user_settings_v1';
export const DEMO_PURCHASES_KEY = 'kama_ze_ole_demo_purchases_v1';

// Popular Israeli cigarette brands for instant auto-complete & price presets
export const POPULAR_ISRAELI_BRANDS = [
  'מרלבורו אדום (Marlboro Red)',
  'מרלבורו גולד (Marlboro Gold)',
  'פרלמנט נייט בלו (Parliament Night Blue)',
  'פרלמנט סילבר (Parliament Silver Blue)',
  'וינסטון כחול (Winston Blue)',
  'וינסטון אדום (Winston Red)',
  'קאמל צהוב (Camel Yellow)',
  'קאמל כחול (Camel Blue)',
  'קנט (Kent)',
  'אל אם אדום (L&M Red)',
  'אל אם כחול (L&M Blue)',
  'טיים (Time)',
  'נובלס (Noblesse)',
  'נקסט (Next)',
  'פאל מאל (Pall Mall)',
  'דבידוף (Davidoff)',
  'טבק לגלגול (Rolling Tobacco)'
];

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

/**
 * Realistic Israeli demo dataset for safe walkthroughs.
 * STRICTLY ISOLATED: Never mixed into user's real purchases!
 */
export const SAMPLE_DEMO_PURCHASES: Purchase[] = [
  {
    id: 'demo-1',
    brand: 'מרלבורו גולד (Marlboro Gold)',
    pricePerPack: 39,
    quantity: 1,
    totalPrice: 39,
    date: '2026-10-18',
    time: '14:30',
    location: 'קיוסק המרכז, תל אביב',
    note: 'הפסקה מהעבודה',
    createdAt: 1729254600000,
    isDemo: true
  },
  {
    id: 'demo-2',
    brand: 'מרלבורו גולד (Marlboro Gold)',
    pricePerPack: 39,
    quantity: 2,
    totalPrice: 78,
    date: '2026-10-15',
    time: '19:15',
    location: 'תחנת דלק פז',
    note: 'לקראת סוף שבוע',
    createdAt: 1729012500000,
    isDemo: true
  },
  {
    id: 'demo-3',
    brand: 'מרלבורו גולד (Marlboro Gold)',
    pricePerPack: 39,
    quantity: 1,
    totalPrice: 39,
    date: '2026-10-12',
    time: '09:00',
    location: 'פיצוצייה שכונתית',
    createdAt: 1728716400000,
    isDemo: true
  },
  {
    id: 'demo-4',
    brand: 'מרלבורו גולד (Marlboro Gold)',
    pricePerPack: 39,
    quantity: 2,
    totalPrice: 78,
    date: '2026-10-08',
    time: '17:45',
    location: 'סופר פארם',
    createdAt: 1728373500000,
    isDemo: true
  },
  {
    id: 'demo-5',
    brand: 'מרלבורו גולד (Marlboro Gold)',
    pricePerPack: 39,
    quantity: 1,
    totalPrice: 39,
    date: '2026-10-04',
    time: '11:20',
    createdAt: 1728026400000,
    isDemo: true
  },
  {
    id: 'demo-6',
    brand: 'מרלבורו גולד (Marlboro Gold)',
    pricePerPack: 39,
    quantity: 2,
    totalPrice: 78,
    date: '2026-10-01',
    time: '08:30',
    location: 'ילו מנטה',
    createdAt: 1727767800000,
    isDemo: true
  },
  // Previous month (September 2026) for comparison
  {
    id: 'demo-prev-1',
    brand: 'מרלבורו גולד (Marlboro Gold)',
    pricePerPack: 39,
    quantity: 10,
    totalPrice: 390,
    date: '2026-09-20',
    time: '16:00',
    note: 'קנייה מרוכזת (פקט)',
    createdAt: 1726838400000,
    isDemo: true
  },
  {
    id: 'demo-prev-2',
    brand: 'מרלבורו גולד (Marlboro Gold)',
    pricePerPack: 39,
    quantity: 10,
    totalPrice: 390,
    date: '2026-09-05',
    time: '12:00',
    note: 'קנייה מרוכזת (פקט)',
    createdAt: 1725537600000,
    isDemo: true
  }
];

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
  const trimmed = text.replace(/^[\s\x00-\x1f]+/, '');
  if (/^[=+\-@]/.test(trimmed)) {
    // Prepend single quote ' so spreadsheet apps treat it strictly as literal text
    text = `'${text}`;
  }

  // Standard CSV escaping: double any embedded double quotes
  const escaped = text.replace(/"/g, '""');
  return `"${escaped}"`;
}

export class StorageService {
  /**
   * Helper to format storage exceptions into helpful Hebrew messages.
   */
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

  /**
   * Loads purchases from local storage.
   * If isDemo is true, reads strictly from demo storage.
   */
  getPurchases(isDemo: boolean = false): Purchase[] {
    try {
      const storageKey = isDemo ? DEMO_PURCHASES_KEY : USER_PURCHASES_KEY;
      const raw = localStorage.getItem(storageKey);
      if (raw === null) {
        if (isDemo) {
          // Initialize demo sandbox on first activation
          this.seedDemoData();
          return [...SAMPLE_DEMO_PURCHASES];
        }
        return [];
      }
      const parsed: Purchase[] = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];

      // Strict demo isolation filter:
      if (!isDemo) {
        return parsed.filter((p) => !p.isDemo);
      }
      return parsed;
    } catch (e) {
      console.error('Error loading purchases from storage:', e);
      return [];
    }
  }

  /**
   * Saves all purchases to the specified storage key with full error handling.
   */
  private savePurchasesDirect(purchases: Purchase[], isDemo: boolean = false): StorageResult<void> {
    try {
      const storageKey = isDemo ? DEMO_PURCHASES_KEY : USER_PURCHASES_KEY;
      localStorage.setItem(storageKey, JSON.stringify(purchases));
      return { success: true, data: undefined };
    } catch (e: any) {
      const errorMsg = this.formatStorageError(e);
      console.error('Failed to write purchases to localStorage:', e);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Adds or updates a purchase.
   * Validates data and returns StorageResult<Purchase>.
   * Never mutates or leaves state in inconsistent state on failure.
   */
  savePurchase(
    data: Omit<Purchase, 'id' | 'totalPrice' | 'createdAt'> & { id?: string; createdAt?: number },
    isDemo: boolean = false
  ): StorageResult<Purchase> {
    // 1. Validate data
    const validation = validatePurchaseData(data);
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0] || 'נתוני הרכישה אינם תקינים';
      return { success: false, error: firstError };
    }

    const list = this.getPurchases(isDemo);
    const totalPrice = calculatePurchaseTotal(data.pricePerPack, data.quantity);
    const now = Date.now();

    let savedItem: Purchase;
    let updatedList: Purchase[];

    if (data.id) {
      // Edit existing
      const existingIndex = list.findIndex((p) => p.id === data.id);
      if (existingIndex !== -1) {
        savedItem = {
          ...list[existingIndex],
          ...data,
          id: data.id,
          totalPrice,
          updatedAt: now,
          isDemo: isDemo
        };
        updatedList = [...list];
        updatedList[existingIndex] = savedItem;
      } else {
        savedItem = {
          ...data,
          id: data.id,
          totalPrice,
          createdAt: data.createdAt || now,
          isDemo: isDemo
        };
        updatedList = [savedItem, ...list];
      }
    } else {
      // Create new
      savedItem = {
        ...data,
        id: `purch_${now}_${Math.random().toString(36).substring(2, 7)}`,
        totalPrice,
        createdAt: now,
        isDemo: isDemo
      };
      updatedList = [savedItem, ...list];
    }

    // 2. Persist to storage
    const writeResult = this.savePurchasesDirect(updatedList, isDemo);
    if (!writeResult.success) {
      return { success: false, error: writeResult.error };
    }

    // 3. Update last brand price preference (non-blocking)
    if (!isDemo && data.brand && data.pricePerPack) {
      this.updateLastBrandPrice(data.brand, data.pricePerPack);
    }

    return { success: true, data: savedItem };
  }

  /**
   * Deletes a purchase by ID with StorageResult return.
   */
  deletePurchase(id: string, isDemo: boolean = false): StorageResult<boolean> {
    const list = this.getPurchases(isDemo);
    const filtered = list.filter((p) => p.id !== id);
    if (filtered.length === list.length) {
      return { success: false, error: 'הרכישה המבוקשת למחיקה לא נמצאה' };
    }

    const writeResult = this.savePurchasesDirect(filtered, isDemo);
    if (!writeResult.success) {
      return { success: false, error: writeResult.error };
    }

    return { success: true, data: true };
  }

  /**
   * Gets user settings safely.
   */
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

  /**
   * Updates user settings safely without crashing on storage failure.
   */
  saveSettings(partial: Partial<UserSettings>): StorageResult<UserSettings> {
    try {
      const current = this.getSettings();
      const updated = { ...current, ...partial };
      localStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(updated));
      return { success: true, data: updated };
    } catch (e: any) {
      const errorMsg = this.formatStorageError(e);
      console.error('Failed to save settings:', e);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Stores the last entered price for a brand.
   */
  private updateLastBrandPrice(brand: string, price: number): void {
    const settings = this.getSettings();
    const lastBrandPrices = { ...settings.lastBrandPrices, [brand]: price };
    this.saveSettings({ lastBrandPrices });
  }

  /**
   * Exports purchases to structured JSON backup.
   */
  exportToJson(isDemo: boolean = false): string {
    const purchases = this.getPurchases(isDemo);
    const settings = this.getSettings();
    const payload = {
      app: 'כמה זה עולה?',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      currency: settings.currency,
      totalPurchases: purchases.length,
      purchases
    };
    return JSON.stringify(payload, null, 2);
  }

  /**
   * Imports and validates purchases from JSON backup.
   * Rejects malformed or corrupted data.
   */
  importFromJson(jsonString: string): { success: boolean; count: number; error?: string } {
    try {
      if (!jsonString || jsonString.trim().length === 0) {
        return { success: false, count: 0, error: 'הקובץ שהועלה ריק' };
      }

      const parsed = JSON.parse(jsonString);
      const rawPurchases = Array.isArray(parsed) ? parsed : parsed.purchases;

      if (!Array.isArray(rawPurchases)) {
        return { success: false, count: 0, error: 'פורמט הקובץ אינו תקין - לא נמצאה רשימת רכישות' };
      }

      const validatedPurchases: Purchase[] = [];

      for (let i = 0; i < rawPurchases.length; i++) {
        const item = rawPurchases[i];
        if (!item || typeof item !== 'object') continue;

        const brand = typeof item.brand === 'string' ? item.brand.trim() : '';
        const pricePerPack = Number(item.pricePerPack);
        const quantity = Number(item.quantity);
        const date = typeof item.date === 'string' ? item.date.trim() : '';

        // Validate essentials
        if (
          brand.length > 0 &&
          !isNaN(pricePerPack) &&
          pricePerPack > 0 &&
          pricePerPack <= 1000 &&
          !isNaN(quantity) &&
          Number.isInteger(quantity) &&
          quantity >= 1 &&
          quantity <= 500 &&
          /^\d{4}-\d{2}-\d{2}$/.test(date)
        ) {
          const totalPrice = calculatePurchaseTotal(pricePerPack, quantity);
          validatedPurchases.push({
            id: item.id || `purch_imp_${Date.now()}_${i}`,
            brand,
            pricePerPack,
            quantity,
            totalPrice,
            date,
            time: typeof item.time === 'string' ? item.time : undefined,
            location: typeof item.location === 'string' ? item.location : undefined,
            note: typeof item.note === 'string' ? item.note : undefined,
            createdAt: typeof item.createdAt === 'number' ? item.createdAt : Date.now(),
            isDemo: false
          });
        }
      }

      if (validatedPurchases.length === 0) {
        return { success: false, count: 0, error: 'לא נמצאו רכישות תקינות לייבוא בקובץ' };
      }

      // Save directly to user storage
      const writeResult = this.savePurchasesDirect(validatedPurchases, false);
      if (!writeResult.success) {
        return { success: false, count: 0, error: writeResult.error };
      }

      return { success: true, count: validatedPurchases.length };
    } catch (e: any) {
      return { success: false, count: 0, error: `שגיאה בפענוח קובץ ה-JSON: ${e?.message || 'קובץ שגוי'}` };
    }
  }

  /**
   * Generates CSV string with UTF-8 BOM and formula injection protection.
   */
  exportToCsv(isDemo: boolean = false): string {
    const purchases = this.getPurchases(isDemo);
    const headers = [
      'תאריך',
      'שעה',
      'מותג',
      'מחיר לחפיסה (₪)',
      'מספר חפיסות',
      'סך הכל (₪)',
      'מקום רכישה',
      'הערה'
    ];

    const rows = purchases.map((p) => [
      sanitizeCsvField(p.date, false),
      sanitizeCsvField(p.time || '', false),
      sanitizeCsvField(p.brand, false),
      sanitizeCsvField(p.pricePerPack, true),
      sanitizeCsvField(p.quantity, true),
      sanitizeCsvField(p.totalPrice, true),
      sanitizeCsvField(p.location || '', false),
      sanitizeCsvField(p.note || '', false)
    ].join(','));

    // Prepend UTF-8 BOM (\uFEFF) so Excel opens Hebrew text properly
    return '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  }

  /**
   * Completely clears user data with safety guarantees.
   * Does NOT touch demo sandbox.
   */
  resetAllUserData(): StorageResult<void> {
    try {
      localStorage.removeItem(USER_PURCHASES_KEY);
      localStorage.removeItem(USER_SETTINGS_KEY);
      return { success: true, data: undefined };
    } catch (e: any) {
      return { success: false, error: this.formatStorageError(e) };
    }
  }

  /**
   * Clears demo data sandbox only. Real user data is completely untouched.
   * Explicitly sets to empty array so it does not auto-recreate demo data on reload.
   */
  resetDemoData(): StorageResult<void> {
    try {
      localStorage.setItem(DEMO_PURCHASES_KEY, JSON.stringify([]));
      return { success: true, data: undefined };
    } catch (e: any) {
      return { success: false, error: this.formatStorageError(e) };
    }
  }

  /**
   * Explicitly seeds demo sandbox when user requests to populate/repopulate demo data.
   */
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
