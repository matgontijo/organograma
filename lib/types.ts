/**
 * Domain model for the TRK Mapa Patrimonial.
 *
 * A "node" is any card in the diagram (a company, property, vehicle, insurance,
 * person, spouse) plus structural nodes (lanes/groups). Edges express
 * relationships (ownership, marriage, participation).
 */

export type NodeType =
  | 'PESSOA'
  | 'CONJUGE'
  | 'EMPRESA_PATRIMONIAL'
  | 'EMPRESA_OPERACIONAL'
  | 'EMPRESA_PARTICIPACAO'
  | 'IMOVEL'
  | 'CARRO'
  | 'SEGURO'
  | 'LANE'
  | 'GROUP';

export type Owner = 'RAFAEL' | 'TARIK' | 'SOCIEDADE';

/** The four horizontal swimlanes (plus the top PESSOAS band). */
export type LaneId = 'PESSOAS' | 'EMPRESAS' | 'IMOVEIS' | 'CARROS' | 'SEGUROS';

export interface Socio {
  nome: string;
  percentual: number;
  papel?: string;
}

export interface Diretor {
  papel: string;
  nome: string;
}

export interface LinkItem {
  id: string;
  label: string;
  url: string;
  icon?: string;
}

/** Card payload. `id` mirrors the React Flow node id for convenience. */
export interface OrgNodeData {
  id: string;
  type: NodeType;
  owner: Owner;
  titulo: string;
  subtitulo?: string;
  diretores?: Diretor[];
  socios?: Socio[];
  imoveis?: string[];
  balanco?: string;
  /** Free-form key/value grid: Placa, RENAVAM, contato, etc. */
  dados?: Record<string, string>;
  links: LinkItem[];
  notas?: string;
  /** Per-card visual overrides. */
  cor?: string;
  corBorda?: string;
  corTexto?: string;
  /** Which swimlane this node belongs to. */
  lane?: LaneId;
  /** Optional sub-group within a lane (e.g. "EMPRESAS RAFAEL"). */
  grupo?: string;
}

/** Serializable graph node (decoupled from React Flow runtime types). */
export interface GraphNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: OrgNodeData;
  parentId?: string;
  width?: number;
  height?: number;
  hidden?: boolean;
}

export type EdgeKind = 'OWNERSHIP' | 'MARRIAGE' | 'PARTICIPATION' | 'CONTROL';

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  kind: EdgeKind;
  label?: string;
  animated?: boolean;
}

export interface LaneDef {
  id: LaneId;
  titulo: string;
  ordem: number;
}

/** The complete persisted document. */
export interface PatrimonioDoc {
  version: number;
  lanes: LaneDef[];
  nodes: GraphNode[];
  edges: GraphEdge[];
  updatedAt: number;
}

export type ThemeName = 'claro' | 'escuro' | 'corporativo';

export interface ThemePreset {
  name: string;
  base: ThemeName;
  /** Optional accent override (hex). */
  accent?: string;
}

export const NODE_TYPES_EMPRESA: NodeType[] = [
  'EMPRESA_PATRIMONIAL',
  'EMPRESA_OPERACIONAL',
  'EMPRESA_PARTICIPACAO',
];

export const isEmpresa = (t: NodeType): boolean => NODE_TYPES_EMPRESA.includes(t);

export const isCard = (t: NodeType): boolean => t !== 'LANE' && t !== 'GROUP';
