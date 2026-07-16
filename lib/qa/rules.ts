/**
 * Domain-integrity rules. Each rule is a pure function (doc) => Issue[] so it
 * can be unit-tested in isolation and composed by the agent.
 *
 * Severity policy:
 *  - error   → blocks deploy (structural integrity broken).
 *  - warning → surfaced but non-blocking (e.g. % not closing 100, rounding).
 *  - info    → advisory / maintainability hints.
 */
import { compactKey, parsePropertyRef } from '../normalize';
import { resolveEntityId } from '../seed';
import { isCard, isEmpresa } from '../types';
import type { GraphNode, PatrimonioDoc } from '../types';
import { PERCENT_TOLERANCE, type Issue } from './types';

const label = (n: GraphNode): string => n.data.titulo || n.id;

/** http/https URL validation. */
export function isValidHttpUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Brazilian plate (old LLLNNNN or Mercosul LLLNLNN). */
export function isPlausiblePlaca(placa: string): boolean {
  return /^[A-Z]{3}[0-9][0-9A-Z][0-9]{2}$/.test(
    placa.toUpperCase().replace(/[\s-]/g, ''),
  );
}

/** RENAVAM: 9 to 11 digits. */
export function isPlausibleRenavam(renavam: string): boolean {
  return /^[0-9]{9,11}$/.test(renavam.replace(/[\s.-]/g, ''));
}

export function ruleUniqueIds(doc: PatrimonioDoc): Issue[] {
  const seen = new Map<string, number>();
  for (const n of doc.nodes) seen.set(n.id, (seen.get(n.id) ?? 0) + 1);
  return [...seen.entries()]
    .filter(([, count]) => count > 1)
    .map(([id, count]) => ({
      rule: 'unique-ids',
      severity: 'error' as const,
      message: `ID duplicado "${id}" (${count} ocorrências)`,
      nodeId: id,
    }));
}

export function rulePercentSums(doc: PatrimonioDoc): Issue[] {
  const issues: Issue[] = [];
  for (const n of doc.nodes) {
    const socios = n.data.socios;
    if (!socios || socios.length === 0) continue;
    const sum = socios.reduce((acc, s) => acc + (Number(s.percentual) || 0), 0);
    if (Math.abs(sum - 100) > PERCENT_TOLERANCE) {
      issues.push({
        rule: 'percent-sum',
        severity: 'warning',
        message: `Soma de sócios = ${sum.toFixed(2)}% (≠ 100%)`,
        nodeId: n.id,
        nodeLabel: label(n),
      });
    }
  }
  return issues;
}

export function ruleNodeHasLane(doc: PatrimonioDoc): Issue[] {
  return doc.nodes
    .filter((n) => isCard(n.type) && !n.data.lane)
    .map((n) => ({
      rule: 'node-lane',
      severity: 'error' as const,
      message: 'Nó sem faixa (lane) atribuída',
      nodeId: n.id,
      nodeLabel: label(n),
    }));
}

export function rulePessoaOwner(doc: PatrimonioDoc): Issue[] {
  const valid = new Set(['RAFAEL', 'TARIK', 'SOCIEDADE']);
  return doc.nodes
    .filter(
      (n) => (n.type === 'PESSOA' || n.type === 'CONJUGE') && !valid.has(n.data.owner),
    )
    .map((n) => ({
      rule: 'pessoa-owner',
      severity: 'error' as const,
      message: `PESSOA/CÔNJUGE sem owner válido (recebeu "${n.data.owner}")`,
      nodeId: n.id,
      nodeLabel: label(n),
    }));
}

export function ruleImovelDono(doc: PatrimonioDoc): Issue[] {
  return doc.nodes
    .filter((n) => n.type === 'IMOVEL')
    .filter((n) => !n.data.owner || !(n.data.socios && n.data.socios.length > 0))
    .map((n) => ({
      rule: 'imovel-dono',
      severity: 'error' as const,
      message: 'IMÓVEL sem dono/sócios definidos',
      nodeId: n.id,
      nodeLabel: label(n),
    }));
}

export function ruleLinksValid(doc: PatrimonioDoc): Issue[] {
  const issues: Issue[] = [];
  for (const n of doc.nodes) {
    for (const link of n.data.links ?? []) {
      if (!isValidHttpUrl(link.url)) {
        issues.push({
          rule: 'link-url',
          severity: 'error',
          message: `Link "${link.label || link.url}" com URL inválida: "${link.url}"`,
          nodeId: n.id,
          nodeLabel: label(n),
        });
      }
    }
  }
  return issues;
}

export function rulePlacaRenavam(doc: PatrimonioDoc): Issue[] {
  const issues: Issue[] = [];
  for (const n of doc.nodes) {
    const placa = n.data.dados?.Placa;
    const renavam = n.data.dados?.RENAVAM;
    if (placa && !isPlausiblePlaca(placa)) {
      issues.push({
        rule: 'placa',
        severity: 'warning',
        message: `Placa com formato implausível: "${placa}"`,
        nodeId: n.id,
        nodeLabel: label(n),
      });
    }
    if (renavam && !isPlausibleRenavam(renavam)) {
      issues.push({
        rule: 'renavam',
        severity: 'warning',
        message: `RENAVAM com formato implausível: "${renavam}"`,
        nodeId: n.id,
        nodeLabel: label(n),
      });
    }
  }
  return issues;
}

