'use client';

import { useMemo } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useAppStore } from '@/lib/store';
import { consolidateBySocio, countByType, nodesWithBadSums } from '@/lib/search';
import { NODE_ICON } from '@/lib/theme';
import type { NodeType } from '@/lib/types';

const TYPE_LABEL: Partial<Record<NodeType, string>> = {
  PESSOA: 'Pessoas',
  CONJUGE: 'Cônjuges',
  EMPRESA_PATRIMONIAL: 'Emp. patrimoniais',
  EMPRESA_OPERACIONAL: 'Emp. operacionais',
  EMPRESA_PARTICIPACAO: 'Emp. participação',
  IMOVEL: 'Imóveis',
  CARRO: 'Carros',
  SEGURO: 'Seguros',
};

export function SummaryPanel({ onClose }: { onClose?: () => void }) {
  const doc = useAppStore((s) => s.doc);
  const setSelection = useAppStore((s) => s.setSelection);
  const { fitView } = useReactFlow();

  const counts = useMemo(() => countByType(doc), [doc]);
  const consolidation = useMemo(() => consolidateBySocio(doc).slice(0, 10), [doc]);
  const badSums = useMemo(() => [...nodesWithBadSums(doc)], [doc]);

  const focus = (id: string) => {
    setSelection([id]);
    fitView({ nodes: [{ id }], padding: 0.4, duration: 400 });
  };

  return (
    <div className="thin-scroll max-h-[60vh] w-72 overflow-y-auto rounded-xl border border-line bg-surface/95 shadow-card backdrop-blur">
      <div className="flex items-center justify-between border-b border-line px-3 py-2">
        <h2 className="text-sm font-semibold">Resumo</h2>
        {onClose && (
          <button
            type="button"
            className="btn-mini"
            onClick={onClose}
            aria-label="Fechar resumo"
          >
            ✕
          </button>
        )}
      </div>

      <div className="space-y-3 p-3">
        <section>
          <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
            Por categoria
          </h3>
          <div className="grid grid-cols-2 gap-1.5">
            {counts
              .filter((c) => TYPE_LABEL[c.type])
              .map((c) => (
                <div
                  key={c.type}
                  className="flex items-center justify-between rounded-md border border-line bg-surface-2 px-2 py-1.5 text-xs"
                >
                  <span className="flex items-center gap-1 text-ink-muted">
                    <span aria-hidden>{NODE_ICON[c.type]}</span>
                    {TYPE_LABEL[c.type]}
                  </span>
                  <span className="font-bold tabular-nums">{c.count}</span>
                </div>
              ))}
          </div>
        </section>

        <section>
          <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
            Consolidação por sócio (Σ % onde aparece)
          </h3>
          <div className="space-y-1">
            {consolidation.map((row) => (
              <div key={row.nome} className="flex items-center justify-between text-xs">
                <span className="truncate" title={row.nome}>
                  {row.nome}
                </span>
                <span className="tabular-nums text-ink-muted">
                  {row.total.toFixed(row.total % 1 ? 2 : 0)}% · {row.participacoes}×
                </span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
            Alertas de soma ≠ 100%
          </h3>
          {badSums.length === 0 ? (
            <p className="text-xs text-green-600">✓ Todos os cards fecham 100%.</p>
          ) : (
            <div className="space-y-1" data-testid="bad-sums">
              {badSums.map((id) => {
                const node = doc.nodes.find((n) => n.id === id);
                if (!node) return null;
                const sum = (node.data.socios ?? []).reduce(
                  (a, s) => a + (Number(s.percentual) || 0),
                  0,
                );
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => focus(id)}
                    className="flex w-full items-center justify-between rounded-md border border-red-300 bg-red-50 px-2 py-1 text-left text-xs text-red-700 hover:bg-red-100"
                  >
                    <span className="truncate">{node.data.titulo}</span>
                    <span className="tabular-nums">{sum.toFixed(2)}%</span>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
