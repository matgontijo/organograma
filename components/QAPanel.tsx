'use client';

import { useMemo, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useAppStore } from '@/lib/store';
import { runQA, type Severity } from '@/lib/qa';
import { checkIndexedDB } from '@/lib/db';
import { computeLayout, estimateSize } from '@/lib/layout';
import { evaluateLayout } from '@/lib/render-agent';

const SEV_STYLE: Record<Severity, string> = {
  error: 'border-red-300 bg-red-50 text-red-700',
  warning: 'border-amber-300 bg-amber-50 text-amber-700',
  info: 'border-sky-300 bg-sky-50 text-sky-700',
};
const SEV_ICON: Record<Severity, string> = { error: '✖', warning: '⚠', info: 'ℹ' };

interface Health {
  status: string;
  version: string;
  idb: string;
}

const GRADE_STYLE: Record<string, string> = {
  A: 'bg-green-100 text-green-700',
  B: 'bg-green-100 text-green-700',
  C: 'bg-amber-100 text-amber-700',
  D: 'bg-orange-100 text-orange-700',
  F: 'bg-red-100 text-red-700',
};

export function QAPanel({ onClose }: { onClose?: () => void }) {
  const doc = useAppStore((s) => s.doc);
  const engine = useAppStore((s) => s.engine);
  const viewport = useAppStore((s) => s.viewport);
  const collapsedLanes = useAppStore((s) => s.collapsedLanes);
  const autoOptimize = useAppStore((s) => s.autoOptimize);
  const setSelection = useAppStore((s) => s.setSelection);
  const { fitView } = useReactFlow();
  const [health, setHealth] = useState<Health | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);

  const report = useMemo(() => runQA(doc), [doc]);
  const render = useMemo(() => {
    const res = computeLayout(doc, {
      engine,
      collapsed: new Set(collapsedLanes),
      viewport,
    });
    return evaluateLayout(res.nodes, estimateSize, viewport);
  }, [doc, engine, collapsedLanes, viewport]);

  const focus = (id?: string) => {
    if (!id) return;
    setSelection([id]);
    fitView({ nodes: [{ id }], padding: 0.4, duration: 400 });
  };

  const runHealth = async () => {
    setHealthLoading(true);
    try {
      const res = await fetch('/api/health', { cache: 'no-store' });
      const json = (await res.json()) as { status: string; version: string };
      const idb = await checkIndexedDB();
      setHealth({ status: json.status, version: json.version, idb: idb.detail });
    } catch (err) {
      setHealth({ status: 'erro', version: '—', idb: (err as Error).message });
    } finally {
      setHealthLoading(false);
    }
  };

  return (
    <div className="thin-scroll max-h-[70vh] w-80 overflow-y-auto rounded-xl border border-line bg-surface/95 shadow-card backdrop-blur">
      <div className="flex items-center justify-between border-b border-line px-3 py-2">
        <h2 className="text-sm font-semibold">QA · Integridade</h2>
        {onClose && (
          <button
            type="button"
            className="btn-mini"
            onClick={onClose}
            aria-label="Fechar QA"
          >
            ✕
          </button>
        )}
      </div>

      <div className="space-y-3 p-3">
        {/* Rendering Quality Agent */}
        <section
          className="rounded-md border border-line bg-surface-2 p-2"
          data-testid="render-quality"
        >
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
              Qualidade de renderização
            </span>
            <span
              className={`rounded px-1.5 py-0.5 text-[11px] font-bold ${GRADE_STYLE[render.grade]}`}
            >
              {render.grade} · {render.score}
            </span>
          </div>
          <div className="flex gap-2 text-[11px] text-ink-muted">
            <span>Proporção {render.aspectRatio.toFixed(2)}:1</span>
            <span>Sobrep. {render.overlaps}</span>
            <span>{viewport.isMobile ? 'Mobile' : 'Desktop'}</span>
          </div>
          <p className="mt-1 text-[10px] text-ink-muted">{render.notes[0]}</p>
          <button
            type="button"
            className="btn-primary mt-2 w-full"
            onClick={autoOptimize}
          >
            ✨ Otimizar layout para esta tela
          </button>
        </section>

        <div className="flex gap-1.5 text-xs" data-testid="qa-counts">
          <span
            className={`flex-1 rounded-md border px-2 py-1 text-center ${SEV_STYLE.error}`}
          >
            {report.counts.error} erros
          </span>
          <span
            className={`flex-1 rounded-md border px-2 py-1 text-center ${SEV_STYLE.warning}`}
          >
            {report.counts.warning} avisos
          </span>
          <span
            className={`flex-1 rounded-md border px-2 py-1 text-center ${SEV_STYLE.info}`}
          >
            {report.counts.info} info
          </span>
        </div>

        <p
          className={`rounded-md px-2 py-1 text-center text-xs font-semibold ${
            report.hasErrors ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}
          data-testid="qa-verdict"
        >
          {report.hasErrors
            ? '✖ Reprovado — há erros bloqueantes'
            : '✓ Aprovado — sem erros bloqueantes'}
        </p>

        <div className="space-y-1.5">
          {report.issues.length === 0 ? (
            <p className="text-xs text-green-600">✓ Nenhum problema encontrado.</p>
          ) : (
            report.issues.map((issue, i) => (
              <button
                key={i}
                type="button"
                onClick={() => focus(issue.nodeId)}
                className={`flex w-full items-start gap-1.5 rounded-md border px-2 py-1.5 text-left text-[11px] ${SEV_STYLE[issue.severity]}`}
              >
                <span aria-hidden>{SEV_ICON[issue.severity]}</span>
                <span>
                  {issue.nodeLabel && <strong>{issue.nodeLabel}: </strong>}
                  {issue.message}
                  <span className="opacity-60"> [{issue.rule}]</span>
                </span>
              </button>
            ))
          )}
        </div>

        <div className="border-t border-line pt-2">
          <button
            type="button"
            className="btn-secondary w-full"
            onClick={runHealth}
            disabled={healthLoading}
          >
            {healthLoading ? 'Verificando…' : 'Checar saúde (/api/health + IndexedDB)'}
          </button>
          {health && (
            <div className="mt-2 space-y-0.5 rounded-md border border-line bg-surface-2 p-2 text-[11px]">
              <div>
                Status: <strong>{health.status}</strong> · v{health.version}
              </div>
              <div>IndexedDB: {health.idb}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
