# organograma — technical portfolio notes

Source reviewed: `dad360de0f7bc16c6c99eee2c59f84cff7d4290a` · 2026-11-04. These notes distinguish implemented behavior from next steps; they do not certify a production deployment.

## Purpose

Interactive graph editing with deterministic layout evaluation, persistence, export and domain-quality checks.

**Stack:** TypeScript, Next.js 14, React Flow, Zustand, Dexie, Vitest, Playwright.

**AI scope:** Deterministic QA/layout heuristics; no LLM agent found.

## Evidence in this repository

- [lib/render-agent.ts](../lib/render-agent.ts): Pure geometric scoring, column recommendation and export sizing.
- [lib/qa/rules.ts](../lib/qa/rules.ts): Domain integrity rules.
- [tests/unit/render-agent.test.ts](../tests/unit/render-agent.test.ts): Layout heuristic tests.
- [vitest.config.ts](../vitest.config.ts): Configured coverage thresholds.
- [.github/workflows/ci.yml](../.github/workflows/ci.yml): Lint, format, type checks, unit coverage and browser checks.

## Validation

```text
npm ci && npm run ci; npm run test:e2e for browser checks
```

Use an isolated environment and synthetic data. Never run operational ingestion, scheduled jobs or live provider calls merely to demonstrate the project. Test presence is not the same as a successful test run.

## Known limits and next steps

- The term agent describes deterministic helpers here, not an autonomous LLM system.
- A configured coverage threshold or static badge does not prove current measured coverage.
- The latest audited default-branch CI run failed; resolve the failing gate before presenting a green build claim.
- Review seed data and exported graphs for personal or business information before portfolio demonstrations.

## Portfolio positioning

Supporting frontend/testing project; describe the QA and rendering algorithms precisely.

A reproducible AI evaluation should document a synthetic or anonymized dataset, baseline, expected outputs, failure cases, quality metrics, latency and cost. Training and evaluating a predictive model would be separate work; it is not claimed here.
