/**
 * Layout engine for the swimlane diagram.
 *
 * Cards are organized into labeled *group boxes* (EMPRESAS RAFAEL, IMÓVEIS EM
 * SOCIEDADE, …) arranged in horizontal *tiers* inside each lane. Groups are
 * aligned by *side*: Rafael's groups hug the LEFT, Tárik's are anchored to the
 * RIGHT and Sociedade sits in the middle — consistently across every lane, so
 * Rafael and Tárik read as two separate columns (like the original chart).
 *
 * Three engines control how cards pack inside each group box:
 *  - 'balanced': multi-column packing sized by the Rendering Quality Agent (default).
 *  - 'grupos'  : single column per group.
 *  - 'dagre'   : dagre over intra-lane edges (no group boxes / side-alignment).
 *
 * The QA suite asserts no engine produces NaN positions or overlaps.
 */
import dagre from 'dagre';
import { recommendColumns, targetAspect, type Viewport } from './render-agent';
import type { GraphEdge, GraphNode, LaneDef, LaneId, PatrimonioDoc } from './types';

export type LayoutEngine = 'balanced' | 'grupos' | 'dagre';

export const CARD_WIDTH = 252;
export const HEADER_H = 44;

const LANE_GAP = 48;
const LANE_PAD_X = 32;
const LANE_PAD_TOP = HEADER_H + 26;
const LANE_PAD_BOTTOM = 30;
const COL_GAP = 24;
const ROW_GAP = 22;

const GROUP_HEADER_H = 30;
const GROUP_PAD_X = 18;
const GROUP_PAD_TOP = 6;
const GROUP_PAD_BOTTOM = 18;
const GROUP_GAP = 52;
const TIER_GAP = 52;
const MAX_GROUP_COLS = 4;

export interface LaneRect {
  id: LaneId;
  titulo: string;
  x: number;
  y: number;
  width: number;
  height: number;
  collapsed: boolean;
}

