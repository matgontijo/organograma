'use client';

import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';

export interface GroupNodeData {
  label: string;
  color: string;
  [key: string]: unknown;
}

function GroupNodeImpl({ data }: NodeProps) {
  const d = data as GroupNodeData;
  return (
    <div
      className="h-full w-full rounded-lg border"
      style={{
        borderColor: `${d.color}33`,
        background: `${d.color}08`,
      }}
    >
      <div
        className="truncate px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em]"
        style={{ color: d.color }}
        title={d.label}
      >
        {d.label}
      </div>
    </div>
  );
}

export const GroupNode = memo(GroupNodeImpl);
