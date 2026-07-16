'use client';

import dynamic from 'next/dynamic';

// The whole app is client-side (React Flow, IndexedDB, html-to-image),
// so we disable SSR to avoid hydration/measurement issues.
const AppShell = dynamic(() => import('@/components/AppShell'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center bg-surface text-ink-muted">
      <div className="animate-pulse text-sm">Carregando mapa patrimonial TRK…</div>
    </div>
  ),
});

export default function Page() {
  return <AppShell />;
}
