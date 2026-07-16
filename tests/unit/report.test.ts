import { describe, expect, it } from 'vitest';
import { buildSeedDoc } from '@/lib/seed';
import { runQA } from '@/lib/qa';
import { formatReportText } from '@/lib/qa/report';
import type { PatrimonioDoc } from '@/lib/types';

describe('formatReportText', () => {
  it('renders the seed report with a passing verdict', () => {
    const text = formatReportText(runQA(buildSeedDoc()));
    expect(text).toContain('Maintenance & Quality Agent');
    expect(text).toContain('Aprovado');
    expect(text).toContain('Terreno Milagres');
  });

  it('renders a failing verdict when errors exist', () => {
    const doc: PatrimonioDoc = buildSeedDoc();
    doc.nodes[0]!.data.links = [{ id: 'x', label: 'bad', url: 'nope' }];
    const text = formatReportText(runQA(doc));
    expect(text).toContain('Reprovado');
  });

  it('renders a clean report with no issues', () => {
    const empty: PatrimonioDoc = {
      version: 1,
      lanes: buildSeedDoc().lanes,
      nodes: [],
      edges: [],
      updatedAt: 0,
    };
    const text = formatReportText(runQA(empty));
    expect(text).toContain('Nenhum problema encontrado');
  });
});
