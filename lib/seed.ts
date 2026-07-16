/**
 * Full seed of the TRK patrimonial map — every entity from the real briefing.
 *
 * Cards are authored with stable ids. Ownership edges are *derived* from each
 * card's sócios via an alias index (ENTITY_ALIASES), so the graph and the
 * participation-tracing feature stay perfectly consistent with the data.
 */
import type {
  GraphEdge,
  GraphNode,
  LaneDef,
  NodeType,
  Owner,
  PatrimonioDoc,
  Socio,
} from './types';

export const DOC_VERSION = 1;

export const LANES: LaneDef[] = [
  { id: 'PESSOAS', titulo: 'PESSOAS', ordem: 0 },
  { id: 'EMPRESAS', titulo: 'EMPRESAS', ordem: 1 },
  { id: 'IMOVEIS', titulo: 'IMÓVEIS', ordem: 2 },
  { id: 'CARROS', titulo: 'CARROS', ordem: 3 },
  { id: 'SEGUROS', titulo: 'SEGUROS', ordem: 4 },
];

interface CardInput {
  id: string;
  type: NodeType;
  owner: Owner;
  titulo: string;
  lane: GraphNode['data']['lane'];
  grupo?: string;
  subtitulo?: string;
  diretores?: { papel: string; nome: string }[];
  socios?: Socio[];
  imoveis?: string[];
  balanco?: string;
  dados?: Record<string, string>;
  notas?: string;
  links?: GraphNode['data']['links'];
}

function card(input: CardInput): GraphNode {
  return {
    id: input.id,
    type: input.type,
    position: { x: 0, y: 0 },
    data: {
      id: input.id,
      type: input.type,
      owner: input.owner,
      titulo: input.titulo,
      lane: input.lane,
      grupo: input.grupo,
      subtitulo: input.subtitulo,
      diretores: input.diretores,
      socios: input.socios,
      imoveis: input.imoveis,
      balanco: input.balanco,
      dados: input.dados,
      notas: input.notas,
      links: input.links ?? [],
    },
  };
}

const s = (nome: string, percentual: number, papel?: string): Socio => ({
  nome,
  percentual,
  ...(papel ? { papel } : {}),
});

// ─────────────────────────────────────────────────────────────────────────────
// PESSOAS / CÔNJUGES
// ─────────────────────────────────────────────────────────────────────────────
const pessoas: GraphNode[] = [
  card({
    id: 'pessoa-rafael',
    type: 'PESSOA',
    owner: 'RAFAEL',
    titulo: 'Rafael Roda',
    subtitulo: 'CEO',
    lane: 'PESSOAS',
    grupo: 'RAFAEL',
    links: [
      {
        id: 'lk-rafael-1',
        label: 'Perfil',
        url: 'https://example.com/rafael',
        icon: 'user',
      },
    ],
  }),
  card({
    id: 'conjuge-luciana',
    type: 'CONJUGE',
    owner: 'RAFAEL',
    titulo: 'Luciana Carminati',
    subtitulo: 'Cônjuge — Separação total',
    lane: 'PESSOAS',
    grupo: 'RAFAEL',
    dados: { 'Regime de bens': 'Separação total' },
  }),
  card({
    id: 'pessoa-tarik',
    type: 'PESSOA',
    owner: 'TARIK',
    titulo: 'Tárik Faraj',
    subtitulo: 'CEO',
    lane: 'PESSOAS',
    grupo: 'TARIK',
  }),
  card({
    id: 'conjuge-carolina',
    type: 'CONJUGE',
    owner: 'TARIK',
    titulo: 'Carolina Meirelles',
    subtitulo: 'Cônjuge — Comunhão Parcial',
    lane: 'PESSOAS',
    grupo: 'TARIK',
    dados: { 'Regime de bens': 'Comunhão Parcial' },
  }),
];

