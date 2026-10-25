/**
 * Data contracts and TypeScript types for "כמה זה עולה?"
 */

export interface Purchase {
  id: string;
  brand: string;
  pricePerPack: number;
  quantity: number;
  totalPrice: number;
  date: string; // ISO date string: YYYY-MM-DD
  time?: string; // HH:mm format (optional)
  location?: string; // Optional purchase location
  note?: string; // Optional note
  createdAt: number; // Unix timestamp
  updatedAt?: number;
  isDemo?: boolean; // STRICT tag for demo isolation
}

export interface UserSettings {
  currency: '₪' | '$' | '€';
  isDemoModeActive: boolean;
  lastBrandPrices: Record<string, number>;
  selectedMonthFilter?: string; // YYYY-MM
  selectedBrandFilter?: string;
  weeklyPackGoal?: number; // Weekly packs reduction target (e.g. 3 packs)
}

export interface WeeklyGoalStats {
  hasGoal: boolean;
  weeklyPackGoal: number;
  currentWeekPacks: number;
  currentWeekSpent: number;
  percentUsed: number;
  status: 'on_track' | 'near_limit' | 'exceeded';
  statusMessage: string;
}

export type StorageResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export interface MonthlySummary {
  monthKey: string; // YYYY-MM
  year: number;
  month: number; // 1-12
  monthNameHe: string;
  totalSpent: number;
  totalPacks: number;
  purchaseCount: number;
  dailyAverage: number;
  projectedTotal: number | null; // Null if not current month or insufficient days
  projectionStatus: 'ready' | 'insufficient_days' | 'no_data' | 'past_month';
  projectionMessage?: string;
  isCurrentMonth: boolean;
  hasData: boolean;
  daysInMonth: number;
  daysConsidered: number;
}

export interface YearlySummary {
  year: number;
  totalSpent: number;
  totalPacks: number;
  averagePricePerPack: number;
  projectedYearTotal: number | null; // Null until enough tracked days exist
  trackedDays: number; // Days counted from tracking start (current year only)
  hasData: boolean;
}

export interface SavingsSimulation {
  percentage: number;
  currentMonthlySpending: number;
  newMonthlySpending: number;
  monthlySaved: number;
  annualSaved: number;
  threeYearsSaved: number;
  fiveYearsSaved: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export type ActiveTab = 'dashboard' | 'purchases' | 'savings' | 'settings';
