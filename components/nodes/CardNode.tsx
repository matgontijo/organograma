'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { motion } from 'framer-motion';
import type { OrgNodeData } from '@/lib/types';
import { nodeAccent, NODE_ICON } from '@/lib/theme';
import { useAppStore } from '@/lib/store';
import { CARD_WIDTH } from '@/lib/layout';

function SocioBar({ pct, color }: { pct: number; color: string }) {
  const width = Math.max(0, Math.min(100, pct));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/10">
      <div
        className="h-full rounded-full"
        style={{ width: `${width}%`, background: color }}
      />
    </div>
  );
}

function CardNodeImpl({ data, selected }: NodeProps) {
  const d = data as unknown as OrgNodeData;
  const accent = nodeAccent(d);
  const setTrace = useAppStore((s) => s.setTrace);
  const traceEntityId = useAppStore((s) => s.traceEntityId);
  const traceable = d.type !== 'CARRO' && d.type !== 'SEGURO';

  const socioSum = (d.socios ?? []).reduce(
    (a, s) => a + (Number(s.percentual) || 0),
    0,
  );
  const hasSocios = (d.socios ?? []).length > 0;
  const sumOff = hasSocios && Math.abs(socioSum - 100) > 0.1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="trk-card rounded-xl border bg-surface text-ink shadow-card transition-shadow hover:shadow-card-hover"
      style={{
        width: CARD_WIDTH,
        borderColor: selected ? accent.color : 'rgb(var(--line))',
        borderWidth: selected ? 2 : 1,
      }}
    >
      <Handle type="target" position={Position.Top} />

      {/* Header banner */}
      <div
        className="flex items-center gap-2 rounded-t-xl px-3 py-2"
        style={{ background: accent.color, color: '#fff' }}
      >
        <span aria-hidden className="text-base leading-none">
          {NODE_ICON[d.type]}
        </span>
        <div className="min-w-0 flex-1">
          <div
            className="truncate text-[13px] font-semibold leading-tight"
            title={d.titulo}
          >
            {d.titulo}
          </div>
          {d.subtitulo && (
            <div className="truncate text-[10px] opacity-90">{d.subtitulo}</div>
          )}
        </div>
        {traceable && (
          <button
            type="button"
            aria-label={`Rastrear participação de ${d.titulo}`}
            title="Rastrear participação"
            onClick={(e) => {
              e.stopPropagation();
              setTrace(traceEntityId === d.id ? null : d.id);
            }}
            className="rounded p-1 text-white/90 hover:bg-white/20"
          >
            🎯
          </button>
        )}
      </div>

      {/* Body */}
      <div className="space-y-2 px-3 py-2 text-[11px]">
        {d.diretores && d.diretores.length > 0 && (
          <div>
            <div className="mb-0.5 text-[9px] font-semibold uppercase tracking-wide text-ink-muted">
              Direção
            </div>
            {d.diretores.map((dir, i) => (
              <div key={i} className="flex justify-between gap-2">
                <span className="text-ink-muted">{dir.papel}</span>
                <span className="truncate font-medium" title={dir.nome}>
                  {dir.nome}
                </span>
              </div>
            ))}
          </div>
        )}

        {hasSocios && (
          <div>
            <div className="mb-0.5 flex items-center justify-between text-[9px] font-semibold uppercase tracking-wide text-ink-muted">
              <span>Sócios</span>
              <span
                className={sumOff ? 'text-red-500' : 'text-ink-muted'}
                title="Soma dos sócios"
              >
                Σ {socioSum.toFixed(socioSum % 1 ? 2 : 0)}%
              </span>
            </div>
            <div className="space-y-1">
              {d.socios!.map((s, i) => (
                <div key={i}>
                  <div className="flex justify-between gap-2">
                    <span className="truncate" title={s.nome}>
                      {s.nome}
                      {s.papel ? (
                        <span className="text-ink-muted"> · {s.papel}</span>
                      ) : null}
                    </span>
                    <span className="font-semibold tabular-nums">{s.percentual}%</span>
                  </div>
                  <SocioBar pct={Number(s.percentual) || 0} color={accent.color} />
                </div>
              ))}
            </div>
          </div>
        )}

        {d.imoveis && d.imoveis.length > 0 && (
          <div>
            <div className="mb-0.5 text-[9px] font-semibold uppercase tracking-wide text-ink-muted">
              Imóveis
            </div>
            <ul className="space-y-0.5">
              {d.imoveis.map((im, i) => (
                <li key={i} className="truncate text-ink-muted" title={im}>
                  • {im}
                </li>
              ))}
            </ul>
          </div>
        )}

        {d.dados && Object.keys(d.dados).length > 0 && (
          <div className="grid grid-cols-1 gap-0.5">
            {Object.entries(d.dados).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2">
                <span className="text-ink-muted">{k}</span>
                <span className="truncate font-medium tabular-nums" title={v}>
                  {v}
                </span>
              </div>
            ))}
          </div>
        )}

        {d.balanco && (
          <span
            className="inline-block rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{ background: accent.soft, color: accent.text }}
          >
            {d.balanco}
          </span>
        )}

        {d.notas && <p className="text-[10px] italic text-ink-muted">{d.notas}</p>}
      </div>

      {/* Links footer */}
      {d.links && d.links.length > 0 && (
        <div className="flex flex-wrap gap-1 border-t border-line px-3 py-2">
          {d.links.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex max-w-full items-center gap-1 truncate rounded-md px-2 py-1 text-[10px] font-medium"
              style={{ background: accent.soft, color: accent.text }}
              title={link.url}
            >
              <span aria-hidden>{link.icon ? '' : '🔗'}</span>
              <span className="truncate">{link.label || link.url}</span>
            </a>
          ))}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} />
    </motion.div>
  );
}

export const CardNode = memo(CardNodeImpl);
