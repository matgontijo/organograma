'use client';

/**
 * Central application store (Zustand + zundo for undo/redo).
 *
 * Only the document (`doc`) is tracked by the temporal middleware, so undo/redo
 * affects data/structure/positions but not transient UI state (selection,
 * theme, filters). Autosave to IndexedDB is wired in the provider component.
 */
import { create } from 'zustand';
import { temporal } from 'zundo';
import { useStore as useZustand } from 'zustand';
import { uid } from './id';
import { computeLayout, estimateSize, type LayoutEngine } from './layout';
import { DEFAULT_DESKTOP, evaluateLayout, type Viewport } from './render-agent';
import { buildSeedDoc, deriveEdges } from './seed';
import { DEFAULT_PRESETS } from './theme';
import { applyFilters, matchNodes, traceParticipation, type Filters } from './search';
import type {
  GraphEdge,
  GraphNode,
  LaneId,
  LinkItem,
  NodeType,
  OrgNodeData,
  Owner,
  PatrimonioDoc,
  Socio,
  ThemeName,
  ThemePreset,
} from './types';

export interface AppState {
  doc: PatrimonioDoc;

  // transient UI state (not in undo history)
  selectedIds: string[];
  collapsedLanes: LaneId[];
  engine: LayoutEngine;
  viewport: Viewport;
  theme: ThemeName;
  accent: string;
  presets: ThemePreset[];
  search: string;
  filters: Filters;
  traceEntityId: string | null;
  /** 'focus' = só mostra conexões do card focado; 'all' = mostra todas. */
  edgeMode: 'focus' | 'all';

  // ── lifecycle ────────────────────────────────────────────────
  loadDoc: (doc: PatrimonioDoc) => void;
  resetToSeed: () => void;
  relayout: () => void;
  setEngine: (engine: LayoutEngine) => void;
  setViewport: (viewport: Viewport) => void;
  /** Rendering Quality Agent: pick the highest-scoring layout for the viewport. */
  autoOptimize: () => void;

  // ── node CRUD ────────────────────────────────────────────────
  addNode: (input: {
    type: NodeType;
    owner: Owner;
    lane: LaneId;
    grupo?: string;
    titulo?: string;
  }) => string;
  duplicateNode: (id: string) => string | null;
  removeNodes: (ids: string[]) => void;
  updateNodeData: (id: string, patch: Partial<OrgNodeData>) => void;
  batchUpdate: (ids: string[], patch: Partial<OrgNodeData>) => void;
  moveNode: (id: string, position: { x: number; y: number }) => void;

  // ── sócios / links CRUD ──────────────────────────────────────
  addSocio: (nodeId: string, socio?: Socio) => void;
  updateSocio: (nodeId: string, index: number, patch: Partial<Socio>) => void;
  removeSocio: (nodeId: string, index: number) => void;
  addLink: (nodeId: string, link?: Partial<LinkItem>) => void;
  updateLink: (nodeId: string, linkId: string, patch: Partial<LinkItem>) => void;
  removeLink: (nodeId: string, linkId: string) => void;

  // ── edges ────────────────────────────────────────────────────
  connectNodes: (source: string, target: string) => void;
  removeEdge: (id: string) => void;
  rederiveEdges: () => void;

  // ── selection / lanes / theme / search ───────────────────────
  setSelection: (ids: string[]) => void;
  toggleSelection: (id: string, additive?: boolean) => void;
  clearSelection: () => void;
  toggleLane: (lane: LaneId) => void;
  setTheme: (theme: ThemeName) => void;
  setAccent: (accent: string) => void;
  savePreset: (name: string) => void;
  applyPreset: (name: string) => void;
  setSearch: (q: string) => void;
  setFilters: (patch: Partial<Filters>) => void;
  clearFilters: () => void;
  setTrace: (entityId: string | null) => void;
  setEdgeMode: (mode: 'focus' | 'all') => void;
}

function withLayout(
  doc: PatrimonioDoc,
  engine: LayoutEngine,
  collapsed: LaneId[],
  viewport?: Viewport,
): PatrimonioDoc {
  const { nodes } = computeLayout(doc, {
    engine,
    collapsed: new Set(collapsed),
    viewport,
  });
  return { ...doc, nodes, updatedAt: Date.now() };
}

function findNode(doc: PatrimonioDoc, id: string): GraphNode | undefined {
  return doc.nodes.find((n) => n.id === id);
}

const initialDoc = withLayout(buildSeedDoc(), 'balanced', [], DEFAULT_DESKTOP);

