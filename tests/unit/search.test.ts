import { describe, expect, it } from 'vitest';
import { buildSeedDoc } from '@/lib/seed';
import {
  applyFilters,
  consolidateBySocio,
  countByType,
  matchNodes,
  nodesWithBadSums,
  traceParticipation,
} from '@/lib/search';

const doc = buildSeedDoc();

describe('matchNodes', () => {
  it('finds by title', () => {
    expect(matchNodes(doc, 'gibraltar').has('emp-gibraltar')).toBe(true);
  });

  it('finds by sócio name', () => {
    const hits = matchNodes(doc, 'ativus');
    expect(hits.size).toBeGreaterThan(1);
  });

  it('finds by placa', () => {
    expect(matchNodes(doc, 'AFX0911').has('carro-porsche-911')).toBe(true);
  });

  it('returns empty for blank query', () => {
    expect(matchNodes(doc, '   ').size).toBe(0);
  });
});

describe('traceParticipation', () => {
  it('lights up everywhere Gibraltar participates', () => {
    const set = traceParticipation(doc, 'emp-gibraltar');
    expect(set.has('emp-gibraltar')).toBe(true);
    // imóvel owned by Gibraltar
    expect(set.has('imovel-quintas-itapoa-p5')).toBe(true);
    // company where Gibraltar is a sócio
    expect(set.has('emp-roi')).toBe(true);
  });

  it('returns empty set for unknown entity', () => {
    expect(traceParticipation(doc, 'nope').size).toBe(0);
  });
});

describe('filters', () => {
  it('filters by owner', () => {
    const set = applyFilters(doc, { owner: 'RAFAEL' });
    expect(
      [...set].every(
        (id) => doc.nodes.find((n) => n.id === id)!.data.owner === 'RAFAEL',
      ),
    ).toBe(true);
  });

  it('filters by lane', () => {
    const set = applyFilters(doc, { lane: 'CARROS' });
    expect(
      [...set].every(
        (id) => doc.nodes.find((n) => n.id === id)!.data.lane === 'CARROS',
      ),
    ).toBe(true);
  });
});

describe('aggregations', () => {
  it('counts by type', () => {
    const counts = countByType(doc);
    const imovel = counts.find((c) => c.type === 'IMOVEL');
    expect(imovel!.count).toBeGreaterThan(10);
  });

  it('consolidates by sócio', () => {
    const rows = consolidateBySocio(doc);
    const tarik = rows.find((r) => r.nome.toLowerCase().includes('tárik'));
    expect(tarik!.participacoes).toBeGreaterThan(1);
  });

  it('flags Terreno Milagres as a bad sum', () => {
    expect(nodesWithBadSums(doc).has('imovel-terreno-milagres')).toBe(true);
  });
});
