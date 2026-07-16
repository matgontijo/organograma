/**
 * Text normalization helpers shared by the seed, the store and the QA agent.
 * Keeping these in one place means cross-reference resolution behaves
 * identically everywhere (UI search, participation tracing, QA validation).
 */

/** Lowercase, strip accents/diacritics, collapse whitespace. */
export function normalize(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/** Compact alphanumeric key: accent-free, lowercased, no separators. */
export function compactKey(input: string): string {
  return normalize(input).replace(/[^a-z0-9]/g, '');
}

/**
 * Parse a property reference such as "18,06% Maracujá[7.814]" or "100% Vila Raiô R104"
 * into a comparable shape: the leading percentage (if any), a name key and an
 * optional matrícula (the number inside () or []).
 */
export interface ParsedRef {
  raw: string;
  percentual?: number;
  nameKey: string;
  matricula?: string;
}

export function parsePropertyRef(raw: string): ParsedRef {
  let rest = raw.trim();

  // Leading percentage, e.g. "18,06%" or "100 %".
  let percentual: number | undefined;
  const pctMatch = rest.match(/^(\d+(?:[.,]\d+)?)\s*%/);
  if (pctMatch && pctMatch[1]) {
    percentual = Number(pctMatch[1].replace(',', '.'));
    rest = rest.slice(pctMatch[0].length).trim();
  }

  // Matrícula inside () or [], digits with optional separators.
  let matricula: string | undefined;
  const matMatch = rest.match(/[[(]\s*([\d./\\-]+)\s*[\])]/);
  if (matMatch && matMatch[1]) {
    matricula = matMatch[1].replace(/[.\s]/g, '');
    rest = rest.replace(matMatch[0], ' ');
  }

  return {
    raw,
    percentual,
    nameKey: compactKey(rest),
    matricula,
  };
}

/** Extract a numeric percentage from a free-form sócio label. */
export function parsePercent(value: string): number | undefined {
  const m = value.match(/(\d+(?:[.,]\d+)?)\s*%?/);
  return m && m[1] ? Number(m[1].replace(',', '.')) : undefined;
}
