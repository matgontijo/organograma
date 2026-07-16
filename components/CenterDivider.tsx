'use client';

import { useViewport } from '@xyflow/react';

/**
 * Rafael ◀ ▶ Tárik divider, drawn as a *screen-space* overlay so it stays crisp
 * at any zoom. A thin line with softly faded ends, bounded to the diagram's
 * vertical extent — a subtle guide rather than a hard slice.
 */
export function CenterDivider({
  laneWidth,
  totalHeight,
}: {
  laneWidth: number;
  totalHeight: number;
}) {
  const { x, y, zoom } = useViewport();
  if (laneWidth <= 0 || totalHeight <= 0) return null;

  const left = (laneWidth / 2) * zoom + x;
  const top = y;
  const height = totalHeight * zoom;

  return (
    <div className="pointer-events-none absolute inset-0 z-[4] overflow-hidden">
      <div
        className="absolute -translate-x-1/2"
        style={{
          left,
          top,
          height,
          width: 2,
          background:
            'linear-gradient(to bottom, transparent 0%, rgb(var(--ink-muted) / 0.4) 7%, rgb(var(--ink-muted) / 0.4) 93%, transparent 100%)',
        }}
      />
      <div
        className="absolute top-1.5 flex -translate-x-1/2 items-center gap-1.5"
        style={{ left }}
      >
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-rafael/80">
          Rafael
        </span>
        <span className="text-[10px] text-ink-muted/60">|</span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-tarik/80">
          Tárik
        </span>
      </div>
    </div>
  );
}
