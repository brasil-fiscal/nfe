import { ProdutoProps, ICMSProps } from '@nfe/domain/entities/Produto';
import { tag, tagGroup, formatNumber } from '../xml-helper';
import { buildIBSCBS } from './ibscbs-groups';

/**
 * Grupos de imposto do item. Cada CST/CSOSN tem uma sequencia propria no XSD —
 * campo fora de ordem ou sequencia opcional pela metade derruba a validacao.
 */

/** pFCP + vFCP (sequencia opcional dos CST sem base de FCP separada). */
function fcpSemBase(icms: ICMSProps): string {
  if (icms.aliquotaFcp === undefined) return '';

  const base = icms.baseCalculoFcp ?? icms.baseCalculo ?? 0;

  return (
    tag('pFCP', formatNumber(icms.aliquotaFcp, 4)) +
    tag('vFCP', formatNumber(icms.valorFcp ?? (base * icms.aliquotaFcp) / 100, 2))
  );
}

/** vBCFCP + pFCP + vFCP. */
function fcpComBase(icms: ICMSProps): string {
  if (icms.aliquotaFcp === undefined) return '';

  const base = icms.baseCalculoFcp ?? icms.baseCalculo ?? 0;

  return (
    tag('vBCFCP', formatNumber(base, 2)) +
    tag('pFCP', formatNumber(icms.aliquotaFcp, 4)) +
    tag('vFCP', formatNumber(icms.valorFcp ?? (base * icms.aliquotaFcp) / 100, 2))
  );
}

/** vBCFCPST + pFCPST + vFCPST. */
function fcpST(icms: ICMSProps): string {
  if (icms.aliquotaFcpST === undefined) return '';

  const base = icms.baseCalculoFcpST ?? icms.baseCalculoST ?? 0;

  return (
    tag('vBCFCPST', formatNumber(base, 2)) +
    tag('pFCPST', formatNumber(icms.aliquotaFcpST, 4)) +
    tag('vFCPST', formatNumber(icms.valorFcpST ?? (base * icms.aliquotaFcpST) / 100, 2))
  );
}

/** vBCFCPSTRet + pFCPSTRet + vFCPSTRet. */
function fcpSTRetido(icms: ICMSProps): string {
  if (icms.aliquotaFcpSTRetido === undefined) return '';

  const base = icms.baseCalculoFcpSTRetido ?? icms.baseCalculoSTRetido ?? 0;

  return (
    tag('vBCFCPSTRet', formatNumber(base, 2)) +
    tag('pFCPSTRet', formatNumber(icms.aliquotaFcpSTRetido, 4)) +
    tag(
      'vFCPSTRet',
      formatNumber(icms.valorFcpSTRetido ?? (base * icms.aliquotaFcpSTRetido) / 100, 2)
    )
  );
}

/** modBCST ... vICMSST — substituicao tributaria propria. */
function substituicao(icms: ICMSProps): string {
  const baseST = icms.baseCalculoST ?? 0;
  const aliquotaST = icms.aliquotaST ?? 0;

  return (
    tag('modBCST', String(icms.modalidadeBaseCalculoST ?? 4)) +
    tag(
      'pMVAST',
      icms.percentualMva !== undefined ? formatNumber(icms.percentualMva, 4) : undefined
    ) +
    tag(
      'pRedBCST',
      icms.percentualReducaoBaseST !== undefined
        ? formatNumber(icms.percentualReducaoBaseST, 4)
        : undefined
    ) +
    tag('vBCST', formatNumber(baseST, 2)) +
    tag('pICMSST', formatNumber(aliquotaST, 4)) +
    tag('vICMSST', formatNumber(icms.valorST ?? (baseST * aliquotaST) / 100, 2)) +
    fcpST(icms)
  );
}

