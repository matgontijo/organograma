'use client';

import { memo } from 'react';

/**
 * Faint vertical guide that visually separates the Rafael side (left) from the
 * Tárik side (right). The node itself is a thin full-height strip placed at the
 * diagram's horizontal centre; non-interactive and rendered behind the cards.
 */
function DividerNodeImpl() {
  return (
    <div className="relative h-full w-full">
      <div
        className="absolute inset-y-0 left-0"
        style={{ width: 0, borderLeft: '5px dashed rgb(var(--ink-muted) / 0.95)' }}
      />
      <span className="absolute -top-9 right-3 whitespace-nowrap text-[18px] font-black uppercase tracking-[0.3em] text-brand-rafael">
        Rafael
      </span>
      <span className="absolute -top-9 left-3 whitespace-nowrap text-[18px] font-black uppercase tracking-[0.3em] text-brand-tarik">
        Tárik
      </span>
    </div>
  );
}

export const DividerNode = memo(DividerNodeImpl);
