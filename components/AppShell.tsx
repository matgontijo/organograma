'use client';

import { useEffect, useRef, useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { Diagram } from './Diagram';
import { Toolbar } from './Toolbar';
import { SearchBar } from './SearchBar';
import { Inspector } from './Inspector';
import { SummaryPanel } from './SummaryPanel';
import { QAPanel } from './QAPanel';
import { useAppStore, useTemporal } from '@/lib/store';
import { loadDoc as loadFromDB, saveDoc } from '@/lib/db';

function hexToRgbTriplet(hex: string): string {
  const m = hex.replace('#', '');
  const full =
    m.length === 3
      ? m
          .split('')
          .map((c) => c + c)
          .join('')
      : m;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return '202 162 74';
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

export function AppShell() {
  const theme = useAppStore((s) => s.theme);
  const accent = useAppStore((s) => s.accent);
  const doc = useAppStore((s) => s.doc);
  const loadDoc = useAppStore((s) => s.loadDoc);
  const setViewport = useAppStore((s) => s.setViewport);
  const selectedIds = useAppStore((s) => s.selectedIds);
  const removeNodes = useAppStore((s) => s.removeNodes);
  const duplicateNode = useAppStore((s) => s.duplicateNode);
  const undo = useTemporal((s) => s.undo);
  const redo = useTemporal((s) => s.redo);

  const [showSummary, setShowSummary] = useState(true);
  const [showQA, setShowQA] = useState(false);
  const [showInspectorMobile, setShowInspectorMobile] = useState(false);
  const loadedRef = useRef(false);

  // Track viewport size → feeds the Rendering Quality Agent (mobile vs desktop).
  useEffect(() => {
    let frame = 0;
    const apply = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const mobile = width < 768;
      setViewport({ width, height, isMobile: mobile });
      if (mobile) setShowSummary(false);
    };
    const onResize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(apply);
    };
    apply();
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
    };
  }, [setViewport]);

  // Apply theme class + accent.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-claro', 'theme-escuro', 'theme-corporativo');
    root.classList.add(`theme-${theme}`);
    root.style.setProperty('--accent', hexToRgbTriplet(accent));
  }, [theme, accent]);

  // Load persisted document once on mount.
  useEffect(() => {
    let active = true;
    (async () => {
      const stored = await loadFromDB();
      if (active && stored && stored.nodes.length > 0) loadDoc(stored);
      loadedRef.current = true;
    })();
    return () => {
      active = false;
    };
  }, [loadDoc]);

  // Autosave (debounced) after load.
  useEffect(() => {
    if (!loadedRef.current) return;
    const t = setTimeout(() => {
      void saveDoc(doc);
    }, 600);
    return () => clearTimeout(t);
  }, [doc]);

  // Open the mobile inspector when a selection is made.
  useEffect(() => {
    if (selectedIds.length > 0) setShowInspectorMobile(true);
  }, [selectedIds]);

  // Keyboard shortcuts.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)) return;
      if (t?.isContentEditable) return;
      const mod = e.ctrlKey || e.metaKey;

      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      } else if (mod && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        const ids = useAppStore.getState().selectedIds;
        if (ids.length === 1 && ids[0]) duplicateNode(ids[0]);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        const ids = useAppStore.getState().selectedIds;
        if (ids.length > 0) {
          e.preventDefault();
          removeNodes(ids);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, duplicateNode, removeNodes]);

  return (
    <ReactFlowProvider>
      <div className="flex h-screen flex-col bg-surface text-ink">
        <Toolbar
          onToggleSummary={() => setShowSummary((v) => !v)}
          onToggleQA={() => setShowQA((v) => !v)}
        />

        <div className="relative flex min-h-0 flex-1">
          <main className="relative min-w-0 flex-1">
            <div className="pointer-events-none absolute inset-0 z-10 p-3">
              <div className="pointer-events-auto inline-block">
                <SearchBar />
              </div>
            </div>

            {/* Left overlay panels */}
            <div className="pointer-events-none absolute bottom-3 left-3 z-10 flex flex-col gap-3">
              {showSummary && (
                <div className="pointer-events-auto">
                  <SummaryPanel onClose={() => setShowSummary(false)} />
                </div>
              )}
            </div>
            {showQA && (
              <div className="absolute right-3 top-20 z-10 md:right-3">
                <QAPanel onClose={() => setShowQA(false)} />
              </div>
            )}

            <Diagram />
          </main>

          {/* Inspector — desktop sidebar */}
          <aside className="hidden w-80 shrink-0 border-l border-line bg-surface md:block">
            <Inspector />
          </aside>
        </div>

        {/* Inspector — mobile bottom sheet */}
        {showInspectorMobile && (
          <div className="fixed inset-x-0 bottom-0 z-30 max-h-[70vh] rounded-t-2xl border-t border-line bg-surface shadow-card-hover md:hidden">
            <Inspector onClose={() => setShowInspectorMobile(false)} />
          </div>
        )}
      </div>
    </ReactFlowProvider>
  );
}

export default AppShell;
