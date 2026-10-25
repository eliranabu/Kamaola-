import { test, expect } from '@playwright/test';
import { rec, seed } from './helpers';

test('insights send nothing before explicit consent (F-04)', async ({ page }) => {
  const apiCalls: string[] = [];
  page.on('request', (r) => { if (r.url().includes('/api/')) apiCalls.push(r.url()); });
  await seed(page, [rec('a')]);

  await page.getByRole('button', { name: 'פתיחת תובנות פיננסיות חכמות' }).click();
  await expect(page.getByText('יישלחו לשרת האפליקציה')).toBeVisible();
  expect(apiCalls).toHaveLength(0);

  await page.getByRole('button', { name: 'אישור ושליחה' }).click();
  // No API key in the test server -> honest "unavailable" notice, never canned AI text
  await expect(page.getByText('שירות התובנות אינו זמין כרגע')).toBeVisible();
  expect(apiCalls).toHaveLength(1);

  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'פתיחת תובנות פיננסיות חכמות' }).click();
  await expect(page.getByRole('button', { name: 'אישור ושליחה' })).toBeVisible(); // asks again
});
