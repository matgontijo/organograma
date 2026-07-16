import { describe, expect, it } from 'vitest';
import {
  evaluateLayout,
  exportPixelRatio,
  recommendColumns,
  targetAspect,
} from '@/lib/render-agent';
import { computeLayout, estimateSize } from '@/lib/layout';
import { buildSeedDoc } from '@/lib/seed';

describe('recommendColumns', () => {
  it('returns 1 for a single card', () => {
    expect(recommendColumns(1, { aspect: 1.6, cardW: 252, cardH: 180, gap: 20 })).toBe(
      1,
    );
  });

  it('uses more columns when more cards are present', () => {
    const cols = recommendColumns(12, { aspect: 1.6, cardW: 252, cardH: 180, gap: 20 });
    expect(cols).toBeGreaterThan(1);
  });

  it('never exceeds the card count or maxCols', () => {
    expect(
      recommendColumns(3, { aspect: 9, cardW: 252, cardH: 180, gap: 20 }),
    ).toBeLessThanOrEqual(3);
    expect(
      recommendColumns(50, { aspect: 9, cardW: 252, cardH: 180, gap: 20, maxCols: 4 }),
    ).toBeLessThanOrEqual(4);
  });
});

describe('viewport heuristics', () => {
  it('targets a narrower aspect on mobile', () => {
    const mobile = targetAspect({ width: 390, height: 800, isMobile: true });
    const desktop = targetAspect({ width: 1440, height: 900, isMobile: false });
    expect(mobile).toBeLessThan(desktop);
  });

  it('picks a high pixel ratio for export', () => {
    expect(exportPixelRatio({ width: 1440, height: 900, isMobile: false })).toBe(3);
    expect(exportPixelRatio({ width: 390, height: 800, isMobile: true })).toBe(2.5);
  });
});

describe('evaluateLayout', () => {
  const doc = buildSeedDoc();

  it('scores the balanced layout well with no overlaps', () => {
    const res = computeLayout(doc, { engine: 'balanced' });
    const q = evaluateLayout(res.nodes, estimateSize);
    expect(q.overlaps).toBe(0);
    expect(q.nanCount).toBe(0);
    expect(q.score).toBeGreaterThanOrEqual(60);
    expect(['A', 'B', 'C']).toContain(q.grade);
  });

  it('finds the balanced layout less vertical than single sub-columns', () => {
    const balanced = evaluateLayout(
      computeLayout(doc, { engine: 'balanced' }).nodes,
      estimateSize,
    );
    const grupos = evaluateLayout(
      computeLayout(doc, { engine: 'grupos' }).nodes,
      estimateSize,
    );
    expect(balanced.verticality).toBeLessThan(grupos.verticality);
  });
});