// ─────────────────────────────────────────────────────────────────────────────
// EMPRESAS RAFAEL
// ─────────────────────────────────────────────────────────────────────────────
const empresasRafael: GraphNode[] = [
  card({
    id: 'emp-rr-participacoes',
    type: 'EMPRESA_PARTICIPACAO',
    owner: 'RAFAEL',
    titulo: 'RR PARTICIPAÇÕES LTDA',
    subtitulo: 'Participação em outras empresas',
    lane: 'EMPRESAS',
    grupo: 'EMPRESAS RAFAEL',
    diretores: [{ papel: 'Diretor', nome: 'Rafael' }],
    socios: [s('Rafael', 100, 'Cotista')],
  }),
  card({
    id: 'emp-audax',
    type: 'EMPRESA_PARTICIPACAO',
    owner: 'RAFAEL',
    titulo: 'AUDAX PARTICIPAÇÕES',
    subtitulo: 'Participação em outras empresas',
    lane: 'EMPRESAS',
    grupo: 'EMPRESAS RAFAEL',
    diretores: [{ papel: 'Diretor', nome: 'Rafael' }],
    socios: [s('Rafael', 100, 'Cotista')],
  }),
  card({
    id: 'emp-ativus',
    type: 'EMPRESA_PATRIMONIAL',
    owner: 'RAFAEL',
    titulo: 'ATIVUS S.A.',
    subtitulo: 'Patrimonial',
    lane: 'EMPRESAS',
    grupo: 'EMPRESAS RAFAEL',
    diretores: [
      { papel: 'Dir. Presidente', nome: 'Rafael' },
      { papel: 'Dir. Adjunto', nome: 'Marco' },
    ],
    socios: [s('Autor', 99, 'Acionista'), s('Marcus', 1, 'Acionista')],
    imoveis: [
      '18,06% Maracujá[7814]',
      '100% Gyro Ricardo Paranhos',
      '100% Quintas Itapoa L16[91988]',
      '100% Vila Raiô R104',
      '6% Sta. Maria[43868]',
    ],
  }),
  card({
    id: 'emp-autor',
    type: 'EMPRESA_PATRIMONIAL',
    owner: 'RAFAEL',
    titulo: 'AUTOR S.A.',
    subtitulo: 'Patrimonial',
    lane: 'EMPRESAS',
    grupo: 'EMPRESAS RAFAEL',
    diretores: [
      { papel: 'Dir. Presidente', nome: 'Marco' },
      { papel: 'Dir. Adjunto', nome: 'Vera' },
    ],
    socios: [s('Rafael', 99, 'Acionista'), s('RR', 1, 'Acionista')],
  }),
];

// ─────────────────────────────────────────────────────────────────────────────
// EMPRESAS TÁRIK
// ─────────────────────────────────────────────────────────────────────────────
const empresasTarik: GraphNode[] = [
  card({
    id: 'emp-tarifa',
    type: 'EMPRESA_PARTICIPACAO',
    owner: 'TARIK',
    titulo: 'TARIFA PARTICIPAÇÕES LTDA',
    subtitulo: 'Participação em outras empresas',
    lane: 'EMPRESAS',
    grupo: 'EMPRESAS TÁRIK',
    diretores: [{ papel: 'Diretor', nome: 'Tárik' }],
    socios: [s('Tárik', 100, 'Cotista')],
  }),
  card({
    id: 'emp-malaga',
    type: 'EMPRESA_PARTICIPACAO',
    owner: 'TARIK',
    titulo: 'MALAGA PARTICIPACAO LTDA',
    subtitulo: 'Participação em outras empresas',
    lane: 'EMPRESAS',
    grupo: 'EMPRESAS TÁRIK',
    diretores: [{ papel: 'Administrador', nome: 'Tárik' }],
    socios: [s('Tárik', 100, 'Cotista')],
    imoveis: ['100% Vila Raiô R102', '100% Vila Raiô R105'],
  }),
  card({
    id: 'emp-cmf',
    type: 'EMPRESA_PARTICIPACAO',
    owner: 'TARIK',
    titulo: 'CMF CONSULTORIA IMOBILIARIA LTDA',
    subtitulo: 'Participação em outras empresas',
    lane: 'EMPRESAS',
    grupo: 'EMPRESAS TÁRIK',
    diretores: [{ papel: 'Administrador', nome: 'Carolina' }],
    socios: [s('Carolina', 100, 'Cotista')],
  }),
  card({
    id: 'emp-gibraltar',
    type: 'EMPRESA_PATRIMONIAL',
    owner: 'TARIK',
    titulo: 'GIBRALTAR S.A.',
    subtitulo: 'Patrimonial',
    lane: 'EMPRESAS',
    grupo: 'EMPRESAS TÁRIK',
    diretores: [
      { papel: 'Dir. Presidente', nome: 'Tárik' },
      { papel: 'Dir. Adjunto', nome: 'Carolina' },
    ],
    socios: [s('Tárik', 99, 'Acionista'), s('Ativus', 1, 'Acionista')],
    imoveis: [
      '28,69% Maracujá[7814]',
      '100% Quintas Itapoa P5',
      '100% Quintas Itapoa E10',
      '100% Shis QI 13',
      '100% Vila Raiô R207',
      '4% Sta. Maria[43868]',
    ],
    links: [
      {
        id: 'lk-gibraltar-1',
        label: 'Contrato social',
        url: 'https://example.com/gibraltar',
        icon: 'file',
      },
    ],
  }),
];