/** vBCSTRet + pST + vICMSSubstituto? + vICMSSTRet — ST retido anteriormente. */
function stRetido(icms: ICMSProps, obrigatorio = false): string {
  const base = icms.baseCalculoSTRetido ?? icms.baseCalculo;
  const valor = icms.valorSTRetido ?? icms.valor;

  if (!obrigatorio && base === undefined && valor === undefined) return '';

  return (
    tag('vBCSTRet', formatNumber(base ?? 0, 2)) +
    tag('pST', formatNumber(icms.aliquotaSTConsumidorFinal ?? icms.aliquota ?? 0, 4)) +
    tag(
      'vICMSSubstituto',
      icms.valorSubstituto !== undefined ? formatNumber(icms.valorSubstituto, 2) : undefined
    ) +
    tag('vICMSSTRet', formatNumber(valor ?? 0, 2))
  );
}

/** pRedBCEfet + vBCEfet + pICMSEfet + vICMSEfet — ICMS efetivo. */
function efetivo(icms: ICMSProps): string {
  if (!icms.efetivo) return '';

  return (
    tag('pRedBCEfet', formatNumber(icms.efetivo.percentualReducaoBase, 4)) +
    tag('vBCEfet', formatNumber(icms.efetivo.baseCalculo, 2)) +
    tag('pICMSEfet', formatNumber(icms.efetivo.aliquota, 4)) +
    tag('vICMSEfet', formatNumber(icms.efetivo.valor, 2))
  );
}

/** vICMSDeson + motDesICMS + indDeduzDeson? — desoneracao. */
function desoneracao(icms: ICMSProps): string {
  if (icms.valorDesonerado === undefined || icms.motivoDesoneracao === undefined) return '';

  return (
    tag('vICMSDeson', formatNumber(icms.valorDesonerado, 2)) +
    tag('motDesICMS', String(icms.motivoDesoneracao)) +
    tag(
      'indDeduzDeson',
      icms.indicadorDeducaoDesoneracao !== undefined
        ? String(icms.indicadorDeducaoDesoneracao)
        : undefined
    )
  );
}

/** vICMSSTDeson + motDesICMSST — desoneracao do ST. */
function desoneracaoST(icms: ICMSProps): string {
  if (icms.valorStDesonerado === undefined || icms.motivoStDesoneracao === undefined) return '';

  return (
    tag('vICMSSTDeson', formatNumber(icms.valorStDesonerado, 2)) +
    tag('motDesICMSST', String(icms.motivoStDesoneracao))
  );
}

/**
 * Grupos monofasicos de combustivel (CST 02, 15, 53 e 61).
 */
function monofasico(icms: ICMSProps, cst: string): string {
  const mono = icms.monofasico ?? {};
  const q = (v?: number): string | undefined => (v !== undefined ? formatNumber(v, 4) : undefined);
  const v = (x?: number): string | undefined => (x !== undefined ? formatNumber(x, 2) : undefined);

  switch (cst) {
    case '02':
      return (
        tag('qBCMono', q(mono.quantidade)) +
        tag('adRemICMS', formatNumber(mono.aliquotaAdRem ?? 0, 4)) +
        tag('vICMSMono', formatNumber(mono.valor ?? 0, 2))
      );

    case '15':
      return (
        tag('qBCMono', q(mono.quantidade)) +
        tag('adRemICMS', formatNumber(mono.aliquotaAdRem ?? 0, 4)) +
        tag('vICMSMono', formatNumber(mono.valor ?? 0, 2)) +
        tag('qBCMonoReten', q(mono.quantidadeRetencao)) +
        tag('adRemICMSReten', formatNumber(mono.aliquotaAdRemRetencao ?? 0, 4)) +
        tag('vICMSMonoReten', formatNumber(mono.valorRetencao ?? 0, 2)) +
        (mono.percentualReducaoAdRem !== undefined && mono.motivoReducaoAdRem !== undefined
          ? tag('pRedAdRem', formatNumber(mono.percentualReducaoAdRem, 2)) +
            tag('motRedAdRem', String(mono.motivoReducaoAdRem))
          : '')
      );

    case '53':
      return (
        tag('qBCMono', q(mono.quantidade)) +
        tag('adRemICMS', q(mono.aliquotaAdRem)) +
        tag('vICMSMonoOp', v(mono.valorOperacao)) +
        tag(
          'pDif',
          mono.percentualDiferimento !== undefined
            ? formatNumber(mono.percentualDiferimento, 4)
            : undefined
        ) +
        tag('vICMSMonoDif', v(mono.valorDiferido)) +
        tag('vICMSMono', v(mono.valor)) +
        tag('qBCMonoDif', q(mono.quantidadeDiferida)) +
        tag('adRemICMSDif', q(mono.aliquotaAdRemDiferida))
      );

    case '61':
      return (
        tag('qBCMonoRet', q(mono.quantidadeRetido)) +
        tag('adRemICMSRet', formatNumber(mono.aliquotaAdRemRetido ?? 0, 4)) +
        tag('vICMSMonoRet', formatNumber(mono.valorRetido ?? 0, 2))
      );

    default:
      return '';
  }
}

