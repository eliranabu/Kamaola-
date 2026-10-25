import { test, expect, Page } from '@playwright/test';
import { rec, isoDaysAgo, seed, goToTab } from './helpers';

// Run with the real service worker so CSP (worker-src) and precaching are exercised too
test.use({ serviceWorkers: 'allow' });

const data = () => [rec('a', isoDaysAgo(0)), rec('b', isoDaysAgo(4)), rec('c', isoDaysAgo(35))];

async function tour(page: Page) {
  for (const tab of ['רכישות', 'חיסכון', 'הגדרות', 'סקירה']) await goToTab(page, tab);
  await page.getByRole('banner').getByRole('button', { name: 'תובנות חכמות' }).click();
  await page.keyboard.press('Escape');
}

test('no third-party requests and no console/CSP errors (F-18)', async ({ page, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  const foreign: string[] = [];
  const problems: string[] = [];
  page.on('request', (r) => { if (!r.url().startsWith(origin) && !r.url().startsWith('data:')) foreign.push(r.url()); });
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(`${m.type()}: ${m.text()}`); });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));

  const response = await page.goto('/');
  const csp = response!.headers()['content-security-policy'];
  expect(csp).toContain("default-src 'self'");
  expect(csp).toContain("frame-ancestors 'none'");

  await seed(page, data());
  await tour(page);
  await page.evaluate(() => document.fonts.ready);

  expect(foreign).toEqual([]);
  expect(problems).toEqual([]);
});

test('Hebrew font is self-hosted and actually used', async ({ page, baseURL }) => {
  const fontFiles: string[] = [];
  page.on('response', (r) => { if (/heebo-.*\.woff2/.test(r.url())) fontFiles.push(r.url()); });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.fonts.check('16px "Heebo Variable"', 'שלום'))).toBe(true);
  expect(fontFiles.some((u) => u.includes('hebrew') && u.startsWith(baseURL!))).toBe(true);
  expect(await page.evaluate(() => getComputedStyle(document.body).fontFamily)).toContain('Heebo Variable');
});

test('manifest and icons are installable (F-18)', async ({ page, request }) => {
  const manifest = await (await request.get('/manifest.webmanifest')).json();
  expect(manifest.lang).toBe('he');
  expect(manifest.dir).toBe('rtl');
  expect(manifest.display).toBe('standalone');
  expect(manifest.orientation ?? 'any').toBe('any'); // no portrait lock
  const purposes = manifest.icons.map((i: { purpose: string }) => i.purpose);
  expect(purposes).toContain('any');
  expect(purposes).toContain('maskable');

  const any = await request.get('/pwa-512x512.png');
  const maskable = await request.get('/pwa-maskable-512x512.png');
  expect((await any.body()).equals(await maskable.body())).toBe(false);

  // Maskable icons are cropped by the OS: all corners must be opaque (full-bleed), unlike the rounded 'any' icon.
  await page.goto('/');
  const alpha = (path: string) =>
    page.evaluate(async (src) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      return [[0, 0], [img.width - 1, 0], [0, img.height - 1], [img.width - 1, img.height - 1]].map(([x, y]) => ctx.getImageData(x, y, 1, 1).data[3]);
    }, path);
  expect(await alpha('/pwa-maskable-512x512.png')).toEqual([255, 255, 255, 255]);
  expect((await alpha('/pwa-512x512.png')).every((a) => a < 255)).toBe(true);
});

test.describe('offline', () => {
  test('the installed app starts without a network connection', async ({ page, context }) => {
    await page.goto('/');
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload(); // let the new worker take control and finish precaching
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    await context.setOffline(true);
    await page.reload();
    await expect(page.locator('main h1')).toHaveCount(1);
    await expect(page.getByText('מצב לא מקוון')).toBeVisible();
    await context.setOffline(false);
  });
});