// ─────────────────────────────────────────────────────────────────────────────
// EMPRESAS OPERACIONAIS EM SOCIEDADE (amarelo)
// ─────────────────────────────────────────────────────────────────────────────
const empresasOperacionais: GraphNode[] = [
  card({
    id: 'emp-acao-imobiliaria',
    type: 'EMPRESA_OPERACIONAL',
    owner: 'SOCIEDADE',
    titulo: 'AÇÃO IMOBILIÁRIA LTDA',
    lane: 'EMPRESAS',
    grupo: 'OPERACIONAIS EM SOCIEDADE',
    diretores: [{ papel: 'Diretor', nome: 'João do Carmo' }],
    socios: [s('João do Carmo', 99.9), s('Soraia', 0.1)],
  }),
  card({
    id: 'emp-trk-administradora',
    type: 'EMPRESA_OPERACIONAL',
    owner: 'SOCIEDADE',
    titulo: 'TRK ADMINISTRADORA LTDA',
    lane: 'EMPRESAS',
    grupo: 'OPERACIONAIS EM SOCIEDADE',
    socios: [s('João do Carmo', 10), s('RR', 30), s('Soraia', 5), s('Tarifa', 55)],
  }),
  card({
    id: 'emp-trk-consultoria',
    type: 'EMPRESA_OPERACIONAL',
    owner: 'SOCIEDADE',
    titulo: 'TRK CONSULTORIA LTDA',
    lane: 'EMPRESAS',
    grupo: 'OPERACIONAIS EM SOCIEDADE',
    socios: [s('Leonardo', 10), s('Eudes', 10), s('RR', 24), s('Tárik', 56)],
  }),
  card({
    id: 'emp-esfera',
    type: 'EMPRESA_OPERACIONAL',
    owner: 'SOCIEDADE',
    titulo: 'ESFERA ARENA E NEGÓCIOS LTDA',
    lane: 'EMPRESAS',
    grupo: 'OPERACIONAIS EM SOCIEDADE',
    diretores: [{ papel: 'Dir. Administrativo', nome: 'Rafael' }],
    socios: [s('RR', 15), s('Tarifa', 35), s('R2B', 50)],
  }),
  card({
    id: 'emp-k-consultoria',
    type: 'EMPRESA_OPERACIONAL',
    owner: 'SOCIEDADE',
    titulo: 'K CONSULTORIA E MARKETING IMOBILIÁRIO LTDA',
    lane: 'EMPRESAS',
    grupo: 'OPERACIONAIS EM SOCIEDADE',
    diretores: [{ papel: 'Administrador', nome: 'Eudes e Leonardo' }],
    socios: [s('Eudes', 10), s('Leonardo', 10), s('Khalil', 80)],
  }),
  card({
    id: 'emp-k-finserv',
    type: 'EMPRESA_OPERACIONAL',
    owner: 'SOCIEDADE',
    titulo: 'K FINSERV SERVICOS FINANCEIROS LTDA',
    lane: 'EMPRESAS',
    grupo: 'OPERACIONAIS EM SOCIEDADE',
    diretores: [{ papel: 'Administrador', nome: 'Rafael' }],
    socios: [s('RR', 50), s('Tarifa', 50)],
  }),
];

