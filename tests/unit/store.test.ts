import { beforeEach, describe, expect, it } from 'vitest';
import { useAppStore } from '@/lib/store';

const get = () => useAppStore.getState();
const temporal = () => useAppStore.temporal.getState();

beforeEach(() => {
  get().resetToSeed();
  temporal().clear();
});

describe('node CRUD invariants', () => {
  it('adds a node and selects it', () => {
    const before = get().doc.nodes.length;
    const id = get().addNode({
      type: 'EMPRESA_PATRIMONIAL',
      owner: 'SOCIEDADE',
      lane: 'EMPRESAS',
    });
    expect(get().doc.nodes.length).toBe(before + 1);
    expect(get().selectedIds).toEqual([id]);
  });

  it('removes nodes and their edges', () => {
    const edgesTouching = get().doc.edges.filter(
      (e) => e.source === 'emp-ativus' || e.target === 'emp-ativus',
    ).length;
    expect(edgesTouching).toBeGreaterThan(0);
    get().removeNodes(['emp-ativus']);
    expect(get().doc.nodes.find((n) => n.id === 'emp-ativus')).toBeUndefined();
    expect(
      get().doc.edges.some(
        (e) => e.source === 'emp-ativus' || e.target === 'emp-ativus',
      ),
    ).toBe(false);
  });

  it('duplicates a node with a fresh id and copied sócios', () => {
    const newId = get().duplicateNode('emp-gibraltar');
    expect(newId).toBeTruthy();
    const clone = get().doc.nodes.find((n) => n.id === newId)!;
    const src = get().doc.nodes.find((n) => n.id === 'emp-gibraltar')!;
    expect(clone.data.socios).toEqual(src.data.socios);
    expect(clone.data.socios).not.toBe(src.data.socios);
  });

  it('updates node data and keeps id stable', () => {
    get().updateNodeData('emp-ativus', { titulo: 'ATIVUS RENOMEADO' });
    const n = get().doc.nodes.find((x) => x.id === 'emp-ativus')!;
    expect(n.data.titulo).toBe('ATIVUS RENOMEADO');
    expect(n.data.id).toBe('emp-ativus');
  });

  it('batch updates many nodes', () => {
    get().batchUpdate(['emp-ativus', 'emp-gibraltar'], { owner: 'SOCIEDADE' });
    expect(get().doc.nodes.find((n) => n.id === 'emp-ativus')!.data.owner).toBe(
      'SOCIEDADE',
    );
    expect(get().doc.nodes.find((n) => n.id === 'emp-gibraltar')!.data.owner).toBe(
      'SOCIEDADE',
    );
  });
});

describe('sócios + links CRUD', () => {
  it('adds, updates and removes a sócio', () => {
    const before = get().doc.nodes.find((n) => n.id === 'emp-quintas')!.data.socios!
      .length;
    get().addSocio('emp-quintas', { nome: 'Teste', percentual: 5 });
    expect(
      get().doc.nodes.find((n) => n.id === 'emp-quintas')!.data.socios!.length,
    ).toBe(before + 1);
    get().updateSocio('emp-quintas', before, { percentual: 9 });
    expect(
      get().doc.nodes.find((n) => n.id === 'emp-quintas')!.data.socios![before]!
        .percentual,
    ).toBe(9);
    get().removeSocio('emp-quintas', before);
    expect(
      get().doc.nodes.find((n) => n.id === 'emp-quintas')!.data.socios!.length,
    ).toBe(before);
  });

  it('adds, updates and removes a link', () => {
    get().addLink('emp-ativus', { label: 'Doc', url: 'https://t.co' });
    const link = get()
      .doc.nodes.find((n) => n.id === 'emp-ativus')!
      .data.links.at(-1)!;
    get().updateLink('emp-ativus', link.id, { label: 'Atualizado' });
    expect(
      get()
        .doc.nodes.find((n) => n.id === 'emp-ativus')!
        .data.links.at(-1)!.label,
    ).toBe('Atualizado');
    get().removeLink('emp-ativus', link.id);
    expect(
      get()
        .doc.nodes.find((n) => n.id === 'emp-ativus')!
        .data.links.some((l) => l.id === link.id),
    ).toBe(false);
  });
});

describe('edges + relink', () => {
  it('connects and removes an edge', () => {
    get().connectNodes('emp-audax', 'emp-tarifa');
    const id = 'e-man-emp-audax-emp-tarifa';
    expect(get().doc.edges.some((e) => e.id === id)).toBe(true);
    get().removeEdge(id);
    expect(get().doc.edges.some((e) => e.id === id)).toBe(false);
  });

  it('ignores self-connections', () => {
    const before = get().doc.edges.length;
    get().connectNodes('emp-audax', 'emp-audax');
    expect(get().doc.edges.length).toBe(before);
  });
});

