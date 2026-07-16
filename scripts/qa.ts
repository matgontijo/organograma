/**
 * QA CLI — `npm run qa`.
 *
 * Runs the Maintenance & Quality Agent against the seed document (or a JSON
 * file passed as the first argument), prints a table of problems and exits
 * with a non-zero code if there are *errors* — wiring it as a deploy gate.
 */
import { readFileSync } from 'node:fs';
import { buildSeedDoc } from '../lib/seed';
import { deserializeDoc } from '../lib/serialize';
import { runQA } from '../lib/qa';
import { formatReportText } from '../lib/qa/report';
import type { PatrimonioDoc } from '../lib/types';

function loadDoc(): PatrimonioDoc {
  const file = process.argv[2];
  if (file) {
    try {
      return deserializeDoc(readFileSync(file, 'utf8'));
    } catch (err) {
      console.error(`Não foi possível ler "${file}": ${(err as Error).message}`);
      process.exit(2);
    }
  }
  return buildSeedDoc();
}

function main(): void {
  const doc = loadDoc();
  const report = runQA(doc);
  process.stdout.write(formatReportText(report));
  if (report.hasErrors) {
    process.exitCode = 1;
  }
}

main();