/**
 * Grupo `ICMS` do item, por CST (regime normal) ou CSOSN (Simples Nacional).
 */
export function buildICMS(prod: ProdutoProps): string {
  const icms = prod.icms;
  const orig = tag('orig', String(icms.origem));

  if (icms.csosn) return tagGroup('ICMS', buildICMSSN(icms, orig));

  const cst = icms.cst || '00';
  const modBC = tag('modBC', String(icms.modalidadeBaseCalculo ?? 3));
  const vBC = tag('vBC', formatNumber(icms.baseCalculo ?? 0, 2));
  const pICMS = tag('pICMS', formatNumber(icms.aliquota ?? 0, 4));
  const vICMS = tag('vICMS', formatNumber(icms.valor ?? 0, 2));
  const pRedBC =
    icms.percentualReducaoBase !== undefined
      ? tag('pRedBC', formatNumber(icms.percentualReducaoBase, 4))
      : '';

  // ICMSPart e ICMSST substituem o grupo do CST quando pedidos explicitamente.
  if (icms.percentualBaseOperacaoPropria !== undefined && icms.ufSt) {
    return tagGroup(
      'ICMS',
      tagGroup(
        'ICMSPart',
        orig +
          tag('CST', cst) +
          modBC +
          vBC +
          pRedBC +
          pICMS +
          vICMS +
          substituicao(icms) +
          tag('pBCOp', formatNumber(icms.percentualBaseOperacaoPropria, 4)) +
          tag('UFST', icms.ufSt)
      )
    );
  }

  if (icms.baseCalculoSTDestino !== undefined && icms.valorSTDestino !== undefined) {
    return tagGroup(
      'ICMS',
      tagGroup(
        'ICMSST',
        orig +
          tag('CST', cst) +
          stRetido(icms, true) +
          fcpSTRetido(icms) +
          tag('vBCSTDest', formatNumber(icms.baseCalculoSTDestino, 2)) +
          tag('vICMSSTDest', formatNumber(icms.valorSTDestino, 2)) +
          efetivo(icms)
      )
    );
  }

  const grupo = (conteudo: string, nomeGrupo = 'ICMS' + cst): string =>
    tagGroup('ICMS', tagGroup(nomeGrupo, orig + tag('CST', cst) + conteudo));

  switch (cst) {
    case '00':
      return grupo(modBC + vBC + pICMS + vICMS + fcpSemBase(icms));

    case '02':
    case '15':
    case '53':
    case '61':
      return grupo(monofasico(icms, cst));

    case '10':
      return grupo(
        modBC + vBC + pICMS + vICMS + fcpComBase(icms) + substituicao(icms) + desoneracaoST(icms)
      );

    case '20':
      return grupo(
        modBC +
          (pRedBC || tag('pRedBC', '0.0000')) +
          vBC +
          pICMS +
          vICMS +
          fcpComBase(icms) +
          desoneracao(icms)
      );

    case '30':
      return grupo(substituicao(icms) + desoneracao(icms));

    case '40':
    case '41':
    case '50':
      // XSD exige o nome fixo <ICMS40> pros 3 CSTs, mesmo com CST 41/50 dentro.
      return grupo(desoneracao(icms), 'ICMS40');

    case '51':
      return grupo(
        modBC +
          pRedBC +
          tag('cBenefRBC', icms.codigoBeneficioReducaoBase) +
          vBC +
          pICMS +
          tag(
            'vICMSOp',
            icms.valorOperacao !== undefined ? formatNumber(icms.valorOperacao, 2) : undefined
          ) +
          (icms.percentualDiferimento !== undefined
            ? tag('pDif', formatNumber(icms.percentualDiferimento, 4)) +
              tag(
                'vICMSDif',
                formatNumber(
                  ((icms.baseCalculo ?? 0) * (icms.aliquota ?? 0) * icms.percentualDiferimento) /
                    10000,
                  2
                )
              )
            : '') +
          vICMS +
          fcpComBase(icms) +
          (icms.percentualFcpDiferido !== undefined && icms.valorFcpDiferido !== undefined
            ? tag('pFCPDif', formatNumber(icms.percentualFcpDiferido, 4)) +
              tag('vFCPDif', formatNumber(icms.valorFcpDiferido, 2)) +
              tag(
                'vFCPEfet',
                icms.valorFcpEfetivo !== undefined
                  ? formatNumber(icms.valorFcpEfetivo, 2)
                  : undefined
              )
            : '')
      );

    case '60':
      return grupo(stRetido(icms) + fcpSTRetido(icms) + efetivo(icms));

    case '70':
      return grupo(
        modBC +
          (pRedBC || tag('pRedBC', '0.0000')) +
          vBC +
          pICMS +
          vICMS +
          fcpComBase(icms) +
          substituicao(icms) +
          desoneracao(icms) +
          desoneracaoST(icms)
      );

    case '90':
      return grupo(
        modBC +
          vBC +
          pRedBC +
          pICMS +
          vICMS +
          fcpComBase(icms) +
          (icms.baseCalculoST !== undefined ? substituicao(icms) : '') +
          desoneracao(icms) +
          desoneracaoST(icms)
      );

    default:
      return grupo(modBC + vBC + pICMS + vICMS);
  }
}

