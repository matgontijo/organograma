/** IndexedDB persistence via Dexie. Single-document store with autosave. */
import Dexie, { type Table } from 'dexie';
import type { PatrimonioDoc } from './types';

export interface StoredDoc {
  key: string;
  doc: PatrimonioDoc;
  savedAt: number;
}

const DOC_KEY = 'current';

class PatrimonioDB extends Dexie {
  documents!: Table<StoredDoc, string>;

  constructor() {
    super('trk-mapa-patrimonial');
    this.version(1).stores({ documents: '&key, savedAt' });
  }
}

let _db: PatrimonioDB | null = null;

/** Lazily create the Dexie instance (browser only). */
export function getDB(): PatrimonioDB | null {
  if (typeof window === 'undefined' || typeof indexedDB === 'undefined') return null;
  if (!_db) _db = new PatrimonioDB();
  return _db;
}

export async function saveDoc(doc: PatrimonioDoc): Promise<void> {
  const db = getDB();
  if (!db) return;
  await db.documents.put({ key: DOC_KEY, doc, savedAt: Date.now() });
}

export async function loadDoc(): Promise<PatrimonioDoc | null> {
  const db = getDB();
  if (!db) return null;
  const row = await db.documents.get(DOC_KEY);
  return row?.doc ?? null;
}

export async function clearDoc(): Promise<void> {
  const db = getDB();
  if (!db) return;
  await db.documents.delete(DOC_KEY);
}

/** Lightweight client-side health probe used by /api/health and the QA agent. */
export async function checkIndexedDB(): Promise<{ ok: boolean; detail: string }> {
  if (typeof indexedDB === 'undefined') {
    return { ok: false, detail: 'IndexedDB indisponível neste ambiente' };
  }
  try {
    const db = getDB();
    if (!db) return { ok: false, detail: 'DB não inicializado' };
    await db.documents.count();
    return { ok: true, detail: 'IndexedDB acessível' };
  } catch (err) {
    return { ok: false, detail: (err as Error).message };
  }
}
