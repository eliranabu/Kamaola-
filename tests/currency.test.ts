/** F-19: the shekel is the only currency - legacy $/€ settings are normalised and no output uses another symbol. */
import { check, finish, installLocalStorage } from './harness.ts';
import { StorageService, USER_SETTINGS_KEY, USER_PURCHASES_KEY } from '../src/services/storage.ts';
import { calculateMonthlyStats, CURRENCY_SYMBOL, formatCurrency, formatCurrencyExact } from '../src/services/calculations.ts';

const ls = installLocalStorage();
const s = new StorageService();

ls.store[USER_SETTINGS_KEY] = JSON.stringify({ currency: '$', weeklyPackGoal: 4 });
check('legacy "$" setting loads as the shekel (other settings kept)', s.getSettings().currency === '₪' && s.getSettings().weeklyPackGoal === 4);
ls.store[USER_SETTINGS_KEY] = JSON.stringify({ currency: '€' });
check('legacy "€" setting loads as the shekel', s.getSettings().currency === '₪');

const saved = s.saveSettings({ currency: '$' as unknown as '₪', weeklyPackGoal: 2 });
check('saving another currency is ignored', saved.success && saved.data.currency === '₪' && JSON.parse(ls.store[USER_SETTINGS_KEY]).currency === '₪');

ls.store[USER_PURCHASES_KEY] = JSON.stringify([{ id: 'a', brand: 'K', pricePerPack: 40, quantity: 1, totalPrice: 40, date: '2020-01-01', createdAt: 1 }]);
check('JSON export carries the shekel', JSON.parse(s.exportToJson()).currency === '₪');
const header = s.exportToCsv().split('\r\n')[0];
check('CSV headers use the shared symbol (and no $/€)', header.includes(`(${CURRENCY_SYMBOL})`) && !header.includes('$') && !header.includes('€'));

const month = calculateMonthlyStats(
  [{ id: 'p', brand: 'b', pricePerPack: 100, quantity: 1, totalPrice: 100, date: '2026-10-01', createdAt: 1 }],
  2026, 10, new Date(2026, 9, 10)
);
check('forecast message uses the shared symbol', month.projectionMessage!.includes(CURRENCY_SYMBOL));
check('formatters default to the shekel', formatCurrency(1234).endsWith('₪') && formatCurrencyExact(5.5).endsWith('₪'));

finish('currency');
