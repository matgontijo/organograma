'use client';

import { useMemo } from 'react';
import { useReactFlow } from '@xyflow/react';
import { isFilteringActive, selectHighlightSet, useAppStore } from '@/lib/store';
import type { LaneId, Owner } from '@/lib/types';

const LANES: LaneId[] = ['PESSOAS', 'EMPRESAS', 'IMOVEIS', 'CARROS', 'SEGUROS'];
const OWNERS: Owner[] = ['RAFAEL', 'TARIK', 'SOCIEDADE'];

export function SearchBar() {
  const search = useAppStore((s) => s.search);
  const setSearch = useAppStore((s) => s.setSearch);
  const filters = useAppStore((s) => s.filters);
  const setFilters = useAppStore((s) => s.setFilters);
  const clearFilters = useAppStore((s) => s.clearFilters);
  const traceEntityId = useAppStore((s) => s.traceEntityId);
  const setTrace = useAppStore((s) => s.setTrace);
  const doc = useAppStore((s) => s.doc);
  const setSelection = useAppStore((s) => s.setSelection);
  const { fitView } = useReactFlow();

  const traceLabel = useMemo(
    () => doc.nodes.find((n) => n.id === traceEntityId)?.data.titulo,
    [doc.nodes, traceEntityId],
  );

  const hitCount = useMemo(() => {
    const state = useAppStore.getState();
    return isFilteringActive(state) ? selectHighlightSet(state).size : 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filters, traceEntityId, doc]);

  const centralize = () => {
    const ids = [...selectHighlightSet(useAppStore.getState())];
    if (ids.length === 0) return;
    setSelection(ids);
    fitView({ nodes: ids.map((id) => ({ id })), padding: 0.25, duration: 500 });
  };

  const active = isFilteringActive(useAppStore.getState());

  return (
    <div className="w-[min(92vw,420px)] rounded-xl border border-line bg-surface/95 p-2 shadow-card backdrop-blur">
      <div className="flex items-center gap-2">
        <span aria-hidden className="pl-1 text-ink-muted">
          🔍
        </span>
        <input
          aria-label="Buscar por nome, sócio, placa ou matrícula"
          placeholder="Buscar nome, sócio, placa, matrícula…"
          className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && centralize()}
        />
        <button
          type="button"
          className="btn-mini"
          onClick={centralize}
          title="Centralizar resultados"
        >
          Centralizar
        </button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <select
          aria-label="Filtrar por faixa"
          className="rounded-md border border-line bg-surface-2 px-1.5 py-1 text-[11px]"
          value={filters.lane ?? ''}
          onChange={(e) =>
            setFilters({ lane: (e.target.value || null) as LaneId | null })
          }
        >
          <option value="">Faixa: todas</option>
          {LANES.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <select
          aria-label="Filtrar por dono"
          className="rounded-md border border-line bg-surface-2 px-1.5 py-1 text-[11px]"
          value={filters.owner ?? ''}
          onChange={(e) =>
            setFilters({ owner: (e.target.value || null) as Owner | null })
          }
        >
          <option value="">Dono: todos</option>
          {OWNERS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <input
          aria-label="Filtrar por sócio"
          placeholder="Sócio…"
          className="w-24 rounded-md border border-line bg-surface-2 px-1.5 py-1 text-[11px]"
          value={filters.socio ?? ''}
          onChange={(e) => setFilters({ socio: e.target.value || null })}
        />
        {active && (
          <span className="chip" data-testid="hit-count">
            {hitCount} resultado{hitCount === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {traceEntityId && (
        <div className="mt-2 flex items-center justify-between rounded-md bg-accent-soft px-2 py-1 text-[11px]">
          <span>
            🎯 Rastreando: <strong>{traceLabel}</strong>
          </span>
          <button type="button" className="btn-mini" onClick={() => setTrace(null)}>
            Limpar
          </button>
        </div>
      )}

      {(search || filters.lane || filters.owner || filters.socio) && (
        <button
          type="button"
          className="btn-mini mt-2 w-full"
          onClick={() => {
            setSearch('');
            clearFilters();
          }}
        >
          Limpar busca e filtros
        </button>
      )}
    </div>
  );
}