export interface GroupRect {
  id: string;
  label: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutResult {
  nodes: GraphNode[];
  lanes: LaneRect[];
  groups: GroupRect[];
}

/** Estimate the rendered size of a card so layout leaves enough room. */
export function estimateSize(node: GraphNode): { width: number; height: number } {
  const d = node.data;
  let h = HEADER_H;
  if (d.subtitulo) h += 16;
  if (d.diretores?.length) h += 14 + d.diretores.length * 16;
  if (d.socios?.length) h += 18 + d.socios.length * 22;
  if (d.imoveis?.length) h += 14 + d.imoveis.length * 15;
  if (d.dados && Object.keys(d.dados).length)
    h += 10 + Object.keys(d.dados).length * 16;
  if (d.balanco) h += 18;
  if (d.notas) h += 18;
  if (d.links?.length) h += 30;
  h += 20; // padding
  return { width: CARD_WIDTH, height: Math.max(96, h) };
}

/** Vertical tiers of groups per lane (replicates the original two-row EMPRESAS). */
const LANE_TIERS: Record<LaneId, string[][]> = {
  PESSOAS: [['RAFAEL', 'TARIK']],
  EMPRESAS: [
    ['EMPRESAS RAFAEL', 'EMPRESAS TÁRIK'],
    ['OPERACIONAIS EM SOCIEDADE', 'PATRIMONIAIS EM SOCIEDADE'],
  ],
  IMOVEIS: [['IMÓVEIS RAFAEL', 'IMÓVEIS EM SOCIEDADE', 'IMÓVEIS TÁRIK']],
  CARROS: [['CARROS RAFAEL', 'CARROS TÁRIK']],
  SEGUROS: [['SEGUROS TÁRIK']],
};

/** Human-readable group box labels. */
const GROUP_LABEL: Record<string, string> = {
  'OPERACIONAIS EM SOCIEDADE': 'EMPRESAS OPERACIONAIS EM SOCIEDADE',
  'PATRIMONIAIS EM SOCIEDADE': 'EMPRESAS PATRIMONIAIS EM SOCIEDADE',
};

/** Accent color per group box (matches the owner/type palette). */
const GROUP_COLOR: Record<string, string> = {
  'EMPRESAS RAFAEL': '#2563eb',
  'EMPRESAS TÁRIK': '#dc2626',
  'OPERACIONAIS EM SOCIEDADE': '#ca8a04',
  'PATRIMONIAIS EM SOCIEDADE': '#6b7280',
  'IMÓVEIS RAFAEL': '#2563eb',
  'IMÓVEIS EM SOCIEDADE': '#16a34a',
  'IMÓVEIS TÁRIK': '#dc2626',
  'CARROS RAFAEL': '#2563eb',
  'CARROS TÁRIK': '#dc2626',
  'SEGUROS TÁRIK': '#dc2626',
};

type Side = 'left' | 'center' | 'right';

/** Rafael → left, Tárik → right, everything else (sociedade) → center. */
function groupSide(name: string): Side {
  const n = name.toUpperCase();
  if (n.includes('RAFAEL')) return 'left';
  if (n.includes('TÁRIK') || n.includes('TARIK')) return 'right';
  return 'center';
}

function laneNodes(nodes: GraphNode[], lane: LaneId): GraphNode[] {
  return nodes.filter((n) => n.data.lane === lane);
}

/** Tier structure for a lane, including any unexpected groups as a trailing tier. */
function tiersForLane(nodes: GraphNode[], lane: LaneId): string[][] {
  const present = new Set(nodes.map((n) => n.data.grupo ?? '—'));
  const known = LANE_TIERS[lane] ?? [];
  const knownFlat = new Set(known.flat());
  const tiers = known
    .map((tier) => tier.filter((g) => present.has(g)))
    .filter((t) => t.length);
  const extras = [...present].filter((g) => !knownFlat.has(g)).sort();
  if (extras.length) tiers.push(extras);
  return tiers.length ? tiers : [[...present]];
}

interface LaneLayout {
  positioned: Map<string, { x: number; y: number }>;
  groups: GroupRect[];
  width: number;
  height: number;
}

interface GroupBlock {
  groupName: string;
  side: Side;
  rel: Array<{ id: string; dx: number; dy: number }>;
  width: number;
  height: number;
  x: number;
}

/**
 * Tiered, side-aligned group-box layout. When `laneWidth` is provided, Tárik
 * groups are anchored to the right edge and pure-Sociedade tiers are centered.
 */
function layoutLaneTiered(
  nodes: GraphNode[],
  lane: LaneId,
  columnsFor: (cards: GraphNode[]) => number,
  laneWidth?: number,
): LaneLayout {
  const positioned = new Map<string, { x: number; y: number }>();
  const groups: GroupRect[] = [];
  const byGroup = new Map<string, GraphNode[]>();
  for (const n of nodes) {
    const g = n.data.grupo ?? '—';
    byGroup.set(g, [...(byGroup.get(g) ?? []), n]);
  }

  const showBoxes = lane !== 'PESSOAS';
  const headerH = showBoxes ? GROUP_HEADER_H : 0;
  const blockWidth = (arr: GroupBlock[]) =>
    arr.reduce((s, b) => s + b.width, 0) + Math.max(0, arr.length - 1) * GROUP_GAP;

  let y = LANE_PAD_TOP;
  let maxWidth = CARD_WIDTH + 2 * LANE_PAD_X;

  for (const tier of tiersForLane(nodes, lane)) {
    // 1) Measure each group block (relative card offsets + size).
    const blocks: GroupBlock[] = [];
    for (const groupName of tier) {
      const cards = byGroup.get(groupName) ?? [];
      if (cards.length === 0) continue;
      const cols = Math.max(1, columnsFor(cards));
      const colY = new Array<number>(cols).fill(0);
      const rel: GroupBlock['rel'] = [];
      for (const card of cards) {
        let shortest = 0;
        for (let c = 1; c < cols; c++) if (colY[c]! < colY[shortest]!) shortest = c;
        const size = estimateSize(card);
        rel.push({
          id: card.id,
          dx: GROUP_PAD_X + shortest * (CARD_WIDTH + COL_GAP),
          dy: headerH + GROUP_PAD_TOP + colY[shortest]!,
        });
        colY[shortest]! += size.height + ROW_GAP;
      }
      const contentHeight = Math.max(0, Math.max(...colY) - ROW_GAP);
      blocks.push({
        groupName,
        side: groupSide(groupName),
        rel,
        width: cols * CARD_WIDTH + (cols - 1) * COL_GAP + 2 * GROUP_PAD_X,
        height: headerH + GROUP_PAD_TOP + contentHeight + GROUP_PAD_BOTTOM,
        x: 0,
      });
    }
    if (blocks.length === 0) continue;

    const left = blocks.filter((b) => b.side === 'left');
    const center = blocks.filter((b) => b.side === 'center');
    const right = blocks.filter((b) => b.side === 'right');

    // 2) Assign x origins. Left + center flow from the left edge.
    let x = LANE_PAD_X;
    for (const b of [...left, ...center]) {
      b.x = x;
      x += b.width + GROUP_GAP;
    }
    const lcEnd = left.length + center.length > 0 ? x - GROUP_GAP : LANE_PAD_X;

    // Right (Tárik) anchored to the right edge when the lane width is known.
    if (right.length) {
      const totalR = blockWidth(right);
      let xR =
        laneWidth != null
          ? Math.max(laneWidth - LANE_PAD_X - totalR, lcEnd + GROUP_GAP)
          : lcEnd + (left.length + center.length > 0 ? GROUP_GAP : 0);
      for (const b of right) {
        b.x = xR;
        xR += b.width + GROUP_GAP;
      }
    }

    // Pure-Sociedade tier (no Rafael/Tárik) → center it.
    if (laneWidth != null && left.length === 0 && right.length === 0 && center.length) {
      const totalC = blockWidth(center);
      const shift = Math.max(0, (laneWidth - totalC) / 2 - LANE_PAD_X);
      for (const b of center) b.x += shift;
    }

    // 3) Emit cards + group rects, track tier height + width.
    let tierHeight = 0;
    for (const b of blocks) {
      for (const r of b.rel) positioned.set(r.id, { x: b.x + r.dx, y: y + r.dy });
      if (showBoxes) {
        groups.push({
          id: `${lane}:${b.groupName}`,
          label: GROUP_LABEL[b.groupName] ?? b.groupName,
          color: GROUP_COLOR[b.groupName] ?? '#6b7280',
          x: b.x,
          y,
          width: b.width,
          height: b.height,
        });
      }
      tierHeight = Math.max(tierHeight, b.height);
      maxWidth = Math.max(maxWidth, b.x + b.width + LANE_PAD_X);
    }
    y += tierHeight + TIER_GAP;
  }

  return {
    positioned,
    groups,
    width: laneWidth ?? maxWidth,
    height: y - TIER_GAP + LANE_PAD_BOTTOM,
  };
}

/** Dagre layout for a single lane over its intra-lane edges (no group boxes). */
function layoutLaneDagre(nodes: GraphNode[], edges: GraphEdge[]): LaneLayout {
  const ids = new Set(nodes.map((n) => n.id));
  const intra = edges.filter((e) => ids.has(e.source) && ids.has(e.target));
  if (intra.length === 0) return layoutLaneGrid(nodes);

  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: 'LR',
    nodesep: ROW_GAP,
    ranksep: 64,
    marginx: LANE_PAD_X,
    marginy: LANE_PAD_TOP,
  });
  g.setDefaultEdgeLabel(() => ({}));
  for (const n of nodes) {
    const size = estimateSize(n);
    g.setNode(n.id, { width: size.width, height: size.height });
  }
  for (const e of intra) g.setEdge(e.source, e.target);
  dagre.layout(g);

  const positioned = new Map<string, { x: number; y: number }>();
  let width = 0;
  let height = 0;
  for (const n of nodes) {
    const gn = g.node(n.id);
    const size = estimateSize(n);
    const x = (gn?.x ?? LANE_PAD_X + CARD_WIDTH / 2) - size.width / 2;
    const y = (gn?.y ?? LANE_PAD_TOP) - size.height / 2;
    positioned.set(n.id, { x, y });
    width = Math.max(width, x + size.width + LANE_PAD_X);
    height = Math.max(height, y + size.height + LANE_PAD_BOTTOM);
  }
  return { positioned, groups: [], width, height };
}

