import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { USER_KEY, rec, isoDaysAgo, seed, goToTab } from './helpers';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

/** Fails on Serious/Critical violations and on heading-order (the checks the audit flagged). */
async function expectAccessible(page: Page, label: string) {
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const blocking = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical' || v.id === 'heading-order');
  expect(blocking.map((v) => `${v.id} (${v.impact}) x${v.nodes.length}: ${v.nodes[0]?.target.join(' ')}`), label).toEqual([]);
}

const data = () => [rec('a', isoDaysAgo(0)), rec('b', isoDaysAgo(3)), rec('c', isoDaysAgo(40))];

for (const [name, size] of [['desktop', { width: 1280, height: 800 }], ['phone', { width: 390, height: 844 }]] as const) {
  test.describe(`axe - ${name}`, () => {
    test.use({ viewport: size });

    test('screens with data', async ({ page }) => {
      await seed(page, data());
      for (const tab of ['סקירה', 'רכישות', 'חיסכון', 'הגדרות']) {
        await goToTab(page, tab);
        await expect(page.locator('main h1')).toHaveCount(1);
        await expectAccessible(page, `${name}/${tab}`);
      }
    });

    test('empty state (new user)', async ({ page }) => {
      await page.goto('/');
      await page.evaluate(() => localStorage.clear());
      await page.reload();
      for (const tab of ['סקירה', 'רכישות', 'חיסכון']) {
        await goToTab(page, tab);
        await expectAccessible(page, `${name}/empty/${tab}`);
      }
    });

    test('dialogs', async ({ page }) => {
      await seed(page, data());
      // add purchase
      await page.getByRole('button', { name: 'הוספת רכישה חדשה' }).first().click();
      await expect(page.getByRole('dialog', { name: 'הוספת רכישה חדשה' })).toBeVisible();
      await expectAccessible(page, `${name}/add-dialog`);
      await page.keyboard.press('Escape');
      // delete confirm
      await goToTab(page, 'רכישות');
      await page.getByRole('button', { name: /מחיקת רכישה/ }).first().click();
      await expect(page.getByRole('alertdialog')).toBeVisible();
      await expectAccessible(page, `${name}/delete-dialog`);
      await page.keyboard.press('Escape');
      // reset
      await goToTab(page, 'הגדרות');
      await page.getByRole('button', { name: 'איפוס ומחיקת כל הנתונים שלי' }).click();
      await expect(page.getByRole('alertdialog')).toBeVisible();
      await expectAccessible(page, `${name}/reset-dialog`);
      await page.keyboard.press('Escape');
      // insights consent
      await page.getByRole('button', { name: 'תובנות חכמות' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await expectAccessible(page, `${name}/insights-dialog`);
    });
  });
}

test.describe('dialog behaviour (F-16)', () => {
  const openAdd = (page: Page) => page.getByRole('banner').getByRole('button', { name: 'הוספת רכישה חדשה' });

  test('focus is trapped, background inert, scroll locked, focus returns', async ({ page }) => {
    await seed(page, data());
    const opener = openAdd(page);
    await opener.focus();
    await opener.click();
    const dialog = page.getByRole('dialog', { name: 'הוספת רכישה חדשה' });
    await expect(dialog).toBeVisible();
    expect(await page.evaluate(() => document.getElementById('root')!.hasAttribute('inert'))).toBe(true);
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');

    for (const key of ['Tab', 'Shift+Tab']) {
      for (let i = 0; i < 25; i++) {
        await page.keyboard.press(key);
        expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]')), `${key} #${i}`).toBe(true);
      }
    }

    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    expect(await page.evaluate(() => document.getElementById('root')!.hasAttribute('inert'))).toBe(false);
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
    await expect(opener).toBeFocused();
  });

  test('typed input is never lost silently', async ({ page }) => {
    await seed(page, data());
    await openAdd(page).click();
    const dialog = page.getByRole('dialog', { name: 'הוספת רכישה חדשה' });
    await page.fill('#price-per-pack', '47');

    await page.mouse.click(5, 5); // backdrop tap does nothing
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape'); // asks first
    await expect(page.getByText('יש שינויים שלא נשמרו')).toBeVisible();
    await expect(page.getByRole('button', { name: 'המשך עריכה' })).toBeFocused();
    await page.getByRole('button', { name: 'המשך עריכה' }).click();
    await expect(page.locator('#price-per-pack')).toHaveValue('47');

    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'סגור בלי לשמור' }).click();
    await expect(dialog).toHaveCount(0);
    expect(await page.evaluate((k) => localStorage.getItem(k) && JSON.parse(localStorage.getItem(k)!).length, USER_KEY)).toBe(3);
  });

  test('an untouched form closes immediately', async ({ page }) => {
    await seed(page, data());
    await openAdd(page).click();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('delete confirmation focuses Cancel and returns focus', async ({ page }) => {
    await seed(page, data());
    await goToTab(page, 'רכישות');
    const del = page.getByRole('button', { name: /מחיקת רכישה/ }).first();
    await del.click();
    await expect(page.getByRole('button', { name: 'ביטול' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(del).toBeFocused();
  });
});

test.describe('toasts (F-16)', () => {
  test('live region always exists; errors persist, success fades', async ({ page }) => {
    await page.clock.install({ time: new Date() });
    await seed(page, data());
    expect(await page.locator('body > [aria-live="polite"]').count()).toBe(1); // present while empty

    await goToTab(page, 'הגדרות');
    await page.getByRole('button', { name: 'הפעלת מצב הדגמה' }).click();
    await expect(page.getByText('מצב הדגמה הופעל')).toBeVisible();
    await page.clock.fastForward(6000);
    await expect(page.getByText('מצב הדגמה הופעל')).toHaveCount(0); // info fades

    await page.evaluate(() => { Storage.prototype.setItem = () => { const e = new Error('q'); e.name = 'QuotaExceededError'; throw e; }; });
    await page.getByRole('button', { name: 'חזרה לרכישות האמיתיות שלי' }).click();
    await expect(page.getByText('זיכרון הדפדפן מלא').first()).toBeVisible();
    await page.clock.fastForward(60_000);
    await expect(page.getByText('זיכרון הדפדפן מלא').first()).toBeVisible(); // error persists
    await page.getByRole('button', { name: 'סגירת הודעה' }).first().click();
    await expect(page.getByText('זיכרון הדפדפן מלא')).toHaveCount(0);
  });
});
