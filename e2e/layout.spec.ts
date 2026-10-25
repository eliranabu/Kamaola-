import { test, expect } from '@playwright/test';
import { rec, isoDaysAgo, seed, goToTab } from './helpers';

const WIDTHS = [320, 360, 390, 430, 768, 1024, 1280];
const TABS = ['סקירה', 'רכישות', 'חיסכון', 'הגדרות'];
const many = () => Array.from({ length: 12 }, (_, i) => rec(`p${i}`, isoDaysAgo(i * 3)));

for (const width of WIDTHS) {
  test(`no horizontal scroll at ${width}px on every screen (F-17)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await seed(page, many());
    for (const tab of TABS) {
      await goToTab(page, tab);
      await expect(page.locator('main h1')).toHaveCount(1);
      const { sw, cw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
      expect(sw, `${tab} @${width}`).toBeLessThanOrEqual(cw);
    }
  });
}

test.describe('phone (320px)', () => {
  test.use({ viewport: { width: 320, height: 700 } });

  test('insights are reachable and the add button is in the bottom bar', async ({ page }) => {
    await seed(page, many());
    const insights = page.getByRole('banner').getByRole('button', { name: 'תובנות חכמות' });
    await expect(insights).toBeVisible();
    const box = (await insights.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(320);
    expect(box.width).toBeGreaterThanOrEqual(44);

    await expect(page.getByRole('banner').getByRole('button', { name: 'הוספת רכישה חדשה' })).toBeHidden();
    await expect(page.getByRole('navigation', { name: 'ניווט תחתון למובייל' }).getByRole('button', { name: 'הוספת רכישה חדשה' })).toBeVisible();
  });

  test('nothing floats over the purchase list: last card is fully reachable above the bar', async ({ page }) => {
    await seed(page, many());
    await goToTab(page, 'רכישות');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const lastDelete = page.getByRole('button', { name: /מחיקת רכישה/ }).last();
    await lastDelete.scrollIntoViewIfNeeded();
    const del = (await lastDelete.boundingBox())!;
    const nav = (await page.getByRole('navigation', { name: 'ניווט תחתון למובייל' }).boundingBox())!;
    expect(del.y + del.height).toBeLessThanOrEqual(nav.y);

    // The add button lives inside the bar, so it cannot overlap any card action button
    const add = (await page.getByRole('navigation', { name: 'ניווט תחתון למובייל' }).getByRole('button', { name: 'הוספת רכישה חדשה' }).boundingBox())!;
    for (const b of await page.getByRole('button', { name: /(מחיקת|עריכת) רכישה/ }).all()) {
      const r = await b.boundingBox();
      if (!r) continue;
      const overlaps = r.x < add.x + add.width && r.x + r.width > add.x && r.y < add.y + add.height && r.y + r.height > add.y;
      expect(overlaps).toBe(false);
    }
  });

  test('add button opens the form', async ({ page }) => {
    await seed(page, many());
    await page.getByRole('navigation', { name: 'ניווט תחתון למובייל' }).getByRole('button', { name: 'הוספת רכישה חדשה' }).click();
    await expect(page.getByRole('dialog', { name: 'הוספת רכישה חדשה' })).toBeVisible();
  });
});
