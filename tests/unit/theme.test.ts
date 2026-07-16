import { describe, expect, it } from 'vitest';
import { nodeAccent } from '@/lib/theme';

describe('nodeAccent', () => {
  it('maps owners and types to brand colors', () => {
    expect(nodeAccent({ type: 'PESSOA', owner: 'RAFAEL' }).label).toBe('Pessoa');
    expect(nodeAccent({ type: 'EMPRESA_OPERACIONAL', owner: 'SOCIEDADE' }).label).toBe(
      'Operacional',
    );
    expect(nodeAccent({ type: 'IMOVEL', owner: 'SOCIEDADE' }).label).toBe('Sociedade');
    expect(nodeAccent({ type: 'EMPRESA_PATRIMONIAL', owner: 'SOCIEDADE' }).label).toBe(
      'Patrimonial',
    );
    expect(nodeAccent({ type: 'IMOVEL', owner: 'TARIK' }).label).toBe('Tárik');
    expect(nodeAccent({ type: 'CARRO', owner: 'RAFAEL' }).label).toBe('Rafael');
  });

  it('honors per-card color overrides', () => {
    const accent = nodeAccent({
      type: 'CARRO',
      owner: 'RAFAEL',
      cor: '#111111',
      corBorda: '#222222',
      corTexto: '#333333',
    });
    expect(accent.soft).toBe('#111111');
    expect(accent.color).toBe('#222222');
    expect(accent.text).toBe('#333333');
  });
});
