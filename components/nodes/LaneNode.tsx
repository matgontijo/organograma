'use client';

import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { useAppStore } from '@/lib/store';
import type { LaneId } from '@/lib/types';

export interface LaneNodeData {
  laneId: LaneId;
  titulo: string;
  collapsed: boolean;
  [key: string]: unknown;
}

function LaneNodeImpl({ data }: NodeProps) {
  const d = data as LaneNodeData;
  const toggleLane = useAppStore((s) => s.toggleLane);

  return (
    <div className="h-full w-full overflow-hidden rounded-xl border border-line bg-surface-2/40">
      <button
        type="button"
        onClick={() => toggleLane(d.laneId)}
        aria-expanded={!d.collapsed}
        aria-label={`${d.collapsed ? 'Expandir' : 'Recolher'} faixa ${d.titulo}`}
        className="flex w-full items-center gap-2 bg-black px-4 py-2 text-left text-white"
        style={{ pointerEvents: 'auto', height: 44 }}
      >
        <span className="text-xs opacity-80">{d.collapsed ? '▸' : '▾'}</span>
        <span className="text-sm font-bold uppercase tracking-[0.2em]">{d.titulo}</span>
      </button>
    </div>
  );
}

export const LaneNode = memo(LaneNodeImpl);
