import { useCallback, useEffect, useRef, useState } from 'react';
import { openDB } from 'idb';

const DB_NAME = 'fleet';
const STORE   = 'pending-actions';
const VERSION = 1;

let dbPromise = null;
function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
        }
      },
    });
  }
  return dbPromise;
}

/**
 * @param {boolean} isOnline  drives auto-flush when it flips true
 */
export default function useOnlineQueue(isOnline) {
  const [pendingCount, setPendingCount] = useState(0);
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle' | 'syncing' | 'error'
  const flushingRef = useRef(false);

  const refreshCount = useCallback(async () => {
    const db = await getDB();
    const n = await db.count(STORE);
    setPendingCount(n);
    return n;
  }, []);

  const enqueue = useCallback(async action => {
    const db = await getDB();
    await db.add(STORE, { ...action, queuedAt: Date.now() });
    await refreshCount();
    return action;
  }, [refreshCount]);

  const flush = useCallback(async () => {
    if (flushingRef.current) return;
    flushingRef.current = true;
    setSyncStatus('syncing');

    try {
      const db = await getDB();
      const all = await db.getAll(STORE);
      if (all.length === 0) { setSyncStatus('idle'); return; }

      for (const item of all) {
        const { id, ...payload } = item;  // strip IDB autoincrement id
        const res = await fetch(apiUrl('/actions'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`POST /actions failed: ${res.status}`);
        await db.delete(STORE, id);
      }

      setSyncStatus('idle');
    } catch (err) {
      console.error('[queue] flush failed', err);
      setSyncStatus('error');
    } finally {
      flushingRef.current = false;
      await refreshCount();
    }
  }, [refreshCount]);

  // Initial count
  useEffect(() => { refreshCount(); }, [refreshCount]);

  // Auto-flush whenever we transition to online
  useEffect(() => {
    if (isOnline) flush();
  }, [isOnline, flush]);

  // Also flush if the browser's own online event fires
  useEffect(() => {
    const onOnline = () => flush();
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [flush]);

  return { enqueue, flush, pendingCount, syncStatus };
}