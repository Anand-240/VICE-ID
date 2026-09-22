import type { StateStorage } from 'zustand/middleware';

// Images belong in IndexedDB, whose quota is suitable for generated PNGs.
// If storage is blocked, the current tab remains usable with memory storage.
const memory = new Map<string, string>();
export let storageUnavailable = false;
async function database() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('vice-id', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('sessions');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function transact(mode: IDBTransactionMode, key: string, value?: string | null) {
  const db = await database();
  try {
    return await new Promise<string | null>((resolve, reject) => {
      const tx = db.transaction('sessions', mode);
      const store = tx.objectStore('sessions');
      const request = mode === 'readonly' ? store.get(key) : value === null ? store.delete(key) : store.put(value, key);
      tx.oncomplete = () => resolve(mode === 'readonly' ? request.result ?? null : null);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally { db.close(); }
}
let pending = Promise.resolve();
export const imageStorage: StateStorage = {
  async getItem(key) {
    try {
      const value = await transact('readonly', key);
      if (!value) return null;
      // A malformed saved session must not strand the hydration screen.
      const saved = JSON.parse(value);
      if (!saved?.state?.character || typeof saved.state.character.name !== 'string' || typeof saved.state.character.alias !== 'string') return null;
      return value;
    }
    catch { storageUnavailable = true; return memory.get(key) ?? null; }
  },
  setItem(key, value) {
    memory.set(key, value);
    pending = pending.then(async () => {
      try { await transact('readwrite', key, value); }
      catch { storageUnavailable = true; }
    });
    return pending;
  },
  removeItem(key) {
    memory.delete(key);
    pending = pending.then(async () => {
      try { await transact('readwrite', key, null); }
      catch { storageUnavailable = true; }
    });
    return pending;
  },
};
