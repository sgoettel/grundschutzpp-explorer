const DB_NAME = 'grundschutzpp-cache';
const STORE_NAME = 'catalogs';

type CatalogCacheEntry = {
  url: string;
  fetchedAt: number;
  payload: unknown;
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
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put({ url, payload, fetchedAt: Date.now() });
  } catch (err) {
    if (hasLocalStorage()) {
      localStorage.setItem(
        `${STORE_NAME}:${url}`,
        JSON.stringify({ payload, fetchedAt: Date.now() })
      );
    } else {
      console.warn('Unable to cache catalog', err);
    }
  }
};

export const loadCatalog = async (url: string): Promise<CatalogCacheEntry | null> => {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).get(url);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve((request.result as CatalogCacheEntry) ?? null);
    });
  } catch (err) {
    if (hasLocalStorage()) {
      const raw = localStorage.getItem(`${STORE_NAME}:${url}`);
      if (!raw) return null;
      return JSON.parse(raw) as CatalogCacheEntry;
    }
    console.warn('Unable to read catalog cache', err);
    return null;
  }
};

export const clearCache = async (): Promise<void> => {
  try {
    const db = await openDb();
    db.close();

    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.deleteDatabase(DB_NAME);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve();
    });
  } catch (err) {
    if (hasLocalStorage()) {
      Object.keys(localStorage)
        .filter((key) => key.startsWith(`${STORE_NAME}:`))
        .forEach((key) => localStorage.removeItem(key));
    }
    console.warn('Failed to clear cache', err);
  }
};