// ─────────────────────────────────────────────────────────────────────────────
// EMPRESAS PATRIMONIAIS EM SOCIEDADE (cinza)
// ─────────────────────────────────────────────────────────────────────────────
const empresasPatrimoniaisSoc: GraphNode[] = [
  card({
    id: 'emp-roi',
    type: 'EMPRESA_PATRIMONIAL',
    owner: 'SOCIEDADE',
    titulo: 'ROI S.A.',
    lane: 'EMPRESAS',
    grupo: 'PATRIMONIAIS EM SOCIEDADE',
    diretores: [{ papel: 'Diretores', nome: 'Rafael, Tárik' }],
    socios: [
      s('4G Investimentos', 46.95),
      s('Mario Rosa', 23.47),
      s('Greco', 14.08),
      s('Gibraltar', 9.51),
      s('Ativus', 5.99),
    ],
    imoveis: ['53,25% Maracujá[7814]'],
  }),
  card({
    id: 'emp-quintas',
    type: 'EMPRESA_PATRIMONIAL',
    owner: 'SOCIEDADE',
    titulo: 'QUINTAS S.A.',
    lane: 'EMPRESAS',
    grupo: 'PATRIMONIAIS EM SOCIEDADE',
    diretores: [
      { papel: 'Dir. Presidente', nome: 'Tárik' },
      { papel: 'Dir. Adjunto', nome: 'Rafael' },
    ],
    socios: [s('Tárik', 75), s('Ativus', 25)],
    imoveis: ['17% Faixa', '10% Triangulo', '57,5% 58[833]'],
  }),
  card({
    id: 'emp-tanger',
    type: 'EMPRESA_PATRIMONIAL',
    owner: 'SOCIEDADE',
    titulo: 'TANGER LTDA',
    lane: 'EMPRESAS',
    grupo: 'PATRIMONIAIS EM SOCIEDADE',
    socios: [s('Gibraltar', 50), s('Ativus', 10), s('Mario', 40)],
    imoveis: ['100% 20.000 DF 140[15.774]'],
  }),
  card({
    id: 'emp-scholl',
    type: 'EMPRESA_PATRIMONIAL',
    owner: 'SOCIEDADE',
    titulo: 'SCHOLL LTDA',
    lane: 'EMPRESAS',
    grupo: 'PATRIMONIAIS EM SOCIEDADE',
    socios: [s('Voxel', 50), s('Tárik', 35), s('Ativus', 15)],
    imoveis: ['100% Escola'],
  }),
  card({
    id: 'emp-golf',
    type: 'EMPRESA_PATRIMONIAL',
    owner: 'SOCIEDADE',
    titulo: 'GOLF LTDA',
    lane: 'EMPRESAS',
    grupo: 'PATRIMONIAIS EM SOCIEDADE',
    socios: [s('Gibraltar', 45), s('Ativus', 5), s('FB', 50)],
    imoveis: ['100% Golf[25.978/26.223]'],
  }),
  card({
    id: 'emp-cidade-jardim',
    type: 'EMPRESA_PATRIMONIAL',
    owner: 'SOCIEDADE',
    titulo: 'CIDADE JARDIM',
    lane: 'EMPRESAS',
    grupo: 'PATRIMONIAIS EM SOCIEDADE',
    socios: [
      s('Frederico', 28.24),
      s('Maurício', 30.57),
      s('Tárik', 5.93),
      s("Dall'Oca", 23.52),
      s('Victor', 11.74),
    ],
  }),
  card({
    id: 'emp-residencial-garden',
    type: 'EMPRESA_PATRIMONIAL',
    owner: 'SOCIEDADE',
    titulo: 'RESIDENCIAL GARDEN LTDA',
    lane: 'EMPRESAS',
    grupo: 'PATRIMONIAIS EM SOCIEDADE',
    diretores: [
      { papel: 'Dir. Financeiro', nome: 'Rafael' },
      { papel: 'Dir. Comercial', nome: 'Luiz Neto' },
    ],
    socios: [
      s('RR', 8.5),
      s('Tarifa', 19.83),
      s('MB', 14.17),
      s('FB', 14.17),
      s('Invest Realty', 28.33),
      s('WT Administração', 15),
    ],
  }),
  card({
    id: 'emp-mar-azul',
    type: 'EMPRESA_PATRIMONIAL',
    owner: 'SOCIEDADE',
    titulo: 'MAR AZUL LTDA',
    lane: 'EMPRESAS',
    grupo: 'PATRIMONIAIS EM SOCIEDADE',
    diretores: [{ papel: 'Administrador', nome: 'Braconi e Tárik' }],
    socios: [s('FB', 28.34), s('MB', 5), s('Gibraltar', 33.33), s('BLG', 33.33)],
  }),
  card({
    id: 'emp-bird-partners',
    type: 'EMPRESA_PATRIMONIAL',
    owner: 'SOCIEDADE',
    titulo: 'BIRD PARTNERS S.A.',
    lane: 'EMPRESAS',
    grupo: 'PATRIMONIAIS EM SOCIEDADE',
    diretores: [{ papel: 'Diretor', nome: 'Rafael' }],
    socios: [s('CDI', 90), s('Malaga', 5), s('Audax', 5)],
    imoveis: ['100% Shis QL 10-8-9'],
  }),
  card({
    id: 'emp-eleven-one',
    type: 'EMPRESA_PATRIMONIAL',
    owner: 'SOCIEDADE',
    titulo: 'ELEVEN & ONE PARTNERS LTDA',
    lane: 'EMPRESAS',
    grupo: 'PATRIMONIAIS EM SOCIEDADE',
    diretores: [{ papel: 'Administrador', nome: 'Wilson e Tárik' }],
    socios: [s('Wilson', 50), s('Malaga', 50)],
    imoveis: ['100% Shis QI 4-14-11'],
  }),
];

// ─────────────────────────────────────────────────────────────────────────────
// IMÓVEIS RAFAEL (azul)
// ─────────────────────────────────────────────────────────────────────────────
const imoveisRafael: GraphNode[] = [
  card({
    id: 'imovel-vila-raio-r104',
    type: 'IMOVEL',
    owner: 'RAFAEL',
    titulo: 'Vila Raiô R104',
    lane: 'IMOVEIS',
    grupo: 'IMÓVEIS RAFAEL',
    balanco: 'Estoque',
    socios: [s('Ativus', 100)],
  }),
  card({
    id: 'imovel-gyro',
    type: 'IMOVEL',
    owner: 'RAFAEL',
    titulo: 'Gyro Ricardo Paranhos',
    lane: 'IMOVEIS',
    grupo: 'IMÓVEIS RAFAEL',
    balanco: 'Estoque',
    socios: [s('Ativus', 100)],
  }),
  card({
    id: 'imovel-shis-qi-19b',
    type: 'IMOVEL',
    owner: 'RAFAEL',
    titulo: 'Shis QI 19B CH 3 UN',
    lane: 'IMOVEIS',
    grupo: 'IMÓVEIS RAFAEL',
    socios: [s('Luciana', 100)],
  }),
  card({
    id: 'imovel-quintas-itapoa-l16',
    type: 'IMOVEL',
    owner: 'RAFAEL',
    titulo: 'Quintas Itapoa L16',
    lane: 'IMOVEIS',
    grupo: 'IMÓVEIS RAFAEL',
    dados: { Matrícula: '91988' },
    balanco: 'Estoque',
    socios: [s('Ativus', 100)],
  }),
];

