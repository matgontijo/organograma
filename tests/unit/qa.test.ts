import { describe, expect, it } from 'vitest';
import { buildSeedDoc } from '@/lib/seed';
import {
  isPlausiblePlaca,
  isPlausibleRenavam,
  isValidHttpUrl,
  rulePercentSums,
  ruleCrossRefImoveis,
  ruleCrossRefSocios,
  ruleLinksValid,
  ruleUniqueIds,
  runQA,
} from '@/lib/qa';
import type { PatrimonioDoc } from '@/lib/types';

const clone = (doc: PatrimonioDoc): PatrimonioDoc => JSON.parse(JSON.stringify(doc));

describe('qa primitives', () => {
  it('validates URLs', () => {
    expect(isValidHttpUrl('https://example.com')).toBe(true);
    expect(isValidHttpUrl('http://a.b/c')).toBe(true);
    expect(isValidHttpUrl('ftp://x')).toBe(false);
    expect(isValidHttpUrl('not a url')).toBe(false);
  });

  it('validates plates (old + mercosul)', () => {
    expect(isPlausiblePlaca('AFX0911')).toBe(true);
    expect(isPlausiblePlaca('SSL2C44')).toBe(true);
    expect(isPlausiblePlaca('ABC')).toBe(false);
  });

  it('validates RENAVAM', () => {
    expect(isPlausibleRenavam('01396929972')).toBe(true);
    expect(isPlausibleRenavam('123')).toBe(false);
  });
});

describe('runQA on the seed', () => {
  const report = runQA(buildSeedDoc());

  it('produces zero blocking errors', () => {
    expect(report.counts.error).toBe(0);
    expect(report.hasErrors).toBe(false);
  });

  it('flags the Terreno Milagres rounding as a warning', () => {
    expect(report.counts.warning).toBeGreaterThanOrEqual(1);
    expect(report.issues.some((i) => i.rule === 'percent-sum')).toBe(true);
  });
});

describe('rules detect injected problems', () => {
  it('detects duplicate ids', () => {
    const doc = clone(buildSeedDoc());
    doc.nodes.push({ ...doc.nodes[0]! });
    expect(ruleUniqueIds(doc).length).toBeGreaterThan(0);
  });

  it('detects bad percentage sums', () => {
    const doc = clone(buildSeedDoc());
    const node = doc.nodes.find((n) => n.id === 'emp-ativus')!;
    node.data.socios = [{ nome: 'X', percentual: 10 }];
    expect(rulePercentSums(doc).some((i) => i.nodeId === 'emp-ativus')).toBe(true);
  });

  it('detects invalid link URLs', () => {
    const doc = clone(buildSeedDoc());
    doc.nodes[0]!.data.links = [{ id: 'x', label: 'bad', url: 'javascript:alert(1)' }];
    expect(ruleLinksValid(doc).length).toBe(1);
  });

  it('detects orphan imóvel references', () => {
    const doc = clone(buildSeedDoc());
    const ativus = doc.nodes.find((n) => n.id === 'emp-ativus')!;
    ativus.data.imoveis = ['100% Imóvel Fantasma XYZ'];
    expect(ruleCrossRefImoveis(doc).some((i) => i.nodeId === 'emp-ativus')).toBe(true);
  });

  it('detects deleted internal sócio entity', () => {
    const doc = clone(buildSeedDoc());
    doc.nodes = doc.nodes.filter((n) => n.id !== 'emp-ativus');
    expect(ruleCrossRefSocios(doc).length).toBeGreaterThan(0);
  });

  it('seed has zero cross-reference errors', () => {
    const doc = buildSeedDoc();
    expect(ruleCrossRefImoveis(doc)).toHaveLength(0);
    expect(ruleCrossRefSocios(doc)).toHaveLength(0);
  });
});
