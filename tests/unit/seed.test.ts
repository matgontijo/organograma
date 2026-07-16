import { describe, expect, it } from 'vitest';
import {
  buildSeedDoc,
  deriveEdges,
  ENTITY_ALIASES,
  resolveEntityId,
  SEED_NODES,
} from '@/lib/seed';

describe('seed', () => {
  it('builds a document without throwing', () => {
    const doc = buildSeedDoc();
    expect(doc.nodes.length).toBeGreaterThan(60);
    expect(doc.edges.length).toBeGreaterThan(0);
    expect(doc.lanes).toHaveLength(5);
  });

  it('has no duplicate node ids', () => {
    const ids = SEED_NODES.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('resolves known internal entities', () => {
    expect(resolveEntityId('Gibraltar')).toBe('emp-gibraltar');
    expect(resolveEntityId('ativus')).toBe('emp-ativus');
    expect(resolveEntityId('Tárik')).toBe('pessoa-tarik');
    expect(resolveEntityId('Desconhecido S.A.')).toBeUndefined();
  });

  it('every alias target exists as a node', () => {
    const ids = new Set(SEED_NODES.map((n) => n.id));
    for (const target of Object.values(ENTITY_ALIASES)) {
      expect(ids.has(target)).toBe(true);
    }
  });

  it('derives marriage + ownership edges that reference existing nodes', () => {
    const edges = deriveEdges(SEED_NODES);
    const ids = new Set(SEED_NODES.map((n) => n.id));
    expect(edges.some((e) => e.kind === 'MARRIAGE')).toBe(true);
    for (const e of edges) {
      expect(ids.has(e.source)).toBe(true);
      expect(ids.has(e.target)).toBe(true);
    }
  });

  it('traces Gibraltar ownership into Maracujá via derived edge', () => {
    const edges = deriveEdges(SEED_NODES);
    expect(
      edges.some((e) => e.source === 'emp-gibraltar' && e.target === 'imovel-maracuja'),
    ).toBe(true);
  });
});
