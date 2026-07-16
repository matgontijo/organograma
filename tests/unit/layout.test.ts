import { describe, expect, it } from 'vitest';
import { buildSeedDoc } from '@/lib/seed';
import { computeLayout, estimateSize, type LayoutEngine } from '@/lib/layout';
import type { GraphNode } from '@/lib/types';

function rectsOverlap(a: GraphNode, b: GraphNode): boolean {
  const sa = estimateSize(a);
  const sb = estimateSize(b);
  return (
    a.position.x < b.position.x + sb.width &&
    a.position.x + sa.width > b.position.x &&
    a.position.y < b.position.y + sb.height &&
    a.position.y + sa.height > b.position.y
  );
}

describe.each<LayoutEngine>(['balanced', 'grupos', 'dagre'])(
  'computeLayout (%s)',
  (engine) => {
    const result = computeLayout(buildSeedDoc(), { engine });

    it('never produces NaN positions', () => {
      for (const n of result.nodes) {
        expect(Number.isFinite(n.position.x)).toBe(true);
        expect(Number.isFinite(n.position.y)).toBe(true);
      }
    });

    it('produces 5 lane rectangles with finite geometry', () => {
      expect(result.lanes).toHaveLength(5);
      for (const lane of result.lanes) {
        expect(Number.isFinite(lane.width)).toBe(true);
        expect(Number.isFinite(lane.height)).toBe(true);
        expect(lane.width).toBeGreaterThan(0);
      }
    });

    it('does not overlap cards within the same lane', () => {
      const byLane = new Map<string, GraphNode[]>();
      for (const n of result.nodes) {
        if (n.hidden) continue;
        const lane = n.data.lane ?? '—';
        byLane.set(lane, [...(byLane.get(lane) ?? []), n]);
      }
      for (const cards of byLane.values()) {
        for (let i = 0; i < cards.length; i++) {
          for (let j = i + 1; j < cards.length; j++) {
            expect(rectsOverlap(cards[i]!, cards[j]!)).toBe(false);
          }
        }
      }
    });
  },
);

describe('collapsed lanes', () => {
  it('hides nodes of a collapsed lane', () => {
    const result = computeLayout(buildSeedDoc(), {
      engine: 'grupos',
      collapsed: new Set(['IMOVEIS']),
    });
    const imoveis = result.nodes.filter((n) => n.data.lane === 'IMOVEIS');
    expect(imoveis.length).toBeGreaterThan(0);
    expect(imoveis.every((n) => n.hidden)).toBe(true);
  });
});
