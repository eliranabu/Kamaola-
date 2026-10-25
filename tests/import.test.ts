/** F-01 / F-09 / F-10: import is previewed, backed up, undoable, and strictly validated. */
import { check, finish, installLocalStorage } from './harness.ts';
import { StorageService, USER_PURCHASES_KEY, DEMO_PURCHASES_KEY } from '../src/services/storage.ts';
import { IMPORT_BACKUP_KEY } from '../src/services/storage/keys.ts';
import { MAX_IMPORT_CHARS } from '../src/services/storage/transfer.ts';

const ls = installLocalStorage();
const rec = (id: string, over: Record<string, unknown> = {}) => ({
  id, brand: 'Kent', pricePerPack: 40, quantity: 1, totalPrice: 40, date: '2026-10-01', createdAt: 1, ...over
});
const file = (items: unknown[]) => JSON.stringify({ purchases: items });

function fresh(existing: unknown[] = [rec('keep')]) {
  ls.reset();
  ls.store[USER_PURCHASES_KEY] = JSON.stringify(existing);
  ls.store[DEMO_PURCHASES_KEY] = JSON.stringify([rec('demo-1', { isDemo: true })]);
  return new StorageService();
}

// Preview writes nothing.
let s = fresh();
const before = ls.store[USER_PURCHASES_KEY];
const pv = s.previewImport(file([rec('n1'), rec('n2')]));
check('preview reports counts and writes nothing', pv.success && pv.newCount === 2 && pv.existingCount === 1 && ls.store[USER_PURCHASES_KEY] === before && !(IMPORT_BACKUP_KEY in ls.store));

// Merge keeps existing records.
let res = s.applyImport(pv.purchases, 'merge');
check('merge keeps the existing record and adds the new ones', res.success && s.getPurchases(false).map((p) => p.id).sort().join() === 'keep,n1,n2');
check('merge creates an automatic backup', IMPORT_BACKUP_KEY in ls.store);

// Undo restores the exact previous raw data.
check('undo restores the exact pre-import data', s.undoLastImport().success && ls.store[USER_PURCHASES_KEY] === before && !s.hasImportBackup());

// Merge dedupes by id (existing wins).
s = fresh();
const pv2 = s.previewImport(file([rec('keep', { brand: 'Other' }), rec('n1')]));
check('preview counts the id that already exists as duplicate', pv2.duplicateCount === 1 && pv2.newCount === 1);
s.applyImport(pv2.purchases, 'merge');
check('existing record wins on duplicate id', s.getPurchases(false).find((p) => p.id === 'keep')?.brand === 'Kent');

// Replace replaces but is undoable.
s = fresh();
s.applyImport(s.previewImport(file([rec('only')])).purchases, 'replace');
check('replace leaves only imported records', s.getPurchases(false).length === 1 && s.getPurchases(false)[0].id === 'only');
s.undoLastImport();
check('replace is undoable', s.getPurchases(false)[0].id === 'keep');

// Backup failure aborts the import and leaves data untouched.
s = fresh();
const snapshot = ls.store[USER_PURCHASES_KEY];
ls.failWritesForKey = IMPORT_BACKUP_KEY;
const aborted = s.applyImport(s.previewImport(file([rec('x')])).purchases, 'replace');
check('import aborts when the safety backup cannot be written', !aborted.success && ls.store[USER_PURCHASES_KEY] === snapshot);

// Import never touches the demo sandbox.
s = fresh();
const demoBefore = ls.store[DEMO_PURCHASES_KEY];
s.applyImport(s.previewImport(file([rec('z')])).purchases, 'replace');
check('import does not modify the demo sandbox', ls.store[DEMO_PURCHASES_KEY] === demoBefore);

// Strict validation.
s = fresh();
const bad = s.previewImport(file([
  rec('a', { date: '2026-02-31' }),
  rec('b', { pricePerPack: 501 }),
  rec('c', { quantity: 501 }),
  rec('d', { quantity: 1.5 }),
  rec('e', { id: { evil: 1 } }),
  rec('ok')
]));
check('impossible dates, out-of-range price/quantity and fractional quantity are rejected', bad.success && bad.purchases.some((p) => p.id === 'ok') && bad.purchases.length === 2 && bad.skipped === 4);
check('non-string id is replaced by a generated string id', bad.purchases.every((p) => typeof p.id === 'string'));
const dupFile = s.previewImport(file([rec('same'), rec('same', { brand: 'B' })]));
check('duplicate ids inside the file become unique', new Set(dupFile.purchases.map((p) => p.id)).size === 2);
check('imported records are never flagged as demo', s.previewImport(file([rec('q', { isDemo: true })])).purchases[0].isDemo === false);

// Rejections.
check('empty file rejected', !s.previewImport('   ').success);
check('invalid JSON rejected', !s.previewImport('{nope').success);
check('JSON without a purchases list rejected', !s.previewImport('{"a":1}').success);
check('file with no valid purchases rejected', !s.previewImport(file([rec('x', { quantity: 0 })])).success);
check('oversized content rejected', !s.previewImport('x'.repeat(MAX_IMPORT_CHARS + 1)).success);
const long = s.previewImport(file([rec('l', { note: 'n'.repeat(5000), brand: 'b'.repeat(500) })])).purchases[0];
check('over-long text fields are truncated', long.note!.length === 500 && long.brand.length === 100);

// Legacy one-shot API keeps working (with backup).
s = fresh();
check('legacy importFromJson still works and now creates a backup', s.importFromJson(file([rec('legacy')])).success && s.hasImportBackup());
check('legacy importFromJson rejects corrupt data', !s.importFromJson('{"purchases":[{"brand":"Fake","pricePerPack":-50,"quantity":0}]}').success);

finish('import');