// ─────────────────────────────────────────────────────────────────────────────
// IMÓVEIS EM SOCIEDADE (verde)
// ─────────────────────────────────────────────────────────────────────────────
const imoveisSociedade: GraphNode[] = [
  card({
    id: 'imovel-maracuja',
    type: 'IMOVEL',
    owner: 'SOCIEDADE',
    titulo: 'Maracujá(7.814)',
    lane: 'IMOVEIS',
    grupo: 'IMÓVEIS EM SOCIEDADE',
    balanco: 'Estoque',
    notas: 'Ônus: 53,25% ROI, 18,06% Ativus, 28,69% Gibraltar',
    socios: [s('ROI', 53.25), s('Ativus', 18.06), s('Gibraltar', 28.69)],
  }),
  card({
    id: 'imovel-faixa',
    type: 'IMOVEL',
    owner: 'SOCIEDADE',
    titulo: 'Faixa(28.239)',
    lane: 'IMOVEIS',
    grupo: 'IMÓVEIS EM SOCIEDADE',
    balanco: 'Bal. Quintas 67%',
    notas: 'Real: 45,23% Tárik, 21,77% Rafael, 33% Voxel',
    socios: [s('Tárik', 50), s('Voxel', 33), s('Quintas', 17)],
  }),
  card({
    id: 'imovel-triangulo',
    type: 'IMOVEL',
    owner: 'SOCIEDADE',
    titulo: 'Triangulo(8.003)',
    lane: 'IMOVEIS',
    grupo: 'IMÓVEIS EM SOCIEDADE',
    balanco: 'Bal. Quintas 60%',
    notas: 'Real: 47% Tárik, 13% Rafael, 40% Voxel',
    socios: [s('Tárik', 50), s('Voxel', 40), s('Quintas', 10)],
  }),
  card({
    id: 'imovel-58',
    type: 'IMOVEL',
    owner: 'SOCIEDADE',
    titulo: '58(833)',
    lane: 'IMOVEIS',
    grupo: 'IMÓVEIS EM SOCIEDADE',
    balanco: 'Estoque',
    notas: 'Real: 42,5% Habitat, 27,25% Rafael, 30,25% Tárik',
    socios: [s('Quintas', 57.5), s('Habitat', 42.5)],
  }),
  card({
    id: 'imovel-20000-df140',
    type: 'IMOVEL',
    owner: 'SOCIEDADE',
    titulo: '20.000 DF 140(15.774)',
    lane: 'IMOVEIS',
    grupo: 'IMÓVEIS EM SOCIEDADE',
    notas: 'Real: 40% Mario, 50% Tárik, 10% Rafael',
    socios: [s('Tanger', 100)],
  }),
  card({
    id: 'imovel-sta-maria',
    type: 'IMOVEL',
    owner: 'SOCIEDADE',
    titulo: 'Sta. Maria(43.868)',
    lane: 'IMOVEIS',
    grupo: 'IMÓVEIS EM SOCIEDADE',
    balanco: 'Imobilizado',
    notas: 'Real: 10% Ze',
    socios: [
      s('Business', 66),
      s('AGP', 14),
      s('FB', 10),
      s('Gibraltar', 4),
      s('Ativus', 6),
    ],
  }),
  card({
    id: 'imovel-escola',
    type: 'IMOVEL',
    owner: 'SOCIEDADE',
    titulo: 'Escola(25.982)',
    lane: 'IMOVEIS',
    grupo: 'IMÓVEIS EM SOCIEDADE',
    balanco: 'Estoque',
    socios: [s('School', 100)],
  }),
  card({
    id: 'imovel-golf',
    type: 'IMOVEL',
    owner: 'SOCIEDADE',
    titulo: 'Golf(25.978/26.223)',
    lane: 'IMOVEIS',
    grupo: 'IMÓVEIS EM SOCIEDADE',
    balanco: 'Estoque',
    notas: 'Real: Tárik 20%, Rafael 5%, FB 50%, Ze 25%',
    socios: [s('Golf', 100)],
  }),
  card({
    id: 'imovel-vila-raio-garden',
    type: 'IMOVEL',
    owner: 'SOCIEDADE',
    titulo: 'Vila Raiô',
    lane: 'IMOVEIS',
    grupo: 'IMÓVEIS EM SOCIEDADE',
    socios: [s('Residencial Garden', 100)],
  }),
  card({
    id: 'imovel-casa-trk-shis-qi-7',
    type: 'IMOVEL',
    owner: 'SOCIEDADE',
    titulo: 'Casa TRK Shis QI 7-13-24',
    lane: 'IMOVEIS',
    grupo: 'IMÓVEIS EM SOCIEDADE',
    socios: [s('Luciana', 30), s('Tárik', 70)],
  }),
  card({
    id: 'imovel-cls-403',
    type: 'IMOVEL',
    owner: 'SOCIEDADE',
    titulo: 'CLS 403 Bloco D Lj 34',
    lane: 'IMOVEIS',
    grupo: 'IMÓVEIS EM SOCIEDADE',
    balanco: 'Estoque',
    socios: [s('Gibraltar', 50, 'Tárik'), s('Ativus', 50, 'Rafael')],
  }),
  card({
    id: 'imovel-shis-ql-8-3-1',
    type: 'IMOVEL',
    owner: 'SOCIEDADE',
    titulo: 'Shis QL 8-3-1',
    lane: 'IMOVEIS',
    grupo: 'IMÓVEIS EM SOCIEDADE',
    balanco: 'Estoque',
    socios: [s('Gibraltar', 50, 'Tárik'), s('Ativus', 50, 'Rafael')],
  }),
  card({
    id: 'imovel-scrs-510',
    type: 'IMOVEL',
    owner: 'SOCIEDADE',
    titulo: 'SCRS 510 Bloco A',
    lane: 'IMOVEIS',
    grupo: 'IMÓVEIS EM SOCIEDADE',
    balanco: 'Estoque',
    socios: [s('Gibraltar', 50, 'Tárik'), s('Ativus', 50, 'Rafael')],
  }),
  card({
    id: 'imovel-shis-ql-10-8-9',
    type: 'IMOVEL',
    owner: 'SOCIEDADE',
    titulo: 'Shis QL 10-8-9',
    lane: 'IMOVEIS',
    grupo: 'IMÓVEIS EM SOCIEDADE',
    balanco: 'Estoque (Vendida)',
    socios: [s('Bird Partners', 100)],
  }),
  card({
    id: 'imovel-sga-sul-616',
    type: 'IMOVEL',
    owner: 'SOCIEDADE',
    titulo: 'SGA/SUL 616 Loja 14-SE / 15-SE / 16-SE',
    lane: 'IMOVEIS',
    grupo: 'IMÓVEIS EM SOCIEDADE',
    socios: [s('Bird Partners', 100)],
  }),
  card({
    id: 'imovel-shis-qi-4-14-11',
    type: 'IMOVEL',
    owner: 'SOCIEDADE',
    titulo: 'Shis QI 4-14-11',
    lane: 'IMOVEIS',
    grupo: 'IMÓVEIS EM SOCIEDADE',
    balanco: 'Estoque',
    socios: [s('Eleven & One', 100)],
  }),
];