/**
 * Grupo `ICMS` do Simples Nacional, por CSOSN.
 */
function buildICMSSN(icms: ICMSProps, orig: string): string {
  const csosn = icms.csosn as string;
  const cson = tag('CSOSN', csosn);

  const creditoSN =
    tag('pCredSN', formatNumber(icms.aliquotaCreditoSN ?? 0, 4)) +
    tag(
      'vCredICMSSN',
      formatNumber(
        icms.valorCreditoSN ?? ((icms.baseCalculo ?? 0) * (icms.aliquotaCreditoSN ?? 0)) / 100,
        2
      )
    );

  switch (csosn) {
    case '101':
      return tagGroup('ICMSSN101', orig + cson + creditoSN);

    case '201':
      return tagGroup('ICMSSN201', orig + cson + substituicao(icms) + creditoSN);

    case '202':
    case '203':
      return tagGroup('ICMSSN202', orig + cson + substituicao(icms));

    case '500':
      return tagGroup(
        'ICMSSN500',
        orig + cson + stRetido(icms) + fcpSTRetido(icms) + efetivo(icms)
      );

    case '900':
      return tagGroup(
        'ICMSSN900',
        orig +
          cson +
          (icms.baseCalculo !== undefined
            ? tag('modBC', String(icms.modalidadeBaseCalculo ?? 3)) +
              tag('vBC', formatNumber(icms.baseCalculo, 2)) +
              (icms.percentualReducaoBase !== undefined
                ? tag('pRedBC', formatNumber(icms.percentualReducaoBase, 4))
                : '') +
              tag('pICMS', formatNumber(icms.aliquota ?? 0, 4)) +
              tag('vICMS', formatNumber(icms.valor ?? 0, 2))
            : '') +
          (icms.baseCalculoST !== undefined ? substituicao(icms) : '') +
          (icms.aliquotaCreditoSN !== undefined ? creditoSN : '')
      );

    default:
      return tagGroup('ICMSSN102', orig + cson);
  }
}

