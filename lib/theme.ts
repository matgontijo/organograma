/** Visual palette derivation per owner / node type, plus global theme presets. */
import type { NodeType, Owner, OrgNodeData, ThemeName, ThemePreset } from './types';

export interface Accent {
  /** Solid accent (banner/border). */
  color: string;
  /** Soft fill for the card body tint. */
  soft: string;
  /** Readable text color on top of `soft`. */
  text: string;
  label: string;
}

const PALETTE: Record<string, Accent> = {
  rafael: { color: '#2563eb', soft: '#dbeafe', text: '#0b2a6b', label: 'Rafael' },
  tarik: { color: '#dc2626', soft: '#fee2e2', text: '#7a1010', label: 'Tárik' },
  sociedade: { color: '#16a34a', soft: '#dcfce7', text: '#0c3d1f', label: 'Sociedade' },
  operacional: {
    color: '#ca8a04',
    soft: '#fef9c3',
    text: '#5c4203',
    label: 'Operacional',
  },
  patrimonial: {
    color: '#6b7280',
    soft: '#f3f4f6',
    text: '#1f2937',
    label: 'Patrimonial',
  },
  pessoa: { color: '#0d9488', soft: '#ccfbf1', text: '#0a4f49', label: 'Pessoa' },
};

/**
 * Derive the visual accent for a card from its type + owner + grupo.
 * Per-card overrides (cor/corBorda/corTexto) take precedence.
 */
export function nodeAccent(
  data: Pick<OrgNodeData, 'type' | 'owner' | 'cor' | 'corBorda' | 'corTexto'>,
): Accent {
  const base = baseAccentKey(data.type, data.owner);
  const accent = PALETTE[base] ?? PALETTE.patrimonial!;
  return {
    color: data.corBorda ?? accent.color,
    soft: data.cor ?? accent.soft,
    text: data.corTexto ?? accent.text,
    label: accent.label,
  };
}

function baseAccentKey(type: NodeType, owner: Owner): keyof typeof PALETTE {
  if (type === 'PESSOA' || type === 'CONJUGE') return 'pessoa';
  if (type === 'EMPRESA_OPERACIONAL') return 'operacional';
  if (owner === 'SOCIEDADE') {
    return type === 'IMOVEL' ? 'sociedade' : 'patrimonial';
  }
  return owner === 'TARIK' ? 'tarik' : 'rafael';
}

export const NODE_ICON: Record<NodeType, string> = {
  PESSOA: '👤',
  CONJUGE: '💍',
  EMPRESA_PATRIMONIAL: '🏛️',
  EMPRESA_OPERACIONAL: '🏢',
  EMPRESA_PARTICIPACAO: '📈',
  IMOVEL: '🏠',
  CARRO: '🚗',
  SEGURO: '🛡️',
  LANE: '▭',
  GROUP: '▢',
};

export const THEME_LABELS: Record<ThemeName, string> = {
  claro: 'Claro',
  escuro: 'Escuro',
  corporativo: 'Corporativo TRK',
};

export const DEFAULT_PRESETS: ThemePreset[] = [
  { name: 'Claro', base: 'claro' },
  { name: 'Escuro', base: 'escuro' },
  { name: 'Corporativo TRK', base: 'corporativo', accent: '#caa24a' },
];