export const useAppStore = create<AppState>()(
  temporal(
    (set, get) => ({
      doc: initialDoc,
      selectedIds: [],
      collapsedLanes: [],
      engine: 'balanced',
      viewport: DEFAULT_DESKTOP,
      theme: 'claro',
      accent: '#2563eb',
      presets: DEFAULT_PRESETS,
      search: '',
      filters: {},
      traceEntityId: null,
      edgeMode: 'focus',

      loadDoc: (doc) =>
        set((s) => ({ doc: withLayout(doc, s.engine, s.collapsedLanes, s.viewport) })),

      resetToSeed: () =>
        set((s) => ({
          doc: withLayout(buildSeedDoc(), s.engine, s.collapsedLanes, s.viewport),
          selectedIds: [],
          traceEntityId: null,
        })),

      relayout: () =>
        set((s) => ({
          doc: withLayout(s.doc, s.engine, s.collapsedLanes, s.viewport),
        })),

      setEngine: (engine) =>
        set((s) => ({
          engine,
          doc: withLayout(s.doc, engine, s.collapsedLanes, s.viewport),
        })),

      setViewport: (viewport) =>
        set((s) => ({
          viewport,
          doc: withLayout(s.doc, s.engine, s.collapsedLanes, viewport),
        })),

      autoOptimize: () =>
        set((s) => {
          const collapsed = new Set(s.collapsedLanes);
          const candidates: LayoutEngine[] = ['balanced', 'dagre', 'grupos'];
          let bestEngine: LayoutEngine = 'balanced';
          let bestScore = -1;
          for (const engine of candidates) {
            const res = computeLayout(s.doc, {
              engine,
              collapsed,
              viewport: s.viewport,
            });
            const q = evaluateLayout(res.nodes, estimateSize, s.viewport);
            if (q.score > bestScore) {
              bestScore = q.score;
              bestEngine = engine;
            }
          }
          return {
            engine: bestEngine,
            doc: withLayout(s.doc, bestEngine, s.collapsedLanes, s.viewport),
          };
        }),

      addNode: (input) => {
        const id = uid('node');
        const data: OrgNodeData = {
          id,
          type: input.type,
          owner: input.owner,
          titulo: input.titulo ?? 'Novo card',
          lane: input.lane,
          grupo: input.grupo,
          links: [],
          socios: [],
        };
        const node: GraphNode = {
          id,
          type: input.type,
          position: { x: 0, y: 0 },
          data,
        };
        set((s) => {
          const doc = { ...s.doc, nodes: [...s.doc.nodes, node] };
          return {
            doc: withLayout(doc, s.engine, s.collapsedLanes, s.viewport),
            selectedIds: [id],
          };
        });
        return id;
      },

      duplicateNode: (id) => {
        const src = findNode(get().doc, id);
        if (!src) return null;
        const newId = uid('node');
        const clone: GraphNode = {
          ...src,
          id: newId,
          position: { x: src.position.x + 32, y: src.position.y + 32 },
          data: {
            ...src.data,
            id: newId,
            titulo: `${src.data.titulo} (cópia)`,
            socios: src.data.socios
              ? src.data.socios.map((x) => ({ ...x }))
              : undefined,
            links: src.data.links.map((l) => ({ ...l, id: uid('lk') })),
          },
        };
        set((s) => {
          const doc = { ...s.doc, nodes: [...s.doc.nodes, clone] };
          return {
            doc: withLayout(doc, s.engine, s.collapsedLanes, s.viewport),
            selectedIds: [newId],
          };
        });
        return newId;
      },

      removeNodes: (ids) => {
        const remove = new Set(ids);
        set((s) => {
          const nodes = s.doc.nodes.filter((n) => !remove.has(n.id));
          const edges = s.doc.edges.filter(
            (e) => !remove.has(e.source) && !remove.has(e.target),
          );
          const doc = { ...s.doc, nodes, edges };
          return {
            doc: withLayout(doc, s.engine, s.collapsedLanes, s.viewport),
            selectedIds: s.selectedIds.filter((x) => !remove.has(x)),
          };
        });
      },

      updateNodeData: (id, patch) =>
        set((s) => ({
          doc: {
            ...s.doc,
            updatedAt: Date.now(),
            nodes: s.doc.nodes.map((n) =>
              n.id === id ? { ...n, data: { ...n.data, ...patch, id: n.id } } : n,
            ),
          },
        })),

      batchUpdate: (ids, patch) => {
        const set2 = new Set(ids);
        set((s) => ({
          doc: {
            ...s.doc,
            updatedAt: Date.now(),
            nodes: s.doc.nodes.map((n) =>
              set2.has(n.id) ? { ...n, data: { ...n.data, ...patch, id: n.id } } : n,
            ),
          },
        }));
      },

      moveNode: (id, position) =>
        set((s) => ({
          doc: {
            ...s.doc,
            nodes: s.doc.nodes.map((n) => (n.id === id ? { ...n, position } : n)),
          },
        })),

      addSocio: (nodeId, socio) =>
        get().updateNodeData(nodeId, {
          socios: [
            ...(findNode(get().doc, nodeId)?.data.socios ?? []),
            socio ?? { nome: 'Novo sócio', percentual: 0 },
          ],
        }),

      updateSocio: (nodeId, index, patch) => {
        const socios = [...(findNode(get().doc, nodeId)?.data.socios ?? [])];
        if (!socios[index]) return;
        socios[index] = { ...socios[index], ...patch };
        get().updateNodeData(nodeId, { socios });
      },

      removeSocio: (nodeId, index) => {
        const socios = (findNode(get().doc, nodeId)?.data.socios ?? []).filter(
          (_, i) => i !== index,
        );
        get().updateNodeData(nodeId, { socios });
      },

      addLink: (nodeId, link) =>
        get().updateNodeData(nodeId, {
          links: [
            ...(findNode(get().doc, nodeId)?.data.links ?? []),
            {
              id: uid('lk'),
              label: link?.label ?? 'Novo link',
              url: link?.url ?? 'https://',
              icon: link?.icon,
            },
          ],
        }),

      updateLink: (nodeId, linkId, patch) => {
        const links = (findNode(get().doc, nodeId)?.data.links ?? []).map((l) =>
          l.id === linkId ? { ...l, ...patch } : l,
        );
        get().updateNodeData(nodeId, { links });
      },

      removeLink: (nodeId, linkId) => {
        const links = (findNode(get().doc, nodeId)?.data.links ?? []).filter(
          (l) => l.id !== linkId,
        );
        get().updateNodeData(nodeId, { links });
      },

      connectNodes: (source, target) => {
        if (source === target) return;
        set((s) => {
          const id = `e-man-${source}-${target}`;
          if (s.doc.edges.some((e) => e.id === id)) return s;
          const edge: GraphEdge = { id, source, target, kind: 'CONTROL' };
          return {
            doc: { ...s.doc, edges: [...s.doc.edges, edge], updatedAt: Date.now() },
          };
        });
      },

      removeEdge: (id) =>
        set((s) => ({
          doc: {
            ...s.doc,
            edges: s.doc.edges.filter((e) => e.id !== id),
            updatedAt: Date.now(),
          },
        })),

      rederiveEdges: () =>
        set((s) => ({
          doc: { ...s.doc, edges: deriveEdges(s.doc.nodes), updatedAt: Date.now() },
        })),

      setSelection: (ids) => set({ selectedIds: ids }),
      toggleSelection: (id, additive) =>
        set((s) => {
          if (!additive) return { selectedIds: [id] };
          return s.selectedIds.includes(id)
            ? { selectedIds: s.selectedIds.filter((x) => x !== id) }
            : { selectedIds: [...s.selectedIds, id] };
        }),
      clearSelection: () => set({ selectedIds: [] }),

      toggleLane: (lane) =>
        set((s) => {
          const collapsedLanes = s.collapsedLanes.includes(lane)
            ? s.collapsedLanes.filter((l) => l !== lane)
            : [...s.collapsedLanes, lane];
          return {
            collapsedLanes,
            doc: withLayout(s.doc, s.engine, collapsedLanes, s.viewport),
          };
        }),

      setTheme: (theme) => set({ theme }),
      setAccent: (accent) => set({ accent }),
      savePreset: (name) =>
        set((s) => ({
          presets: [
            ...s.presets.filter((p) => p.name !== name),
            { name, base: s.theme, accent: s.accent },
          ],
        })),
      applyPreset: (name) =>
        set((s) => {
          const preset = s.presets.find((p) => p.name === name);
          if (!preset) return s;
          return { theme: preset.base, accent: preset.accent ?? s.accent };
        }),

      setSearch: (search) => set({ search }),
      setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),
      clearFilters: () => set({ filters: {} }),
      setTrace: (traceEntityId) => set({ traceEntityId }),
      setEdgeMode: (edgeMode) => set({ edgeMode }),
    }),
    {
      limit: 100,
      partialize: (state) => ({ doc: state.doc }),
      equality: (a, b) => a.doc === b.doc,
    },
  ),
);

/** Hook into zundo's temporal store for undo/redo + history length. */
export function useTemporal<T>(selector: (state: TemporalState) => T): T {
  return useZustand(useAppStore.temporal, selector);
}

interface TemporalState {
  undo: (steps?: number) => void;
  redo: (steps?: number) => void;
  clear: () => void;
  pastStates: unknown[];
  futureStates: unknown[];
}

// ── derived selectors (computed outside the store to keep history clean) ──────

export function selectHighlightSet(state: AppState): Set<string> {
  const sets: Set<string>[] = [];
  if (state.search.trim()) sets.push(matchNodes(state.doc, state.search));
  if (state.filters.lane || state.filters.owner || state.filters.socio)
    sets.push(applyFilters(state.doc, state.filters));
  if (state.traceEntityId)
    sets.push(traceParticipation(state.doc, state.traceEntityId));
  if (sets.length === 0) return new Set();
  // Intersection of all active constraints.
  return sets.reduce((acc, s) => new Set([...acc].filter((x) => s.has(x))), sets[0]!);
}

export function isFilteringActive(state: AppState): boolean {
  return Boolean(
    state.search.trim() ||
    state.filters.lane ||
    state.filters.owner ||
    state.filters.socio ||
    state.traceEntityId,
  );
}
