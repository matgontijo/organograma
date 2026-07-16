/** Human-readable formatting of a QA report (used by the CLI and the UI panel). */
import type { QAReport, Severity } from './types';

const ICON: Record<Severity, string> = {
  error: '✖',
  warning: '⚠',
  info: 'ℹ',
};

function pad(str: string, len: number): string {
  return str.length >= len ? str.slice(0, len) : str + ' '.repeat(len - str.length);
}

/** Plain-text table for terminal output. */
export function formatReportText(report: QAReport): string {
  const lines: string[] = [];
  lines.push('');
  lines.push('  TRK · Maintenance & Quality Agent');
  lines.push('  ' + '─'.repeat(64));
  lines.push(
    `  Nós: ${report.nodeCount}   Arestas: ${report.edgeCount}   ` +
      `Erros: ${report.counts.error}   Avisos: ${report.counts.warning}   Info: ${report.counts.info}`,
  );
  lines.push('  ' + '─'.repeat(64));

  if (report.issues.length === 0) {
    lines.push('  ✓ Nenhum problema encontrado.');
  } else {
    lines.push(`  ${pad('SEV', 4)} ${pad('REGRA', 18)} ${pad('NÓ', 24)} MENSAGEM`);
    lines.push('  ' + '─'.repeat(64));
    for (const issue of report.issues) {
      lines.push(
        `  ${pad(ICON[issue.severity], 4)} ${pad(issue.rule, 18)} ` +
          `${pad(issue.nodeLabel ?? issue.nodeId ?? '—', 24)} ${issue.message}`,
      );
    }
  }

  lines.push('  ' + '─'.repeat(64));
  lines.push(
    report.hasErrors
      ? '  ✖ Reprovado: há erros que bloqueiam o deploy.'
      : '  ✓ Aprovado: nenhum erro bloqueante.',
  );
  lines.push('');
  return lines.join('\n');
}
