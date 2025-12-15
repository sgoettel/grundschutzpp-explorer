const DB_NAME = 'grundschutzpp-cache';
const STORE_NAME = 'catalogs';

type CatalogCacheEntry = {
  url: string;
  fetchedAt: number;
  payload: unknown;
};

const storageKey = (url: string): string => `${STORE_NAME}:${url}`;

const idbPut = async (entry: CatalogCacheEntry): Promise<void> => {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('IndexedDB write failed'));
      tx.onabort = () => reject(tx.error ?? new Error('IndexedDB write aborted'));
      tx.objectStore(STORE_NAME).put(entry);
    });
  } finally {
    db.close();
  }
};

const idbGet = async (url: string): Promise<CatalogCacheEntry | null> => {
  const db = await openDb();
  try {
    return await new Promise<CatalogCacheEntry | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      tx.onerror = () => reject(tx.error ?? new Error('IndexedDB read failed'));
      tx.onabort = () => reject(tx.error ?? new Error('IndexedDB read aborted'));

      const request = tx.objectStore(STORE_NAME).get(url);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve((request.result as CatalogCacheEntry) ?? null);
    });
  } finally {
    db.close();
  }
};


const openDb = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => reject(request.error);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'url' });
      }
    };

    request.onsuccess = () => resolve(request.result);
  });
};

/**
 * Not a React hook. Name must NOT start with "use", otherwise react-hooks lint rule will fire.
 */
const hasLocalStorage = (): boolean => {
  return typeof localStorage !== 'undefined';
};

export const saveCatalog = async (url: string, payload: unknown): Promise<void> => {
  const entry: CatalogCacheEntry = { url, payload, fetchedAt: Date.now() };

  try {
    await idbPut(entry);
    return;
  } catch (err) {
    // fall through to localStorage
  }

  if (!hasLocalStorage()) {
    console.warn('Unable to cache catalog (no localStorage available)');
    return;
  }

  try {
    localStorage.setItem(storageKey(url), JSON.stringify(entry));
  } catch (err) {
    console.warn('Unable to cache catalog in localStorage', err);
  }
};


export const loadCatalog = async (url: string): Promise<CatalogCacheEntry | null> => {
  try {
    const fromIdb = await idbGet(url);
    if (fromIdb) return fromIdb;
  } catch (err) {
    // fall through to localStorage
  }

  if (!hasLocalStorage()) return null;

  try {
    const raw = localStorage.getItem(storageKey(url));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<CatalogCacheEntry>;
    if (!parsed || typeof parsed !== 'object') return null;

    const fetchedAtRaw = (parsed as any).fetchedAt;
    const fetchedAt =
      typeof fetchedAtRaw === 'number' ? fetchedAtRaw : Number(fetchedAtRaw);

    if (Number.isNaN(fetchedAt)) return null;
    if (!('payload' in parsed)) return null;

    return {
      url,
      fetchedAt,
      payload: (parsed as any).payload,
    };
  } catch (err) {
    console.warn('Unable to read/parse localStorage cache', err);
    return null;
  }
};


export const clearCache = async (): Promise<void> => {
  try {
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.deleteDatabase(DB_NAME);

      req.onerror = () => reject(req.error);

      req.onblocked = () => {
        console.warn('IndexedDB delete blocked; close other tabs using the app.');
        reject(new Error('IndexedDB delete blocked'));
      };

      req.onsuccess = () => resolve();
    });
  } finally {
    if (hasLocalStorage()) {
      try {
        Object.keys(localStorage)
          .filter((key) => key.startsWith(`${STORE_NAME}:`))
          .forEach((key) => localStorage.removeItem(key));
      } catch (lsErr) {
        console.warn('Failed to clear localStorage cache', lsErr);
      }
    }
  }
};


