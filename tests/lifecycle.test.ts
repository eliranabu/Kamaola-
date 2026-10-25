/** F-08 / F-12: day rollover helpers and reset semantics. */
import { check, finish, installLocalStorage } from './harness.ts';
import { msUntilNextMidnight, isSameLocalDay } from '../src/services/useNow.ts';
import { StorageService, USER_PURCHASES_KEY, DEMO_PURCHASES_KEY, USER_SETTINGS_KEY } from '../src/services/storage.ts';
import { IMPORT_BACKUP_KEY, USER_CORRUPT_KEY } from '../src/services/storage/keys.ts';

check('23:59:30 -> about 31s to the next midnight', msUntilNextMidnight(new Date(2026, 9, 25, 23, 59, 30)) === 31000);
check('00:00:00 -> a full day (+1s) until the next midnight', msUntilNextMidnight(new Date(2026, 9, 25, 0, 0, 0)) === 86401000);
check('month end rolls into the next month (Oct 31 -> Nov 1)', (() => {
  const ms = msUntilNextMidnight(new Date(2026, 9, 31, 12, 0, 0));
  return new Date(new Date(2026, 9, 31, 12, 0, 0).getTime() + ms).getMonth() === 10;
})());
check('never schedules less than one second', msUntilNextMidnight(new Date(2026, 9, 25, 23, 59, 59, 999)) >= 1000);
check('isSameLocalDay distinguishes days, ignores time', isSameLocalDay(new Date(2026, 9, 25, 0, 1), new Date(2026, 9, 25, 23, 59)) && !isSameLocalDay(new Date(2026, 9, 25, 23, 59), new Date(2026, 9, 26, 0, 1)));

const ls = installLocalStorage();
const s = new StorageService();
ls.store[USER_PURCHASES_KEY] = '[]';
ls.store[USER_SETTINGS_KEY] = '{}';
ls.store[USER_CORRUPT_KEY] = '[{"raw":"x"}]';
ls.store[IMPORT_BACKUP_KEY] = '{"raw":"[]"}';
ls.store[DEMO_PURCHASES_KEY] = '[]';
check('reset returns success', s.resetAllUserData().success);
check('reset removes purchases, settings and both safety copies', ![USER_PURCHASES_KEY, USER_SETTINGS_KEY, USER_CORRUPT_KEY, IMPORT_BACKUP_KEY].some((k) => k in ls.store));
check('reset leaves the demo sandbox alone', DEMO_PURCHASES_KEY in ls.store);

// A failing storage reports the failure (App keeps the dialog open and shows the error).
(globalThis as any).localStorage.removeItem = () => { const e = new Error('blocked'); e.name = 'SecurityError'; throw e; };
const failed = s.resetAllUserData();
check('reset failure is returned as an error result, not swallowed', !failed.success && failed.error.includes('הרשאה'));
(globalThis as any).localStorage.setItem = () => { const e = new Error('Quota'); e.name = 'QuotaExceededError'; throw e; };
check('saving settings failure is returned as an error result', !s.saveSettings({ isDemoModeActive: true }).success);

finish('lifecycle');