// ─────────────────────────────────────────────────────────────────────────────
// IMÓVEIS TÁRIK (vermelho)
// ─────────────────────────────────────────────────────────────────────────────
const imoveisTarik: GraphNode[] = [
  card({
    id: 'imovel-lotes-edith',
    type: 'IMOVEL',
    owner: 'TARIK',
    titulo: 'Lotes Edith',
    lane: 'IMOVEIS',
    grupo: 'IMÓVEIS TÁRIK',
    notas:
      'Lotes: Frederico 84,12 · Maurício 91,08 · Tárik 17,68 · Dall’Oca 70,08 · Victor 35,04',
    socios: [
      s('Frederico', 28.24),
      s('Maurício', 30.57),
      s('Tárik', 5.93),
      s("Dall'Oca", 23.52),
      s('Victor', 11.74),
    ],
  }),
  card({
    id: 'imovel-quintas-itapoa-p5',
    type: 'IMOVEL',
    owner: 'TARIK',
    titulo: 'Quintas Itapoa P5',
    lane: 'IMOVEIS',
    grupo: 'IMÓVEIS TÁRIK',
    socios: [s('Gibraltar', 100)],
  }),
  card({
    id: 'imovel-quintas-itapoa-e10',
    type: 'IMOVEL',
    owner: 'TARIK',
    titulo: 'Quintas Itapoa E10',
    lane: 'IMOVEIS',
    grupo: 'IMÓVEIS TÁRIK',
    socios: [s('Gibraltar', 100)],
  }),
  card({
    id: 'imovel-terreno-milagres',
    type: 'IMOVEL',
    owner: 'TARIK',
    titulo: 'Terreno Milagres',
    lane: 'IMOVEIS',
    grupo: 'IMÓVEIS TÁRIK',
    notas: 'Confirmar venda 06/05/25',
    socios: [s('Braconi', 33), s('Gibraltar', 33.33), s('BLG', 33.33)],
  }),
  card({
    id: 'imovel-shis-ql-10-2-4',
    type: 'IMOVEL',
    owner: 'TARIK',
    titulo: 'Shis QL 10-2-4',
    lane: 'IMOVEIS',
    grupo: 'IMÓVEIS TÁRIK',
    socios: [s('Tárik', 100)],
  }),
  card({
    id: 'imovel-shis-qi-13-banca',
    type: 'IMOVEL',
    owner: 'TARIK',
    titulo: 'Shis QI 13-Banca',
    lane: 'IMOVEIS',
    grupo: 'IMÓVEIS TÁRIK',
    socios: [s('Gibraltar', 100)],
  }),
  card({
    id: 'imovel-shis-qi-9-11-23',
    type: 'IMOVEL',
    owner: 'TARIK',
    titulo: 'Shis QI 9-11-23',
    lane: 'IMOVEIS',
    grupo: 'IMÓVEIS TÁRIK',
    socios: [s('Tárik', 100)],
  }),
  card({
    id: 'imovel-barramar-601',
    type: 'IMOVEL',
    owner: 'TARIK',
    titulo: 'Barramar 601 Maceió',
    lane: 'IMOVEIS',
    grupo: 'IMÓVEIS TÁRIK',
    socios: [s('Tárik', 100)],
  }),
  card({
    id: 'imovel-barramar-101',
    type: 'IMOVEL',
    owner: 'TARIK',
    titulo: 'Barramar 101 Maceió',
    lane: 'IMOVEIS',
    grupo: 'IMÓVEIS TÁRIK',
    socios: [s('Gibraltar', 100)],
  }),
  card({
    id: 'imovel-vila-raio-r207',
    type: 'IMOVEL',
    owner: 'TARIK',
    titulo: 'Vila Raiô R207',
    lane: 'IMOVEIS',
    grupo: 'IMÓVEIS TÁRIK',
    socios: [s('Gibraltar', 100)],
  }),
  card({
    id: 'imovel-vila-raio-r102',
    type: 'IMOVEL',
    owner: 'TARIK',
    titulo: 'Vila Raiô R102',
    lane: 'IMOVEIS',
    grupo: 'IMÓVEIS TÁRIK',
    socios: [s('Malaga', 100)],
  }),
  card({
    id: 'imovel-vila-raio-r105',
    type: 'IMOVEL',
    owner: 'TARIK',
    titulo: 'Vila Raiô R105',
    lane: 'IMOVEIS',
    grupo: 'IMÓVEIS TÁRIK',
    socios: [s('Malaga', 100)],
  }),
];

