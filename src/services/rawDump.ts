/** Dumps every app key from localStorage as-is, for emergency export. */

export const APP_KEY_PREFIX = 'kama_ze_ole_';

export function buildRawDump(): string {
  const dump: Record<string, string | null> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(APP_KEY_PREFIX)) dump[key] = localStorage.getItem(key);
    }
  } catch (e) {
    dump.__error = String(e);
  }
  return JSON.stringify({ exportedAt: new Date().toISOString(), data: dump }, null, 2);
}
