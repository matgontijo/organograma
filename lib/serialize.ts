/**
 * JSON import/export with a canonical normalizer so that
 * export → import → export is idempotent (round-trip safe).
 */
import { DOC_VERSION, LANES } from './seed';
import type {
  GraphEdge,
  GraphNode,
  LinkItem,
  OrgNodeData,
  PatrimonioDoc,
  Socio,
} from './types';

function num(v: unknown, fallback = 0): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function cleanSocio(s: unknown): Socio {
  const o = (s ?? {}) as Record<string, unknown>;
  const out: Socio = { nome: str(o.nome), percentual: num(o.percentual) };
  if (o.papel) out.papel = str(o.papel);
  return out;
}

function cleanLink(l: unknown): LinkItem {
  const o = (l ?? {}) as Record<string, unknown>;
  const out: LinkItem = { id: str(o.id), label: str(o.label), url: str(o.url) };
  if (o.icon) out.icon = str(o.icon);
  return out;
}

function cleanData(raw: unknown): OrgNodeData {
  const o = (raw ?? {}) as Record<string, unknown>;
  const data: OrgNodeData = {
    id: str(o.id),
    type: o.type as OrgNodeData['type'],
    owner: o.owner as OrgNodeData['owner'],
    titulo: str(o.titulo),
    links: Array.isArray(o.links) ? o.links.map(cleanLink) : [],
  };
  if (o.subtitulo) data.subtitulo = str(o.subtitulo);
  if (Array.isArray(o.diretores))
    data.diretores = o.diretores.map((d) => {
      const dd = (d ?? {}) as Record<string, unknown>;
      return { papel: str(dd.papel), nome: str(dd.nome) };
    });
  if (Array.isArray(o.socios)) data.socios = o.socios.map(cleanSocio);
  if (Array.isArray(o.imoveis)) data.imoveis = o.imoveis.map(str);
  if (o.balanco) data.balanco = str(o.balanco);
  if (o.dados && typeof o.dados === 'object') {
    const dd: Record<string, string> = {};
    for (const [k, v] of Object.entries(o.dados as Record<string, unknown>))
      dd[k] = str(v);
    data.dados = dd;
  }
  if (o.notas) data.notas = str(o.notas);
  if (o.cor) data.cor = str(o.cor);
  if (o.corBorda) data.corBorda = str(o.corBorda);
  if (o.corTexto) data.corTexto = str(o.corTexto);
  if (o.lane) data.lane = o.lane as OrgNodeData['lane'];
  if (o.grupo) data.grupo = str(o.grupo);
  return data;
}

function cleanNode(raw: unknown): GraphNode {
  const o = (raw ?? {}) as Record<string, unknown>;
  const data = cleanData(o.data);
  const pos = (o.position ?? {}) as Record<string, unknown>;
  const node: GraphNode = {
    id: str(o.id) || data.id,
    type: data.type,
    position: { x: num(pos.x), y: num(pos.y) },
    data,
  };
  if (o.parentId) node.parentId = str(o.parentId);
  if (typeof o.width === 'number') node.width = o.width;
  if (typeof o.height === 'number') node.height = o.height;
  if (o.hidden) node.hidden = true;
  return node;
}

function cleanEdge(raw: unknown): GraphEdge {
  const o = (raw ?? {}) as Record<string, unknown>;
  const edge: GraphEdge = {
    id: str(o.id),
    source: str(o.source),
    target: str(o.target),
    kind: (o.kind as GraphEdge['kind']) ?? 'OWNERSHIP',
  };
  if (o.label) edge.label = str(o.label);
  if (o.animated) edge.animated = true;
  return edge;
}

/** Parse + normalize an arbitrary object into a valid PatrimonioDoc. */
export function normalizeDoc(raw: unknown): PatrimonioDoc {
  const o = (raw ?? {}) as Record<string, unknown>;
  const lanes =
    Array.isArray(o.lanes) && o.lanes.length
      ? (o.lanes as PatrimonioDoc['lanes'])
      : LANES;
  return {
    version: num(o.version, DOC_VERSION),
    lanes: [...lanes].sort((a, b) => a.ordem - b.ordem),
    nodes: Array.isArray(o.nodes) ? o.nodes.map(cleanNode) : [],
    edges: Array.isArray(o.edges) ? o.edges.map(cleanEdge) : [],
    updatedAt: num(o.updatedAt, Date.now()),
  };
}

/** Canonical, pretty JSON for the document (stable field order via normalize). */
export function serializeDoc(doc: PatrimonioDoc): string {
  return JSON.stringify(normalizeDoc(doc), null, 2);
}

export function deserializeDoc(json: string): PatrimonioDoc {
  return normalizeDoc(JSON.parse(json));
}
