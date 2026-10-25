import { Page } from '@playwright/test';

export const USER_KEY = 'kama_ze_ole_user_purchases_v1';

export const isoDaysAgo = (days: number): string => {
  const d = new Date(Date.now() - days * 86400000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const rec = (id: string, date: string = isoDaysAgo(0)) => ({
  id, brand: 'Kent', pricePerPack: 40, quantity: 1, totalPrice: 40, date, createdAt: 1
});

/** Opens the app with the given raw localStorage value for user purchases. */
export async function openWithStorage(page: Page, raw: string | null): Promise<void> {
  await page.goto('/');
  await page.evaluate(([k, v]) => (v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v)), [USER_KEY, raw] as const);
  await page.reload();
}

export const seed = (page: Page, items: unknown[]) => openWithStorage(page, JSON.stringify(items));

export const goToTab = (page: Page, name: string) =>
  page.getByRole('navigation', { name: 'ניווט ראשי' }).getByText(name, { exact: true }).click();

export const storedIds = (page: Page) =>
  page.evaluate((k) => (JSON.parse(localStorage.getItem(k) || '[]') as { id: string }[]).map((x) => x.id), USER_KEY);