// ─────────────────────────────────────────────────────────────────────────────
// CARROS
// ─────────────────────────────────────────────────────────────────────────────
const carros: GraphNode[] = [
  card({
    id: 'carro-volvo-xc60-rafael',
    type: 'CARRO',
    owner: 'RAFAEL',
    titulo: 'Volvo XC60',
    lane: 'CARROS',
    grupo: 'CARROS RAFAEL',
    socios: [s('Ativus', 100)],
    dados: { Placa: 'SSL2C44', RENAVAM: '01396929972' },
  }),
  card({
    id: 'carro-jeep-wrangler',
    type: 'CARRO',
    owner: 'RAFAEL',
    titulo: 'Jeep Wrangler',
    lane: 'CARROS',
    grupo: 'CARROS RAFAEL',
    socios: [s('Ativus', 100)],
    dados: { Placa: 'SGN9G78', RENAVAM: '01318875959' },
  }),
  card({
    id: 'carro-byd-king',
    type: 'CARRO',
    owner: 'TARIK',
    titulo: 'BYD King GS DM',
    lane: 'CARROS',
    grupo: 'CARROS TÁRIK',
    socios: [s('Gibraltar', 100)],
    dados: { Placa: 'OVO6J32', RENAVAM: '01437726841' },
  }),
  card({
    id: 'carro-denza-b5',
    type: 'CARRO',
    owner: 'TARIK',
    titulo: 'Denza B5',
    lane: 'CARROS',
    grupo: 'CARROS TÁRIK',
    socios: [s('Gibraltar', 100)],
  }),
  card({
    id: 'carro-porsche-911',
    type: 'CARRO',
    owner: 'TARIK',
    titulo: 'Porsche 911 Carrera 4S',
    lane: 'CARROS',
    grupo: 'CARROS TÁRIK',
    socios: [s('Gibraltar', 100)],
    dados: { Placa: 'AFX0911', RENAVAM: '00191657395' },
  }),
  card({
    id: 'carro-defender',
    type: 'CARRO',
    owner: 'TARIK',
    titulo: 'Defender D350',
    lane: 'CARROS',
    grupo: 'CARROS TÁRIK',
    socios: [s('Tárik', 100)],
    dados: { Placa: 'TVK6A96', RENAVAM: '01448564503' },
  }),
  card({
    id: 'carro-volvo-xc60-tarik',
    type: 'CARRO',
    owner: 'TARIK',
    titulo: 'Volvo XC60',
    lane: 'CARROS',
    grupo: 'CARROS TÁRIK',
    socios: [s('Tárik', 100)],
    dados: { Placa: 'SSK1C95', RENAVAM: '01393897298' },
  }),
];