export function ruleEdgesResolve(doc: PatrimonioDoc): Issue[] {
  const ids = new Set(doc.nodes.map((n) => n.id));
  const issues: Issue[] = [];
  for (const e of doc.edges) {
    if (!ids.has(e.source)) {
      issues.push({
        rule: 'edge-orphan',
        severity: 'error',
        message: `Aresta "${e.id}" referencia source inexistente "${e.source}"`,
      });
    }
    if (!ids.has(e.target)) {
      issues.push({
        rule: 'edge-orphan',
        severity: 'error',
        message: `Aresta "${e.id}" referencia target inexistente "${e.target}"`,
      });
    }
  }
  return issues;
}

/** Build a lookup of IMÓVEL nodes for cross-reference resolution. */
function buildImovelIndex(
  doc: PatrimonioDoc,
): Array<{ nameKey: string; matricula?: string }> {
  return doc.nodes
    .filter((n) => n.type === 'IMOVEL')
    .map((n) => {
      const parsed = parsePropertyRef(n.data.titulo);
      const matricula =
        parsed.matricula ?? n.data.dados?.['Matrícula']?.replace(/[.\s]/g, '');
      return { nameKey: parsed.nameKey, matricula };
    });
}

/** Every property listed in a company's `imoveis` must resolve to an IMÓVEL node. */
export function ruleCrossRefImoveis(doc: PatrimonioDoc): Issue[] {
  const index = buildImovelIndex(doc);
  const issues: Issue[] = [];
  for (const n of doc.nodes) {
    if (!isEmpresa(n.type)) continue;
    for (const ref of n.data.imoveis ?? []) {
      const parsed = parsePropertyRef(ref);
      const resolved = index.some((im) => {
        if (parsed.matricula && im.matricula && parsed.matricula === im.matricula)
          return true;
        if (parsed.nameKey.length < 2) return false;
        return (
          im.nameKey.includes(parsed.nameKey) || parsed.nameKey.includes(im.nameKey)
        );
      });
      if (!resolved) {
        issues.push({
          rule: 'xref-imovel',
          severity: 'error',
          message: `Imóvel "${ref}" referenciado não existe como nó IMÓVEL`,
          nodeId: n.id,
          nodeLabel: label(n),
        });
      }
    }
  }
  return issues;
}

/** Sócios that are internal entities (Ativus, Gibraltar, …) must resolve to a node. */
export function ruleCrossRefSocios(doc: PatrimonioDoc): Issue[] {
  const ids = new Set(doc.nodes.map((n) => n.id));
  const issues: Issue[] = [];

  // For each sócio that resolves to an internal entity, the target must exist
  // (catches orphan references such as a sócio "Ativus" with no Ativus node).
  const reported = new Set<string>();
  for (const n of doc.nodes) {
    for (const socio of n.data.socios ?? []) {
      const target = resolveEntityId(socio.nome);
      if (target && !ids.has(target)) {
        const key = `${n.id}:${target}`;
        if (reported.has(key)) continue;
        reported.add(key);
        issues.push({
          rule: 'xref-socio',
          severity: 'error',
          message: `Sócio empresa "${socio.nome}" referencia nó inexistente "${target}"`,
          nodeId: n.id,
          nodeLabel: label(n),
        });
      }
    }
  }
  return issues;
}

/** Maintainability hint: a sócio whose name matches an empresa título but is not aliased. */
export function ruleUnmappedEntity(doc: PatrimonioDoc): Issue[] {
  const empresaKeys = new Map<string, string>();
  for (const n of doc.nodes) {
    if (isEmpresa(n.type)) empresaKeys.set(compactKey(n.data.titulo), n.id);
  }
  const issues: Issue[] = [];
  const reported = new Set<string>();
  for (const n of doc.nodes) {
    for (const socio of n.data.socios ?? []) {
      const key = compactKey(socio.nome);
      if (empresaKeys.has(key) && !resolveEntityId(socio.nome) && !reported.has(key)) {
        reported.add(key);
        issues.push({
          rule: 'unmapped-entity',
          severity: 'info',
          message: `Sócio "${socio.nome}" parece ser uma empresa do mapa, mas não está mapeado em ENTITY_ALIASES`,
          nodeId: n.id,
          nodeLabel: label(n),
        });
      }
    }
  }
  return issues;
}

export const ALL_RULES = [
  ruleUniqueIds,
  rulePercentSums,
  ruleNodeHasLane,
  rulePessoaOwner,
  ruleImovelDono,
  ruleLinksValid,
  rulePlacaRenavam,
  ruleEdgesResolve,
  ruleCrossRefImoveis,
  ruleCrossRefSocios,
  ruleUnmappedEntity,
] as const;