describe('lanes', () => {
  it('toggles collapse and hides nodes', () => {
    get().toggleLane('CARROS');
    expect(get().collapsedLanes).toContain('CARROS');
    expect(
      get()
        .doc.nodes.filter((n) => n.data.lane === 'CARROS')
        .every((n) => n.hidden),
    ).toBe(true);
    get().toggleLane('CARROS');
    expect(get().collapsedLanes).not.toContain('CARROS');
  });
});

describe('undo / redo (zundo)', () => {
  it('reverts and reapplies a structural change', () => {
    const before = get().doc.nodes.length;
    get().addNode({ type: 'CARRO', owner: 'RAFAEL', lane: 'CARROS' });
    expect(get().doc.nodes.length).toBe(before + 1);
    temporal().undo();
    expect(get().doc.nodes.length).toBe(before);
    temporal().redo();
    expect(get().doc.nodes.length).toBe(before + 1);
  });
});

describe('layout engine switch', () => {
  it('re-lays out when the engine changes', () => {
    get().setEngine('dagre');
    expect(get().engine).toBe('dagre');
    expect(get().doc.nodes.every((n) => Number.isFinite(n.position.x))).toBe(true);
  });

  it('relayout and rederiveEdges keep the doc valid', () => {
    get().relayout();
    expect(get().doc.nodes.length).toBeGreaterThan(0);
    const before = get().doc.edges.length;
    get().rederiveEdges();
    expect(get().doc.edges.length).toBe(before);
  });

  it('moveNode updates a position', () => {
    get().moveNode('emp-ativus', { x: 999, y: 888 });
    expect(get().doc.nodes.find((n) => n.id === 'emp-ativus')!.position).toEqual({
      x: 999,
      y: 888,
    });
  });

  it('setViewport relays out for the new device', () => {
    get().setViewport({ width: 390, height: 800, isMobile: true });
    expect(get().viewport.isMobile).toBe(true);
    expect(get().doc.nodes.every((n) => Number.isFinite(n.position.x))).toBe(true);
  });

  it('autoOptimize selects an engine and keeps positions valid', () => {
    get().setEngine('grupos');
    get().autoOptimize();
    expect(['balanced', 'grupos', 'dagre']).toContain(get().engine);
    expect(get().doc.nodes.every((n) => Number.isFinite(n.position.x))).toBe(true);
  });
});

describe('selection helpers', () => {
  it('sets, toggles and clears selection', () => {
    get().setSelection(['emp-ativus']);
    expect(get().selectedIds).toEqual(['emp-ativus']);
    get().toggleSelection('emp-gibraltar', true);
    expect(get().selectedIds).toContain('emp-gibraltar');
    get().toggleSelection('emp-gibraltar', true);
    expect(get().selectedIds).not.toContain('emp-gibraltar');
    get().toggleSelection('emp-quintas', false);
    expect(get().selectedIds).toEqual(['emp-quintas']);
    get().clearSelection();
    expect(get().selectedIds).toEqual([]);
  });
});

describe('theme, presets, search and trace setters', () => {
  it('sets theme and accent', () => {
    get().setTheme('claro');
    get().setAccent('#123456');
    expect(get().theme).toBe('claro');
    expect(get().accent).toBe('#123456');
  });

  it('saves and applies a preset', () => {
    get().setTheme('escuro');
    get().setAccent('#abcabc');
    get().savePreset('Meu preset');
    get().setTheme('claro');
    get().applyPreset('Meu preset');
    expect(get().theme).toBe('escuro');
    expect(get().accent).toBe('#abcabc');
  });

  it('ignores applying an unknown preset', () => {
    const before = get().theme;
    get().applyPreset('inexistente');
    expect(get().theme).toBe(before);
  });

  it('sets and clears search/filters/trace', () => {
    get().setSearch('gibraltar');
    get().setFilters({ owner: 'TARIK' });
    get().setTrace('emp-gibraltar');
    expect(get().search).toBe('gibraltar');
    expect(get().filters.owner).toBe('TARIK');
    expect(get().traceEntityId).toBe('emp-gibraltar');
    get().clearFilters();
    get().setTrace(null);
    expect(get().filters).toEqual({});
    expect(get().traceEntityId).toBeNull();
  });

  it('loadDoc replaces the document', () => {
    const doc = get().doc;
    const trimmed = { ...doc, nodes: doc.nodes.slice(0, 5) };
    get().loadDoc(trimmed);
    expect(get().doc.nodes.length).toBe(5);
  });
});