/**
 * IPI do item. Aceita tributacao por percentual (vBC + pIPI) ou por unidade
 * (qUnid + vUnid) — o XSD so permite um dos dois.
 */
export function buildIPI(prod: ProdutoProps): string {
  const ipi = prod.ipi;
  if (!ipi) return '';

  const cabecalho =
    tag('CNPJProd', ipi.cnpjProdutor) +
    tag('cSelo', ipi.codigoSelo) +
    tag('qSelo', ipi.quantidadeSelo !== undefined ? String(ipi.quantidadeSelo) : undefined) +
    tag('cEnq', ipi.cEnq || '999');

  const naoTributado = ['01', '02', '03', '04', '05', '51', '52', '53', '54', '55'];

  if (naoTributado.includes(ipi.cst)) {
    return tagGroup('IPI', cabecalho + tagGroup('IPINT', tag('CST', ipi.cst)));
  }

  const porUnidade =
    ipi.quantidade !== undefined && ipi.valorPorUnidade !== undefined
      ? tag('qUnid', formatNumber(ipi.quantidade, 4)) +
        tag('vUnid', formatNumber(ipi.valorPorUnidade, 4))
      : '';

  const porPercentual =
    tag('vBC', formatNumber(ipi.baseCalculo || 0, 2)) +
    tag('pIPI', formatNumber(ipi.aliquota || 0, 4));

  return tagGroup(
    'IPI',
    cabecalho +
      tagGroup(
        'IPITrib',
        tag('CST', ipi.cst) +
          (porUnidade || porPercentual) +
          tag('vIPI', formatNumber(ipi.valor || 0, 2))
      )
  );
}

/**
 * Imposto de Importacao do item (grupo `II`).
 */
export function buildII(prod: ProdutoProps): string {
  const ii = prod.ii;
  if (!ii) return '';

  return tagGroup(
    'II',
    tag('vBC', formatNumber(ii.baseCalculo, 2)) +
      tag('vDespAdu', formatNumber(ii.despesasAduaneiras, 2)) +
      tag('vII', formatNumber(ii.valor, 2)) +
      tag('vIOF', formatNumber(ii.valorIof, 2))
  );
}

/**
 * ISSQN do item, para nota mista de mercadoria e servico.
 */
export function buildISSQN(prod: ProdutoProps): string {
  const iss = prod.issqn;
  if (!iss) return '';

  const opcional = (v?: number): string | undefined =>
    v !== undefined ? formatNumber(v, 2) : undefined;

  return tagGroup(
    'ISSQN',
    tag('vBC', formatNumber(iss.baseCalculo, 2)) +
      tag('vAliq', formatNumber(iss.aliquota, 4)) +
      tag('vISSQN', formatNumber(iss.valor, 2)) +
      tag('cMunFG', iss.codigoMunicipioFatoGerador) +
      tag('cListServ', iss.itemListaServicos) +
      tag('vDeducao', opcional(iss.valorDeducao)) +
      tag('vOutro', opcional(iss.outrasRetencoes)) +
      tag('vDescIncond', opcional(iss.descontoIncondicionado)) +
      tag('vDescCond', opcional(iss.descontoCondicionado)) +
      tag('vISSRet', opcional(iss.valorRetido)) +
      tag('indISS', String(iss.exigibilidade)) +
      tag('cServico', iss.codigoServico) +
      tag('cMun', iss.codigoMunicipio) +
      tag('cPais', iss.codigoPais) +
      tag('nProcesso', iss.numeroProcesso) +
      tag('indIncentivo', String(iss.incentivoFiscal))
  );
}

