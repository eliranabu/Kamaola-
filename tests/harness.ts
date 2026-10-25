/** Minimal shared test harness (same style as src/services/calculations.test.ts). */

let counter = 0;
let failed = 0;

export function check(description: string, condition: boolean, details?: string): void {
  counter++;
  if (!condition) failed++;
  console.log(`[${String(counter).padStart(2, '0')}] ${description} -> ${condition ? 'PASSED ✅' : `FAILED ❌ ${details ?? ''}`}`);
}

export interface MockStorage {
  store: Record<string, string>;
  failWritesForKey: string | null;
  reset: () => void;
}

/** Installs an in-memory localStorage on globalThis. Never touches real browser data. */
export function installLocalStorage(): MockStorage {
  const mock: MockStorage = {
    store: {},
    failWritesForKey: null,
    reset() {
      mock.store = {};
      mock.failWritesForKey = null;
    }
  };
  (globalThis as any).localStorage = {
    getItem: (k: string) => (k in mock.store ? mock.store[k] : null),
    setItem: (k: string, v: string) => {
      if (mock.failWritesForKey === k || mock.failWritesForKey === '*') {
        const err = new Error('Quota exceeded');
        err.name = 'QuotaExceededError';
        throw err;
      }
      mock.store[k] = String(v);
    },
    removeItem: (k: string) => {
      delete mock.store[k];
    },
    key: (i: number) => Object.keys(mock.store)[i] ?? null,
    get length() {
      return Object.keys(mock.store).length;
    }
  };
  return mock;
}

export function finish(name: string): never {
  console.log(`\n${name}: TOTAL ${counter} | FAILED ${failed}`);
  process.exit(failed === 0 ? 0 : 1);
}
