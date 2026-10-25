import { test, expect } from '@playwright/test';
import { rec, seed, goToTab } from './helpers';

test('settings has no currency picker and the UI never shows $ or € (F-19)', async ({ page }) => {
  await seed(page, [rec('a')]);
  await page.evaluate(() => localStorage.setItem('kama_ze_ole_user_settings_v1', JSON.stringify({ currency: '$' })));
  await page.reload();
  await goToTab(page, 'הגדרות');
  await expect(page.getByText('מטבע ראשי')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /דולר|אירו/ })).toHaveCount(0);
  for (const tab of ['סקירה', 'רכישות', 'חיסכון', 'הגדרות']) {
    await goToTab(page, tab);
    const text = await page.locator('main').innerText();
    expect(text, `tab ${tab}`).not.toMatch(/[$€]/);
  }
  await goToTab(page, 'סקירה');
  await expect(page.locator('main')).toContainText('₪');
});
