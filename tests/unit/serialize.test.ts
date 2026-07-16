import { describe, expect, it } from 'vitest';
import { buildSeedDoc } from '@/lib/seed';
import { deserializeDoc, normalizeDoc, serializeDoc } from '@/lib/serialize';

describe('serialize round-trip', () => {
  it('export → import is idempotent', () => {
    const doc = buildSeedDoc();
    const json1 = serializeDoc(doc);
    const back = deserializeDoc(json1);
    const json2 = serializeDoc(back);
    expect(json2).toBe(json1);
  });

  it('preserves node and edge counts', () => {
    const doc = buildSeedDoc();
    const back = deserializeDoc(serializeDoc(doc));
    expect(back.nodes.length).toBe(doc.nodes.length);
    expect(back.edges.length).toBe(doc.edges.length);
  });

  it('normalizes malformed input without throwing', () => {
    const doc = normalizeDoc({ nodes: [{ id: 'a', data: { id: 'a', titulo: 'A' } }] });
    expect(doc.nodes).toHaveLength(1);
    expect(doc.lanes.length).toBeGreaterThan(0);
    expect(doc.nodes[0]!.position).toEqual({ x: 0, y: 0 });
  });

  it('preserves updatedAt across round-trip', () => {
    const doc = buildSeedDoc();
    doc.updatedAt = 123456;
    const back = deserializeDoc(serializeDoc(doc));
    expect(back.updatedAt).toBe(123456);
  });
});
