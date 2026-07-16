import { NextResponse } from 'next/server';

// Always evaluate fresh (Render health check hits this endpoint).
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Health endpoint used by Render (healthCheckPath) and the Dockerfile HEALTHCHECK.
 * Reports server status + version. IndexedDB is a browser-only API, so its check
 * runs on the client (see lib/db.ts#checkIndexedDB) and is reported here as a hint.
 */
export function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      service: 'trk-mapa-patrimonial',
      version: process.env.APP_VERSION ?? '1.0.0',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      checks: {
        server: 'ok',
        indexedDB: 'client-only (verificado no navegador via checkIndexedDB)',
      },
    },
    { status: 200, headers: { 'Cache-Control': 'no-store' } },
  );
}
