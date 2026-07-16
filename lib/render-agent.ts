/**
 * Rendering & Layout Quality Agent.
 *
 * A small autonomous helper that (a) recommends how many columns each group of
 * cards should use to avoid an over-vertical diagram, (b) scores a computed
 * layout for quality (aspect ratio, overlaps, NaN, density), and (c) advises the
 * best export resolution per device. Used by the layout engine, the store's
 * `autoOptimize`, and surfaced in the UI.
 */
import type { GraphNode } from './types';

export interface Viewport {
  width: number;
  height: number;
  isMobile: boolean;
}

export interface LayoutQualityReport {
  width: number;
  height: number;
  /** width / height */
  aspectRatio: number;
  /** height / width (lower is less vertical) */
  verticality: number;
  overlaps: number;
  nanCount: number;
  /** fraction of the bounding box occupied by cards (0..1) */
  density: number;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  notes: string[];
}

export type SizeFn = (node: GraphNode) => { width: number; height: number };

export const DEFAULT_DESKTOP: Viewport = { width: 1440, height: 900, isMobile: false };

/** Target width:height for a group block, given the device. */
export function targetAspect(viewport?: Viewport): number {
  if (!viewport) return 1.7;
  if (viewport.isMobile) return 1.0;
  // Wider screens → wider (less vertical) packing.
  return viewport.width >= 1600 ? 2.0 : 1.6;
}

/**
 * Choose the column count that brings a group's block closest to `aspect`,
 * given the (average) card size. Pure math — safe to call from the layout core.
 */
export function recommendColumns(
  count: number,
  opts: { aspect: number; cardW: number; cardH: number; gap: number; maxCols?: number },
): number {
  if (count <= 1) return 1;
  const maxCols = Math.min(opts.maxCols ?? 8, count);
  let best = 1;
  let bestDiff = Infinity;
  for (let cols = 1; cols <= maxCols; cols++) {
    const rows = Math.ceil(count / cols);
    const w = cols * opts.cardW + (cols - 1) * opts.gap;
    const h = rows * opts.cardH + (rows - 1) * opts.gap;
    const diff = Math.abs(w / h - opts.aspect);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = cols;
    }
  }
  return best;
}

/** Pixel ratio for raster export — higher on capable desktops for crisp output. */
export function exportPixelRatio(viewport?: Viewport): number {
  if (viewport?.isMobile) return 2.5;
  return 3;
}

function gradeFor(score: number): LayoutQualityReport['grade'] {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

/** Evaluate a set of positioned nodes and produce a quality report. */
export function evaluateLayout(
  nodes: GraphNode[],
  sizeOf: SizeFn,
  viewport?: Viewport,
): LayoutQualityReport {
  const visible = nodes.filter((n) => !n.hidden);
  const notes: string[] = [];

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let nanCount = 0;
  let cardArea = 0;

  for (const n of visible) {
    const { width, height } = sizeOf(n);
    if (!Number.isFinite(n.position.x) || !Number.isFinite(n.position.y)) {
      nanCount++;
      continue;
    }
    minX = Math.min(minX, n.position.x);
    minY = Math.min(minY, n.position.y);
    maxX = Math.max(maxX, n.position.x + width);
    maxY = Math.max(maxY, n.position.y + height);
    cardArea += width * height;
  }

  const width = Number.isFinite(maxX - minX) ? Math.max(1, maxX - minX) : 1;
  const height = Number.isFinite(maxY - minY) ? Math.max(1, maxY - minY) : 1;
  const aspectRatio = width / height;
  const verticality = height / width;
  const density = Math.min(1, cardArea / (width * height));

  // Overlaps within the same lane.
  let overlaps = 0;
  const byLane = new Map<string, GraphNode[]>();
  for (const n of visible) {
    const lane = n.data.lane ?? '—';
    byLane.set(lane, [...(byLane.get(lane) ?? []), n]);
  }
  for (const cards of byLane.values()) {
    for (let i = 0; i < cards.length; i++) {
      for (let j = i + 1; j < cards.length; j++) {
        const a = cards[i]!;
        const b = cards[j]!;
        const sa = sizeOf(a);
        const sb = sizeOf(b);
        if (
          a.position.x < b.position.x + sb.width &&
          a.position.x + sa.width > b.position.x &&
          a.position.y < b.position.y + sb.height &&
          a.position.y + sa.height > b.position.y
        ) {
          overlaps++;
        }
      }
    }
  }

  let score = 100;
  const verticalLimit = viewport?.isMobile ? 3.5 : 1.6;
  if (verticality > verticalLimit) {
    const penalty = Math.min(45, (verticality - verticalLimit) * 22);
    score -= penalty;
    notes.push(`Diagrama vertical demais (proporção ${verticality.toFixed(2)}:1).`);
  }
  if (overlaps > 0) {
    score -= Math.min(40, overlaps * 8);
    notes.push(`${overlaps} sobreposição(ões) de cards.`);
  }
  if (nanCount > 0) {
    score -= Math.min(40, nanCount * 20);
    notes.push(`${nanCount} card(s) com posição inválida.`);
  }
  if (density < 0.12) {
    score -= 8;
    notes.push('Baixa densidade — muito espaço vazio.');
  }
  score = Math.max(0, Math.round(score));
  if (notes.length === 0) notes.push('Layout equilibrado e nítido.');

  return {
    width,
    height,
    aspectRatio,
    verticality,
    overlaps,
    nanCount,
    density,
    score,
    grade: gradeFor(score),
    notes,
  };
}