/** Simple wrapped grid for edgeless lanes (dagre fallback). */
function layoutLaneGrid(nodes: GraphNode[]): LaneLayout {
  const positioned = new Map<string, { x: number; y: number }>();
  const perRow = Math.max(1, Math.min(6, Math.ceil(Math.sqrt(nodes.length))));
  let rowHeight = 0;
  let x = LANE_PAD_X;
  let y = LANE_PAD_TOP;
  let col = 0;
  let width = 0;
  for (const n of nodes) {
    const size = estimateSize(n);
    if (col >= perRow) {
      col = 0;
      x = LANE_PAD_X;
      y += rowHeight + ROW_GAP;
      rowHeight = 0;
    }
    positioned.set(n.id, { x, y });
    x += size.width + COL_GAP;
    width = Math.max(width, x);
    rowHeight = Math.max(rowHeight, size.height);
    col++;
  }
  return {
    positioned,
    groups: [],
    width: width + LANE_PAD_X,
    height: y + rowHeight + LANE_PAD_BOTTOM,
  };
}

function balancedColumns(aspect: number): (cards: GraphNode[]) => number {
  return (cards) => {
    const avgH = cards.reduce((s, c) => s + estimateSize(c).height, 0) / cards.length;
    return recommendColumns(cards.length, {
      aspect,
      cardW: CARD_WIDTH,
      cardH: avgH,
      gap: ROW_GAP,
      maxCols: MAX_GROUP_COLS,
    });
  };
}

