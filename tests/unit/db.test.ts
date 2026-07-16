import { describe, expect, it } from 'vitest';
import { checkIndexedDB, clearDoc, getDB, loadDoc, saveDoc } from '@/lib/db';
import { buildSeedDoc } from '@/lib/seed';

/**
 * jsdom does not implement IndexedDB, so these exercise the safe no-op guards
 * (the real persistence path is covered by the Playwright E2E suite).
 */
describe('db guards without IndexedDB', () => {
  it('getDB returns null', () => {
    expect(getDB()).toBeNull();
  });

  it('save/load/clear are no-ops and do not throw', async () => {
    await expect(saveDoc(buildSeedDoc())).resolves.toBeUndefined();
    await expect(loadDoc()).resolves.toBeNull();
    await expect(clearDoc()).resolves.toBeUndefined();
  });

  it('checkIndexedDB reports unavailable', async () => {
    const res = await checkIndexedDB();
    expect(res.ok).toBe(false);
    expect(res.detail).toMatch(/IndexedDB/i);
  });
});
