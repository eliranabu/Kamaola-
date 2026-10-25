import { test, expect } from '@playwright/test';
import { USER_KEY, rec, seed, goToTab } from './helpers';

// Deterministic local midnight regardless of the machine's timezone
test.use({ timezoneId: 'Asia/Jerusalem' });

test('month rolls over at midnight without reload (F-08)', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-31T23:59:50+02:00') });
  await page.addInitScript(([k, v]) => { if (!localStorage.getItem(k)) localStorage.setItem(k, v); }, [USER_KEY, JSON.stringify([rec('a', '2026-10-31')])] as const);
  await page.goto('/');
  await expect(page.locator('main')).toContainText('ב־1 רכישות נפרדות החודש');
  await page.clock.fastForward(30_000);
  await expect(page.locator('main')).toContainText('ב־0 רכישות נפרדות החודש');
});

test('add-purchase form: shared limits, future date rejected, price remembered (F-09/10/11)', async ({ page }) => {
  await page.goto('/');
  const openAdd = () => page.getByRole('banner').getByRole('button', { name: 'הוספת רכישה חדשה' }).click();
  await openAdd();
  await expect(page.locator('#quantity-input')).toHaveAttribute('max', '500');

  const future = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
  await page.fill('#purchase-date', future);
  await page.getByRole('button', { name: 'שמירת רכישה' }).click();
  await expect(page.getByText('לא ניתן לתעד רכישה בתאריך עתידי')).toBeVisible();
  expect(await page.evaluate((k) => localStorage.getItem(k), USER_KEY)).toBeNull();

  await page.fill('#purchase-date', new Date().toISOString().slice(0, 10));
  await page.fill('#price-per-pack', '45');
  await page.getByRole('button', { name: 'שמירת רכישה' }).click();
  await openAdd();
  await expect(page.locator('#price-per-pack')).toHaveValue('45');
});

test('storage failures are reported, never faked as success (F-12)', async ({ page }) => {
  await seed(page, [rec('a')]);
  await goToTab(page, 'הגדרות');
  await page.evaluate(() => {
    (window as any).__si = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { const e = new Error('q'); e.name = 'QuotaExceededError'; throw e; };
  });
  await page.getByRole('button', { name: 'הפעלת מצב הדגמה' }).click();
  await expect(page.getByText('זיכרון הדפדפן מלא').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'הפעלת מצב הדגמה' })).toBeVisible(); // did not switch

  await page.evaluate(() => {
    Storage.prototype.setItem = (window as any).__si;
    (window as any).__ri = Storage.prototype.removeItem;
    Storage.prototype.removeItem = () => { const e = new Error('b'); e.name = 'SecurityError'; throw e; };
  });
  await page.getByRole('button', { name: 'איפוס ומחיקת כל הנתונים שלי' }).click();
  await page.getByRole('button', { name: 'כן, אפס את כל הרכישות שלי' }).click();
  await expect(page.getByText('הדפדפן חוסם גישה').first()).toBeVisible();
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await expect(page.getByText('כל הנתונים האישיים נמחקו בהצלחה')).toHaveCount(0);

  await page.evaluate(() => { Storage.prototype.removeItem = (window as any).__ri; });
  await page.getByRole('button', { name: 'כן, אפס את כל הרכישות שלי' }).click();
  await expect.poll(() => page.evaluate((k) => localStorage.getItem(k), USER_KEY)).toBeNull();
});