const CST_PIS_COFINS_NT = ['04', '05', '06', '07', '08', '09'];
const CST_PIS_COFINS_OUTR = [
  '49',
  '50',
  '51',
  '52',
  '53',
  '54',
  '55',
  '56',
  '60',
  '61',
  '62',
  '63',
  '64',
  '65',
  '66',
  '67',
  '70',
  '71',
  '72',
  '73',
  '74',
  '75',
  '98',
  '99'
];

/**
 * PIS ou COFINS do item. `imposto` escolhe as tags (`pPIS`/`vPIS` ou
 * `pCOFINS`/`vCOFINS`) e o grupo (`PISAliq`/`COFINSAliq` etc.).
 */
function buildPisCofins(
  imposto: 'PIS' | 'COFINS',
  dados: {
    readonly cst: string;
    readonly baseCalculo?: number;
    readonly aliquota?: number;
    readonly valor?: number;
    readonly quantidade?: number;
    readonly aliquotaPorUnidade?: number;
  }
): string {
  const tagAliquota = imposto === 'PIS' ? 'pPIS' : 'pCOFINS';
  const tagValor = imposto === 'PIS' ? 'vPIS' : 'vCOFINS';
  const valor = tag(tagValor, formatNumber(dados.valor || 0, 2));

  if (CST_PIS_COFINS_NT.includes(dados.cst)) {
    return tagGroup(imposto, tagGroup(`${imposto}NT`, tag('CST', dados.cst)));
  }

  // Tributacao por quantidade (CST 03 e afins): qBCProd + vAliqProd.
  const porQuantidade =
    dados.quantidade !== undefined && dados.aliquotaPorUnidade !== undefined
      ? tag('qBCProd', formatNumber(dados.quantidade, 4)) +
        tag('vAliqProd', formatNumber(dados.aliquotaPorUnidade, 4))
      : '';

  if (porQuantidade && !CST_PIS_COFINS_OUTR.includes(dados.cst)) {
    return tagGroup(
      imposto,
      tagGroup(`${imposto}Qtde`, tag('CST', dados.cst) + porQuantidade + valor)
    );
  }

  const porValor =
    tag('vBC', formatNumber(dados.baseCalculo || 0, 2)) +
    tag(tagAliquota, formatNumber(dados.aliquota || 0, 4));

  const grupo = CST_PIS_COFINS_OUTR.includes(dados.cst) ? `${imposto}Outr` : `${imposto}Aliq`;

  return tagGroup(
    imposto,
    tagGroup(grupo, tag('CST', dados.cst) + (porQuantidade || porValor) + valor)
  );
}

export function buildPIS(prod: ProdutoProps): string {
  return buildPisCofins('PIS', prod.pis);
}

export function buildCOFINS(prod: ProdutoProps): string {
  return buildPisCofins('COFINS', prod.cofins);
}

/**
 * PIS ST ou COFINS ST do item.
 */
function buildPisCofinsST(
  imposto: 'PISST' | 'COFINSST',
  dados?: {
    readonly baseCalculo?: number;
    readonly aliquota?: number;
    readonly quantidade?: number;
    readonly aliquotaPorUnidade?: number;
    readonly valor: number;
    readonly compoeTotal?: 0 | 1;
  }
): string {
  if (!dados) return '';

  const ehPis = imposto === 'PISST';
  const base =
    dados.quantidade !== undefined && dados.aliquotaPorUnidade !== undefined
      ? tag('qBCProd', formatNumber(dados.quantidade, 4)) +
        tag('vAliqProd', formatNumber(dados.aliquotaPorUnidade, 4))
      : tag('vBC', formatNumber(dados.baseCalculo ?? 0, 2)) +
        tag(ehPis ? 'pPIS' : 'pCOFINS', formatNumber(dados.aliquota ?? 0, 4));

  return tagGroup(
    imposto,
    base +
      tag(ehPis ? 'vPIS' : 'vCOFINS', formatNumber(dados.valor, 2)) +
      tag(
        ehPis ? 'indSomaPISST' : 'indSomaCOFINSST',
        dados.compoeTotal !== undefined ? String(dados.compoeTotal) : undefined
      )
  );
}

