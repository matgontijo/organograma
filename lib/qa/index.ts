/** Maintenance & Quality Agent — runs all domain rules and aggregates a report. */
import type { PatrimonioDoc } from '../types';
import { ALL_RULES } from './rules';
import type { Issue, QAReport, Severity } from './types';

export * from './types';
export * from './rules';

/** Run every rule over the document and produce an aggregated report. */
export function runQA(doc: PatrimonioDoc): QAReport {
  const issues: Issue[] = [];
  for (const rule of ALL_RULES) {
    try {
      issues.push(...rule(doc));
    } catch (err) {
      issues.push({
        rule: rule.name || 'unknown-rule',
        severity: 'error',
        message: `Regra falhou ao executar: ${(err as Error).message}`,
      });
    }
  }

  const counts = { error: 0, warning: 0, info: 0 } as Record<Severity, number>;
  for (const issue of issues) counts[issue.severity]++;

  // Stable ordering: errors first, then warnings, then info.
  const weight: Record<Severity, number> = { error: 0, warning: 1, info: 2 };
  issues.sort(
    (a, b) => weight[a.severity] - weight[b.severity] || a.rule.localeCompare(b.rule),
  );

  return {
    issues,
    counts,
    nodeCount: doc.nodes.length,
    edgeCount: doc.edges.length,
    hasErrors: counts.error > 0,
    generatedAt: Date.now(),
  };
}