// ─────────────────────────────────────────────────────────────────────────────
// SEGUROS
// ─────────────────────────────────────────────────────────────────────────────
const seguros: GraphNode[] = [
  card({
    id: 'seguro-pa-wealth',
    type: 'SEGURO',
    owner: 'TARIK',
    titulo: 'PA Wealth Transfer Trust',
    subtitulo: 'Seguro de Vida',
    lane: 'SEGUROS',
    grupo: 'SEGUROS TÁRIK',
    dados: { Contratante: 'Tárik', Prêmio: 'US$ 1.000.000' },
  }),
  card({
    id: 'seguro-vumi',
    type: 'SEGURO',
    owner: 'TARIK',
    titulo: 'VUMI',
    subtitulo: 'Seguro Saúde Internacional',
    lane: 'SEGUROS',
    grupo: 'SEGUROS TÁRIK',
    dados: {
      Contratante: 'Tárik',
      Franquia: 'US$ 50.000',
      Contato: 'Guilherme +55 21 98710-2878',
    },
  }),
];

export const SEED_NODES: GraphNode[] = [
  ...pessoas,
  ...empresasRafael,
  ...empresasTarik,
  ...empresasOperacionais,
  ...empresasPatrimoniaisSoc,
  ...imoveisRafael,
  ...imoveisSociedade,
  ...imoveisTarik,
  ...carros,
  ...seguros,
];

/**
 * Alias index: normalized sócio/owner name → node id of an *internal* entity.
 * Used to (a) derive ownership edges and (b) trace participation. External
 * partners (Mario Rosa, Greco, Voxel, FB, …) are intentionally absent.
 */
export const ENTITY_ALIASES: Record<string, string> = {
  // pessoas / cônjuges
  rafael: 'pessoa-rafael',
  'rafael roda': 'pessoa-rafael',
  tarik: 'pessoa-tarik',
  'tarik faraj': 'pessoa-tarik',
  luciana: 'conjuge-luciana',
  'luciana carminati': 'conjuge-luciana',
  carolina: 'conjuge-carolina',
  'carolina meirelles': 'conjuge-carolina',
  // empresas
  rr: 'emp-rr-participacoes',
  'rr participacoes': 'emp-rr-participacoes',
  audax: 'emp-audax',
  ativus: 'emp-ativus',
  autor: 'emp-autor',
  tarifa: 'emp-tarifa',
  malaga: 'emp-malaga',
  cmf: 'emp-cmf',
  gibraltar: 'emp-gibraltar',
  roi: 'emp-roi',
  quintas: 'emp-quintas',
  tanger: 'emp-tanger',
  scholl: 'emp-scholl',
  school: 'emp-scholl',
  golf: 'emp-golf',
  'residencial garden': 'emp-residencial-garden',
  'mar azul': 'emp-mar-azul',
  'bird partners': 'emp-bird-partners',
  'eleven & one': 'emp-eleven-one',
  'eleven and one': 'emp-eleven-one',
};

/** Resolve a sócio/owner name to an internal node id, if any. */
export function resolveEntityId(name: string): string | undefined {
  return ENTITY_ALIASES[compactKeyToAlias(name)];
}

function compactKeyToAlias(name: string): string {
  // Aliases are stored accent-free & lowercased but keep single spaces.
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

/** Build ownership edges from sócios that resolve to internal entities. */
export function deriveEdges(nodes: GraphNode[]): GraphEdge[] {
  const ids = new Set(nodes.map((n) => n.id));
  const edges: GraphEdge[] = [];
  const seen = new Set<string>();

  // Marriages (explicit, bidirectional concept rendered once).
  const marriages: Array<[string, string]> = [
    ['pessoa-rafael', 'conjuge-luciana'],
    ['pessoa-tarik', 'conjuge-carolina'],
  ];
  for (const [a, b] of marriages) {
    if (ids.has(a) && ids.has(b)) {
      edges.push({ id: `e-mar-${a}-${b}`, source: a, target: b, kind: 'MARRIAGE' });
    }
  }

  // Ownership: internal sócio → card.
  for (const node of nodes) {
    const socios = node.data.socios ?? [];
    for (const socio of socios) {
      const sourceId = resolveEntityId(socio.nome);
      if (!sourceId || sourceId === node.id || !ids.has(sourceId)) continue;
      const id = `e-own-${sourceId}-${node.id}`;
      if (seen.has(id)) continue;
      seen.add(id);
      const kind = node.type === 'IMOVEL' ? 'OWNERSHIP' : 'PARTICIPATION';
      edges.push({
        id,
        source: sourceId,
        target: node.id,
        kind,
        label: `${socio.percentual}%`,
      });
    }
  }

  return edges;
}

/** A fresh, fully-populated document (positions are computed by the layout). */
export function buildSeedDoc(): PatrimonioDoc {
  const nodes = SEED_NODES.map((n) => ({
    ...n,
    data: { ...n.data, socios: n.data.socios ? [...n.data.socios] : undefined },
  }));
  return {
    version: DOC_VERSION,
    lanes: LANES,
    nodes,
    edges: deriveEdges(nodes),
    updatedAt: Date.now(),
  };
}