export function buildPISST(prod: ProdutoProps): string {
  return buildPisCofinsST('PISST', prod.pisSt);
}

export function buildCOFINSST(prod: ProdutoProps): string {
  return buildPisCofinsST('COFINSST', prod.cofinsSt);
}

/**
 * Partilha do ICMS com a UF de destino (EC 87/2015).
 */
export function buildICMSUFDest(prod: ProdutoProps): string {
  const dest = prod.icmsUfDest;
  if (!dest) return '';

  const vBC = dest.baseCalculo ?? prod.valorTotal;
  const partilha = dest.percentualPartilha ?? 100;
  const diferencial = (vBC * (dest.aliquotaInterna - dest.aliquotaInterestadual)) / 100;
  const vICMSUFDest = (diferencial * partilha) / 100;

  const baseFcp = dest.baseCalculoFcp ?? vBC;
  const temFcp = dest.aliquotaFcp !== undefined;

  return tagGroup(
    'ICMSUFDest',
    tag('vBCUFDest', formatNumber(vBC, 2)) +
      (temFcp
        ? tag('vBCFCPUFDest', formatNumber(baseFcp, 2)) +
          tag('pFCPUFDest', formatNumber(dest.aliquotaFcp as number, 4))
        : '') +
      tag('pICMSUFDest', formatNumber(dest.aliquotaInterna, 4)) +
      tag('pICMSInter', formatNumber(dest.aliquotaInterestadual, 2)) +
      tag('pICMSInterPart', formatNumber(partilha, 4)) +
      (temFcp
        ? tag('vFCPUFDest', formatNumber((baseFcp * (dest.aliquotaFcp as number)) / 100, 2))
        : '') +
      tag('vICMSUFDest', formatNumber(vICMSUFDest, 2)) +
      tag('vICMSUFRemet', formatNumber(diferencial - vICMSUFDest, 2))
  );
}

/**
 * Imposto Seletivo do item (grupo `IS`, NT 2025.002).
 */
export function buildIS(prod: ProdutoProps): string {
  const is = prod.impostoSeletivo;
  if (!is) return '';

  return tagGroup(
    'IS',
    tag('CSTIS', is.cst) +
      tag('cClassTribIS', is.cClassTrib) +
      tag('vBCIS', formatNumber(is.baseCalculo, 2)) +
      tag('pIS', formatNumber(is.aliquota, 4)) +
      tag(
        'pISEspec',
        is.aliquotaEspecifica !== undefined ? formatNumber(is.aliquotaEspecifica, 4) : undefined
      ) +
      tag('uTrib', is.unidadeTributavel) +
      tag('qTrib', formatNumber(is.quantidadeTributavel, 4)) +
      tag('vIS', formatNumber(is.valor, 2))
  );
}

/**
 * Bloco `imposto` do item.
 *
 * O leiaute traz uma escolha entre dois caminhos, e a ordem muda em cada um:
 * mercadoria e `ICMS, IPI?, II?`; servico e `IPI?, ISSQN`. Depois vem, em
 * sequencia, PIS, PISST, COFINS, COFINSST, ICMSUFDest, IS e IBSCBS.
 */
export function buildImpostos(prod: ProdutoProps): string {
  const tributos =
    prod.tributosAproximados !== undefined
      ? tag('vTotTrib', formatNumber(prod.tributosAproximados, 2))
      : '';

  const principal = prod.issqn
    ? buildIPI(prod) + buildISSQN(prod)
    : buildICMS(prod) + buildIPI(prod) + buildII(prod);

  return tagGroup(
    'imposto',
    tributos +
      principal +
      buildPIS(prod) +
      buildPISST(prod) +
      buildCOFINS(prod) +
      buildCOFINSST(prod) +
      buildICMSUFDest(prod) +
      buildIS(prod) +
      buildIBSCBS(prod)
  );
}
