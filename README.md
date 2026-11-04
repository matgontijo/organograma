# TRK · Mapa Patrimonial Interativo

Interactive graph editing with deterministic layout evaluation, persistence, export and domain-quality checks.

Technical evidence, validation and limitations: [portfolio notes](docs/PORTFOLIO.md).

Diagrama patrimonial interativo e altamente personalizável da TRK: cada **card** é uma
empresa, imóvel, veículo, seguro ou pessoa — com sócios/percentuais, links clicáveis e
personalização visual total. Inclui um **Agente de Testes/QA** que valida a integridade
dos dados e serve de _gate_ de qualidade para o deploy.

[![CI](https://github.com/matgontijo/organograma/actions/workflows/ci.yml/badge.svg)](https://github.com/matgontijo/organograma/actions/workflows/ci.yml)

Coverage thresholds are configured in `vitest.config.ts`; consult the workflow results for measured coverage and browser-test status.

---

## ✨ Recursos

- **Diagrama React Flow** com 5 faixas/_swimlanes_ horizontais colapsáveis (PESSOAS,
  EMPRESAS, IMÓVEIS, CARROS, SEGUROS), cabeçalho-banner preto, minimap, zoom, pan e
  _fit-to-screen_. Auto-layout em **sub-colunas** ou **dagre** dentro de cada faixa.
- **Cards por tipo** (cor/ícone próprios): cabeçalho, direção, tabela de sócios com % e
  mini-barra, lista de imóveis, _badge_ de balanço, grid de dados (placa/RENAVAM/contato)
  e **rodapé de links clicáveis** (abrem em nova aba).
- **Inspector lateral** (vira _bottom sheet_ no mobile): edita todos os campos, sócios e
  links (CRUD), cores por card, com **edição em lote** em multi-seleção.
- **Personalização visual** por card e global: temas claro / escuro / **corporativo
  dourado TRK**, cor de destaque e **presets salvos**.
- **Estrutura**: adicionar / duplicar / remover nó, religar relações (arrastar handles),
  multi-seleção.
- **Persistência**: autosave em IndexedDB (Dexie), além de export/import **JSON** e
  export **PNG/SVG** em alta resolução.
- **Busca e filtros**: por nome, sócio, placa ou matrícula com _highlight_ +
  centralização; filtros por faixa, dono (Rafael/Tárik/Sociedade) e sócio. **Rastreamento
  de participação**: clique em 🎯 numa empresa (ex.: Gibraltar) e todos os imóveis/empresas
  onde ela aparece se iluminam.
- **Undo/redo** (zundo) e atalhos: `Del` (remover), `Ctrl/Cmd+Z` (desfazer),
  `Ctrl/Cmd+Shift+Z` ou `Ctrl+Y` (refazer), `Ctrl/Cmd+D` (duplicar).
- **Painel de Resumo**: contadores por categoria, consolidação de participação por sócio
  (Σ % onde cada um aparece) e **alerta quando a soma dos sócios de um card ≠ 100%**.
- **Painel de QA**: roda o agente de integridade no navegador e mostra os problemas
  encontrados, com verificação de saúde (`/api/health` + IndexedDB).

---

## 🧱 Stack

Next.js 14 (App Router) · TypeScript estrito · Tailwind CSS · React Flow
(`@xyflow/react`) · Zustand + zundo (undo/redo) · Dexie (IndexedDB) · dagre ·
framer-motion · html-to-image. Testes: **Vitest** + Testing Library + **Playwright**.
Deploy: **Render** (Web Service via Docker, _output standalone_).

---

## 🚀 Rodar localmente

```bash
npm install
npm run dev
# abre http://localhost:3000
```

> Os dados reais já vêm carregados via `lib/seed.ts`. As alterações são salvas
> automaticamente no IndexedDB do navegador. Use **Reset** na toolbar para voltar ao seed.

### Scripts disponíveis

| Script                  | O que faz                                                            |
| ----------------------- | -------------------------------------------------------------------- |
| `npm run dev`           | Servidor de desenvolvimento (hot-reload)                             |
| `npm run build`         | Build de produção (Next _standalone_)                                |
| `npm run start`         | Sobe o build de produção                                             |
| `npm run qa`            | **Agente de QA** — valida o seed e sai com código ≠0 se houver erros |
| `npm run test`          | Testes unitários (Vitest)                                            |
| `npm run test:coverage` | Testes + cobertura (gate de 80% no `/lib`)                           |
| `npm run test:e2e`      | Testes E2E (Playwright)                                              |
| `npm run lint`          | ESLint                                                               |
| `npm run format`        | Prettier (escreve)                                                   |
| `npm run typecheck`     | `tsc --noEmit`                                                       |
| `npm run ci`            | lint + typecheck + qa + cobertura (tudo que o CI roda)               |

---

## 🧪 Agente de Testes / QA

O módulo `lib/qa/` implementa um **Maintenance & Quality Agent** que roda local e no CI.

### A) Integridade dos dados (regras de domínio)

- Soma de percentuais dos sócios deve fechar **100%** (tolerância 0,1%) — divergências
  viram **avisos**.
- **Referências cruzadas** resolvem: imóvel citado em uma empresa existe como nó `IMOVEL`;
  sócio que é empresa interna (Ativus, Gibraltar, Malaga…) existe como nó. Órfãos viram
  **erros**.
- Sem IDs duplicados; todo card tem faixa; toda PESSOA tem _owner_; todo IMÓVEL tem
  dono/sócios.
- URLs de links válidas (protocolo http/https).
- Placas/RENAVAM em formato plausível (quando preenchidos).

### B) Qualidade (Vitest)

Seed carrega sem erro; store add/remove/relink mantém invariantes; **round-trip
JSON** (export → import) idempotente; auto-layout sem sobreposição/`NaN`; reducers de
undo/redo consistentes.

### C) E2E (Playwright)

App sobe, renderiza as faixas, adiciona link a um card e abre em nova aba, busca por
"Gibraltar" centraliza e ilumina a cadeia, exporta PNG, colapsa/expande faixa.

### D) Saúde e _gate_ de deploy

```bash
npm run qa
```

Imprime uma tabela de problemas (erros/avisos) e **sai com código ≠0 se houver erros** —
travando o deploy. A rota `GET /api/health` reporta status + versão; a checagem de
IndexedDB roda no cliente (`lib/db.ts#checkIndexedDB`).

### E) Qualidade de código

ESLint + Prettier + `typecheck` no CI; cobertura mínima **80%** no `/lib`.

---

## 🗂️ Estrutura

```
app/
  layout.tsx           Tema, fontes, metadata
  page.tsx             Carrega o AppShell (client-only)
  globals.css          Tokens de tema (claro/escuro/corporativo) + React Flow
  api/health/route.ts  Health check (Render / Docker)
components/
  AppShell.tsx         Orquestra tema, autosave, atalhos, layout responsivo
  Diagram.tsx          React Flow (nós, arestas, highlight/dim)
  nodes/CardNode.tsx   Card por tipo (sócios, imóveis, dados, links)
  nodes/LaneNode.tsx   Faixa colapsável com banner preto
  Inspector.tsx        Editor lateral / bottom sheet
  Toolbar.tsx          Ações globais (add, undo/redo, export, layout, reset, tema)
  SearchBar.tsx        Busca, filtros e rastreamento
  SummaryPanel.tsx     Contadores + consolidação + alertas
  QAPanel.tsx          Relatório de QA + saúde
lib/
  types.ts seed.ts store.ts db.ts layout.ts theme.ts
  normalize.ts search.ts serialize.ts export.ts
  qa/                  rules.ts index.ts report.ts types.ts
scripts/qa.ts          CLI do agente de QA (npm run qa)
tests/unit/            Vitest      tests/e2e/  Playwright
Dockerfile render.yaml .github/workflows/ci.yml
```

---

## 🧩 Modelo de dados

Definido em `lib/types.ts`. Resumo do card (`OrgNodeData`): `type` (NodeType), `owner`
(RAFAEL/TARIK/SOCIEDADE), `titulo`/`subtitulo`, `diretores[]`, `socios[]` (`{nome,
percentual, papel?}`), `imoveis[]`, `balanco`, `dados` (placa/RENAVAM/contato…),
`links[]` (`{id, label, url, icon?}`), `notas`, e cores opcionais (`cor`, `corBorda`,
`corTexto`). As **arestas de propriedade são derivadas** dos sócios via um índice de
aliases (`ENTITY_ALIASES`), mantendo grafo, rastreamento e QA sempre consistentes.

### Colando links / personalizando

1. Clique num card → o **Inspector** abre à direita.
2. Em **Links**, clique **+ Adicionar**, defina rótulo + URL (validada na hora).
3. Ajuste cores do card no próprio Inspector, ou tema/destaque globais na toolbar.
4. Tudo é salvo automaticamente; use **JSON ↓ / JSON ↑** para backup/transferência.

---

## ☁️ Deploy no Render (Blueprint via Docker)

O repositório já traz `Dockerfile` (multi-stage, Next _standalone_), `.dockerignore` e
`render.yaml`.

1. Faça **push** do projeto para um repositório no GitHub.
2. No [Render](https://dashboard.render.com): **New → Blueprint** e conecte o repositório.
   O Render lê o `render.yaml` e cria o Web Service `trk-mapa-patrimonial` (env `docker`,
   plano `starter`).
3. _Health check_ já configurado em **`/api/health`**; `autoDeploy` ligado (cada push na
   branch padrão dispara novo deploy).
4. Aguarde o build da imagem Docker. Ao ficar _healthy_, a URL pública estará disponível.

> **Gate de qualidade:** o workflow `.github/workflows/ci.yml` roda
> `lint → format → typecheck → qa → cobertura → E2E`. Mantenha o deploy condicionado à
> branch padrão para que um pipeline vermelho (ou o `npm run qa` falhando) bloqueie a
> publicação.

### Rodar a imagem Docker localmente

```bash
docker build -t trk-mapa .
docker run -p 3000:3000 trk-mapa
# http://localhost:3000  ·  health: http://localhost:3000/api/health
```

---

## 📌 Notas sobre os dados

Os percentuais e relações vêm do briefing real. O QA acusa **1 aviso conhecido**:
_Terreno Milagres_ soma 99,66% (33% + 33,33% + 33,33%) — provável arredondamento a
confirmar. Por ser aviso (não erro), não bloqueia o deploy.
