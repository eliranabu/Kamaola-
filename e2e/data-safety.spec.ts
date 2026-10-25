import { test, expect } from '@playwright/test';
import fs from 'fs';
import { USER_KEY, rec, seed, openWithStorage, goToTab, storedIds } from './helpers';

test.describe('import (F-01)', () => {
  test('preview, cancel, merge, undo', async ({ page }, testInfo) => {
    await seed(page, [rec('keep')]);
    await goToTab(page, 'הגדרות');
    const path = testInfo.outputPath('imp.json');
    fs.writeFileSync(path, JSON.stringify({ purchases: [rec('n1'), rec('n2'), rec('bad', '2026-02-31')] }));

    await page.setInputFiles('input[type=file]', path);
    await expect(page.getByRole('dialog', { name: 'אישור שחזור מגיבוי' })).toBeVisible();
    expect(await storedIds(page)).toEqual(['keep']); // nothing written before confirmation
    await page.getByRole('button', { name: 'ביטול' }).click();
    expect(await storedIds(page)).toEqual(['keep']);

    await page.setInputFiles('input[type=file]', path);
    await page.getByRole('button', { name: 'מזג רכישות' }).click();
    await expect.poll(async () => (await storedIds(page)).sort().join()).toBe('keep,n1,n2'); // invalid date skipped

    await page.getByRole('button', { name: /בטל ייבוא אחרון/ }).click();
    await expect.poll(() => storedIds(page)).toEqual(['keep']);
  });

  test('import is disabled in demo mode', async ({ page }) => {
    await seed(page, [rec('keep')]);
    await goToTab(page, 'הגדרות');
    await page.getByRole('button', { name: 'הפעלת מצב הדגמה' }).click();
    await expect(page.getByRole('button', { name: /שחזור מגיבוי JSON/ })).toBeDisabled();
  });
});

test.describe('corrupt storage (F-02, F-03)', () => {
  test('invalid JSON: app renders, banner shown, raw data downloadable and identical', async ({ page }) => {
    const raw = '[{"id":"x","brand":"A",';
    await openWithStorage(page, raw);
    await expect(page.locator('main')).toBeVisible();
    await expect(page.getByText('הנתונים השמורים במכשיר פגומים')).toBeVisible();
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'הורדת עותק שחזור' }).click()]);
    expect(fs.readFileSync((await download.path())!, 'utf8')).toBe(raw);
  });

  test('mixed items: valid one survives and dropped count is reported', async ({ page }) => {
    await openWithStorage(page, JSON.stringify([null, rec('good'), { ...rec('b'), date: 5 }]));
    await expect(page.getByText('2 רכישות שמורות היו פגומות')).toBeVisible();
    await expect(page.getByText('לכל היסטוריית הרכישות (1)')).toBeVisible();
    expect(await page.evaluate((k) => localStorage.getItem(k) !== null, USER_KEY)).toBe(true);
  });
});