/** Compute absolute node positions, lane rectangles and group boxes. */
export function computeLayout(
  doc: PatrimonioDoc,
  opts: { engine?: LayoutEngine; collapsed?: Set<LaneId>; viewport?: Viewport } = {},
): LayoutResult {
  const engine = opts.engine ?? 'balanced';
  const collapsed = opts.collapsed ?? new Set<LaneId>();
  const aspect = targetAspect(opts.viewport);
  const orderedLanes = [...doc.lanes].sort((a, b) => a.ordem - b.ordem);
  const tiered = engine === 'balanced' || engine === 'grupos';
  const columnsFor = engine === 'grupos' ? () => 1 : balancedColumns(aspect);

  // Pass 1 — natural layout per lane, to learn the widest lane.
  const naturals = new Map<LaneId, LaneLayout>();
  let maxWidth = CARD_WIDTH + 2 * LANE_PAD_X;
  for (const laneDef of orderedLanes) {
    const ln = laneNodes(doc.nodes, laneDef.id);
    if (collapsed.has(laneDef.id) || ln.length === 0) continue;
    const layout =
      engine === 'dagre'
        ? layoutLaneDagre(ln, doc.edges)
        : layoutLaneTiered(ln, laneDef.id, columnsFor);
    naturals.set(laneDef.id, layout);
    maxWidth = Math.max(maxWidth, layout.width);
  }

  // Pass 2 — re-run tiered lanes with the common width so sides line up.
  const outNodes: GraphNode[] = [];
  const lanes: LaneRect[] = [];
  const outGroups: GroupRect[] = [];
  let laneY = 0;

  for (const laneDef of orderedLanes) {
    const ln = laneNodes(doc.nodes, laneDef.id);
    const isCollapsed = collapsed.has(laneDef.id);

    let local: LaneLayout;
    if (isCollapsed || ln.length === 0) {
      local = {
        positioned: new Map(),
        groups: [],
        width: maxWidth,
        height: HEADER_H + LANE_PAD_BOTTOM,
      };
    } else if (tiered) {
      local = layoutLaneTiered(ln, laneDef.id, columnsFor, maxWidth);
    } else {
      local = naturals.get(laneDef.id)!;
    }

    if (!isCollapsed) {
      for (const n of ln) {
        const p = local.positioned.get(n.id);
        if (!p) continue;
        outNodes.push({ ...n, position: { x: p.x, y: laneY + p.y }, hidden: false });
      }
      for (const grp of local.groups) outGroups.push({ ...grp, y: laneY + grp.y });
    } else {
      for (const n of ln) outNodes.push({ ...n, hidden: true });
    }

    const laneHeight = isCollapsed ? HEADER_H : local.height;
    lanes.push({
      id: laneDef.id,
      titulo: laneDef.titulo,
      x: 0,
      y: laneY,
      width: maxWidth,
      height: laneHeight,
      collapsed: isCollapsed,
    });
    laneY += laneHeight + LANE_GAP;
  }

  return { nodes: outNodes, lanes, groups: outGroups };
}

export const _internal = {
  layoutLaneTiered,
  layoutLaneDagre,
  layoutLaneGrid,
  groupSide,
  LANE_TIERS,
  laneOrderFor: (lanes: LaneDef[]) => [...lanes].sort((a, b) => a.ordem - b.ordem),
};
