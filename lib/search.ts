/** Search, filtering and participation-tracing — pure functions over the doc. */
import { compactKey, normalize, parsePropertyRef } from './normalize';
import { resolveEntityId } from './seed';
import type { GraphNode, LaneId, Owner, PatrimonioDoc } from './types';

/** Node ids matching a free-text query (nome, sócio, placa, matrícula, dados). */
export function matchNodes(doc: PatrimonioDoc, query: string): Set<string> {
  const q = normalize(query);
  const result = new Set<string>();
  if (!q) return result;
  for (const n of doc.nodes) {
    const haystacks: string[] = [
      n.data.titulo,
      n.data.subtitulo ?? '',
      n.data.notas ?? '',
    ];
    for (const s of n.data.socios ?? []) haystacks.push(s.nome);
    for (const d of n.data.diretores ?? []) haystacks.push(d.nome);
    for (const v of Object.values(n.data.dados ?? {})) haystacks.push(v);
    for (const im of n.data.imoveis ?? []) haystacks.push(im);
    if (haystacks.some((h) => normalize(h).includes(q))) result.add(n.id);
  }
  return result;
}

export interface Filters {
  lane?: LaneId | null;
  owner?: Owner | null;
  socio?: string | null;
}

/** Node ids that pass the active filters (empty filters → all cards). */
export function applyFilters(doc: PatrimonioDoc, filters: Filters): Set<string> {
  const result = new Set<string>();
  const socioKey = filters.socio ? compactKey(filters.socio) : null;
  for (const n of doc.nodes) {
    if (filters.lane && n.data.lane !== filters.lane) continue;
    if (filters.owner && n.data.owner !== filters.owner) continue;
    if (socioKey) {
      const has = (n.data.socios ?? []).some((s) =>
        compactKey(s.nome).includes(socioKey),
      );
      if (!has) continue;
    }
    result.add(n.id);
  }
  return result;
}

/**
 * Participation tracing: given an internal entity node id (e.g. Gibraltar),
 * return every node where it participates — companies/imóveis it is a sócio of,
 * and imóveis it owns by reference — plus the entity itself.
 */
export function traceParticipation(doc: PatrimonioDoc, entityId: string): Set<string> {
  const result = new Set<string>();
  const entity = doc.nodes.find((n) => n.id === entityId);
  if (!entity) return result;
  result.add(entityId);

  for (const n of doc.nodes) {
    if (n.id === entityId) continue;
    const asSocio = (n.data.socios ?? []).some(
      (s) => resolveEntityId(s.nome) === entityId,
    );
    if (asSocio) result.add(n.id);
  }

  // Imóveis explicitly listed on the entity card.
  if (entity.data.imoveis?.length) {
    const imovelNodes = doc.nodes.filter((n) => n.type === 'IMOVEL');
    for (const ref of entity.data.imoveis) {
      const parsed = parsePropertyRef(ref);
      for (const im of imovelNodes) {
        const imParsed = parsePropertyRef(im.data.titulo);
        const matriculaMatch =
          parsed.matricula &&
          imParsed.matricula &&
          parsed.matricula === imParsed.matricula;
        const nameMatch =
          parsed.nameKey.length >= 2 &&
          (imParsed.nameKey.includes(parsed.nameKey) ||
            parsed.nameKey.includes(imParsed.nameKey));
        if (matriculaMatch || nameMatch) result.add(im.id);
      }
    }
  }

  return result;
}

/** Aggregate ownership % per person across all cards (consolidation). */
export interface ConsolidationRow {
  nome: string;
  total: number;
  participacoes: number;
}

export function consolidateBySocio(doc: PatrimonioDoc): ConsolidationRow[] {
  const map = new Map<string, ConsolidationRow>();
  for (const n of doc.nodes) {
    for (const s of n.data.socios ?? []) {
      const key = normalize(s.nome);
      const row = map.get(key) ?? { nome: s.nome, total: 0, participacoes: 0 };
      row.total += Number(s.percentual) || 0;
      row.participacoes += 1;
      map.set(key, row);
    }
  }
  return [...map.values()].sort((a, b) => b.participacoes - a.participacoes);
}

export interface CategoryCount {
  type: GraphNode['type'];
  count: number;
}

/** Counts per node type for the summary panel. */
export function countByType(doc: PatrimonioDoc): CategoryCount[] {
  const map = new Map<GraphNode['type'], number>();
  for (const n of doc.nodes) map.set(n.type, (map.get(n.type) ?? 0) + 1);
  return [...map.entries()].map(([type, count]) => ({ type, count }));
}

/** Cards whose sócios do not sum to 100% (within tolerance). */
export function nodesWithBadSums(doc: PatrimonioDoc, tolerance = 0.1): Set<string> {
  const bad = new Set<string>();
  for (const n of doc.nodes) {
    const socios = n.data.socios;
    if (!socios || socios.length === 0) continue;
    const sum = socios.reduce((a, s) => a + (Number(s.percentual) || 0), 0);
    if (Math.abs(sum - 100) > tolerance) bad.add(n.id);
  }
  return bad;
}
