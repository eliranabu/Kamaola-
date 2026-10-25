/** F-02 / F-03: corrupt or malformed stored data must be preserved and must never crash reads. */
import { check, finish, installLocalStorage } from './harness.ts';
import { StorageService, USER_PURCHASES_KEY, DEMO_PURCHASES_KEY } from '../src/services/storage.ts';
import { USER_CORRUPT_KEY } from '../src/services/storage/keys.ts';
import { calculateMonthlyStats } from '../src/services/calculations.ts';

const ls = installLocalStorage();
const originalError = console.error;
console.error = () => {};
const good = { id: 'a', brand: 'A', pricePerPack: 39, quantity: 1, totalPrice: 39, date: '2026-10-01', createdAt: 1 };

// Truncated JSON is preserved before the next save overwrites it.
let s = new StorageService();
const truncated = '[{"id":"x","brand":"A","pricePerPack":39,"quantity":1,"totalPrice":39,"date":"2026-10-01",';
ls.store[USER_PURCHASES_KEY] = truncated;
check('invalid JSON reads as empty list without throwing', s.getPurchases(false).length === 0);
check('load issue reports invalid_json with a saved backup', s.getLoadIssue()?.reason === 'invalid_json' && s.getLoadIssue()?.backupSaved === true);
const save = s.savePurchase({ brand: 'New', pricePerPack: 40, quantity: 1, date: '2026-10-02' });
const backups = s.getCorruptBackups(false);
check('save succeeds AND the original corrupt raw string is still recoverable', save.success && backups.some((b) => b.raw === truncated));
check('corrupt backup is not duplicated on repeated reads', (s.getPurchases(false), s.getPurchases(false), s.getCorruptBackups(false).length === 1));

// A single bad item must not hide the good ones.
ls.reset();
s = new StorageService();
ls.store[USER_PURCHASES_KEY] = JSON.stringify([null, good, { ...good, id: 'b', date: 20261001 }, { ...good, id: 'c', quantity: 0 }, 'x']);
const loaded = s.getPurchases(false);
check('valid items survive next to null / numeric date / zero quantity / string items', loaded.length === 1 && loaded[0].id === 'a');
check('load issue reports the number of dropped items', s.getLoadIssue()?.reason === 'dropped_items' && s.getLoadIssue()?.dropped === 4);
check('raw array with dropped items is preserved as a recovery copy', s.getCorruptBackups(false)[0]?.raw === ls.store[USER_PURCHASES_KEY]);

// Calculations never crash on whatever storage returns (demo path used to).
ls.store[DEMO_PURCHASES_KEY] = JSON.stringify([null, { ...good, date: 5 }]);
let crashed = false;
try {
  calculateMonthlyStats(s.getPurchases(true), 2026, 10, new Date(2026, 9, 25));
} catch {
  crashed = true;
}
check('demo path with malformed items no longer crashes calculations', !crashed);

// Non-array JSON.
ls.reset();
s = new StorageService();
ls.store[USER_PURCHASES_KEY] = '{"oops":true}';
check('non-array JSON is preserved, not silently discarded', s.getPurchases(false).length === 0 && s.getLoadIssue()?.reason === 'not_array' && USER_CORRUPT_KEY in ls.store);

// Duplicate ids become unique so edit/delete hit exactly one record.
ls.reset();
s = new StorageService();
ls.store[USER_PURCHASES_KEY] = JSON.stringify([good, { ...good, brand: 'Dup' }]);
const dup = s.getPurchases(false);
check('duplicate ids are made unique', new Set(dup.map((p) => p.id)).size === 2);
s.deletePurchase(dup[1].id, false);
check('deleting one of two former duplicates removes exactly one', s.getPurchases(false).length === 1);

// Backup that cannot be written is reported, not hidden.
ls.reset();
s = new StorageService();
ls.failWritesForKey = USER_CORRUPT_KEY;
ls.store[USER_PURCHASES_KEY] = '[broken';
s.getPurchases(false);
check('failure to save the safety copy is reported (backupSaved=false)', s.getLoadIssue()?.backupSaved === false);

// Clean data reports no issue.
ls.reset();
s = new StorageService();
ls.store[USER_PURCHASES_KEY] = JSON.stringify([good]);
s.getPurchases(false);
check('clean data produces no load issue', s.getLoadIssue() === null);

console.error = originalError;
finish('storage.recovery');
