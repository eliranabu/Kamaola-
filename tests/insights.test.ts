/** F-04 / F-03: insights payload is aggregate-only, responses are validated, UI pieces render. */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { check, finish, installLocalStorage } from './harness.ts';
import { buildInsightsPayload, parseInsights, buildFallbackInsights, fetchInsights } from '../src/services/insights.ts';
import { calculateMonthlyStats, calculateYearlyStats } from '../src/services/calculations.ts';
import { buildRawDump } from '../src/services/rawDump.ts';
import { ErrorBoundary } from '../src/components/ErrorBoundary.tsx';
import { DataRecoveryBanner } from '../src/components/DataRecoveryBanner.tsx';
import { ImportSection } from '../src/components/ImportSection.tsx';

const ls = installLocalStorage();
const p = { id: 'i', brand: 'SECRET-BRAND', pricePerPack: 40, quantity: 1, totalPrice: 40, date: '2026-10-01', note: 'SECRET-NOTE', createdAt: 1 };
const ref = new Date(2026, 9, 25);
const payload = buildInsightsPayload(calculateMonthlyStats([p], 2026, 10, ref), calculateYearlyStats([p], 2026, ref), '₪');

check('payload has only the five aggregate fields', Object.keys(payload).sort().join() === 'currency,dailyAverage,projectedAnnual,totalMonthlySpent,totalPacks');
check('payload contains no brand/note/date', !JSON.stringify(payload).includes('SECRET') && !JSON.stringify(payload).includes('2026-10'));

const ok = { summary: 's', tips: ['a', 'b'], milestoneIdea: 'm' };
check('valid response accepted', parseInsights(ok)?.tips.length === 2);
check('missing tips rejected', parseInsights({ summary: 's' }) === null);
check('error JSON rejected', parseInsights({ error: 'quota' }) === null);
check('null / string / array rejected', parseInsights(null) === null && parseInsights('x') === null && parseInsights([]) === null);
check('non-string tips are filtered; all invalid -> rejected', parseInsights({ ...ok, tips: ['a', 5, null] })?.tips.length === 1 && parseInsights({ ...ok, tips: [1, 2] }) === null);
check('missing milestoneIdea becomes empty string', parseInsights({ summary: 's', tips: ['a'] })?.milestoneIdea === '');
const fb = buildFallbackInsights(123.4, '$');
check('fallback uses the selected currency and no invented figures', fb.summary.includes('$') && !fb.summary.includes('₪') && !JSON.stringify(fb).includes('4,000'));

(globalThis as any).fetch = async () => ({ ok: false, json: async () => ({}) });
check('fetch: non-OK response -> null', (await fetchInsights(payload)) === null);
(globalThis as any).fetch = async () => ({ ok: true, json: async () => { throw new Error('html'); } });
check('fetch: non-JSON body -> null', (await fetchInsights(payload)) === null);
(globalThis as any).fetch = async () => ({ ok: true, json: async () => ({ weird: 1 }) });
check('fetch: wrong shape -> null', (await fetchInsights(payload)) === null);
(globalThis as any).fetch = async () => ({ ok: true, json: async () => ok });
check('fetch: valid shape -> data', (await fetchInsights(payload))?.summary === 's');

// ErrorBoundary.
check('getDerivedStateFromError captures the error', ErrorBoundary.getDerivedStateFromError(new Error('x')).error?.message === 'x');
const healthy = new ErrorBoundary({ children: createElement('p', null, 'child') });
check('healthy boundary renders its children', renderToStaticMarkup(healthy.render() as any) === '<p>child</p>');
const broken = new ErrorBoundary({ children: null });
broken.state = { error: new Error('boom') };
const html = renderToStaticMarkup(broken.render() as any);
check('broken boundary shows a Hebrew recovery screen with retry + raw export', html.includes('משהו השתבש') && html.includes('ניסיון חוזר') && html.includes('הורדת עותק גולמי'));

ls.store['kama_ze_ole_user_purchases_v1'] = '[broken';
ls.store['unrelated_key'] = 'x';
const dump = JSON.parse(buildRawDump());
check('raw dump contains app keys verbatim and ignores other keys', dump.data['kama_ze_ole_user_purchases_v1'] === '[broken' && !('unrelated_key' in dump.data));

// Recovery banner & import section.
const banner = renderToStaticMarkup(createElement(DataRecoveryBanner, { issue: { isDemo: false, reason: 'dropped_items', dropped: 3, backupSaved: true }, backups: [{ at: 1, reason: 'x', raw: '[]' }], onDismiss: () => {} }));
check('banner states how many items were dropped and offers the recovery download', banner.includes('3 רכישות') && banner.includes('הורדת עותק שחזור'));
const noBackup = renderToStaticMarkup(createElement(DataRecoveryBanner, { issue: { isDemo: false, reason: 'invalid_json', dropped: 0, backupSaved: false }, backups: [], onDismiss: () => {} }));
check('banner warns when the safety copy could not be saved', noBackup.includes('לא הצלחנו לשמור עותק'));
const demoImport = renderToStaticMarkup(createElement(ImportSection, { isDemoActive: true, onRefreshData: () => {}, onStatus: () => {} }));
check('import button is disabled in demo mode', /<button[^>]*\sdisabled=""/.test(demoImport) && demoImport.includes('לא זמין במצב הדגמה'));
const realImport = renderToStaticMarkup(createElement(ImportSection, { isDemoActive: false, onRefreshData: () => {}, onStatus: () => {} }));
check('import button is enabled with real data', !/<button[^>]*\sdisabled=""/.test(realImport));

finish('insights');
