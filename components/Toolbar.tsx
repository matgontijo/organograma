'use client';

import { useRef } from 'react';
import { getNodesBounds, getViewportForBounds, useReactFlow } from '@xyflow/react';
import { useAppStore, useTemporal } from '@/lib/store';
import { exportJson, exportPng, exportSvg } from '@/lib/export';
import { deserializeDoc } from '@/lib/serialize';
import { exportPixelRatio } from '@/lib/render-agent';
import { ThemeControls } from './ThemeControls';
import type { LayoutEngine } from '@/lib/layout';

interface ToolbarProps {
  onToggleSummary: () => void;
  onToggleQA: () => void;
}

export function Toolbar({ onToggleSummary, onToggleQA }: ToolbarProps) {
  const addNode = useAppStore((s) => s.addNode);
  const duplicateNode = useAppStore((s) => s.duplicateNode);
  const removeNodes = useAppStore((s) => s.removeNodes);
  const selectedIds = useAppStore((s) => s.selectedIds);
  const engine = useAppStore((s) => s.engine);
  const setEngine = useAppStore((s) => s.setEngine);
  const relayout = useAppStore((s) => s.relayout);
  const autoOptimize = useAppStore((s) => s.autoOptimize);
  const edgeMode = useAppStore((s) => s.edgeMode);
  const setEdgeMode = useAppStore((s) => s.setEdgeMode);
  const viewport = useAppStore((s) => s.viewport);
  const resetToSeed = useAppStore((s) => s.resetToSeed);
  const loadDoc = useAppStore((s) => s.loadDoc);
  const doc = useAppStore((s) => s.doc);

  const undo = useTemporal((s) => s.undo);
  const redo = useTemporal((s) => s.redo);
  const pastLen = useTemporal((s) => s.pastStates.length);
  const futureLen = useTemporal((s) => s.futureStates.length);

  const { getNodes } = useReactFlow();
  const fileRef = useRef<HTMLInputElement>(null);

  const getViewportEl = (): HTMLElement | null =>
    document.querySelector('.react-flow__viewport');

  const computeTransform = () => {
    const nodes = getNodes().filter((n) => n.type !== 'lane');
    if (nodes.length === 0) return { pixelRatio: exportPixelRatio(viewport) };
    const bounds = getNodesBounds(nodes);
    const pad = 80;
    const width = Math.min(6000, Math.ceil(bounds.width) + pad * 2);
    const height = Math.min(6000, Math.ceil(bounds.height) + pad * 2);
    const vp = getViewportForBounds(bounds, width, height, 0.2, 2, 0.1);
    return {
      width,
      height,
      pixelRatio: exportPixelRatio(viewport),
      style: {
        width: `${width}px`,
        height: `${height}px`,
        transform: `translate(${vp.x}px, ${vp.y}px) scale(${vp.zoom})`,
      },
    };
  };

  const doExportPng = async () => {
    const el = getViewportEl();
    if (el) await exportPng(el, 'mapa-trk.png', computeTransform());
  };
  const doExportSvg = async () => {
    const el = getViewportEl();
    if (el) await exportSvg(el, 'mapa-trk.svg', computeTransform());
  };

  const onImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        loadDoc(deserializeDoc(String(reader.result)));
      } catch (err) {
        alert(`JSON inválido: ${(err as Error).message}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <header className="thin-scroll z-20 flex flex-nowrap items-center gap-2 overflow-x-auto border-b border-line bg-surface px-3 py-2 md:flex-wrap md:overflow-visible">
      <div className="mr-2 flex shrink-0 items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-gold font-black text-black">
          T
        </span>
        <div className="leading-tight">
          <div className="whitespace-nowrap text-sm font-bold">
            TRK · Mapa Patrimonial
          </div>
          <div className="hidden text-[10px] text-ink-muted sm:block">
            Interativo &amp; personalizável
          </div>
        </div>
      </div>

      <div className="h-6 w-px shrink-0 bg-line" />

      <button
        type="button"
        className="btn-primary"
        onClick={() =>
          addNode({ type: 'EMPRESA_PATRIMONIAL', owner: 'SOCIEDADE', lane: 'EMPRESAS' })
        }
      >
        + Card
      </button>
      <button
        type="button"
        className="btn-secondary"
        disabled={selectedIds.length !== 1}
        onClick={() => selectedIds[0] && duplicateNode(selectedIds[0])}
        title="Duplicar (Ctrl+D)"
      >
        Duplicar
      </button>
      <button
        type="button"
        className="btn-secondary"
        disabled={selectedIds.length === 0}
        onClick={() => removeNodes(selectedIds)}
        title="Remover (Del)"
      >
        Remover
      </button>

      <div className="h-6 w-px shrink-0 bg-line" />

      <button
        type="button"
        className="btn-secondary"
        disabled={pastLen === 0}
        onClick={() => undo()}
        title="Desfazer (Ctrl+Z)"
      >
        ↶ Desfazer
      </button>
      <button
        type="button"
        className="btn-secondary"
        disabled={futureLen === 0}
        onClick={() => redo()}
        title="Refazer (Ctrl+Y)"
      >
        ↷ Refazer
      </button>

      <div className="h-6 w-px shrink-0 bg-line" />

      <select
        aria-label="Motor de layout"
        className="shrink-0 rounded-md border border-line bg-surface-2 px-2 py-1.5 text-xs"
        value={engine}
        onChange={(e) => setEngine(e.target.value as LayoutEngine)}
      >
        <option value="balanced">Layout: balanceado</option>
        <option value="grupos">Layout: sub-colunas</option>
        <option value="dagre">Layout: dagre</option>
      </select>
      <button
        type="button"
        className="btn-primary"
        onClick={autoOptimize}
        title="Agente de qualidade escolhe o melhor layout para a tela"
      >
        ✨ Otimizar
      </button>
      <button type="button" className="btn-secondary" onClick={relayout}>
        Reorganizar
      </button>
      <button
        type="button"
        className="btn-secondary"
        onClick={() => setEdgeMode(edgeMode === 'focus' ? 'all' : 'focus')}
        title="Mostrar conexões só do card focado, ou todas de uma vez"
      >
        {edgeMode === 'focus' ? '↳ Conexões: ao focar' : '↳ Conexões: todas'}
      </button>

      <div className="h-6 w-px shrink-0 bg-line" />

      <button type="button" className="btn-secondary" onClick={doExportPng}>
        PNG
      </button>
      <button type="button" className="btn-secondary" onClick={doExportSvg}>
        SVG
      </button>
      <button type="button" className="btn-secondary" onClick={() => exportJson(doc)}>
        JSON ↓
      </button>
      <button
        type="button"
        className="btn-secondary"
        onClick={() => fileRef.current?.click()}
      >
        JSON ↑
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onImport(f);
          e.target.value = '';
        }}
      />

      <div className="h-6 w-px shrink-0 bg-line" />

      <button type="button" className="btn-secondary" onClick={onToggleSummary}>
        Resumo
      </button>
      <button type="button" className="btn-secondary" onClick={onToggleQA}>
        QA
      </button>
      <button
        type="button"
        className="btn-secondary"
        onClick={() =>
          confirm('Restaurar dados originais? Alterações locais serão perdidas.') &&
          resetToSeed()
        }
      >
        Reset
      </button>

      <div className="ml-auto shrink-0">
        <ThemeControls />
      </div>
    </header>
  );
}
